const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const connectDB = require("../database");
const { clubUpload } = require("../s3Upload");
const { chkUser, getRandomElements } = require("../utils/middleware");

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
    res.status(200).json(result);
  } catch (error) {
    console.error("데이터 조회 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

router.get("/interest", async (req, res) => {
  try {
    if (req.user) {
      const interestList = req.user.interestList.split("\\");
      console.log(interestList);
      let clubs = await db
        .collection("club")
        .find({ category: { $in: interestList } })
        .toArray();

      // 클럽 개수가 3개보다 적을 경우 부족한 만큼 추가
      if (clubs.length < 3) {
        const allClubs = await db.collection("club").find().toArray();
        const additionalClubs = getRandomElements(
          allClubs.filter(
            (club) => !clubs.some((item) => item._id.equals(club._id))
          ), // 중복 제거
          3 - clubs.length
        );
        clubs = [...clubs, ...additionalClubs]; // 기존 클럽 + 추가 클럽
      }

      const randomClubs = getRandomElements(clubs, 3); // 최종 3개 랜덤
      res.status(200).json(randomClubs);
    } else {
      const allClubs = await db.collection("club").find().toArray();
      const randomClubs = getRandomElements(allClubs, 3);
      res.status(200).json(randomClubs);
    }
  } catch (error) {
    console.error("데이터 조회 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

router.get("/hot", async (req, res) => {
  try {
    let result = await db.collection("club").find().toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error("데이터 조회 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// 마이페이지 가입한 클럽 조회 API
router.get("/myclub", chkUser, async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await db
      .collection("user")
      .findOne({ _id: new ObjectId(userId) });
    const clubIds = user.joinedClub.map((club) => club.clubId);
    const clubs = await db
      .collection("club")
      .find({ _id: { $in: clubIds } })
      .toArray();
    res.status(200).json(clubs);
  } catch (err) {
    console.error("데이터 조회 오류 : ", err);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// 유저 가입 클럽 조회 API
router.get("/myclub/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await db
      .collection("user")
      .findOne({ _id: new ObjectId(userId) });
    const clubIds = user.joinedClub.map((club) => club.clubId);
    const clubs = await db
      .collection("club")
      .find({ _id: { $in: clubIds } })
      .toArray();
    res.status(200).json(clubs);
  } catch (err) {
    console.error("데이터 조회 오류 : ", err);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

//클럽 ID 조회 API
router.get("/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    const club = await db
      .collection("club")
      .findOne({ _id: new ObjectId(itemId) });
    if (!club) {
      res.status(404).json({ error: "데이터를 찾을 수 없습니다." });
      return;
    }

    if (club.activity.length > 3) {
      const limitedActivities = club.activity.slice(0, 3);
      const limitedClub = { ...club, activity: limitedActivities };
      res.status(200).json(limitedClub);
    } else {
      res.status(200).json(club);
    }
  } catch (error) {
    console.error("데이터 조회 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

//클럽 활동 page 조회 API
router.get("/:id/activity", async (req, res) => {
  try {
    const itemId = req.params.id;
    const club = await db
      .collection("club")
      .findOne({ _id: new ObjectId(itemId) });
    if (!club) {
      res.status(404).json({ error: "데이터를 찾을 수 없습니다." });
      return;
    }

    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 3;

    const startIndex = (page - 1) * itemsPerPage;
    const limitedActivities = club.activity.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    res.status(200).json(limitedActivities);
  } catch (error) {
    console.error("데이터 조회 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

//클럽 생성 API
router.post("/", chkUser, clubUpload.single("images"), async (req, res) => {
  const clubName = req.body.clubName;
  const category = req.body.category;
  const information = req.body.information;
  const images = req.file.location;
  const master = req.user._id;
  const sido = req.body.sido;
  const gugun = req.body.gugun || "";
  try {
    console.log(images);
    if (!clubName || !category || !images || !information || !sido) {
      res.status(400).json({ message: "Bad Request : 잘못된 요청입니다." });
    } else {
      const result = await db.collection("club").insertOne({
        clubName: clubName,
        category: category,
        images: images,
        information: information,
        master: master,
        masterName: req.user.name,
        sido: sido,
        gugun: gugun,
        activity: [],
        activityCount: 0,
        date: new Date(),
        member: [
          {
            memberId: master,
          },
        ],
      });

      await db.collection("chat").insertOne({
        member: [req.user._id],
        clubTitle: clubName,
        date: new Date(),
        clubId: new ObjectId(result.insertedId),
        thumb: images,
      });

      await db.collection("user").updateOne(
        { _id: new ObjectId(req.user._id) },
        {
          $addToSet: {
            joinedClub: {
              clubId: new ObjectId(result.insertedId),
            },
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

//클럽 참가 API
router.post("/join/:id", chkUser, async (req, res) => {
  const itemId = req.params.id;

  const club = await db
    .collection("club")
    .findOne({ _id: new ObjectId(itemId) });

  const isMember = club.member.some((member) => {
    console.log(member.memberId);
    console.log(req.user._id);
    return member.memberId.toString() === req.user._id.toString();
  });

  console.log(isMember);

  if (isMember) {
    return res.status(400).json({ message: "이미 가입한 클럽입니다." });
  }

  if (!club) {
    return res.status(404).json({ message: "클럽을 찾을 수 없습니다." });
  }

  if (club.joinedMember >= 20) {
    return res.status(400).json({ message: "정원 초과" });
  }

  await db.collection("club").updateOne(
    { _id: new ObjectId(itemId) },
    {
      $addToSet: {
        member: {
          memberId: req.user._id,
        },
      },
    }
  );

  await db.collection("user").updateOne(
    { _id: new ObjectId(req.user._id) },
    {
      $addToSet: {
        joinedClub: {
          clubId: new ObjectId(itemId),
        },
      },
    }
  );

  await db.collection("chat").updateOne(
    { clubId: new ObjectId(itemId) },
    {
      $addToSet: {
        member: req.user._id,
      },
    }
  );

  res.status(201).json({ message: "클럽에 가입되었습니다." });
});

//클럽 활동 추가 API
router.put("/:id", chkUser, clubUpload.single("images"), async (req, res) => {
  const clubId = req.params.id;
  const clubData = await db
    .collection("club")
    .findOne({ _id: new ObjectId(clubId) });
  console.log(clubData.master);
  console.log(req.user._id);
  if (clubData.master.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: "인증되지 않은 사용자입니다." });
  }

  const activityName = req.body.activityName;
  const content = req.body.content;
  const date = req.body.date;
  const images = req.file.location;
  const location = req.body.location;

  if (!activityName && !content && !date && !location && !images) {
    return res
      .status(400)
      .json({ message: "Bad Request : 잘못된 요청입니다." });
  }

  const newActivity = {
    activityName: activityName,
    content: content,
    date: date,
    location: location,
    images: images,
  };

  try {
    await db.collection("club").updateOne(
      { _id: new ObjectId(clubId) },
      {
        $push: { activity: newActivity },
        $inc: { activityCount: 1 },
      }
    );
    res.status(200).json({ message: "활동이 성공적으로 추가되었습니다." });
  } catch (error) {
    console.error("데이터 수정 오류 : ", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

//클럽 인기 API
router.get("/category/hot", async (req, res) => {
  try {
    const query = [
      {
        $sort: {
          joinedMember: -1,
        },
      },
    ];

    const clubs = await db.collection("club").aggregate(query).toArray();

    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;

    const club = clubs.slice(startIndex, startIndex + itemsPerPage);

    res.status(200).json(club);
  } catch (error) {
    console.error("데이터 조회 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

//클럽 추천 API
router.get("/category/interest", async (req, res) => {
  try {
    let interestList = [];
    if (req.user && req.user.interestList) {
      interestList = req.user.interestList.split("\\");
    }

    const query =
      interestList.length > 0
        ? [{ $match: { category: { $in: interestList } } }]
        : [];

    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;

    let clubs;
    if (query.length === 0) {
      clubs = await db.collection("club").find().toArray();
    } else {
      clubs = await db.collection("club").aggregate(query).toArray();
    }

    const paginatedClubs = clubs.slice(startIndex, startIndex + itemsPerPage);

    res.status(200).json(paginatedClubs);
  } catch (error) {
    console.error("데이터 조회 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});
module.exports = router;
