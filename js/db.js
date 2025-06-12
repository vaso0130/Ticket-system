// Temporary DB implementation using localStorage
// In real deployment this should be replaced with actual API calls or DB logic
export async function fetchFromDB(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

export async function saveToDB(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Export current data to a JSON file
export async function exportToJSON(dataObj) {
  const jsonStr = JSON.stringify(dataObj, null, 2);
  const blob = new Blob([jsonStr], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'db.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Import data from a JSON file
export async function importFromJSON(file) {
  const text = await file.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON', e);
    return {};
  }
}
