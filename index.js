const express = require("express");
const socket = require("socket.io");
const app = express();
const port = process.env.PORT || 4000;
const server = app.listen(port, function () {
  console.log("Server is running");
});
app.use(express.static("public"));

const io = socket(server);
io.on("connection", function (socket) {
  console.log("User connected::", socket.id);

  socket.on("join", function (roomName) {
    var rooms = io.sockets.adapter.rooms;
    var room = rooms.get(roomName);
    if (room === undefined) {
      socket.join(roomName);
      socket.emit("created");
    } else if (room.size == 1) {
      socket.join(roomName);
      socket.emit("joined");
    } else {
      socket.emit("full");
    }
    console.log("Romms::", rooms);
  });

  socket.on("ready", function (roomName) {
    console.log("On Ready::", roomName);
    socket.broadcast.to(roomName).emit("ready");
  });

  socket.on("candidate", function (candidate, roomName) {
    console.log("On Candidate::", roomName);
    socket.broadcast.to(roomName).emit("candidate", candidate);
  });

  socket.on("offer", function (offer, roomName) {
    console.log("On Offer::", roomName);
    console.log(offer);
    socket.broadcast.to(roomName).emit("offer", offer);
  });

  socket.on("answer", function (answer, roomName) {
    console.log("On answer::", roomName);
    socket.broadcast.to(roomName).emit("answer", answer);
  });

  socket.on("leave", function (roomName) {
    console.log("On leave::", roomName);
    socket.leave(roomName);
    socket.broadcast.to(roomName).emit("leave");
  });
});
