const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.get("/ping", (req, res) => {
  res.send("i am ping")
  //return res.json({ msg: "Ping Successful" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);
const io = socket(server, {
  cors: {
    origin: "https://snappy-chat-jvf6.vercel.app",
    // origin: "*",
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  console.log("global.chatSocket   ", global.chatSocket.id);


  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      console.log("sendUserSocket:  ",sendUserSocket)
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
      console.log("emitted msg-receive", data.msg);
    }else{
      console.log("no send iuser found")
    }
  });

  socket.on('disconnect',() => {
    for(const [mongoid,socketid] of global.onlineUsers.entries()) {
      if(socketid == socket.id){
        console.log("remover  ",socketid);
        global.onlineUsers.delete(mongoid)
        return;
      }
    }
  })



});
