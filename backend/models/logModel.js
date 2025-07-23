const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  type:     { type: String, required: true },
  username: { type: String, required: true, unique: true },
  apikey:   { type: String, required: true },
  query:    { type: String, required: true },
  timestamp:{ type: String, required: true }
});

module.exports = mongoose.model('Log', logSchema);
