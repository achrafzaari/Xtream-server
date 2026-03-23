const express = require("express");
const cors = require("cors");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// إذا عندك ملفات HTML في public
app.use(express.static("public"));

// Route رئيسي
app.get("/", (req, res) => {
  res.send("Server is working 🚀");
});

// مثال API
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working ✅" });
});

// مهم جدا: PORT ديال Railway
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
