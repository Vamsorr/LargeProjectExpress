// routes/userRoutes.js

// Import express, User model, Recipe and jsonwebtoken
const express = require('express');
const User = require('../models/User');
const Favorites = require('../models/Favorites');
const Recipe = require('../models/Recipe');
const jwt = require('jsonwebtoken');
const path = require('path');

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

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

        // Password complexity check
        if (password.length < 7 || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return res.status(400).send({ message: "Password does not meet complexity requirements" });
}

        // generate 2 digit confirmation number
        let confirmationNumber = Math.floor(10 + Math.random() * 90);

        // Create a new user object
        const user = new User({ username, password, email, confirmationNumber});

        // Save the user to the database
        await user.save();

        // Return the user object to the client
        res.json(user);

        // Creating a token for the user
        //const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Creating a url to send to the user's email with an embedded json web token
        // to confirm registration and direct user to login
        //const url = process.env.URL;

        // Create a transporter object using the default SMTP transport using gmail
        let transporter = nodemailer.createTransport
        ({
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
        let mailOptions = 
        {
            from:
            {
                name: "Culinary Canvas",
                address: process.env.GMAIL_USER
            },
            to: email, // sending to the email entered by the user
            subject: "Culinary Canvas confirmation number",
            text: `Confirmation number: \n\n${user.confirmationNumber}\n\n`
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

// confirmation-number endpoint to confirm email
router.post('/confirmation-number', async (req, res) => 
{
    const { username, numberEntered } = req.body;

    // find the user by username
    const user = await User.findOne({ username });

    // if user doesn't exist, send an error message
    if (!user) {
        return res.status(404).send({ message: "User not found" });
    }

    // check if the confirmation number is correct
    if (numberEntered == user.confirmationNumber) {
        user.confirmed = true;
        await user.save();
        res.send({ message: "Confirmation number is correct" });
    } else {
        res.send({ message: "Confirmation number is incorrect" });
    }
});



// Login endpoint
router.post('/login', async (req, res) => 
{
    try 
    {   
        // Get the username, password and confirmation number from the post request body
        const { username, password} = req.body;

        // saving the user object from the database to user variable
        const user = await User.findOne({ username });

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

        // If user has not confirmed email he may not login
        if (!user.confirmed)
        {
            return res.status(401).send({ message: "Please confirm your email to login"});
        }

        // If the credentials are valid and the email is confirmed, generate a token for the user
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Respond with the user and token
        res.status(200).send({ user, token, message: "Yay you're logged in!"});

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

    // check if the email exists in the request body
    const emailExists = req.body.email ? true : false;
    if (!emailExists)
    {
        return res.status(400).send({ message: "Please enter an email"});
    }

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
        text: `here is your reset password confirmation${user.confirmationNumber}\n\n`
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

  // username and password variables used to check if username and password exist in request body
  const pass = req.body.newPassword;
  const usename = req.body.username;

  // if username or password are not provided throw error
  if (!pass)
  {
    return res.status(400).send({ message: 'Please enter a password'});
  }

  if (!usename)
  {
    return res.status(400).send({ message: 'Please enter a username'});
  }


  // If no user is found, return an error
  if (!user) 
  {
    return res.status(400).send({ message: 'Inavlid Username' });
  }

  // Password complexity check
  if (newPassword.length < 7 || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) 
  {
    return res.status(400).send({ message: "Password does not meet complexity requirements" });
  }

  /*
    if (user.resetConfirm !== true)
    {
        return res.status(400).send({ message: 'Please confirm your email to reset password'});
    }
  */

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


// Add recipe
router.post('/add-recipe', async (req, res) =>
{

    // create a new recipe object from the request body
    const recipe = new Recipe(req.body);

    // save the recipe to the database
    await recipe.save();

    // send the recipe to the client
    res.send(recipe);
})

// edit recipe by strMeal
router.patch('/edit-recipe', async (req, res) =>
{
    // find the recipe by strMeal, aka the meal name
    const recipe = await Recipe.findOne({strMeal: req.body.strMeal});

    // update the recipe with the new values
    recipe.set(req.body);

    // save the updated recipe to the database
    await recipe.save();
})


router.get('/favorite-recipe/:id', async (req, res) =>
{

    // get the user's favorite recipes
    const favorites_json = await Favorites.find({userId: req.params.id});

    // send the favorites to the client
    res.send(favorites_json);
}
)

router.post('/favorite-recipe/', async (req, res) => {
    const { username, recipeId } = req.body;

    if (!username || !recipeId) {
        return res.status(400).send({ error: 'userId and recipeId are required' });
    }

    try {
        const favorite = new Favorites({ username, recipeId });
        await favorite.save();
        res.send(favorite);
    } catch (error) {
        console.error(error);   
        res.status(500).send({ error: 'An error occurred while saving the favorite' });
    }
});


router.post('/favorites', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).send({ error: 'username is required' });
    }

    try {
        const favorites = await Favorites.find({ username });
        res.send(favorites);
    } catch (error) {
        console.error(error);

        res.status(500).send({ error: 'An error occurred while fetching favorites' });
    }
}
);




// Export the router
module.exports = router;

