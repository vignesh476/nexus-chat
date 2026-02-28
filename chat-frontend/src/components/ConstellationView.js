import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { AccountTree, Chat } from '@mui/icons-material';

const ConstellationView = ({ messages, onMessageClick, onClose }) => {
  const canvasRef = useRef();
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    if (!messages?.length) return;

    const messageNodes = messages.map((msg, index) => ({
      id: msg._id,
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100,
      message: msg,
      index,
      radius: msg.message_type === 'game' ? 15 : 8,
      color: getNodeColor(msg)
    }));

    const messageConnections = [];
    for (let i = 1; i < messageNodes.length; i++) {
      const current = messageNodes[i];
      const previous = messageNodes[i - 1];
      
      if (current.message.sender === previous.message.sender ||
          Math.abs(new Date(current.message.timestamp) - new Date(previous.message.timestamp)) < 60000) {
        messageConnections.push({
          from: previous.id,
          to: current.id,
          strength: current.message.sender === previous.message.sender ? 0.8 : 0.3
        });
      }
    }

    setNodes(messageNodes);
    setConnections(messageConnections);
  }, [messages]);

  const getNodeColor = (msg) => {
    if (msg.message_type === 'game') return '#667eea';
    if (msg.message_type === 'image') return '#4facfe';
    if (msg.content?.includes('?')) return '#f093fb';
    if (msg.content?.includes('!')) return '#fa709a';
    return '#a8edea';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;

    const ctx = canvas.getContext('2d');
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      connections.forEach(conn => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        if (!fromNode || !toNode) return;

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = `rgba(102, 126, 234, ${conn.strength * 0.3})`;
        ctx.lineWidth = conn.strength * 2;
        ctx.stroke();
      });

      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.radius
        );
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, node.color + '66');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, [nodes, connections]);

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= node.radius;
    });

    if (clickedNode) {
      onMessageClick(clickedNode.message);
    }
  };

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountTree />
          <span>Conversation Constellation</span>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Chat />
        </IconButton>
      </Box>
      
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight - 80}
        onClick={handleCanvasClick}
        style={{ cursor: 'pointer' }}
      />
      
      <Box sx={{ 
        position: 'absolute', 
        bottom: 20, 
        left: 20, 
        color: 'white', 
        opacity: 0.7,
        fontSize: '12px'
      }}>
        Click nodes to view messages • Lines show conversation flow
      </Box>
    </Box>
  );
};

export default ConstellationView;