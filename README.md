```js
const express = require("express");
const socket = require("socket.io");
const app = express();

let server = app.listen(4000, function () {
  console.log("Server is running");
});

app.use(express.static("public"));
```

Modify our public/index.html file
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

Getting User Media in chat.js

Accss all the element of index.html from chat.js
```js
//let socket = io.connect("http://localhost:4000");
let divVideoChatLobby = document.getElementById("video-chat-lobby");
let divVideoChat = document.getElementById("video-chat-room");
let joinButton = document.getElementById("join");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");
let roomInput = document.getElementById("roomName");

```
By default if user click on join button nothing will happen. To make join button work we have to add a listner in join button
### chat.js ###
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
Start implementing signaling server (index.js) before that we will make small modification in chat.js
### chat.js ###
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

### index.js ###
```js
const io = socket(server);
io.on("connection", function (socket) {
  console.log("User connected::", socket.id);
  socket.on("join", function (roomName) {
    var rooms = io.sockets.adapter.rooms;
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
