const express = require("express");
const router = express.Router();
const connectDB = require("../database");
const bcrypt = require("bcrypt");

let db;
connectDB
  .then((client) => {
    db = client.db("joinTeam");
  })
  .catch((err) => {
    console.log(err);
  });

router.post("/", async (req, res) => {
  const idChk = await db
    .collection("user")
    .findOne({ username: req.body.username });
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pwdRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;

    if (!emailRegex.test(req.body.username)) {
      res.status(400).json({ message: "유효한 이메일 주소를 입력하세요." });
      return;
    }

    if (!pwdRegex.test(req.body.password)) {
      res.status(400).json({
        message: "비밀번호는 영문,숫자,특수문자를 포함하여 8~16자여야 합니다.",
      });
      return;
    }

    if (idChk) {
      res.status(409).json({ message: "이미 존재하는 아이디입니다." });
      return;
    }
    const hashingPwd = await bcrypt.hash(req.body.password, 10);
    const result = await db.collection("user").insertOne({
      username: req.body.username,
      password: hashingPwd,
      name: req.body.name,
      introComment: "가입을 환영합니다!",
      interestList: req.body.interestList,
      feedCount: 0,
      joinedClub: [],
      thumbnail:
        "https://jointeam.s3.ap-northeast-2.amazonaws.com/utill/defaultThumb.png",
      followers: [],
      followings: [],
    });
    res.status(201).json({ result, message: "회원가입 성공" });
  } catch (error) {
    console.error("데이터 등록 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

module.exports = router;
