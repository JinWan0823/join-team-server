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
      "https://master.d10cozylpfiq8l.amplifyapp.com",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
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
      "https://master.d10cozylpfiq8l.amplifyapp.com",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // 쿠키 전송 허용
  })
);

const isSecure = process.env.SESSION_SECURE === "true";
app.set("trust proxy", 1); // Proxy 신뢰 설정 추가

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(
  session({
    secret: "password", // 세션 암호화 키
    resave: false, // 세션을 항상 저장하지 않음
    saveUninitialized: false, // 초기화되지 않은 세션을 저장하지 않음
    cookie: {
      sameSite: isSecure ? "none" : "lax",
      maxAge: 60 * 60 * 1000, // 1시간
      secure: isSecure, // HTTPS 사용
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

console.log("Cookie options:", {
  sameSite: "none",
  secure: isSecure,
});

const PORT = process.env.PORT || 8080;

let db;
connectDB
  .then((client) => {
    console.log("DB연결성공");
    db = client.db("joinTeam");
    initializePassport(db);
    socketHandlers(io, db);
    server.listen(PORT, function () {
      console.log(`listening on ${PORT}`);
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
