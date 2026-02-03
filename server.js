const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

/* ===== SOCKET.IO ===== */
const io = new Server(server, {
  cors: { origin: "*" }
});

/* ===== HEALTH CHECK ===== */
app.get("/", (req, res) => {
  res.send("Notification server running 🚀");
});

/* ===== API KEY CHECK ===== */
function verifyApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  next();
}

/* ===== SOCKET CONNECTION ===== */
io.on("connection", (socket) => {
  socket.on("register", (userId) => {
    socket.join("user_" + userId);
  });
});

/* ===== NOTIFY API ===== */
app.use(express.json());

app.post("/notify", verifyApiKey, (req, res) => {
  const { user_id, title, message } = req.body;

  io.to("user_" + user_id).emit("notification", {
    title,
    message
  });

  res.json({ success: true });
});

/* ===== START SERVER ===== */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Running on port", PORT);
});
