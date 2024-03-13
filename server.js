const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./database");

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

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { ObjectId } = require("mongodb");
app.use(passport.initialize());
app.use(
  session({
    secret: "비번",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 },
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
    if (result.password == pwd) {
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

app.use("/club", clubRoutes);
app.use("/feed", feedRoutes);
