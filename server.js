import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

/* =====================================================
   SOCKET.IO SETUP
===================================================== */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

/* =====================================================
   HEALTH CHECK
===================================================== */
app.get("/", (req, res) => {
  res.send("✅ Realtime Notify + Chat Server Running");
});

/* =====================================================
   🔔 NOTIFICATION FROM PHP
===================================================== */
app.post("/notify", (req, res) => {
  const { user_id, title, message, link } = req.body;

  if (!user_id || !title || !message) {
    return res.status(400).json({ success: false });
  }

  io.emit("notification", {
    user_id,
    title,
    message,
    link
  });

  console.log("🔔 Notification sent to user:", user_id);
  res.json({ success: true });
});

/* =====================================================
   🟢 ONLINE USERS TRACKING
===================================================== */
const onlineUsers = new Set();

/* =====================================================
   🔌 SOCKET CONNECTION
===================================================== */
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  /* ------------------------------
     USER ONLINE
  ------------------------------ */
  socket.on("user_online", (userId) => {
    socket.userId = userId;
    onlineUsers.add(userId);

    console.log("🟢 User online:", userId);
    io.emit("online_users", Array.from(onlineUsers));
  });

  /* ------------------------------
     CHAT MESSAGE
  ------------------------------ */
  socket.on("send_chat", (data) => {
    if (!data?.sender || !data?.receiver || !data?.message) return;

    console.log(`💬 Chat ${data.sender} → ${data.receiver}`);

    io.emit("receive_chat", {
      sender: data.sender,
      receiver: data.receiver,
      message: data.message,
      ts: Date.now()
    });
  });

  /* ------------------------------
     DISCONNECT
  ------------------------------ */
  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log("🔴 User offline:", socket.userId);

      io.emit("online_users", Array.from(onlineUsers));
    } else {
      console.log("🔴 Socket disconnected:", socket.id);
    }
  });
});

/* =====================================================
   SERVER START
===================================================== */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
