const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('hello world');
})

let PORT = 5000;
app.listen(PORT, ()=>{
  console.log(`server is listening on port ${PORT}`)
})
