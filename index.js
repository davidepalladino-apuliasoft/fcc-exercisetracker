const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const bodyParser = require('body-parser');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, deprecationErrors: true });

let UserModel = require('./models/user.js');
let ExerciseModel = require('./models/exercise.js');

app.use(cors())
app.use(express.static('public'))

app.use('/', bodyParser.urlencoded({extended: false}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  const user = new UserModel({
    username: req.body.username,
  });

  user.save((err, data) => {
    res.json(data)
  });
});

app.get('/api/users', (req, res) => {
  UserModel.find((err, data) => {
    res.json(data)
  })
});

app.get('/api/users/:_id/logs', async function (req, res) {
  const userId = req.params._id;
	const from = req.query.from;
	const to = req.query.to;
	const limit = Number(req.query.limit) || 0;

  let user = await UserModel.findById(userId).exec();

	let exercises = await ExerciseModel.find(
    (from && to) ? { userId: userId, date: { $gte: from, $lte: to }} : { userId: userId })
		.select('description duration date')
		.limit(limit)
		.exec();

	let parsedDatesLog = exercises.map((exercise) => {
		return {
			description: exercise.description,
			duration: exercise.duration,
			date: new Date(exercise.date).toDateString(),
		};
	});

	res.json({
		_id: user._id,
		username: user.username,
		count: parsedDatesLog.length,
		log: parsedDatesLog,
	});
});

app.post('/api/users/:_id/exercises', (req, res) => {
  UserModel.findById(req.params._id, (err, data) => {
    const user = data;

    const exercise = new ExerciseModel({
      userId: user._id,
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: req.body.date ? new Date(req.body.date) : new Date()
    });
    exercise.save((err, exercise) => {
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      });
    })
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
