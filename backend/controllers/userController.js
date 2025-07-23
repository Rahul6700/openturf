const userService = require('../services/userService');

exports.register = async (req, res) => {
  try {
    const apikey = await userService.register(req.body);
    res.status(201).json({ success: `api key: ${apikey}` });
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      console.error(err);
      res.status(400).json({ error: err.message });
    }
  }
};

exports.signin = async (req, res) => {
  try {
    await userService.signin(req.body);
    res.status(200).json({ success: 'Logged in successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.modifyMessage = async (req, res) => {
  try {
    await userService.modifyMessage(req.headers['authorization'], req.body.message);
    res.status(200).json({ success: 'Message modified successfully' });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

exports.viewLogs = async (req, res) => {
  try {
    const logs = await userService.viewLogs(req.headers['authorization']);
    res.status(200).json({ success: logs });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

exports.getCurrentModel = async (req, res) => {
  try {
    const data = await userService.getCurrentModel(req.headers['authorization']);
    res.status(200).json(data);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

exports.changeModel = async (req, res) => {
  try {
    await userService.changeModel(req.headers['authorization'], req.body.model);
    res.status(200).json({ success: `Response model changed to ${req.body.model}` });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
