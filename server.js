const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./database");
const { ObjectId } = require("mongodb");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const MongoStore = require("connect-mongo");

const clubRoutes = require("./routes/clubRoutes");
const feedRoutes = require("./routes/feedRoutes");

app.use(express.static(__dirname + "/public"));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(
  session({
    secret: "비번",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 },
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://admin:Wlsdhks21!@cluster0.r8evwke.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      dbName: "joinTeam",
    }),
  })
);
app.use(passport.session());

let db;
connectDB
  .then((client) => {
    console.log("DB연결성공");
    db = client.db("joinTeam");
    app.listen(8080, function () {
      console.log("listening on 8080");
    });
  })
  .catch((err) => {
    console.error(err);
  });

passport.use(
  new LocalStrategy(async (id, pwd, cb) => {
    let result = await db.collection("user").findOne({ username: id });
    if (!result) {
      return cb(null, false, { message: "아이디 DB에 없음" });
    }
    const pwdCheck = await bcrypt.compare(pwd, result.password);
    if (pwdCheck) {
      return cb(null, result);
    } else {
      return cb(null, false, { message: "비번불일치" });
    }
  })
);

passport.serializeUser((user, done) => {
  //쿠키 생성
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username });
  });
});

passport.deserializeUser(async (user, done) => {
  //유저가 보낸 쿠키분석
  const result = await db
    .collection("user")
    .findOne({ _id: new ObjectId(user.id) });

  delete result.password;
  process.nextTick(() => {
    done(null, result);
  });
});

app.post("/login", async (req, res, next) => {
  passport.authenticate("local", (error, user, info) => {
    if (error) return res.status(500).json(error);
    if (!user) return res.status(401).json(info.message);
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  })(req, res, next);
});

//hashing : 문자 -> 랜덤문자 변환
app.post("/signup", async (req, res) => {
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
      interestList: req.body.interestList,
    });
    res.status(201).json({ result, message: "회원가입 성공" });
  } catch (error) {
    console.error("데이터 등록 오류 : ", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

app.use("/club", clubRoutes);
app.use("/feed", feedRoutes);
