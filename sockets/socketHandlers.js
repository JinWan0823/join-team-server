const { ObjectId } = require("mongodb");

module.exports = (io, db) => {
  io.on("connection", (socket) => {
    console.log("클라이언트 소켓연결");

    socket.on("joinRoom", (data) => {
      socket.join(data);
    });

    socket.on("message", async (data) => {
      try {
        await db.collection("chatMessage").insertOne({
          parentRoom: new ObjectId(data.room),
          content: data.msg,
        });
        console.log("유저 msg", data);
        io.to(data.room).emit("broadcast", data.msg);
      } catch (err) {
        console.error("메시지 저장 오류", err);
      }
    });
  });
};
