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

module.exports = router;
