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
  docs: {
    type: Array,
    required: true,
    unique: false
  },
  message: {
    type: String,
    required: true,
    unique: false
  },
  model: {
    type: String,
    required: true
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
