import { useEffect, useState } from 'react';
import { groupsAPI } from '../api';
import { useSocket } from '../context/SocketContext';

export const useGroups = () => {
  const socket = useSocket();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await groupsAPI.list();
        if (!mounted) return;
        setGroups(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load groups:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();

    const onGroupCreated = (g) => setGroups((prev) => [g, ...prev]);
    const onGroupUpdated = (g) =>
      setGroups((prev) => prev.map((it) => (it._id === g._id ? { ...it, ...g } : it)));
    const onGroupDeleted = ({ groupId }) =>
      setGroups((prev) => prev.filter((g) => g._id !== groupId));

    socket?.on('group:created', onGroupCreated);
    socket?.on('group:updated', onGroupUpdated);
    socket?.on('group:deleted', onGroupDeleted);

    return () => {
      socket?.off('group:created', onGroupCreated);
      socket?.off('group:updated', onGroupUpdated);
      socket?.off('group:deleted', onGroupDeleted);
      mounted = false;
    };
  }, [socket]);

  return { groups, loading, setGroups };
};

export const useGroupSettings = (groupId) => {
  const socket = useSocket();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await groupsAPI.get(groupId);
        if (!mounted) return;
        setGroup(data || null);
      } catch (e) {
        console.error('Failed to load group:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (groupId) load();

    const onUpdated = (g) => {
      if (g._id === groupId) setGroup((prev) => ({ ...prev, ...g }));
    };
    socket?.on('group:updated', onUpdated);

    return () => {
      socket?.off('group:updated', onUpdated);
      mounted = false;
    };
  }, [socket, groupId]);

  const saveSettings = async (payload) => {
    try {
      const { data } = await groupsAPI.updateSettings(groupId, payload);
      setGroup((prev) => ({ ...prev, ...data }));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.response?.data?.detail || 'Failed to update settings' };
    }
  };

  return { group, loading, saveSettings, setGroup };
};
