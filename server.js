const express = require('express');
const bodyParser = require('body-parser');
const { Low, JSONFile } = require('lowdb');
const multer = require('multer');
const path = require('path');

(async () => {
  const dbFile = path.join(__dirname, 'data.json');
  const adapter = new JSONFile(dbFile);
  const db = new Low(adapter);
  await db.read();
  db.data = db.data || { venues: [], concerts: [], tickets: [] };
  await db.write();

  const app = express();
  app.use(bodyParser.json());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use(express.static(__dirname));

  const upload = multer({ dest: path.join(__dirname, 'uploads') });

  app.get('/api/data', (req, res) => {
    res.json(db.data);
  });

  app.post('/api/data', async (req, res) => {
    const { venues, concerts, tickets } = req.body;
    if (venues) db.data.venues = venues;
    if (concerts) db.data.concerts = concerts;
    if (tickets) db.data.tickets = tickets;
    await db.write();
    res.json({ status: 'ok' });
  });

  app.post('/api/upload', upload.single('image'), (req, res) => {
    res.json({ filename: req.file.filename });
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
})();
