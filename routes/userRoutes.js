const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const connectDB = require("../database");
const chkUser = require("../utils/util");

let db;
connectDB
  .then((client) => {
    db = client.db("joinTeam");
  })
  .catch((err) => {
    console.log(err);
  });

router.get("/", async (req, res) => {
  const user = req.user;
  console.log(user);
  try {
    const result = await db.collection("user").findOne({ _id: user._id });
    console.log(result);
    res.status(201).json(result);
  } catch (error) {
    console.error("데이터 조회 오류 : ", err);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

router.put("/comment", async (req, res) => {
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
    console.error("데이터 조회 오류 : ", err);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

module.exports = router;
