const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const connectDB = require("../database");

let db;
connectDB
  .then((client) => {
    db = client.db("joinTeam");
  })
  .catch((err) => {
    console.log(err);
  });

router.get("/", async (req, res) => {
  console.log(req.user);
  try {
    let result = await db.collection("feed").find().toArray();
    res.status(201).json(result);
  } catch (err) {
    console.error("데이터 조회 오류 : ", err);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

router.post("/", async (req, res) => {
  const content = req.body.content;
  const hashTag = req.body.hashTag;
  const img = req.body.img;

  try {
    if (!content || hashTag.length === 0) {
      res.status(400).json({ message: "Bad Request : 잘못된 요청입니다." });
    } else {
      await db.collection("feed").insertOne({
        content: content,
        hashTag: hashTag,
        img: img,
        date: new Date(),
      });
      res.status(201).json({ message: "데이터 등록 성공" });
    }
  } catch (error) {
    console.error("데이터 등록 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    const result = await db
      .collection("feed")
      .findOne({ _id: new ObjectId(itemId) });
    if (!result) {
      res.status(404).json({ error: "데이터를 찾을 수 없습니다." });
      return;
    }
    res.json(result);
  } catch (error) {
    console.error("데이터 조회 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

router.put("/:id", async (req, res) => {
  const itemId = req.params.id;
  try {
    if (req.body.hashTag.length > 10) {
      res.status(400).json({ message: "Bad Request : 잘못된 요청입니다." });
    } else {
      await db.collection("feed").updateOne(
        { _id: new ObjectId(itemId) },
        {
          $set: {
            content: req.body.content,
            hashTag: req.body.hashTag,
            img: req.body.img,
          },
        }
      );
      res.status(201).json({ message: "데이터 수정 성공" });
    }
  } catch (error) {
    console.error("데이터 수정 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

router.delete("/:id", async (req, res) => {
  const itemId = req.params.id;
  try {
    const result = await db
      .collection("feed")
      .deleteOne({ _id: new ObjectId(itemId) });
    res.status(201).json({ result, message: "데이터 삭제 성공" });
  } catch (error) {
    console.error("데이터 삭제 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

module.exports = router;
