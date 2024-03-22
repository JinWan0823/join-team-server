const express = require("express");
const router = express.Router();
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
  const query = req.query.val;
  try {
    if (query) {
      const result = await db
        .collection("club")
        .find({ clubName: { $regex: query } })
        .toArray();
      res.status(201).json({ result });
    } else {
      const result = await db.collection("club").find().toArray();
      res.status(201).json({ result });
    }
  } catch (error) {
    console.error("데이터 조회 오류 : ", err);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

module.exports = router;
