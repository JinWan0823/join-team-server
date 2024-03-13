const { MongoClient } = require("mongodb");

const url =
  "mongodb+srv://admin:Wlsdhks21!@cluster0.r8evwke.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const connectDB = MongoClient.connect(url);

module.exports = connectDB;
