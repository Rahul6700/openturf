const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Pinecone } = require('@pinecone-database/pinecone');
const router = express.Router();
const User = require('../models/models.js');

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

async function register (req,res) {
  try {
    const {username, email, password} = req.body;
    if (!username || !email || !password){
      return res.status(400).json({ error: `enter valid credentials`});
    }
    //create a new API key for the user
    const apikey = crypto.randomBytes(32).toString('hex');
    //hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    //write the user to DB
    const newUser = new User({username, email, password: hashedPassword, apikey});
    await newUser.save();

    //creating a new pinecone index for the user with the index name as the username
    try {
      await pc.createIndexForModel({
        name: username,
        cloud: 'aws',
        region: 'us-east-1',
        embed: {
          model: 'llama-text-embed-v2',
          fieldMap: { text: 'chunk_text' },
        },
        waitUntilReady: true,
      });
        } catch (pineconeError) {
          console.error("Pinecone Error:", pineconeError);  // Log Pinecone error for debugging
          return res.status(500).json({ error: `Failed to create Pinecone index` });
        }

    res.status(201).json({ success: `api key: ${apikey}`});
  }
  catch (error) {
    if(error.code === 11000) {
      return res.status(400).json({ error: `username or email already exists`});
    }
    res.status(500).json({error: `internal server error, please try again`});
  }
}

async function signin (req, res) {
  try {
    const {email, password} = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: `enter an email and password`});
    }

    const user = await User.fineOne({ email })

    if (!user) {
      return res.status(401).json({ error : `invalid username or password`})
    }

    //compare the hashed password
    const isMatch = await bycrpt.compare(password, user.password)

    if (!isMatched) {
      return res.status(400).json({ error: `enter an email and password`});
    }

    res.status(200).json({ success : `logged in successfully`});
  
  } catch (error) {
    res.status(500).json({ error : `internal server error, please try again`});
  }
}

module.exports = { register, signin };
