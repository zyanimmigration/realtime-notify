import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("Realtime Notify + Chat Server Running");
});

/* =========================
   🔔 NOTIFICATION API (PHP → NODE)
   DO NOT TOUCH THIS
========================= */
app.post("/notify", (req, res) => {
  const { user_id, title, message, link } = req.body;

  if (!user_id || !title || !message) {
    return res.status(400).json({ success: false });
  }

  // 👉 notification sirf target user ko
  io.to(`user_${user_id}`).emit("notification", {
    user_id,
    title,
    message,
    link
  });

  console.log("🔔 Notification → user_", user_id);
  res.json({ success: true });
});

/* =========================
   SOCKET.IO
========================= */
io.on("connection", (socket) => {
  console.log("🟢 socket connected", socket.id);

  /* 🔐 USER REGISTER (ROOM JOIN) */
  socket.on("register", (userId) => {
    if (!userId) return;
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`👤 user_${userId} joined`);
  });

  /* 💬 CHAT MESSAGE */
  socket.on("send_chat", (data) => {
    const { sender, receiver, message } = data;
    if (!sender || !receiver || !message) return;

    // receiver
    io.to(`user_${receiver}`).emit("receive_chat", data);

    // sender echo
    io.to(`user_${sender}`).emit("receive_chat", data);
  });

  /* ✍️ TYPING INDICATOR */
  socket.on("typing", (data) => {
    if (!data?.to) return;
    io.to(`user_${data.to}`).emit("typing", data);
  });

  socket.on("stop_typing", (data) => {
    if (!data?.to) return;
    io.to(`user_${data.to}`).emit("stop_typing", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 socket disconnected", socket.id);
  });
});

server.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
