const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./database');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const MongoStore = require('connect-mongo');

const clubRoutes = require('./routes/clubRoutes');
const feedRoutes = require('./routes/feedRoutes');
const signupRoutes = require('./routes/signupRoutes');
const loginRoutes = require('./routes/loginRoutes');
const initializePassport = require('./passport');

app.use(express.static(__dirname + '/public'));
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(
  session({
    secret: '비번',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 },
    store: MongoStore.create({
      mongoUrl:
        'mongodb+srv://admin:Wlsdhks21!@cluster0.r8evwke.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      dbName: 'joinTeam',
    }),
  })
);
app.use(passport.session());

let db;
connectDB
  .then((client) => {
    console.log('DB연결성공');
    db = client.db('joinTeam');
    initializePassport(db);
    app.listen(8080, function () {
      console.log('listening on 8080');
    });
  })
  .catch((err) => {
    console.error(err);
  });

passport.use(
  new LocalStrategy(async (id, pwd, cb) => {
    let result = await db.collection('user').findOne({ username: id });
    if (!result) {
      return cb(null, false, { message: '아이디 DB에 없음' });
    }
    const pwdCheck = await bcrypt.compare(pwd, result.password);
    if (pwdCheck) {
      return cb(null, result);
    } else {
      return cb(null, false, { message: '비번불일치' });
    }
  })
);

app.use('/club', clubRoutes);
app.use('/feed', feedRoutes);
app.use('/signup', signupRoutes);
app.use('/login', loginRoutes);
