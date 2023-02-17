# Step-1 : Create Node Server
 - Create node application
 - mkdir real-time-video-chat
 - cd real-time-video-chat
 - npm init
 - npm install express
 - npm install socket.io
 - Modify index.js as below
```js
const express = require("express");
const socket = require("socket.io");
const app = express();

let server = app.listen(4000, function () {
  console.log("Server is running");
});

app.use(express.static("public"));
```
- Add below content in public/index.html
```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Video Chat Application</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.js"></script>
        <link href="/styles.css" rel="stylesheet" />
    </head>
    <body>

        <div id="video-chat-lobby">
            <h2 class="text">Video Chat Application</h2>
            <input id="roomName" type="text" placeholder="Room Name" />
            <button id="join">Join</button>
        </div>
		
        <div id="video-chat-room">
            <video id="user-video" muted="muted"></video>
            <video id="peer-video"></video>
        </div>
		
		<div class="btn-group" id="chat-control-panel">
		  <button id="mute-button">Mute</button>
		  <button id="camera-button">Stop Camera</button>
		  <button id="leave-room-button">Leave Room</button>
		</div>
	

    </body>
    <script src="https://cdn.socket.io/socket.io-3.0.1.min.js"></script>
    <script src="/chat.js"></script>
</html>
```
- create blank public/chat.js 
- create style.css add copy content from repository
- start node server with node index.js

# Step-2 : Now access user media
- Add following content in chat.js
```js
let divVideoChatLobby = document.getElementById("video-chat-lobby");
let divVideoChat = document.getElementById("video-chat-room");
let joinButton = document.getElementById("join");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");
let roomInput = document.getElementById("roomName");

```
By default if user click on join button nothing will happen. To make join button work we have to add a listner in join button
 - Add Event Listener on join button add access user media here
```js 
joinButton.addEventListener("click", function () {
  if (roomInput.value == "") {
    alert("Please enter a room name");
	return;
  }
  roomName = roomInput.value;
  
  //Now access user media 
  //https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia
  
  navigator.getUserMedia({ audio: true, video: { width: 1280, height: 720 } },
      (stream) => {
         userVideo.srcObject = stream;
         userVideo.onloadedmetadata = (e) => {
           userVideo.play();
         };
      },
      (err) => {
         console.error(`The following error occurred: ${err.name}`);
      }
   );
  
});
```
# Step-3 : Creating room in our socket server

 - Start implementing signaling server (index.js) before that we will make small modification in chat.js

```js
let socket = io.connect("http://localhost:4000"); //uncomment this line
let divVideoChatLobby = document.getElementById("video-chat-lobby");
let divVideoChat = document.getElementById("video-chat-room");
let joinButton = document.getElementById("join");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");
let roomInput = document.getElementById("roomName");

joinButton.addEventListener("click", function () {
  if (roomInput.value == "") {
    alert("Please enter a room name");
	return;
  }
  roomName = roomInput.value;
  
  socket.emit("join", roomName); //Add this line
  //Now access user media 
  //https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia
  
  navigator.getUserMedia({ audio: true, video: { width: 1280, height: 720 } },
      (stream) => {
         userVideo.srcObject = stream;
         userVideo.onloadedmetadata = (e) => {
           userVideo.play();
         };
      },
      (err) => {
         console.error(`The following error occurred: ${err.name}`);
      }
   );
   
  
});

```

- Modify index.js as per below
```js
const io = socket(server);
io.on("connection", function (socket) {
  console.log("User connected::", socket.id);
  socket.on("join", function (roomName) {
    var rooms = io.sockets.adapter.rooms;
	console.log(rooms);
	
    var room = rooms.get(roomName);
    if (room === undefined) {
	  console.log("Room created");
      socket.join(roomName);
      //socket.emit("created");
    } else if (room.size == 1) {
	  console.log("Room join");
      socket.join(roomName);
      //socket.emit("joined");
    } else {
	  console.log("Romm is full::");
	  //socket.emit("full");
    }
    console.log("Romms::", rooms);
  });
});
```
- resrat node server and open hppt://localhost:4000 and check the logs of client and server
# Step-4 : Making a Signaling Server
We should let our client what is happening. DO so server should emit some event.

- Modify index.js as per below. 
```js
const io = socket(server);
io.on("connection", function (socket) {
  console.log("User connected::", socket.id);
  socket.on("join", function (roomName) {
    var rooms = io.sockets.adapter.rooms;
	console.log(rooms);
	
    var room = rooms.get(roomName);
    if (room === undefined) {
	  console.log("Room created");
      socket.join(roomName);
      socket.emit("created");
    } else if (room.size == 1) {
	  console.log("Room join");
      socket.join(roomName);
      socket.emit("joined");
    } else {
	  console.log("Romm is full::");
	  socket.emit("full");
    }
    console.log("Romms::", rooms);
  });
  
});
```
- Now if someone join the room (here John join the room created by Bob) room owner need to know it. We can implement it by creating ready event
```js
const io = socket(server);
io.on("connection", function (socket) {
  console.log("User connected::", socket.id);
  socket.on("join", function (roomName) {
  });
  
  socket.on("ready", function (roomName) {
    console.log("On Ready::", roomName);
    socket.broadcast.to(roomName).emit("ready");
  });
});
```
- Now BOb and John need to exchange their ICE candidate. An ICE candidate *** describes the protocols and routing needed for WebRTC to be able to communicate with a remote device**
Typically ice candidate provides the information about the ipaddress and port from where the data is going to be exchanged.
It's format is something like follows
a=candidate:1 1 UDP 2130706431 192.168.1.102 1816 typ host

```js
socket.on("candidate", function (candidate, roomName) {
    console.log("On Candidate::", roomName);
    socket.broadcast.to(roomName).emit("candidate", candidate);
});
```
- Now BOb will send a offer to John

```js
socket.on("offer", function (offer, roomName) {
	console.log("On Offer::", roomName);
	console.log(offer);
	socket.broadcast.to(roomName).emit("offer", offer);
});
```
- John will send a answer to Bob
```js
socket.on("answer", function (answer, roomName) {
    console.log("On answer::", roomName);
    socket.broadcast.to(roomName).emit("answer", answer);
  });
```
- If someone leave the room other party should know 

```js
 socket.on("leave", function (roomName) {
    console.log("On leave::", roomName);
    socket.leave(roomName);
    socket.broadcast.to(roomName).emit("leave");
  });
 ```
 
# Step-4: Setting up Client Side Events
- Now client (chat.js) file should catch these events

