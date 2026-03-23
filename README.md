# XtreamAR Panel — تعليمات التشغيل

## 📁 هيكل الملفات
```
xtream-server/
├── server.js        ← السيرفر الحقيقي (Node.js)
├── package.json     ← إعدادات المشروع
├── db.json          ← قاعدة البيانات (يُنشأ تلقائياً)
└── public/
    └── index.html   ← لوحة التحكم (الواجهة)
```

---

## 🚀 تشغيل السيرفر محلياً

```bash
# 1. تثبيت المتطلبات
npm install

# 2. تشغيل السيرفر
node server.js
```

افتح المتصفح على: **http://localhost:8080**

---

## 🌐 رفع السيرفر على الإنترنت

### خيار 1 — Railway (مجاني)
1. اذهب لـ https://railway.app
2. ارفع المجلد كـ GitHub repo
3. ستحصل على رابط مثل `https://xtream-ar.railway.app`
4. غيّر "عنوان السيرفر" في الإعدادات

### خيار 2 — VPS (DigitalOcean / Hetzner)
```bash
git clone YOUR_REPO
cd xtream-server
npm install
# تشغيل دائم
npm install -g pm2
pm2 start server.js --name xtream
pm2 save
```

### خيار 3 — Render (مجاني)
1. https://render.com
2. New Web Service → رفع الكود
3. Start command: `node server.js`

---

## 📺 استخدام مع التطبيقات

| التطبيق | الطريقة | البيانات |
|---------|---------|----------|
| TiviMate | Xtream Codes | Server + admin + admin123 |
| IPTV Smarters | Xtream Codes | Server + admin + admin123 |
| VLC | M3U URL | /get.php?username=admin&password=admin123 |
| Kodi | M3U URL | نفس رابط M3U |

---

## 🔑 بيانات الدخول الافتراضية
- **Admin Username:** admin
- **Admin Password:** admin123
- **Port:** 8080

غيّرها من صفحة الإعدادات في لوحة التحكم.
