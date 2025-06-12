// Temporary DB implementation using localStorage
// In real deployment this should be replaced with actual API calls or DB logic
export async function fetchFromDB(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

export async function saveToDB(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Export current data to an XLSX file
export async function exportToXLSX(dataObj) {
  const wb = XLSX.utils.book_new();
  for (const key in dataObj) {
    const ws = XLSX.utils.json_to_sheet(dataObj[key]);
    XLSX.utils.book_append_sheet(wb, ws, key);
  }
  const wbout = XLSX.write(wb, {bookType: 'xlsx', type: 'array'});
  const blob = new Blob([wbout], {type: 'application/octet-stream'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'db.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

// Import data from an XLSX file
export async function importFromXLSX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, {type: 'array'});
  const result = {};
  wb.SheetNames.forEach(name => {
    const ws = wb.Sheets[name];
    result[name] = XLSX.utils.sheet_to_json(ws);
  });
  return result;
}
