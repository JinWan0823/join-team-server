const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.static(__dirname + "/public"));
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { MongoClient } = require("mongodb");
const clubRoutes = require("./routes/clubRoutes");
const feedRoutes = require("./routes/feedRoutes");

const url =
  "mongodb+srv://admin:Wlsdhks21!@cluster0.r8evwke.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

MongoClient.connect(url)
  .then((client) => {
    console.log("DB연결성공");
    const db = client.db("joinTeam");
    app.use((req, res, next) => {
      req.db = db;
      next();
    });
    app.use("/club", clubRoutes);
    app.use("/feed", feedRoutes);

    app.listen(8080, function () {
      console.log("listening on 8080");
    });
  })
  .catch((err) => {
    console.error(err);
  });
