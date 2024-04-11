// routes/userRoutes.js

// Import express, User model, Recipe and jsonwebtoken
const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Recipe = require('../models/User');

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// create a map to store the confirmation numbers
let confirmationNumbers = new Map();

// Create a new router
const router = express.Router();

router.post('/signup', async (req, res) => 
{
    try {

        // Get the username and email from the post request body
        const { username, password, email } = req.body;

        // Check if the user already exists
        let existingUser = await User.findOne({ username });

        // If the user already exists, return an error
        if (existingUser) 
        {
            return res.status(409).send({ message: "User already exists" });
        }

        // Generate a random confirmation number to ensure the email is valid
        let confirmationNumber = Math.floor(10000 + Math.random() * 90000);

        // Create a new user object
        const user = new User({ username, password, email, confirmationNumber});

        // Save the user to the database
        await user.save();

        // Store the confirmation number and email in a map
        confirmationNumbers.set(email, confirmationNumber);

        // Return the user object to the client
        res.json(user);

        // Create a transporter object using the default SMTP transport using gmail
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: 
            {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS, // app password from gmail account
            }
        });

        // Send email with defined transport object
        let mailOptions = {
            from:
            {
                name: "Recipe App",
                address: process.env.GMAIL_USER
            },
            to: email, // sending to the email entered by the user
            subject: "Recipe App Confirmation Number",
            text: `Your Recipe App confirmation number is ${user.confirmationNumber}. Please click the following link to login using your confirmation number: \n\nhttp://${req.headers.host}/login.`, // plain text body
        }

        // Send the email
        const sendMail = async (transporter, mailOptions) =>
        {
            try
            {
                await transporter.sendMail(mailOptions)
                console.log("Email sent");

            } catch(error)
            {
                console.error(error);
            }
        }

        // Call the sendMail function
        sendMail(transporter, mailOptions);
    
        // If an error occurs, return it to the client
    } catch (error) 
    {
        res.status(500).send({ message: "Error creating user", error: error.message });
    }
});



router.post('/login', async (req, res) => 
{
    try 
    {   
        // Get the username, password and confirmation number from the post request body
        const { username, password, confirmationNumber } = req.body;

        // saving the user object from the database to user variable
        const user = await User.findOne({ username });

        // num is boolean to check if there is a confirmation number in the request body
        const num = req.body.confirmationNumber ? true : false;

        // If the user is not found, wrong username error
        if (!user) 
        {
            return res.status(401).send({ message: "Invalid username" });
        }

        // If the password is incorrect, return an error
        if (!(await user.isValidPassword(password)))
        {
            return res.status(401).send({ message: "Invalid password"});
        }

        // if email has not been authenticated then you must enter username, password and confirmation number to login
        if (user.emailAuthenticated === false)
            {

                if (!num)
                {
                    return res.status(401).send({ message: "You must enter a confirmation number to login, if you have not received a confirmation number, please sign up again"});
                }

                // if the confirmation number entered does not match the confirmation number in the database, return an error
                if (parseInt(confirmationNumber, 10 ) !== user.confirmationNumber)
                {
                    return res.status(401).send({ message: "Invalid confirmation number"});
                }

                // if the confirmation number is correct, set the emailAuthenticated to true
                user.emailAuthenticated = true;
                user.save();
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
    // Log the values of the environment variables
    console.log(process.env.GMAIL_USER);
    console.log(process.env.GMAIL_PASS);

    // Get the email from the request body
    const {email} = req.body;

    // check if the user exists in the database
    const user = await User.findOne({email});

    // If the user does not exist, return an error
    if (!user)
    {
        return res.status(404).send({message: "User not found"});
    }

    // Log the user's email
    console.log("User email:", user.email);

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
        host: "smtp.gmail.com",
        auth:
        {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });
    
      // Create the email options object which sends user to the reset password page
      const mailOptions = 
      {
        to: user.email,
        from:
        {
            name: 'Culinary Canvas',
            address: process.env.GMAIL_USER,
        },
        subject: 'Culinary Canvas Password Reset',
        text: `You are receiving this because you have requested the reset of the password
         for your Culinary Canvas account.\n\nPlease click on the following link, or paste this into your browser to complete
          the process:\n\nhttp://${req.headers.host}/reset-password\n\n`
      };
    
      // Send the email to the user with the reset link
      transporter.sendMail(mailOptions, (err) =>
    {
        if (err)
            return res.status(500).send({ message: 'Error sending email' });

        res.status(200).send({ message: 'Email sent' });
    });


});

// Reset password endpoint
router.post('/reset-password', async (req, res) => 
{
  // Get the token and new password from the request body
  const { username, newPassword } = req.body;

  // Find the user with the provided token
  const user = await User.findOne({ username });

  // If no user is found, return an error
  if (!user) 
  {
    return res.status(400).send({ message: 'Inavlid Username' });
  }

  // If the token has expired, return an error
  if (Date.now() > user.resetPasswordTokenExpires)
  {
    return res.status(400).send({ message: "Token has expired, please request a new one"});
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

