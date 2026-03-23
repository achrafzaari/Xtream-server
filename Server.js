const express = require("express");
const cors = require("cors");

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// عرض ملفات HTML من public
app.use(express.static("public"));

// route رئيسي
app.get("/", (req, res) => {
  res.send("Server is working 🚀");
});

// API تجريبي
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working ✅" });
});

// PORT ديال Railway
const PORT = process.env.PORT || 3000;

// تشغيل السيرفر
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
