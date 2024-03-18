const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const connectDB = require('../database');
const upload = require('../s3Upload');

let db;
connectDB
  .then((client) => {
    db = client.db('joinTeam');
  })
  .catch((err) => {
    console.log(err);
  });

router.get('/', async (req, res) => {
  try {
    let result = await db.collection('feed').find().toArray();
    res.status(201).json(result);
  } catch (err) {
    console.error('데이터 조회 오류 : ', err);
    res.status(500).json({ error: '서버 오류 발생' });
  }
});

router.post('/', upload.single('images'), async (req, res) => {
  const content = req.body.content;
  const hashTag = req.body.hashTag;
  const imges = req.body.imges;

  console.log(req.file);
  try {
    if (!content || hashTag.length === 0 || !req.user) {
      console.log(req.user);
      res.status(400).json({ message: 'Bad Request : 잘못된 요청입니다.' });
    } else {
      console.log(req.user);
      await db.collection('feed').insertOne({
        content: content,
        hashTag: hashTag,
        imges: imges,
        date: new Date(),
      });
      res.status(201).json({ message: '데이터 등록 성공' });
    }
  } catch (error) {
    console.error('데이터 등록 오류 : ', error);
    res.status(500).json({ error: '서버 오류 발생' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    const result = await db.collection('feed').findOne({ _id: new ObjectId(itemId) });
    if (!result) {
      res.status(404).json({ error: '데이터를 찾을 수 없습니다.' });
      return;
    }
    res.json(result);
  } catch (error) {
    console.error('데이터 조회 오류:', error);
    res.status(500).json({ error: '서버 오류 발생' });
  }
});

router.put('/:id', async (req, res) => {
  const itemId = req.params.id;
  try {
    if (req.body.hashTag.length > 10) {
      res.status(400).json({ message: 'Bad Request : 잘못된 요청입니다.' });
    } else {
      await db.collection('feed').updateOne(
        { _id: new ObjectId(itemId) },
        {
          $set: {
            content: req.body.content,
            hashTag: req.body.hashTag,
            img: req.body.img,
          },
        }
      );
      res.status(201).json({ message: '데이터 수정 성공' });
    }
  } catch (error) {
    console.error('데이터 수정 오류 : ', error);
    res.status(500).json({ error: '서버 오류 발생' });
  }
});

router.delete('/:id', async (req, res) => {
  console.log(req.user);
  if (!req.user) {
    res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    return;
  }
  const itemId = req.params.id;
  try {
    const result = await db.collection('feed').deleteOne({ _id: new ObjectId(itemId) });
    res.status(201).json({ message: '데이터 삭제 성공' });
  } catch (error) {
    console.error('데이터 삭제 오류 : ', error);
    res.status(500).json({ error: '서버 오류 발생' });
  }
});

module.exports = router;
