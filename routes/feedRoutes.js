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

router.get("/", async (req, res) => {
  const query = req.query.val;
  try {
    let feeds;

    if (query) {
      feeds = await db
        .collection("feed")
        .find({ hashTag: { $regex: new RegExp(`(^|\\\\)${query}(\\\\|$)`) } })
        .sort({ date: -1 })
        .toArray();
    } else {
      feeds = await db.collection("feed").find().sort({ date: -1 }).toArray();
    }

    const result = await Promise.all(
      feeds.map(async (feed) => {
        const user = await db.collection("user").findOne({ _id: feed.writer });

        return {
          ...feed,
          username: user.name,
          thumbnail: user.thumbnail,
        };
      })
    );

    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 3;
    const startIndex = (page - 1) * itemsPerPage;

    const feed = result.slice(startIndex, startIndex + itemsPerPage);

    res.status(200).json(feed);
  } catch (err) {
    console.error("데이터 조회 오류 : ", err);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// 마이피드 조회 API
router.get("/myfeed", chkUser, async (req, res) => {
  const userId = req.user._id;

  try {
    const [user, feeds] = await Promise.all([
      db.collection("user").findOne({ _id: new ObjectId(userId) }),
      db
        .collection("feed")
        .find({ writer: new ObjectId(userId) })
        .sort({ date: -1 })
        .toArray(),
    ]);

    const result = feeds.map((feed) => ({
      ...feed,
      thumbnail: user.thumbnail,
      username: user.name,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("데이터 조회 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// 유저피드 조회 API
router.get("/myfeed/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    let result = await db
      .collection("feed")
      .find({ writer: new ObjectId(userId) })
      .toArray();
    res.status(200).json(result);
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
    res.status(200).json(result);
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
        writer: req.user._id,
        username: req.user.name,
        date: new Date(),
        likedBy: [],
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
      writer: new ObjectId(req.user._id),
    });
    await db.collection("user").updateOne(
      { _id: req.user._id },
      {
        $inc: {
          feedCount: -1,
        },
      }
    );
    res.status(204).json({ message: "데이터 삭제 성공" });
  } catch (error) {
    console.error("데이터 삭제 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

//피드 Liked API
router.post("/like/:id", async (req, res) => {
  const itemId = req.params.id;
  const userId = req.user._id;

  try {
    const feed = await db
      .collection("feed")
      .findOne({ _id: new ObjectId(itemId) });
    const isLiked = feed.likedBy
      .map((id) => id.toString())
      .includes(userId.toString());

    const updateOperation = isLiked
      ? { $pull: { likedBy: userId } }
      : { $addToSet: { likedBy: userId } };

    await db
      .collection("feed")
      .updateOne({ _id: new ObjectId(itemId) }, updateOperation);

    res
      .status(200)
      .json({ message: isLiked ? "좋아요 취소 성공" : "좋아요 추가 성공" });
  } catch (error) {
    console.error("데이터 삭제 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

//피드 Liked 조회 API
router.get("/like/:id", async (req, res) => {
  const itemId = req.params.id;
  try {
    const result = await db
      .collection("feed")
      .findOne(
        { _id: new ObjectId(itemId) },
        { projection: { likedBy: 1, _id: 0 } }
      );
    res.status(200).json(result.likedBy);
  } catch (error) {
    console.error("데이터 삭제 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

module.exports = router;
