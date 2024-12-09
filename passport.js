const passport = require("passport");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

const initializePassport = (db) => {
  passport.use(
    new LocalStrategy(async (id, pwd, cb) => {
      let result = await db.collection("user").findOne({ username: id });
      if (!result) {
        return cb(null, false, { message: "아이디 DB에 없음" });
      }
      const pwdCheck = await bcrypt.compare(pwd, result.password);
      if (pwdCheck) {
        return cb(null, result);
      } else {
        return cb(null, false, { message: "비번불일치" });
      }
    })
  );

  passport.serializeUser((user, done) => {
    //쿠키 생성
    process.nextTick(() => {
      done(null, { id: user._id, username: user.username });
    });
  });

  passport.deserializeUser(async (user, done) => {
    try {
      const result = await db
        .collection("user")
        .findOne({ _id: new ObjectId(user.id) });
      if (result) {
        delete result.password;
        done(null, result);
      } else {
        done(null, false);
      }
    } catch (err) {
      console.error("deserializeUser error:", err);
      done(err, false);
    }
  });
};

module.exports = initializePassport;
