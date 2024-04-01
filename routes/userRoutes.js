// routes/userRoutes.js

// Import express, User model, and jsonwebtoken
const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Create a new router
const router = express.Router();

// Signup endpoint and route
router.post('/signup', async (req, res) => 
{
    // Wrap the code in a try-catch block to catch any errors
    try 
    {
    
        // Get the username, password, and email from the request body
        const { username, password, email } = req.body;

        // Mongoose query to check if the user already exists, can match either username or email, boolean value
        let existingUser = await User.findOne({ $or: [{ username }, { email }] });

        // If the user already exists, return an error
        if (existingUser) 
        {
            return res.status(409).send({ message: "User already exists" });
        }

        // Create a new user from data acquired from the post request
        const user = new User({ username, password, email});

        // Save the user to the database
        await user.save();

        // saves the user to the database and returns the user object as json to the client
        res.json(user);

        // If an error occurs, return it to the client
    } catch (error) 
    {
        res.status(500).send({ message: "Error creating user", error: error.message });
    }
});

// Login endpoint
router.post('/login', async (req, res) => 
{
    try 
    {
        // Get the username and password from the post request body
        const { username, password } = req.body;

        // saving the user object from the database to user variable
        const user = await User.findOne({ username });

        // If the user is not found, or the password is incorrect, return an error
        if (!user || !(await user.isValidPassword(password))) 
        {
            return res.status(401).send({ message: "Invalid username or password" });
        }
        
        // If the user is found and the password is correct, create a token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Respond with the user and token
        res.status(200).send({ user,token });

    // If an error occurs, return it to the client
    } catch (error) 
    {
        // Log the error to the console
        res.status(500).send({ message: "Error logging in", error: error.message });
    }
});

// Export the router
module.exports = router;

