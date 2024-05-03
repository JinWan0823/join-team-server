const express = require("express");
const router = express.Router();
const connectDB = require("../database");
const passport = require("passport");

let db;
connectDB
  .then((client) => {
    db = client.db("joinTeam");
  })
  .catch((err) => {
    console.log(err);
  });

router.get("/", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "로그아웃 중 오류가 발생했습니다." });
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.status(204).json({ message: "로그아웃을 완료했습니다." });
    });
  });
});

module.exports = router;
