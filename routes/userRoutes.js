const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const connectDB = require("../database");
const { chkUser } = require("../utils/middleware");
const { userUpload } = require("../s3Upload");

let db;
connectDB
  .then((client) => {
    db = client.db("joinTeam");
  })
  .catch((err) => {
    console.log(err);
  });

router.get("/", chkUser, async (req, res) => {
  const user = req.user;
  try {
    if (user) {
      const result = await db.collection("user").findOne({ _id: user._id });
      console.log(result);
      res.status(201).json(result);
    } else {
      res.status(401).json({ message: "인증되지 않은 사용자입니다." });
    }
  } catch (error) {
    console.error("데이터 조회 오류 : ", err);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

router.put("/comment", chkUser, async (req, res) => {
  const user = req.user;
  try {
    const result = await db.collection("user").updateOne(
      { _id: user._id },
      {
        $set: {
          introComment: req.body.introComment,
        },
      }
    );
    res.status(201).json({ result });
  } catch (error) {
    console.error("데이터 조회 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

router.put(
  "/profile",
  chkUser,
  userUpload.single("images"),
  async (req, res) => {
    const user = req.user;
    let result;
    try {
      if (req.file) {
        const images = req.file.location;
        result = await db.collection("user").updateOne(
          { _id: user._id },
          {
            $set: {
              name: req.body.name,
              interestList: req.body.interestList,
              thumbnail: images,
            },
          }
        );
      } else {
        result = await db.collection("user").updateOne(
          { _id: user._id },
          {
            $set: {
              name: req.body.name,
              interestList: req.body.interestList,
            },
          }
        );
      }
      res.status(201).json(result);
    } catch (error) {
      console.error("데이터 수정 오류 : ", error);
      res.status(500).json({ error: "서버 오류 발생" });
    }
  }
);

module.exports = router;
