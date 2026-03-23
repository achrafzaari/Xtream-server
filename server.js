/**
 * XtreamAR Server — Xtream Codes Compatible API
 * تشغيل: node server.js
 * المتطلبات: npm install express cors
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── DATABASE (ملف JSON بسيط كقاعدة بيانات) ───────────────
const DB_FILE = path.join(__dirname, 'db.json');

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultDB = {
      settings: {
        server_name: "XtreamAR",
        server_url:  "http://localhost:8080",
        admin_user:  "admin",
        admin_pass:  "admin123"
      },
      credits: 1000,
      channels: [],
      users: [],
      resellers: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
    return defaultDB;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ─── AUTH MIDDLEWARE ───────────────────────────────────────
function adminAuth(req, res, next) {
  const db   = readDB();
  const user = req.query.admin_user || req.body.admin_user;
  const pass = req.query.admin_pass || req.body.admin_pass;
  if (user === db.settings.admin_user && pass === db.settings.admin_pass) {
    req.db = db; return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

function userAuth(req, res) {
  const db   = readDB();
  const user = req.query.username || req.body.username;
  const pass = req.query.password || req.body.password;
  return db.users.find(u => u.username === user && u.password === pass && u.status === 'active');
}

// ══════════════════════════════════════════════════════════
//  XTREAM CODES API — هذا ما يستخدمه TiviMate و Smarters
// ══════════════════════════════════════════════════════════

// تسجيل الدخول وجلب معلومات الحساب
app.get('/player_api.php', (req, res) => {
  const db   = readDB();
  const action = req.query.action;
  const u    = userAuth(req, res);
  if (!u) return res.json({ user_info: { auth: 0 } });

  if (!action) {
    // معلومات الحساب الأساسية
    const expTs = Math.floor(new Date(u.exp_date).getTime() / 1000);
    return res.json({
      user_info: {
        username:      u.username,
        password:      u.password,
        message:       "Welcome to XtreamAR",
        auth:          1,
        status:        "Active",
        exp_date:      String(expTs),
        is_trial:      "0",
        active_cons:   "0",
        created_at:    String(Math.floor(Date.now()/1000)),
        max_connections: String(u.max_connections || 2),
        allowed_output_formats: ["m3u8","ts","rtmp"]
      },
      server_info: {
        url:          db.settings.server_url,
        port:         String(PORT),
        https_port:   "443",
        server_protocol: "http",
        rtmp_port:    "1935",
        timezone:     "Africa/Casablanca",
        timestamp_now: Math.floor(Date.now()/1000),
        time_now:     new Date().toISOString()
      }
    });
  }

  if (action === 'get_live_categories') {
    const cats = [...new Set(db.channels.filter(c=>c.enabled).map(c=>c.category))];
    return res.json(cats.map((cat,i) => ({
      category_id: String(i+1),
      category_name: cat,
      parent_id: 0
    })));
  }

  if (action === 'get_live_streams') {
    const cat = req.query.category_id;
    const cats = [...new Set(db.channels.filter(c=>c.enabled).map(c=>c.category))];
    let list = db.channels.filter(c => c.enabled);
    if (cat) list = list.filter(c => String(cats.indexOf(c.category)+1) === String(cat));
    return res.json(list.map((ch,i) => ({
      num:            i+1,
      name:           ch.name,
      stream_type:    "live",
      stream_id:      ch.id,
      stream_icon:    ch.logo || "",
      epg_channel_id: ch.epg_id || "",
      added:          String(Math.floor(Date.now()/1000)),
      category_id:    String(cats.indexOf(ch.category)+1),
      custom_sid:     "",
      tv_archive:     0,
      direct_source:  "",
      tv_archive_duration: 0
    })));
  }

  res.json([]);
});

// رابط البث المباشر
app.get('/live/:username/:password/:stream_id', (req, res) => {
  const db = readDB();
  const { username, password, stream_id } = req.params;
  const u = db.users.find(u => u.username===username && u.password===password && u.status==='active');
  if (!u) return res.status(403).send('Forbidden');
  const ch = db.channels.find(c => String(c.id) === String(stream_id) && c.enabled);
  if (!ch) return res.status(404).send('Not Found');
  res.redirect(ch.url);
});

// رابط M3U Playlist
app.get('/get.php', (req, res) => {
  const db = readDB();
  const u  = userAuth(req, res);
  if (!u) return res.status(401).send('Unauthorized');

  const base    = db.settings.server_url;
  const active  = db.channels.filter(c => c.enabled);
  let m3u = '#EXTM3U\n';
  active.forEach(ch => {
    m3u += `#EXTINF:-1 tvg-id="${ch.epg_id||''}" tvg-name="${ch.name}" tvg-logo="${ch.logo||''}" group-title="${ch.category}",${ch.name}\n`;
    m3u += `${base}/live/${u.username}/${u.password}/${ch.id}\n`;
  });

  res.setHeader('Content-Type', 'application/x-mpegurl');
  res.setHeader('Content-Disposition', 'attachment; filename="playlist.m3u8"');
  res.send(m3u);
});

// EPG
app.get('/xmltv.php', (req, res) => {
  const u = userAuth(req, res);
  if (!u) return res.status(401).send('Unauthorized');
  res.setHeader('Content-Type', 'application/xml');
  res.send('<?xml version="1.0" encoding="UTF-8"?><tv generator-info-name="XtreamAR"></tv>');
});

// ══════════════════════════════════════════════════════════
//  ADMIN API
// ══════════════════════════════════════════════════════════

// إعدادات
app.get('/api/settings',    adminAuth, (req,res) => res.json({ credits: req.db.credits, settings: req.db.settings }));
app.post('/api/settings',   adminAuth, (req,res) => {
  const db = req.db;
  Object.assign(db.settings, req.body);
  writeDB(db); res.json({ ok: true });
});

// ── القنوات ──
app.get('/api/channels',    adminAuth, (req,res) => res.json(req.db.channels));
app.post('/api/channels',   adminAuth, (req,res) => {
  const db = req.db;
  const ch = {
    id:       Date.now(),
    name:     req.body.name,
    url:      req.body.url,
    category: req.body.category || 'عام',
    country:  req.body.country  || '',
    logo:     req.body.logo     || '',
    epg_id:   req.body.epg_id   || '',
    enabled:  true
  };
  db.channels.push(ch);
  writeDB(db); res.json({ ok: true, channel: ch });
});
app.put('/api/channels/:id',  adminAuth, (req,res) => {
  const db = req.db;
  const idx = db.channels.findIndex(c => String(c.id) === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  Object.assign(db.channels[idx], req.body);
  writeDB(db); res.json({ ok: true });
});
app.delete('/api/channels/:id', adminAuth, (req,res) => {
  const db = req.db;
  db.channels = db.channels.filter(c => String(c.id) !== req.params.id);
  writeDB(db); res.json({ ok: true });
});

// ── المستخدمون ──
app.get('/api/users',       adminAuth, (req,res) => res.json(req.db.users));
app.post('/api/users',      adminAuth, (req,res) => {
  const db = req.db;
  const dur = parseInt(req.body.duration_months) || 1;
  if (db.credits < dur) return res.status(400).json({ error: 'رصيد الكريديت غير كافٍ' });
  const exp = new Date(); exp.setMonth(exp.getMonth() + dur);
  const user = {
    id:              Date.now(),
    username:        req.body.username,
    password:        req.body.password,
    max_connections: parseInt(req.body.max_connections) || 2,
    exp_date:        exp.toISOString().split('T')[0],
    bouquet:         req.body.bouquet || 'الباقة الكاملة',
    status:          'active',
    created_at:      new Date().toISOString()
  };
  db.users.push(user);
  db.credits -= dur;
  writeDB(db); res.json({ ok: true, user });
});
app.put('/api/users/:id',   adminAuth, (req,res) => {
  const db = req.db;
  const idx = db.users.findIndex(u => String(u.id) === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  Object.assign(db.users[idx], req.body);
  writeDB(db); res.json({ ok: true });
});
app.delete('/api/users/:id', adminAuth, (req,res) => {
  const db = req.db;
  db.users = db.users.filter(u => String(u.id) !== req.params.id);
  writeDB(db); res.json({ ok: true });
});

// ── الكريديت ──
app.post('/api/credits/add', adminAuth, (req,res) => {
  const db  = req.db;
  const amt = parseInt(req.body.amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
  db.credits += amt;
  writeDB(db); res.json({ ok: true, credits: db.credits });
});

// ── الموزعون ──
app.get('/api/resellers',   adminAuth, (req,res) => res.json(req.db.resellers));
app.post('/api/resellers',  adminAuth, (req,res) => {
  const db = req.db;
  const r  = { id: Date.now(), ...req.body, credits: parseInt(req.body.credits)||0, users: 0, status:'active' };
  db.resellers.push(r);
  writeDB(db); res.json({ ok: true });
});

// ─── FRONTEND (Static Files) ─────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req,res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ─── START ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ XtreamAR Server running on port ${PORT}`);
  console.log(`🌐 Admin panel: http://localhost:${PORT}`);
  console.log(`📺 Xtream API:  http://localhost:${PORT}/player_api.php`);
  console.log(`📋 M3U:         http://localhost:${PORT}/get.php?username=USER&password=PASS&type=m3u_plus`);
  console.log(`\n🔑 Admin: admin / admin123\n`);
});
