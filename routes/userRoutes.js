// routes/userRoutes.js

// Import express, User model, Recipe and jsonwebtoken
const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Recipe = require('../models/Recipe');

const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

// implement the forgot password endpoint, user enters email and receives a reset link by email
router.post('/forgot-password', async (req, res) =>
{
    // Get the email from the request body
    const {email} = req.body;

    // check if the user exists in the database
    const user = await User.findOne({email});

    // If the user does not exist, return an error
    if (!user)
    {
        return res.status(404).send({message: "User not found"});
    }

    // Create a token for the user
    const token = crypto.randomBytes(20).toString('hex');

    // Create a transporter object to send the email
    user.resetPasswordToken = token;

    // Set the expiration time for the token to 1 hour
    user.resetPasswordTokenExpires = Date.now() + 3600000;

    // Save the user to the database
    await user.save();

    // Create a transporter object to send the email
    const transporter = nodemailer.createTransport
    ({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });
    
      // Create the email options object which sends user to the reset password page
      const mailOptions = 
      {
        to: email,
        from: process.env.GMAIL_USER,
        subject: 'Password Reset',
        text: `You are receiving this because you have requested the reset of the password
         for your recipeApp account.\n\nPlease click on the following link, or paste this into your browser to complete
          the process:\n\nhttp://${req.headers.host}/reset-password\n\n`
      };
    
      // Send the email to the user with the reset link
      transporter.sendMail(mailOptions, (err) =>
    {
        if (err) return res.status(500).send({ message: 'Error sending email' });
        res.status(200).send({ message: 'Email sent' });
      });


});

// Reset password endpoint
router.post('/reset-password', async (req, res) => 
{
  const { token, newPassword } = req.body;

  // Find the user with the provided token
  const user = await User.findOne({ resetPasswordToken: token });

  // If no user is found, or the token has expired, return an error
  if (!user || Date.now() > user.resetPasswordTokenExpires) {
    return res.status(400).send({ message: 'Invalid or expired token' });
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the user's password and clear the reset token and expiration
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpires = undefined;

  // Save the updated user to the database
  await user.save();

  res.status(200).send({ message: 'Password updated successfully' });
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

