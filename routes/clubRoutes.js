const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const connectDB = require("../database");
const { clubUpload } = require("../s3Upload");
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
  try {
    let result = await db.collection("club").find().toArray();
    res.status(201).json(result);
  } catch (err) {
    console.error("데이터 조회 오류 : ", err);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// router.get("/myclub", async (req, res) => {
//   const id = req.user._id;

//   try {
//     let result = await db.collection("club").aggregate(searchQuery).toArray();
//     res.status(201).json(result);
//   } catch (err) {
//     console.error("데이터 조회 오류 : ", err);
//     res.status(500).json({ error: "서버 오류 발생" });
//   }
// });

router.get("/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    const result = await db
      .collection("club")
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

router.post("/", chkUser, clubUpload.single("images"), async (req, res) => {
  const clubName = req.body.clubName;
  const category = req.body.category;
  const information = req.body.information;
  const images = req.file.location;
  const master = req.user._id;
  try {
    console.log(images);
    if (!clubName || !category || !images || !information) {
      res.status(400).json({ message: "Bad Request : 잘못된 요청입니다." });
    } else {
      const result = await db.collection("club").insertOne({
        clubName: clubName,
        category: category,
        images: images,
        information: information,
        master: master,
        masterName: req.user.name,
        date: new Date(),
        member: [
          {
            memberId: master,
            name: req.user.name,
          },
        ],
      });
      res.status(201).json(result);
    }
  } catch (error) {
    console.error("데이터 등록 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

//클럽 참가 API
router.post("/join/:id", chkUser, async (req, res) => {
  const itemId = req.params.id;
  const club = await db
    .collection("club")
    .findOne({ _id: new ObjectId(itemId) });

  if (!club) {
    return res.status(404).json({ message: "클럽을 찾을 수 없습니다." });
  }

  if (club.joinedMember >= 20) {
    return res.status(400).json({ message: "정원 초과" });
  }

  const joinedClub = await db.collection("club").updateOne(
    { _id: new ObjectId(itemId) },
    {
      $addToSet: {
        member: {
          memberId: req.user._id,
          name: req.user.name,
          userThumb: req.user.thumb,
        },
      },
    }
  );

  const updatedUser = await db.collection("user").updateOne(
    { _id: new ObjectId(req.user._id) },
    {
      $addToSet: {
        joinedClub: {
          clubId: new ObjectId(itemId),
          clubName: club.clubName,
        },
      },
    }
  );
  res.status(200).json({ message: "클럽에 가입되었습니다." });
});

module.exports = router;
