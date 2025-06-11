require('dotenv').config();

const express = require('express');
const app = express();
const mongoose = require('mongoose');

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

let PORT = 5000;
app.listen(PORT, ()=>{
  console.log(`server is listening on port ${PORT}`)
})
