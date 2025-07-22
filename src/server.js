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

const publicRooms = () => {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
};

const countRoom = (roomName) => {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
};

const randomNickArr = ["i", "l", "1", "!"];
const makeNick = () => {
  let randomNick = "";
  for (let i = 0; i < 11; i++) {
    randomNick +=
      randomNickArr[Math.floor(Math.random() * randomNickArr.length)];
  }
  return randomNick;
};

wsServer.on("connection", (socket) => {
  if (socket.nickname === undefined) {
    socket.nickname = makeNick();
  }
  socket.onAny((e) => {
    console.log(`socket event: ${e}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    wsServer.sockets.emit("room_change", publicRooms(), countRoom(roomName));
  });
  socket.on("new_message", (data, done) => {
    socket.to(data.roomName).emit("new_message", data.msg, socket.nickname);
    done(data.msg);
  });
  socket.on("nickname", (nickname) => {
    socket["nickname"] = nickname;
    done();
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1);
    });
  });
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
});

server.listen(PORT, handleListen);
