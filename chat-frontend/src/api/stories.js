// Use explicit API base (env override) to avoid hitting the React dev server root
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const base = `${API_BASE.replace(/\/+$|$/, '')}/stories`;

export async function getStories() {
  const res = await fetch(`${base}/`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
  if (!res.ok) throw new Error('Failed to fetch stories');
  return res.json();
}

export async function getUserStories(username) {
  const res = await fetch(`${base}/${username}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
  if (!res.ok) throw new Error('Failed to fetch user stories');
  return res.json();
}

export async function createStory({ story_type, content, interactive, privacy = 'everyone', allowed_viewers = [], file }) {
  const fd = new FormData();
  fd.append('story_type', story_type);
  if (content) fd.append('content', content);
  if (interactive) fd.append('interactive', JSON.stringify(interactive));
  fd.append('privacy', privacy);
  if (allowed_viewers && allowed_viewers.length) fd.append('allowed_viewers', JSON.stringify(allowed_viewers));
  if (file) fd.append('file', file);

  const res = await fetch(`${base}/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: fd
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.detail || 'Failed to create story');
  }
  const j = await res.json();
  // Try to return the created story by refreshing the feed and matching id
  try {
    if (j.story_id) {
      const all = await getStories();
      const found = all.find(s => s._id === j.story_id);
      if (found) return found;
      // fallback: return the most recent
      return all[0];
    }
  } catch (e) {
    // ignore and return raw response
  }
  return j;
}

export async function interactStory(story_id, action, payload) {
  const fd = new FormData();
  fd.append('action', action);
  if (payload) fd.append('payload', JSON.stringify(payload));

  const res = await fetch(`${base}/${story_id}/interact`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: fd
  });
  if (!res.ok) throw new Error('Failed to interact with story');
  return res.json();
}

export async function highlightStory(story_id) {
  const res = await fetch(`${base}/${story_id}/highlight`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  if (!res.ok) throw new Error('Failed to highlight story');
  return res.json();
}

export async function deleteStory(story_id) {
  const res = await fetch(`${base}/${story_id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  if (!res.ok) throw new Error('Failed to delete story');
  return res.json();
}
