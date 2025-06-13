// DB helpers using backend API
export async function fetchFromDB() {
  try {
    const res = await fetch('/api/data');
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Failed to fetch data from backend', err);
  }
  return {};
}

export async function saveToDB(data) {
  await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// Export data to JSON file client-side
export async function exportToJSON(dataObj) {
  const jsonStr = JSON.stringify(dataObj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'db.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Import data from JSON file and save to backend
export async function importFromJSON(file) {
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    await saveToDB(data);
    return data;
  } catch (e) {
    console.error('Failed to parse JSON', e);
    return {};
  }
}
