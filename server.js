const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./database");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const crypto = require("crypto");

const { createServer } = require("http");
const { Server } = require("socket.io");
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000", // 로컬 개발 주소
      "https://join-team-rho.vercel.app", // 배포된 클라이언트 주소
      "https://new-client-url.com", // 추가된 클라이언트 주소
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

require("dotenv").config();

const clubRoutes = require("./routes/clubRoutes");
const feedRoutes = require("./routes/feedRoutes");
const signupRoutes = require("./routes/signupRoutes");
const loginRoutes = require("./routes/loginRoutes");
const logoutRoutes = require("./routes/logoutRoutes");
const userRoutes = require("./routes/userRoutes");
const searchRoutes = require("./routes/searchRoutes");
const chatRoutes = require("./routes/chatRoutes");

const initializePassport = require("./passport");
const { extendSessionMiddleware } = require("./utils/middleware");
const socketHandlers = require("./sockets/socketHandlers");

const generateRandomString = (length) => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
};

const newSecret = generateRandomString(32);

app.use(express.static(__dirname + "/public"));
app.use(
  cors({
    origin: [
      "http://localhost:3000", // 로컬 환경 허용
      "http://jointeamserver-env.eba-mxsmsvyv.ap-northeast-2.elasticbeanstalk.com", // 배포된 서버 허용
      "https://join-team-rho.vercel.app", // 클라이언트 배포 주소
    ],
    credentials: true, // 쿠키 전송 허용
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "password",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
    },
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://admin:Wlsdhks21!@cluster0.r8evwke.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      dbName: "joinTeam",
    }),
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(extendSessionMiddleware);

let db;
connectDB
  .then((client) => {
    console.log("DB연결성공");
    db = client.db("joinTeam");
    initializePassport(db);
    socketHandlers(io, db);
    server.listen(8080, function () {
      console.log("listening on 8080");
    });
  })
  .catch((err) => {
    console.error(err);
  });

app.use("/club", clubRoutes);
app.use("/feed", feedRoutes);
app.use("/signup", signupRoutes);
app.use("/login", loginRoutes);
app.use("/logout", logoutRoutes);
app.use("/user", userRoutes);
app.use("/search", searchRoutes);
app.use("/chat", chatRoutes);
