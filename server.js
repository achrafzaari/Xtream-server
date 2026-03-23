const express = require('express');
const cors = require('cors');
const path = require('path'); // ✔ تصحيح
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// database file
const DB_FILE = path.join(__dirname, 'db.json');

// create/read db
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const d = {
      settings: {
        server_name: "XtreamAR",
        server_url: "https://your-app.up.railway.app",
        admin_user: "admin",
        admin_pass: "admin123"
      },
      credits: 1000,
      channels: [],
      users: [],
      resellers: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2));
    return d;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// admin auth
function adminAuth(req, res, next) {
  const db = readDB();
  const user = req.query.admin_user || req.body.admin_user;
  const pass = req.query.admin_pass || req.body.admin_pass;

  if (user === db.settings.admin_user && pass === db.settings.admin_pass) {
    req.db = db;
    return next();
  }

  res.status(401).json({ error: 'Unauthorized' });
}

// user auth
function userAuth(req) {
  const db = readDB();
  const user = req.query.username || req.body.username;
  const pass = req.query.password || req.body.password;

  return db.users.find(
    u => u.username === user && u.password === pass && u.status === 'active'
  );
}

// test route
app.get('/', (req, res) => {
  res.send('🚀 Server is working');
});

// Xtream API
app.get('/player_api.php', (req, res) => {
  const db = readDB();
  const action = req.query.action;
  const u = userAuth(req);

  if (!u) return res.json({ user_info: { auth: 0 } });

  if (!action) {
    return res.json({
      user_info: {
        username: u.username,
        password: u.password,
        auth: 1,
        status: "Active",
        exp_date: String(Math.floor(new Date(u.exp_date).getTime() / 1000)),
        max_connections: String(u.max_connections || 2),
        allowed_output_formats: ["m3u8", "ts"]
      },
      server_info: {
        url: db.settings.server_url,
        port: String(PORT),
        timestamp_now: Math.floor(Date.now() / 1000)
      }
    });
  }

  res.json([]);
});

// static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// start server ✔ مصحح
app.listen(PORT, "0.0.0.0", () => {
  console.log(✅ Server running on port ${PORT});
});
