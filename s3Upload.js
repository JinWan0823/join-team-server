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
      const uniqueKey = `feed_images/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 11)}_${file.originalname}`;
      cb(null, uniqueKey);
    },
  }),
});

const clubUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "jointeam",
    key: function (req, file, cb) {
      const uniqueKey = `club_images/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 11)}_${file.originalname}`;
      cb(null, uniqueKey);
    },
  }),
});

const userUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "jointeam",
    key: function (req, file, cb) {
      const uniqueKey = `user_images/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 11)}_${file.originalname}`;
      cb(null, uniqueKey);
    },
  }),
});

module.exports = { feedUpload, clubUpload, userUpload };
