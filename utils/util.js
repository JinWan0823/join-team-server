const chkUser = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ message: "인증되지 않은 사용자입니다." });
  }
  next();
};

module.exports = chkUser;
