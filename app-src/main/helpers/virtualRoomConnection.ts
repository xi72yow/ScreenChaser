import { Server } from "socket.io";

const io = new Server(4545, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
    allowedHeaders: ["virtual-room"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.info(`Client connected [id=${socket.id}]`);

  socket.on("disconnect", () => {
    console.info(`Client gone [id=${socket.id}]`);
  });
});

function onEmit(ip, pixelarray) {
  io.sockets.emit("package", JSON.stringify({ ip, pixelarray }));
}

export default onEmit;
