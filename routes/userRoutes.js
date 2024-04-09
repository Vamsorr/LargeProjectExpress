// routes/userRoutes.js

// Import express, User model, Recipe and jsonwebtoken
const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Recipe = require('../models/User');

const crypto = require('crypto');
const nodemailer = require('nodemailer');

// create a map to stroe the confirmation numbers
let confirmationNumbers = new Map();

// Create a new router
const router = express.Router();

router.post('/signup', async (req, res) => 
{
    try {

        // Get the username, password, and email from the post request body
        const { username, password, email } = req.body;

        // Check if the user already exists
        let existingUser = await User.findOne({ $or: [{ username }, { email }] });

        // If the user already exists, return an error
        if (existingUser) 
        {
            return res.status(409).send({ message: "User already exists" });
        }

        // Generate a random confirmation number
        let confirmationNumber = Math.floor(10000 + Math.random() * 90000);

        // Store the confirmation number and email in a map
        confirmationNumbers.set(email, confirmationNumber);

        // Create a transporter object using the default SMTP transport, must use gmail
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: 
            {
                user: 'your-email@gmail.com', // replace with your email
                pass: 'your-password' // replace with your password
            }
        });

        // Send email with defined transport object
        let info = await transporter.sendMail({
            from: '"RecipeTeam" RecipeGang@gmail.com', // sender address
            to: email, // list of receivers
            subject: "Recipe App Confirmation Number", // Subject line
            text: `Your Recipe App confirmation number is ${confirmationNumber}. Please click the following link to confirm your account: /signup/confirm. Once the link is clicked, please enter the 5 digit confirmation number to complete the signup process.`, // plain text body
        });

        // Send a response to the client
        res.status(200).send({ message: 'Confirmation number sent, please check your email' });
    
        // If an error occurs, return it to the client
    } catch (error) 
    {
        res.status(500).send({ message: "Error creating user", error: error.message });
    }
});

router.post('/signup/confirm', async (req, res) => {
    try {
        const { confirmationNumber } = req.body;

        // Check if the confirmation number exists
        if (!confirmationNumbers.has(confirmationNumber)) {
            return res.status(400).send({ message: "Invalid confirmation number" });
        }

        // Get the user details
        const { username, password, email } = confirmationNumbers.get(confirmationNumber);

        // Create a new user
        const user = new User({ username, password, email });

        // Save the user to the database
        await user.save();

        // Remove the confirmation number
        confirmationNumbers.delete(confirmationNumber);

        // send the user object to the client
        res.json(user);

        // If an error occurs, return it to the client
    } catch (error) 
    {
        res.status(500).send({ message: "Error confirming user", error: error.message });
    }
});

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



// Export the router
module.exports = router;

