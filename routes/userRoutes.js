// routes/userRoutes.js

// Import express, User model, and jsonwebtoken
const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Signup endpoint
router.post('/signup', async (req, res) => 
{
    try {
        const { username, password, email, phoneNum, location } = req.body;
        // Check if user already exists
        let existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).send({ message: "User already exists" });
        }
        // Create a new user and save to database
        const user = new User({ username, password, email, phoneNum, location });
        await user.save();

        // Respond with success
        res.status(201).send({ message: "User created successfully" });
    } catch (error) {
        res.status(500).send({ message: "Error creating user", error: error.message });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await user.isValidPassword(password))) {
            return res.status(401).send({ message: "Invalid username or password" });
        }
        // Generate a token and send it in the response to user, 
        // allows user authentication without needing to send username and password with every request
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).send({ token });
    } catch (error) {
        res.status(500).send({ message: "Error logging in", error: error.message });
    }
});

// Export the router
module.exports = router;

