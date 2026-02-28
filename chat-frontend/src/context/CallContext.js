import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [callState, setCallState] = useState({
    isInCall: false,
    callStatus: null, // 'calling', 'ringing', 'connecting', 'connected'
    caller: null,
    callee: null,
    roomId: null,
    localStream: null,
    remoteStream: null,
    callStartTime: null,
    callDuration: 0,
  });

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const ringingTimeoutRef = useRef(null);
  const disconnectTimeoutRef = useRef(null);
  const incomingOfferHasVideoRef = useRef(false);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Ensure endCall is defined before any callbacks reference it to avoid TDZ
  const endCall = useCallback(async () => {
    // Clear ringing timeout
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }

    // Clear call offer timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    // Clear disconnect timeout
    if (disconnectTimeoutRef.current) {
      clearTimeout(disconnectTimeoutRef.current);
      disconnectTimeoutRef.current = null;
    }

    // Log call duration if call was connected (but don't send chat messages)
    if (callState.callStatus === 'connected' && callState.callStartTime) {
      const duration = Math.floor((Date.now() - callState.callStartTime) / 1000);
      try {
        await fetch('http://localhost:8000/calls/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            caller: callState.caller,
            callee: callState.callee,
            status: 'ended',
            timestamp: new Date().toISOString(),
            duration: duration,
          }),
        });
      } catch (error) {
        console.error('Failed to log call:', error);
      }
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    setCallState({
      isInCall: false,
      callStatus: null,
      caller: null,
      callee: null,
      roomId: null,
      localStream: null,
      remoteStream: null,
      callStartTime: null,
      callDuration: 0,
    });

    socket?.emit('call_end', { room_id: callState.roomId });
  }, [socket, callState]);

  // Create a peer connection bound to a specific roomId to avoid closure-stale room_id on ICE events
  const createPeerConnection = useCallback(async (roomIdParam) => {
    if (!user) {
      console.error('Cannot create peer connection: user not available');
      return;
    }

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    const pcRoomId = roomIdParam || callState.roomId;

    pc.onicecandidate = (event) => {
      if (event.candidate && user) {
        try {
          socket?.emit('call_ice_candidate', {
            room_id: pcRoomId,
            from: user.username,
            candidate: event.candidate,
          });
        } catch (err) {
          console.error('Failed to emit ICE candidate', err);
        }
      }
    };

    pc.ontrack = (event) => {
      setCallState(prev => ({
        ...prev,
        remoteStream: event.streams[0],
      }));
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        // Connected - clear any pending disconnect-triggered end
        if (disconnectTimeoutRef.current) {
          clearTimeout(disconnectTimeoutRef.current);
          disconnectTimeoutRef.current = null;
        }
        setCallState(prev => ({ ...prev, callStatus: 'connected', callStartTime: Date.now() }));
        return;
      }

      if (state === 'disconnected') {
        // Give a short grace period for transient disconnects before ending
        if (disconnectTimeoutRef.current) clearTimeout(disconnectTimeoutRef.current);
        disconnectTimeoutRef.current = setTimeout(() => {
          console.log('Peer connection remained disconnected - ending call');
          endCall();
        }, 5000);
        return;
      }

      if (state === 'failed' || state === 'closed') {
        // Let endCall handle cleanup immediately on hard failure
        endCall();
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try { pc.addTrack(track, localStreamRef.current); } catch (e) { console.warn('addTrack failed', e); }
      });
    }

    return pc;
  }, [socket, user, callState.roomId, endCall]);

  const startCall = useCallback(async (targetUser, roomId, isVideo = false) => {
    if (!user) return;

    console.log('CallContext: startCall - caller:', user.username, 'callee:', targetUser);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });

      localStreamRef.current = stream;
      setCallState({
        isInCall: true,
        callStatus: 'calling',
        caller: user.username,
        callee: targetUser,
        roomId,
        localStream: stream,
        remoteStream: null,
      });

      // Pass roomId so onicecandidate uses the correct room id immediately
      await createPeerConnection(roomId);

      // Ensure local tracks are added (in case createPeerConnection ran earlier)
      if (peerConnectionRef.current && localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          try { peerConnectionRef.current.addTrack(track, localStreamRef.current); } catch (e) { }
        });
      }

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socket?.emit('call_offer', {
        room_id: roomId,
        from: user.username,
        signal: offer,
      });

      // Optional: auto end if not answered in 60s
      callTimeoutRef.current = setTimeout(() => {
        console.log('Call offer timed out - ending call');
        endCall();
      }, 60000);
    } catch (error) {
      console.error('Error starting call:', error);
      endCall();
    }
  }, [user, createPeerConnection, socket, endCall]);

  const answerCall = useCallback(async () => {
    // Clear ringing timeout when call is answered
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }

    try {
      const wantsVideo = !!incomingOfferHasVideoRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: wantsVideo, // request video when offer included it
      });

      localStreamRef.current = stream;

      // Add tracks to existing peer connection (created in handleIncomingOffer)
      if (localStreamRef.current && peerConnectionRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          try { peerConnectionRef.current.addTrack(track, localStreamRef.current); } catch (e) { console.warn('addTrack failed on answer', e); }
        });
      }

      setCallState(prev => ({
        ...prev,
        callStatus: 'connecting',
        localStream: stream,
      }));

      // Create answer (remote description already set in handleIncomingOffer)
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socket?.emit('call_answer', {
        room_id: callState.roomId,
        from: user.username,
        signal: answer,
      });

      // Set call as connected and start timing
      setCallState(prev => ({
        ...prev,
        callStatus: 'connected',
        callStartTime: Date.now()
      }));
    } catch (error) {
      console.error('Error answering call:', error);
      endCall();
    }
  }, [callState.roomId, socket, user, endCall]);

  // endCall moved above to avoid "Cannot access 'endCall' before initialization" ReferenceError

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev })); // Trigger re-render
      }
    }
  }, []);

  const toggleVideo = useCallback(async () => {
    // If we already have a video track, just toggle it
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev })); // Trigger re-render
        return;
      }
    }

    // No existing video track — try to acquire one and add it to the call, then renegotiate
    try {
      const vstream = await navigator.mediaDevices.getUserMedia({ video: true });
      const vtrack = vstream.getVideoTracks()[0];
      if (!vtrack) return;

      // Ensure we have a local stream to attach the track
      if (!localStreamRef.current) {
        localStreamRef.current = new MediaStream();
      }
      localStreamRef.current.addTrack(vtrack);
      setCallState(prev => ({ ...prev, localStream: localStreamRef.current }));

      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.addTrack(vtrack, localStreamRef.current);
        } catch (e) {
          console.warn('Failed to add video track to peer connection', e);
        }

        // Trigger renegotiation by creating and sending an offer
        try {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socket?.emit('call_offer', {
            room_id: callState.roomId,
            from: user.username,
            signal: offer,
          });
        } catch (e) {
          console.warn('Renegotiation offer failed after adding video track', e);
        }
      }
    } catch (e) {
      console.warn('Failed to acquire camera for toggleVideo', e);
    }
  }, [socket, callState.roomId, user]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingOffer = async (data) => {
      const { signal, from, room_id } = data;
      if (!user) {
        console.error('Cannot handle incoming offer: user not available');
        return;
      }

      // Detect whether the offer contains a video m-line so we can request video when answering/renegotiating
      try {
        incomingOfferHasVideoRef.current = !!(signal && signal.sdp && signal.sdp.indexOf('m=video') !== -1);
      } catch (e) {
        incomingOfferHasVideoRef.current = false;
      }

      // If we're already in a call and this offer is from our call peer, treat it as a re-offer and auto-answer
      if (callState.isInCall && peerConnectionRef.current && callState.roomId === room_id) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        } catch (e) {
          console.error('Failed to set remote description on incoming re-offer', e);
        }

        // If the new offer requests video and we don't have a video track, try to get it and add to the connection
        if (incomingOfferHasVideoRef.current && (!localStreamRef.current || localStreamRef.current.getVideoTracks().length === 0)) {
          try {
            const vstream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Merge or set local stream
            if (localStreamRef.current) {
              vstream.getVideoTracks().forEach(t => localStreamRef.current.addTrack(t));
            } else {
              localStreamRef.current = new MediaStream();
              vstream.getVideoTracks().forEach(t => localStreamRef.current.addTrack(t));
              setCallState(prev => ({ ...prev, localStream: localStreamRef.current }));
            }

            // Add tracks to peer connection
            vstream.getVideoTracks().forEach(track => {
              try { peerConnectionRef.current.addTrack(track, localStreamRef.current); } catch (e) { console.warn('addTrack failed during renegotiation', e); }
            });
          } catch (e) {
            console.warn('Failed to acquire video for renegotiation', e);
          }
        }

        // Create an answer automatically to complete renegotiation
        try {
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket?.emit('call_answer', {
            room_id,
            from: user.username,
            signal: answer,
          });
        } catch (e) {
          console.error('Failed to create/send answer for re-offer', e);
        }

        return; // re-offer handled
      }

      // New incoming call
      setCallState({
        isInCall: true,
        callStatus: 'ringing',
        caller: from,
        callee: user.username,
        roomId: room_id,
        localStream: null,
        remoteStream: null,
      });

      // Pass room_id to ensure ICE candidates use correct room
      await createPeerConnection(room_id);

      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
      } catch (e) {
        console.error('Failed to set remote description on incoming offer', e);
      }

      // Set ringing timeout - auto-decline after 30 seconds
      ringingTimeoutRef.current = setTimeout(() => {
        console.log('Call ringing timeout - auto-declining call');
        endCall();
      }, 30000);
    };

    const handleIncomingAnswer = async (data) => {
      const { signal } = data;
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        setCallState(prev => ({ ...prev, callStatus: 'connected', callStartTime: Date.now() }));
      }
      // Clear call timeout when call is answered
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    };

    const handleIceCandidate = async (data) => {
      const { candidate, from } = data;
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Failed to add received ICE candidate', e);
        }
      }
    };

    const handleCallEnded = () => {
      // Clear call timeout when call is ended by other party
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      endCall();
    };

    socket.on('call_offer', handleIncomingOffer);
    socket.on('call_answer', handleIncomingAnswer);
    socket.on('call_ice_candidate', handleIceCandidate);
    socket.on('call_end', handleCallEnded);

    return () => {
      socket.off('call_offer', handleIncomingOffer);
      socket.off('call_answer', handleIncomingAnswer);
      socket.off('call_ice_candidate', handleIceCandidate);
      socket.off('call_end', handleCallEnded);
    };
  }, [socket, user, createPeerConnection, endCall, callState]);

  // Update call duration every second when connected
  useEffect(() => {
    let interval;
    if (callState.callStatus === 'connected' && callState.callStartTime) {
      interval = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          callDuration: Math.floor((Date.now() - prev.callStartTime) / 1000)
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState.callStatus, callState.callStartTime]);

  const remoteUser = user ? (callState.caller === user.username ? callState.callee : callState.caller) : null;

  // Debug logging
  console.log('CallContext remoteUser calculation:', {
    caller: callState.caller,
    callee: callState.callee,
    user: user?.username,
    remoteUser,
    callStatus: callState.callStatus
  });

  const value = {
    ...callState,
    remoteUser,
    startCall,
    answerCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};
