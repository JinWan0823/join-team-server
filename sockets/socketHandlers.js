const { ObjectId } = require("mongodb");

module.exports = (io, db) => {
  io.on("connection", (socket) => {
    console.log("클라이언트 소켓연결");

    socket.on("joinRoom", (data) => {
      socket.join(data);
    });

    socket.on("message", async (data) => {
      try {
        const user = await db
          .collection("user")
          .findOne({ _id: new ObjectId(data.who) });
        const userInfo = user
          ? { name: user.name, thumbnail: user.thumbnail }
          : { name: "알수없음", thumbnail: null };

        await db.collection("chatMessage").insertOne({
          parentRoom: new ObjectId(data.parentRoom),
          content: data.content,
          time: data.time,
          who: data.who,
        });

        await db
          .collection("chat")
          .updateOne(
            { clubId: new ObjectId(data.parentRoom) },
            { $set: { lastMessageTime: data.time, lastMessage: data.content } }
          );

        await db
          .collection("club")
          .updateOne(
            { _id: new ObjectId(data.parentRoom) },
            { $set: { lastMessageTime: data.time } }
          );

        io.to(data.parentRoom).emit("message", {
          ...data,
          userInfo,
        });
      } catch (err) {
        console.error("메시지 저장 오류", err);
      }
    });

    socket.on("userJoined", async (data) => {
      // console.log("Received userJoined data:", data); // 데이터 내용 출력
      try {
        let userName;
        if (data.who === "System Message") {
          userName = "System"; // 시스템 메시지일 경우 기본 이름 설정
        } else {
          // 유저가 직접 참여한 경우만 데이터베이스에서 사용자 이름을 조회
          const user = await db
            .collection("user")
            .findOne({ _id: new ObjectId(data.who) });
          userName = user ? user.name : "Unknown User";
        }

        const joined = await db.collection("chatMessage").insertOne({
          parentRoom: new ObjectId(data.parentRoom),
          content: "system 메세지",
          time: data.time,
          who: "System Message",
          userId: data.userId,
        });
        io.to(data.parentRoom).emit("userJoined", data);
      } catch (err) {
        console.error("메시지 저장 오류", err);
      }
    });
  });
};
