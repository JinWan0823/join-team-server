const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const connectDB = require("../database");
const { feedUpload } = require("../s3Upload");
const { chkUser } = require("../utils/middleware");

router.get("/list", async (req, res) => {
  const result = await Db.collection("chat")
    .find({
      member: req.user._id,
    })
    .toArray();
  res.status(200).json(result);
});
