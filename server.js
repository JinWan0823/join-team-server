const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./database");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const crypto = require("crypto");
require("dotenv").config();

const clubRoutes = require("./routes/clubRoutes");
const feedRoutes = require("./routes/feedRoutes");
const signupRoutes = require("./routes/signupRoutes");
const loginRoutes = require("./routes/loginRoutes");
const userRoutes = require("./routes/userRoutes");
const initializePassport = require("./passport");

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
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(
  session({
    secret: "password",
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
    initializePassport(db);
    app.listen(8080, function () {
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
app.use("/user", userRoutes);
