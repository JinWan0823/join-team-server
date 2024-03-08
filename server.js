const express = require("express");
const app = express();

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

const { MongoClient } = require("mongodb");

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

app.get("/list", async (req, res) => {
  let result = await db.collection("club").find().toArray();
  console.log(result);

  res.render("list.ejs", { posts: result });
});
