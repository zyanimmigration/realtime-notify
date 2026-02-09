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

app.get("/", (req, res) => {
  res.send("Realtime Notify + Chat Server Running");
});

const onlineUsers = new Set();

io.on("connection", (socket) => {
  console.log("🟢 socket connected", socket.id);

  socket.on("user_online", (userId) => {
    socket.userId = userId;
    onlineUsers.add(userId);
    io.emit("online_users", Array.from(onlineUsers));
  });

  socket.on("send_chat", (data) => {
    io.emit("receive_chat", data);
  });

  socket.on("typing", (data) => {
    io.emit("typing", data);
  });

  socket.on("stop_typing", (data) => {
    io.emit("stop_typing", data);
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit("online_users", Array.from(onlineUsers));
      io.emit("user_last_seen", {
        userId: socket.userId,
        time: Date.now()
      });
    }
  });
});

server.listen(3000, () => {
  console.log("🚀 Server running on 3000");
});
