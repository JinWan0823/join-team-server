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
      res.status(200).json(result);
    } else {
      res.status(401).json({ message: "인증되지 않은 사용자입니다." });
    }
  } catch (error) {
    console.error("데이터 조회 오류 : ", err);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    const result = await db
      .collection("user")
      .findOne({ _id: new ObjectId(itemId) });
    if (!result) {
      return res.status(404).json({ error: "데이터를 찾을 수 없습니다." });
    }
    // const { thumbnail, name, _id, interestList } = result;
    res.status(200).json(result);
  } catch (error) {
    console.error("데이터 조회 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

//유저 정보 수정 API
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
              introComment: req.body.introComment,
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
              introComment: req.body.introComment,
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

// 유저 팔로우 조회 API
router.post("/follow", async (req, res) => {
  const user = req.user;

  if (!user) {
    res.status(200).json({ isFollowing: false });
    return;
  }

  const followId = req.body.followId;
  try {
    const followObjectId = new ObjectId(followId);
    const userData = await db.collection("user").findOne({ _id: user._id });
    const isFollowing = userData.followings.some(
      (id) => id.toString() === followObjectId.toString()
    );
    res.status(200).json({ isFollowing });
  } catch (error) {
    console.error("팔로우 조회 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

//유저 팔로우 신청/취소 API
router.put("/follow/:id", chkUser, async (req, res) => {
  const user = req.user;
  const itemId = req.params.id;

  try {
    if (!itemId) {
      return res.status(404).json({ error: "해당 유저를 찾을 수 없습니다." });
    }
    const userData = await db.collection("user").findOne({ _id: user._id });
    console.log(new ObjectId(itemId));
    console.log(userData.followings);

    if (
      userData.followings.some((following) => following.toString() === itemId)
    ) {
      console.log("팔로 취소");
      const followingData = await db.collection("user").updateOne(
        { _id: new ObjectId(itemId) },
        {
          $pull: {
            followers: user._id,
          },
        }
      );
      const followerData = await db.collection("user").updateOne(
        { _id: user._id },
        {
          $pull: {
            followings: new ObjectId(itemId),
          },
        }
      );
      return res.status(200).json({ message: "팔로우 취소가 완료되었습니다." });
    } else {
      const followingData = await db.collection("user").updateOne(
        { _id: new ObjectId(itemId) },
        {
          $addToSet: {
            followers: user._id,
          },
        }
      );
      const followerData = await db.collection("user").updateOne(
        { _id: user._id },
        {
          $addToSet: {
            followings: new ObjectId(itemId),
          },
        }
      );
      return res.status(200).json({ message: "팔로우 신청이 완료되었습니다." });
    }
  } catch (error) {
    console.error("데이터 수정 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

module.exports = router;
new ObjectId("660a6ef37ff07fde43e015ed");
new ObjectId("660a6ef37ff07fde43e015ed");
