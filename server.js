const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

const { MongoClient, ObjectId } = require("mongodb");

let db;
const url =
  "mongodb+srv://admin:Wlsdhks21!@cluster0.r8evwke.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
new MongoClient(url)
  .connect()
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

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/club", async (req, res) => {
  try {
    let result = await db.collection("club").find().toArray();
    console.log(result);
    res.json(result);
    // res.render("list.ejs", { posts: result });
  } catch (err) {
    console.error("데이터 조회 오류 : ", err);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

app.get("/club/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    console.log(itemId);
    const result = await db
      .collection("club")
      .findOne({ _id: new ObjectId(itemId) });
    console.log(result);
    if (!result) {
      res.status(404).json({ error: "데이터를 찾을 수 없습니다." });
      return;
    }
    res.json(result);
  } catch (error) {
    console.error("데이터 조회 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});
