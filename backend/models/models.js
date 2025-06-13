const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    unique: false
  },
  apikey: {
    type: String,
    required: true,
    unique: true
  },
  message: {
    type: String,
    required: true,
    unique: false
  },
  createdat: {
    type: Date,
    default: Date.now
  }
})

const logSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: false
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  apikey: {
    type: String,
    required: true,
    unique: false
  },
  query: {
    type: String,
    required: true,
    unique: false,
  },
  timestamp: {
    type: String,
    required: true,
    unique: false
  }
})

const User = mongoose.model('User', userSchema);
const Log = mongoose.model('Log', logSchema)

module.exports = { User, Log }
