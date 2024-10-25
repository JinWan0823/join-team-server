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
          parentRoom: new ObjectId(data.parentRoom),
          content: data.content,
          time: data.time,
          who: data.who,
        });
        console.log("유저 msg", data);

        await db
          .collection("chat")
          .updateOne(
            { _id: new ObjectId(data.parentRoom) },
            { $set: { lastMessageTime: data.time } }
          );

        io.to(data.parentRoom).emit("message", data);
      } catch (err) {
        console.error("메시지 저장 오류", err);
      }
    });
  });
};
