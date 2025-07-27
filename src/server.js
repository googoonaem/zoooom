// import { WebSocketServer } from "ws";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { createServer } from "http";
import express from "express";

const app = express();

const PORT = 3000;

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/{*any}", (req, res) => res.redirect("/"));

const handleListen = () =>
  console.log(`Listening on http://Localhost:${PORT}🚀!!`);

const server = createServer(app);

const wsServer = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(wsServer, {
  auth: false,
});


const randomNickArr = ["i", "l", "1", "!"];
const makeNick = () => {
  let randomNick = "";
  for (let i = 0; i < 11; i++) {
    randomNick +=
      randomNickArr[Math.floor(Math.random() * randomNickArr.length)];
  }
  return randomNick;
};

const getPublicRooms = ()=>{
  const {
    sockets:{
      adapter : {sids, rooms}
    }
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if(sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

wsServer.on("connection", (socket) => {
  socket.emit("rooms", getPublicRooms());
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer, roomName);
  });
  socket.on("answer", (data) => {
    socket.to(data.roomName).emit("answer", data.answer);
  });
  socket.on("ice", (data) =>{
    socket.to(data.roomName).emit("ice", data.candidate);
  });
});

server.listen(PORT, handleListen);
