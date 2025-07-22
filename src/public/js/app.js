const socket = io();
const myFace = document.querySelector("#myFace");
const muteBtn = document.querySelector("#mute");
const cameraBtn = document.querySelector("#camera");
const cameraSelect = document.querySelector("#cameras");
let myStream;
let muted = false;
let cameraOff = false;

const handleCameraChange = async () => {
  await getMedia(cameraSelect.value);
};

const getCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((video) => {
      const option = document.createElement("option");
      option.value = video.deviceId;
      option.innerText = video.label !== "" ? video.label : "Device Video";
      if (currentCamera.label == cameraBtn.label) {
        option.selected = true;
      }
      cameraSelect.appendChild(option);
    });
  } catch (error) {
    console.log(error);
  }
};

const handleMuteClick = () => {
  if (!muted) {
    myStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
};
const handleCameraClick = () => {
  if (!cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = true;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = false;
  }
};
muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);

const getMedia = async (deviceId) => {
  try {
    const initialConstrains = {
      audio: true,
      video: { facingMode: "user" },
    };
    const cameraConstrains = {
      audio: true,
      video: { deviceId: { exact: deviceId } },
    };
    myStream = await navigator.mediaDevices.getDisplayMedia(
      deviceId ? cameraConstrains : initialConstrains
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (error) {
    console.log(error);
  }
};
getMedia();

// const welcome = document.querySelector("#welcome");
// const form = welcome.querySelector("form");
// const room = document.querySelector("#room");
// room.hidden = true;
// let roomName;
// let count = 0;

// const addMessage = (message, user) => {
//   const ul = room.querySelector("ul");
//   const li = document.createElement("li");
//   if (user === undefined) {
//     li.innerText = `You: ${message}`;
//   } else {
//     li.innerText = `${user}: ${message}`;
//   }
//   ul.appendChild(li);
// };

// const addSystemMessage = (message) => {
//   const ul = room.querySelector("ul");
//   const li = document.createElement("li");
//   li.innerText = message;
//   ul.appendChild(li);
//   setTimeout(() => {
//     li.remove();
//   }, 3000);
// };

// const handleMessageSubmit = (e) => {
//   e.preventDefault();
//   const input = room.querySelector("#msg input");
//   socket.emit("new_message", { msg: input.value, roomName }, (msg) => {
//     addMessage(msg);
//   });
//   input.value = "";
//   input.focus();
// };

// const handleNicknameSubmit = (e) => {
//   e.preventDefault();
//   const input = room.querySelector("#name input");
//   socket.emit("nickname", input.value);
// };

// const showRoom = () => {
//   welcome.hidden = true;
//   room.hidden = false;
//   const h3 = room.querySelector("h3");
//   h3.innerText = `room ${roomName} (${count + 1})`;
//   const msgForm = room.querySelector("#msg");
//   const nickForm = room.querySelector("#name");
//   nickForm.addEventListener("submit", handleNicknameSubmit);
//   msgForm.addEventListener("submit", handleMessageSubmit);
// };

// const handleSubmit = (e) => {
//   e.preventDefault();
//   const input = form.querySelector("input");
//   roomName = input.value;
//   socket.emit("enter_room", input.value, showRoom);
//   input.value = "";
// };

// socket.on("room_change", (rooms, countRoom) => {
//   const roomList = welcome.querySelector("ul");
//   roomList.innerHTML = "";
//   count = countRoom;
//   if (rooms.length === 0) {
//     return;
//   }
//   rooms.forEach((room) => {
//     const li = document.createElement("li");
//     li.innerText = room;
//     roomList.append(li);
//   });
// });

// socket.on("welcome", (user, newCount) => {
//   const h3 = room.querySelector("h3");
//   h3.innerText = `room ${roomName} (${newCount})`;
//   addSystemMessage(`${user} join the room`);
// });
// socket.on("bye", (user, newCount) => {
//   const h3 = room.querySelector("h3");
//   h3.innerText = `room ${roomName} (${newCount})`;
//   addSystemMessage(`${user} left the room`);
// });

// socket.onAny((e) => {
//   console.log(`socket event: ${e}`);
// });

// socket.on("new_message", addMessage);

// form.addEventListener("submit", handleSubmit);
