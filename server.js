const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'signups.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function readSignups() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function writeSignups(signups) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(signups, null, 2));
}

// POST /api/signup — add to waitlist
app.post('/api/signup', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) return res.status(400).json({ error: 'Invalid email address.' });

  const signups = readSignups();
  if (signups.find(s => s.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'You\'re already on the list!' });
  }

  const entry = { id: Date.now(), email: email.trim().toLowerCase(), joinedAt: new Date().toISOString() };
  signups.push(entry);
  writeSignups(signups);

  res.json({ ok: true, position: signups.length, message: `You're #${signups.length} on the waitlist!` });
});

// GET /api/signups — list all (admin)
app.get('/api/signups', (req, res) => {
  const signups = readSignups();
  res.json({ count: signups.length, signups });
});

// GET /api/count — public count only
app.get('/api/count', (req, res) => {
  res.json({ count: readSignups().length });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`StudyLock waitlist running at http://localhost:${PORT}`);
});
