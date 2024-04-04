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

// 피드 조회 API
router.get("/", async (req, res) => {
  try {
    let result = await db.collection("feed").find().toArray();
    res.status(201).json(result);
  } catch (err) {
    console.error("데이터 조회 오류 : ", err);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// 마이피드 조회 API
router.get("/myfeed", chkUser, async (req, res) => {
  const userId = req.user._id;
  try {
    let result = await db
      .collection("feed")
      .find({ writer: new ObjectId(userId) })
      .toArray();
    res.status(201).json(result);
  } catch (error) {
    console.error("데이터 조회 오류 : ", error);
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

//피드 생성 API
router.post("/", feedUpload.array("images", 10), async (req, res) => {
  const content = req.body.content;
  const hashTag = req.body.hashTag;
  const images = req.files;
  let imagesLocation = [];

  images.forEach((img) => {
    imagesLocation.push(img.location);
  });
  try {
    if (
      !content ||
      hashTag.length === 0 ||
      !req.user ||
      imagesLocation.length === 0
    ) {
      res.status(400).json({ message: "Bad Request : 잘못된 요청입니다." });
    } else {
      const result = await db.collection("feed").insertOne({
        content: content,
        hashTag: hashTag,
        images: imagesLocation,
        user: req.user._id,
        username: req.user.name,
        date: new Date(),
      });
      await db.collection("user").updateOne(
        { _id: req.user._id },
        {
          $inc: {
            feedCount: 1,
          },
        }
      );
      res.status(201).json(result);
    }
  } catch (error) {
    console.error("데이터 등록 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

//피드 수정 API
router.put("/:id", feedUpload.array("images", 10), async (req, res) => {
  console.log(req.files);
  const itemId = req.params.id;
  const content = req.body.content;
  const hashTag = req.body.hashTag;
  const images = req.files;
  let imagesLocation = [];

  images.forEach((img) => {
    imagesLocation.push(img.location);
  });
  try {
    if (!content || hashTag.length === 0 || !req.user) {
      res.status(400).json({ message: "Bad Request : 잘못된 요청입니다." });
    } else {
      await db.collection("feed").updateOne(
        { _id: new ObjectId(itemId) },
        {
          $set: {
            content: req.body.content,
            hashTag: req.body.hashTag,
            images: imagesLocation,
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

//피드 삭제 API
router.delete("/:id", async (req, res) => {
  const itemId = req.params.id;
  try {
    const result = await db.collection("feed").deleteOne({
      _id: new ObjectId(itemId),
      user: new ObjectId(req.user._id),
    });
    await db.collection("user").updateOne(
      { _id: req.user._id },
      {
        $inc: {
          feedCount: -1,
        },
      }
    );
    console.log(result);
    res.status(201).json({ message: "데이터 삭제 성공" });
  } catch (error) {
    console.error("데이터 삭제 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

module.exports = router;
