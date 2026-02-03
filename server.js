const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("register", (userId) => {
    socket.join("user_" + userId);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

app.use(express.json());

app.post("/notify", (req, res) => {
  const { user_id, title, message } = req.body;

  io.to("user_" + user_id).emit("notification", {
    title,
    message
  });

  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log("Socket running on", PORT)
);
