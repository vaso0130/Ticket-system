// Simple API wrapper to replace the previous localStorage-only approach.
// By default it falls back to localStorage so existing code continues to work.
const API_BASE = '/api';

export async function fetchFromDB(key) {
  try {
    const resp = await fetch(`${API_BASE}/data/${key}`);
    if (!resp.ok) throw new Error('Network response was not ok');
    return await resp.json();
  } catch (err) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}

export async function saveToDB(key, value) {
  try {
    const resp = await fetch(`${API_BASE}/data/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });
    if (!resp.ok) throw new Error('Network response was not ok');
  } catch (err) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
