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
    <meta charset="utf-8" />
    <title>Video Chat Application</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.js"></script>
    <link href="/styles.css" rel="stylesheet" />
  </head>
  <body>
    <div id="video-chat-lobby">
      <h2 class="text">Video Chat Application</h2>
      <input id="roomName" type="text" placeholder="Enter room name" />
      <button id="join-button" class="joinButtom">Join</button>
    </div>
    <div id="video-chat-room">
      <video id="user-video" muted="muted"></video>
      <video id="peer-video"></video>
    </div>
    <div class="btn-group" id="chat-control-panel">
      <button id="mute-button">Mute</button>&nbsp;
      <button id="camera-button">Stop Camera</button>&nbsp;
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
var videoChatLobbyDiv = document.getElementById("video-chat-lobby");
var videoChatRoomDiv = document.getElementById("video-chat-room");
var chatControlPanel = document.getElementById("chat-control-panel");

let roomNameBox = document.getElementById("roomName");
let joinButton = document.getElementById("join-button");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");

let muteButton = document.getElementById("mute-button");
let cameraButton = document.getElementById("camera-button");
let leaveRoomButton = document.getElementById("leave-room-button");

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
  
 navigator.mediaDevices.getUserMedia({ audio: true, video: { width: 1280, height: 720 } },
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
var videoChatLobbyDiv = document.getElementById("video-chat-lobby");
var videoChatRoomDiv = document.getElementById("video-chat-room");
var chatControlPanel = document.getElementById("chat-control-panel");

let roomNameBox = document.getElementById("roomName");
let joinButton = document.getElementById("join-button");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");

let muteButton = document.getElementById("mute-button");
let cameraButton = document.getElementById("camera-button");
let leaveRoomButton = document.getElementById("leave-room-button");

let roomName = "";
let rtcPeerConnection;
let creator = false;
let muteFlag = false;
let cameraFlag = false;

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
- Now BOb and John need to exchange their ICE candidate. An ICE candidate **describes the protocols and routing needed for WebRTC to be able to communicate with a remote device**
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
 
# Step-5: Setting up Client Side Events
Need to do lots of things in client (chat.js). 
- First let create the template and accept all the event
```js
socket.on("created", function () {});
socket.on("joined", function () {});
socket.on("full", function () {});
socket.on("ready", function () {});
socket.on("offer", function () {});
socket.on("answer", function () {});
socket.on("leave", function () {});
```
- Now first implment the created, joined and full call back function. Test them
```js
let userStream;
let constraints = {
  audio: true,
  video: { width: 400, height: 500 },
};

socket.on("created", function () {
   console.log("On Created");
   creator = true;
   navigator.mediaDevices
    .getUserMedia(constraints)
    .then((mediaStream) => {
      userStream = mediaStream;
      videoChatLobbyDiv.style = "display:none";
      chatControlPanel.style = "display:flex;";
      userVideo.srcObject = mediaStream;
      userVideo.onloadedmetadata = () => {
        userVideo.play();
      };
    })
    .catch((err) => {
      console.error(`${err.name}: ${err.message}`);
    });
});

socket.on("joined", function () {
  console.log("On Joined");
  creator = false;
  navigator.mediaDevices
	.getUserMedia(constraints)
	.then((mediaStream) => {
	  userStream = mediaStream;
	  videoChatLobbyDiv.style = "display:none";
	  chatControlPanel.style = "display:flex;";
	  userVideo.srcObject = mediaStream;
	  userVideo.onloadedmetadata = () => {
		userVideo.play();
	  };
	 
	})
	.catch((err) => {
	  console.error(`${err.name}: ${err.message}`);
	});
});

socket.on("full", function () {
	alert("Room is full, you can't join this room");
});

socket.on("ready", function () {});
socket.on("offer", function () {});
socket.on("answer", function () {});
socket.on("leave", function () {});
```

Implement - Ready State
- Ready is an event that's triggered by the client once he/she joins us.
- We wrote the server side of logic on receiving an event already, but we didn't actually trigger the event ready, so let's do that first.
```js
socket.on("joined", function () {
  console.log("On Joined");
  creator = false;
  navigator.mediaDevices
	.getUserMedia(constraints)
	.then((mediaStream) => {
	  userStream = mediaStream;
	  videoChatLobbyDiv.style = "display:none";
	  chatControlPanel.style = "display:flex;";
	  
	  userVideo.srcObject = mediaStream;
	  userVideo.onloadedmetadata = () => {
		userVideo.play();
	  };
	  socket.emit("ready", roomName); // Add this line
	})
	.catch((err) => {
	  console.error(`${err.name}: ${err.message}`);
	});
});
```

## RTCPeerConnection - onICECandidateEvent

- The next step basically is the creator of the room now has to try and establish a connection with the person who joined the room.
- Now, before all of this, first of all, both people in the room now need to know their public address and this is done with the help of ICE framework, like we were talking about this framework.
- All of this attempt to establish connection is actually managed by a WebRTC interface called RTCPeerConnection
- this RTCPeerConnection interface has a function called onicecandidate but this event 
  will be trigger every time you get back a ice candidate from STUN server, but the logic of what 
  happens when you get back ICE  candidate has to be implemented by us. 


```js
const configuration = {
  iceServers: [
    {
      urls: "stun:stun.services.mozilla.com",
    },
    {
      urls: "stun:stun1.l.google.com:19302",
    },
  ],
};
var rtcPeerConnection ;

socket.on("ready", function () {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(configuration);
    rtcPeerConnection.onicecandidate = onICECandidateEvent;
  }
});
function onICECandidateEvent(event) {
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName);
  }
}

socket.on("candidate", function (candidate) {
    console.log("On candidate");
    var iceCandidate = new RTCIceCandidate(candidate);
    //rtcPeerConnection.addIceCandidate(iceCandidate);
});

```
- You just learn the first half of the ready event, but there's obviously more to it

## RTCPeerConnection - ontrackEvent

- One more imporant function just like icecandiate is ontrack Function
- Ontrack function gets triggered when we start to getting media streams from the peer to which we are trying establish connection.
(So in case of a Bob John example, then Bob gets video streams or audio streams from John that pending on the track)
- What should we do when we are getting media streams from the PR on the other side? We have to display the median in our peerVideo

```js
socket.on("ready", function () {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(configuration);
    rtcPeerConnection.onicecandidate = onICECandidateEvent;
	rtcPeerConnection.ontrack = ontrackEvent;
  }
});

function ontrackEvent(event) {
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = () => {
    peerVideo.play();
  };
}
```
- So upto here, we have learn to implement another important function, which is part of the connection

## Adding Media Tracks (addtrack)
- we implemented the on track function here will continue implementing the things that go inside already event.
- we are handling when you get media streams from the on the other side, but we are also responsible to send media information to other side. 
  So that they(remote user) can also see our side's media.
- addtrack take two arguments (fisrt track and second stream)
```js
socket.on("ready", function () {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(configuration);
    rtcPeerConnection.onicecandidate = onICECandidateEvent;
	rtcPeerConnection.ontrack = ontrackEvent;
	
	rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); // Added (audio track)
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream); // Added (video track)
  }
});
```
- we're not just receiving the track and showing it on our user end, but also learning how tosend tracks to the other side.
## Creating an Offer

- we talked about exchanging ice candidates so that Bob and John knows each other's public address. We also need to exchange offers
- An offer contains the information about the media that you're sending. Bob needs to send an offer over to John so that John can understand what type of information is coming.
- So here we need to create an offer and emit a offer event to send it to other side

```js
socket.on("ready", function () {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(configuration);
    rtcPeerConnection.onicecandidate = onICECandidateEvent;
	rtcPeerConnection.ontrack = ontrackEvent;
	
	rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); // Added (audio track)
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream); // Added (video track)
	rtcPeerConnection
      .createOffer()
      .then((offer) => {
        //rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomName);
      })
      .catch((error) => {
        console.log("Error while creating offer", error);
      });
	  
  }
});
```
- SO here we have learn how to create an offfer and emitting the offer os that our signalling server can broad cast to other side of peer.

## Offer and Answer
 - Up to this point all are happening at the end of the person who is creating the room. but what about the person who joined the room
 - On receiving this offer event, other persons (Persons who joined) have to do exactly everything 
	that the person who created the room is doing.
- Also they have to create an answer

- Now, There is an important part, because there's something called local description and something called remote description
- offer is remote description and answer is local description for John here
```js
socket.on("offer", function (offer) {
   if (!creator) {
    rtcPeerConnection = new RTCPeerConnection(configuration);
    rtcPeerConnection.onicecandidate = onICECandidateEvent;
    rtcPeerConnection.ontrack = ontrackEvent;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection
      .createAnswer()
      .then((answer) => {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, roomName);
      })
      .catch((error) => {
        console.log("Error while creating answer", error);
      });
  }
  
});
```
- answer is remote description for Bob and offer is local description
```js
socket.on("answer", function (answer) {
  console.log("I am in answer::", answer);
  rtcPeerConnection.setRemoteDescription(answer);

});

socket.on("ready", function () {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(configuration);
    rtcPeerConnection.onicecandidate = onICECandidateEvent;
	rtcPeerConnection.ontrack = ontrackEvent;
	
	rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); // Added (audio track)
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream); // Added (video track)
	rtcPeerConnection
      .createOffer()
      .then((offer) => {
        rtcPeerConnection.setLocalDescription(offer); // Added this line
        socket.emit("offer", offer, roomName);
      })
      .catch((error) => {
        console.log("Error while creating offer", error);
      });
	  
  }
});

```

## Create other parts (leaving room, pausing video etc)
```js 
leaveRoomButton.addEventListener("click", function () {
  socket.emit("leave", roomName);
  videoChatLobbyDiv.style = "display:block";
  chatControlPanel.style = "display:none;";

  if (userVideo.srcObject) {
    userVideo.srcObject.getTracks()[0].stop();
    userVideo.srcObject.getTracks()[1].stop();
  }

  if (peerVideo.srcObject) {
    peerVideo.srcObject.getTracks()[0].stop();
    peerVideo.srcObject.getTracks()[1].stop();
  }
  
  if (rtcPeerConnection) {
    rtcPeerConnection.ontrack = null;
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.close();
    rtcPeerConnection = null;
  }
  
});

socket.on("leave", function () {
  creator = true;
  if (peerVideo.srcObject) {
    peerVideo.srcObject.getTracks()[0].stop();
    peerVideo.srcObject.getTracks()[1].stop();
  }

  if (rtcPeerConnection) {
    rtcPeerConnection.ontrack = null;
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.close();
    rtcPeerConnection = null;
  }
});

cameraButton.addEventListener("click", function () {
  cameraFlag = !cameraFlag;
  if (cameraFlag) {
    userStream.getTracks()[1].enabled = false;
    cameraButton.textContent = "Show Camera";
  } else {
    userStream.getTracks()[1].enabled = true;
    cameraButton.textContent = "Hide Camera";
  }
});

muteButton.addEventListener("click", function () {
  muteFlag = !muteFlag;
  if (muteFlag) {
    userStream.getTracks()[0].enabled = false;
    muteButton.textContent = "Unmute";
  } else {
    userStream.getTracks()[0].enabled = true;
    muteButton.textContent = "Mute";
  }
});
```



 







