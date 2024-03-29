const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
require("dotenv").config();

const s3 = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const feedUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "jointeam",
    key: function (req, file, cb) {
      cb(
        null,
        "feed_images/" + Date.now().toString() + "_" + file.originalname
      );
    },
  }),
});

const clubUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "jointeam",
    key: function (req, file, cb) {
      cb(
        null,
        "club_images/" + Date.now().toString() + "_" + file.originalname
      );
    },
  }),
});

module.exports = { feedUpload, clubUpload };
