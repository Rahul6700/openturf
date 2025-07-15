const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Pinecone } = require('@pinecone-database/pinecone');
const router = express.Router();
const { User, Log } = require('../models/models.js');
const validator = require('validator'); 

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const validEmail = (email) =>{
  return validator.isEmail(email);
}

async function register (req,res) {
  try {
    const {username, email, password} = req.body;
    if (!username || !email || !password){
      return res.status(400).json({ error: `all 3 fields are mandatory`});
    }

    if(!validEmail(email)){
      return res.status(400).json({ error : `invalid email format`});
    }

    //create a new API key for the user
    const apikey = crypto.randomBytes(32).toString('hex');
    //hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    //setting default llm failure message
    const message = "I'm unable to assist with that request. Please contact support for further help.";
    //write the user to DB
    const model = "gemini" //using gemini as default model
    const newUser = new User({username, email, password: hashedPassword, apikey,docs:[], message, model});
    await newUser.save();

    //creating a new pinecone index for the user with the index name as the username
    try {
    await pc.createIndex({
      name: username,
      dimension: 384,
      metric: 'cosine',
      spec: {
        serverless: {
        cloud: 'aws',
        region: 'us-east-1',
      },
    },
      waitUntilReady: true,
    });
        } catch (pineconeError) {
          console.error("Pinecone Error:", pineconeError); 
          return res.status(500).json({ error: `Failed to create Pinecone index` });
        }

    res.status(201).json({ success: `api key: ${apikey}`});
  }
  catch (error) {
    if(error.code === 11000) {
      return res.status(400).json({ error: `username or email already exists`});
    }
    console.log(error)
    res.status(500).json({error: `internal server error, please try again`});
  }
}

async function signin (req, res) {
  try {
    const {email, password} = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: `enter an email and password`});
    }
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({ error : `invalid username or password`})
    }
    //compare the hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: `Incorrect Email or password`});
    }
    res.status(200).json({ success : `logged in successfully`});
  
  } catch (error) {
    console.log(error)
    res.status(500).json({ error : `internal server error, please try again`});
  }
}

async function modifyMessage (req, res) { 
  try {
    const {message} = req.body;

    const apikey = req.headers['authorization'];

    if (!apikey) {
      return res.status(401).json({ error: `missing apikey`});
    }

    const user = await User.findOne({ apikey });

    if (!user) {
      return res.status(401).json({ error : `user not found` });
    }

    user.message = message;
    await user.save();

    res.status(200).json({ success : `message modified successfully`})
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: `error : internal server error`})
  }
}

async function viewLogs (req, res) {
  try {
    const apikey = req.headers['authorization'];

    if (!apikey) {
      return res.status(401).json({ error : `missing apikey`});
    }

    const user = await User.findOne({ apikey });

    if (!user) {
      return res.status(401).json({ error : `user not found`});
    }

    const logs = await Log.find({ apikey : apikey });

    res.status(201).json({ success : logs })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error : `internal server error`});
  }
}

const getCurrentModel = async (req, res) => {
  try {
    const apikey = req.headers['authorization'];
    if(!apikey){
      return res.status(401).json({ error : `missing apikey`})
    }

    const user = await User.findOne({ apikey })

    if(!user) {
      return res.status(401).json( {error : 'user not found'})
    }

    res.status(201).json({ success: user.model})
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error : 'interal server error'})
  }
}

const changeModel = async (req, res) => {
  try {
    const {model} = req.body;
    const apikey = req.headers['authorization']
    if(!apikey) {
      return res.status(401).json({ error : `missing apikey`})
    }

    const user = await User.findOne({ apikey })
    if(!user){
      return res.status(401).json({ error : 'user not found' })
    }

    user.model = model
    await user.save()

    return res.status(200).json({ success : `response model changed to ${model}`})
  } catch (e) {
      console.log(e)
      return res.status(500).json({ error : 'internal server error'})
  }
}


module.exports = { register, signin, modifyMessage, viewLogs, getCurrentModel, changeModel };
