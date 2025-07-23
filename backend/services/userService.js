const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Pinecone } = require('@pinecone-database/pinecone');
const User = require('../models/userModel');
const Log = require('../models/logModel');
const { validEmail } = require('../utils/validator');

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

exports.register = async ({ username, email, password }) => {
  if (!username || !email || !password) throw new Error('All fields are required');
  if (!validEmail(email)) throw new Error('Invalid email format');

  const apikey = crypto.randomBytes(32).toString('hex');
  const hashedPassword = await bcrypt.hash(password, 10);
  const message = "I'm unable to assist with that request. Please contact support for further help.";
  const model = "gemini";

  const newUser = new User({ username, email, password: hashedPassword, apikey, docs: [], message, model });
  await newUser.save();

  await pc.createIndex({
    name: username,
    dimension: 384,
    metric: 'cosine',
    spec: { serverless: { cloud: 'aws', region: 'us-east-1' }},
    waitUntilReady: true
  });

  return apikey;
};

exports.signin = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid email or password');

  return true;
};

exports.modifyMessage = async (apikey, message) => {
  const user = await User.findOne({ apikey });
  if (!user) throw new Error('User not found');

  user.message = message;
  await user.save();
};

exports.viewLogs = async (apikey) => {
  const logs = await Log.find({ apikey });
  return logs;
};

exports.getCurrentModel = async (apikey) => {
  const user = await User.findOne({ apikey });
  if (!user) throw new Error('User not found');
  return { model: user.model, username: user.username };
};

exports.changeModel = async (apikey, model) => {
  const user = await User.findOne({ apikey });
  if (!user) throw new Error('User not found');

  user.model = model;
  await user.save();
};
