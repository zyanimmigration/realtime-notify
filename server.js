import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

/* ===============================
   SOCKET.IO SETUP
   =============================== */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/* ===============================
   MIDDLEWARE
   =============================== */
app.use(cors());
app.use(express.json());

/* ===============================
   SOCKET CONNECTION
   =============================== */
io.on("connection", (socket) => {
  console.log("🟢 socket connected:", socket.id);

  socket.on("register", (userId) => {
    if (!userId) return;
    const room = "user_" + userId;
    socket.join(room);
    console.log("👤 user registered:", room);
  });

  socket.on("disconnect", () => {
    console.log("🔴 socket disconnected:", socket.id);
  });
});

/* ===============================
   PHP → NODE NOTIFY ENDPOINT
   =============================== */
app.post("/notify", (req, res) => {
  const { user_id, title, message, link } = req.body;

  if (!user_id || !title || !message) {
    return res.status(400).json({ success: false });
  }

  const room = "user_" + user_id;

  io.to(room).emit("notification", {
    title,
    message,
    link
  });

  console.log("📩 notification sent to", room);

  res.json({ success: true });
});

/* ===============================
   START SERVER
   =============================== */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🚀 Realtime Notify running on port", PORT);
});
