import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

/* 🔍 Health check */
app.get("/", (req, res) => {
  res.send("✅ Realtime Notify Server Running");
});

/* 🔔 Receive from PHP & broadcast */
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

  console.log("📩 Notification broadcast for user:", user_id);

  res.json({ success: true });
});

/* 🔌 Socket connect */
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
