const express = require('express');
const router = express.Router();
const connectDB = require('../database');
const passport = require('passport');

let db;
connectDB
  .then((client) => {
    db = client.db('joinTeam');
  })
  .catch((err) => {
    console.log(err);
  });

router.post('/', (req, res, next) => {
  passport.authenticate('local', (error, user, info) => {
    if (error) return res.status(500).json(error);
    if (!user) return res.status(401).json(info.message);
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  })(req, res, next);
});

module.exports = router;
