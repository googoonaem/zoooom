const socket = io();
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const chat = document.getElementById("chat");
const chatUl = call.querySelector("ul");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;


const getCameras = async() => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if(currentCamera.label == camera.label) {
        option.selected = true;
      }
      cameraSelect.appendChild(option);
    });

  } catch (error) {
    console.log(error);
  }
}

const getMedia = async (deviceId) => {
    const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(deviceId ? cameraConstraints : initialConstrains);
    myFace.srcObject = myStream;
    if(!deviceId) {
      await getCameras();
    }
  }catch(error) {
    console.log(error);
  }
}

const handleMuteCLick = () => {
  myStream.getAudioTracks().forEach((track) =>(track.enabled = !track.enabled));
  if(!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}
const handleCameraCLick = () => {
  myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
  if(cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

const handleCameraSwitch = async () => {
  await getMedia(cameraSelect.value);
  if(myPeerConnection) {
    const videoSender = myPeerConnection.getSenders();
    console.log(videoSender);
  }
}

const handleChatSubmit = (e) =>{
  e.preventDefault();
  const input = chat.querySelector("input");
  myDataChannel.send(JSON.stringify({
    type:"message",
    message: input.value
  }));
  importChat("owner", input.value);
  input.value = "";
}

const importChat = (isOwner,message) =>{
  const li = document.createElement("li");
  li.innerText =  `${isOwner === "owner"? "나" :"someone"}: ${message}`;
  chatUl.appendChild(li);
}


muteBtn.addEventListener("click", handleMuteCLick);
cameraBtn.addEventListener("click", handleCameraCLick);
cameraSelect.addEventListener("input", handleCameraSwitch);
chat.addEventListener("submit", handleChatSubmit);

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const welcomeSelect = welcome.querySelector("select");


socket.on("rooms", (rooms) =>{
  if(rooms.length != 0) {
    rooms.forEach((room) => {
      const option = document.createElement("option");
      option.innerText = room;
      option.value=room;
      welcomeSelect.appendChild(option);
    })
    
  }
});

const initCall = async () => {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();

}

const handleWelcomeSubmit = async (e) => {
  e.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}


welcomeForm.addEventListener("submit", handleWelcomeSubmit);


socket.on("welcome",async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", (message) => {
    const parsedMsg = JSON.parse(message.data);
    if(parsedMsg.type === "message") {
      importChat("someone",parsedMsg.message);
    }
  });
  const offer = await myPeerConnection.createOffer();
  await myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message",  (message) =>{
      const parsedMsg = JSON.parse(message.data);
      if(parsedMsg.type === "message") {
        importChat("someone", parsedMsg.message);
      }
    })
  })
  console.log("received the offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", {answer, roomName});
  console.log("send the answer");
});

socket.on("answer", (answer) => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) =>{
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});


const makeConnection = () => {
  myPeerConnection = new RTCPeerConnection();
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("track", handleAddStream);
  myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}
const handleIce = (data) => {
  console.log("send candidate");
  socket.emit("ice", {candidate: data.candidate, roomName});  
}
const handleAddStream = (data) => {
  const peersFace = document.getElementById("peersFace");
  console.log(data);
  peersFace.srcObject = data.streams[0];
}
