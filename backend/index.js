require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors')
const mongoose = require('mongoose');
const {register, signin, modifyMessage, viewLogs, getCurrentModel} = require('./core/users');

app.use(express.json());
app.use(cors()); //using cors cuz both BE and FE are running on localhost

//connecting mongodb
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('connected to mongoDB'))
.catch(err => {
  console.error('error connecting to mongoDB:', err);
  process.exit(1);
});

app.get('/', (req, res) => {
  res.send('hello world');
})

app.post('/register', register);
app.post('/signin', signin);
app.post('/modify', modifyMessage);
app.get('/logs', viewLogs);
app.get('getCurrentModel', getCurrentModel);

let PORT = 5000;
app.listen(PORT, ()=>{
  console.log(`server is listening on port ${PORT}`)
})
