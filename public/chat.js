let socket = io.connect("http://localhost:4000");
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

let userStream;
let constraints = {
  audio: true,
  video: { width: 400, height: 500 },
};

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

chatControlPanel.style = "display:none;";

joinButton.addEventListener("click", function () {
  roomName = roomNameBox.value;
  console.log("Room Name::", roomName);
  if (roomName == "") {
    alert("Please enter room name");
    return;
  }
  socket.emit("join", roomName);
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

cameraButton.addEventListener("click", function () {
  cameraFlag = !cameraFlag;
  if (cameraFlag) {
    userStream.getTracks()[1].enabled = false;
    muteButton.textContent = "Show Camera";
  } else {
    userStream.getTracks()[1].enabled = true;
    muteButton.textContent = "Hide Camera";
  }
});

socket.on("created", function () {
  console.log("On Created");
  creator = true;
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((mediaStream) => {
      userStream = mediaStream;
      videoChatLobbyDiv.style = "display:none";
      userVideo.srcObject = mediaStream;
      userVideo.onloadedmetadata = () => {
        userVideo.play();
      };
      chatControlPanel.style = "display:flex;";
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
      socket.emit("ready", roomName);
    })
    .catch((err) => {
      console.error(`${err.name}: ${err.message}`);
    });
});

socket.on("full", function () {
  alert("Room is full, you can't join this room");
});

socket.on("ready", function () {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(configuration);
    rtcPeerConnection.onicecandidate = onICECandidateEvent;
    rtcPeerConnection.ontrack = ontrackEvent;
    console.log(userStream.getTracks());
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection
      .createOffer()
      .then((offer) => {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomName);
      })
      .catch((error) => {
        console.log("Error while creating offer", error);
      });
  }
});

socket.on("candidate", function (candidate) {
  var iceCandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(iceCandidate);
});

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

socket.on("answer", function (answer) {
  rtcPeerConnection.setRemoteDescription(answer);
});

function onICECandidateEvent(event) {
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName);
  }
}

function ontrackEvent(event) {
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = () => {
    peerVideo.play();
  };
}

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
