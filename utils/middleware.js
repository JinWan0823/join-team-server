const chkUser = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ message: "인증되지 않은 사용자입니다." });
  } else {
    next();
  }
};

const extendSessionMiddleware = (req, res, next) => {
  if (req.session && req.session.cookie && !req.session.cookie.expires) {
    req.session.cookie.expires = new Date(Date.now() + 60 * 60 * 1000);
    req.session.save();
  }
  next();
};

module.exports = { chkUser, extendSessionMiddleware };
