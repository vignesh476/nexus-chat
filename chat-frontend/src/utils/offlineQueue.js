class OfflineMessageQueue {
  constructor() {
    this.storageKey = 'offline_messages';
    this.syncInProgress = false;
  }

  // Store message locally when offline
  storeMessage(message) {
    const offlineMessages = this.getStoredMessages();
    const messageWithId = {
      ...message,
      offline_id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    offlineMessages.push(messageWithId);
    localStorage.setItem(this.storageKey, JSON.stringify(offlineMessages));
    return messageWithId;
  }

  // Get all stored offline messages
  getStoredMessages() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse offline messages:', e);
      return [];
    }
  }

  // Remove message from offline storage
  removeMessage(offlineId) {
    const messages = this.getStoredMessages();
    const filtered = messages.filter(m => m.offline_id !== offlineId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  // Mark message as failed
  markAsFailed(offlineId, error) {
    const messages = this.getStoredMessages();
    const updated = messages.map(m => 
      m.offline_id === offlineId 
        ? { ...m, status: 'failed', error: error.message }
        : m
    );
    localStorage.setItem(this.storageKey, JSON.stringify(updated));
  }

  // Sync all pending messages when back online
  async syncMessages(socket) {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    const messages = this.getStoredMessages();
    const pendingMessages = messages.filter(m => m.status === 'pending');

    for (const message of pendingMessages) {
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
          
          socket.emit('send_message', {
            room_id: message.room_id,
            sender: message.sender,
            content: message.content,
            type: message.type,
            offline_id: message.offline_id
          });

          const handleResponse = (response) => {
            clearTimeout(timeout);
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error(response.error || 'Failed to send'));
            }
          };

          socket.once(`message_sent_${message.offline_id}`, handleResponse);
        });

        this.removeMessage(message.offline_id);
      } catch (error) {
        console.error('Failed to sync message:', error);
        this.markAsFailed(message.offline_id, error);
      }
    }

    this.syncInProgress = false;
  }

  // Get count of pending messages
  getPendingCount() {
    return this.getStoredMessages().filter(m => m.status === 'pending').length;
  }

  // Clear all offline messages
  clear() {
    localStorage.removeItem(this.storageKey);
  }
}

export default new OfflineMessageQueue();