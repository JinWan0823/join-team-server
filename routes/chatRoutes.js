const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const connectDB = require("../database");
const { feedUpload } = require("../s3Upload");
const { chkUser } = require("../utils/middleware");

let db;
connectDB
  .then((client) => {
    db = client.db("joinTeam");
  })
  .catch((err) => {
    console.log(err);
  });

router.get("/list", async (req, res) => {
  let result;

  if (req.user) {
    result = await db
      .collection("chat")
      .find({
        member: req.user._id,
      })
      .toArray();
    res.status(200).json(result);
  } else {
    res.status(404).json({ message: "가입중인 클럽이 없습니다." });
  }
});

router.get("/:roomId", async (req, res) => {
  const roomId = req.params.roomId;
  console.log(roomId);
  try {
    const messages = await db
      .collection("chatMessage")
      .aggregate([
        {
          $match: { parentRoom: new ObjectId(roomId) },
        },
        {
          $addFields: {
            whoObjectId: {
              $cond: {
                if: { $eq: ["$who", "System Message"] },
                then: null,
                else: { $toObjectId: "$who" },
              },
            },
          },
        },
        {
          $lookup: {
            from: "user",
            localField: "whoObjectId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $unwind: {
            path: "$userInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            content: 1,
            parentRoom: 1,
            time: 1,
            who: 1,
            userId: 1,
            "userInfo.name": 1,
            "userInfo.thumbnail": 1,
          },
        },
      ])
      .toArray();

    res.status(200).json(messages);
  } catch (err) {
    console.error("메시지 불러오기 오류", err);
    res.status(500).json({ message: "메시지를 불러오는 데 실패했습니다." });
  }
});
module.exports = router;
