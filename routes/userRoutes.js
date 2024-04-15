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
            return res.status(409).send({ message: "Username already in use" });
        }

        // Check if the email already exists
        let existingEmail = await User.findOne({ email });

        // If the email already exists, return an error
        if (existingEmail) {
            return res.status(409).send({ message: "Email already in use" });
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
    // Get the username and confirmation number from the request body
    const { username, numberEntered } = req.body;

    // find the user by username
    const user = await User.findOne({ username });

    // if user doesn't exist, send an error message
    if (!user) {
        return res.status(404).send({ message: "User not found" });
    }

    // check if the confirmation number is correct
    if (numberEntered == user.confirmationNumber) 
    {
        user.confirmed = true;
        await user.save();
        res.send({ message: "Confirmation number is correct" });
    } else 
    {
        res.send({ message: "Invalid confirmation number" });
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

    // Get the email from the request body
    const {username} = req.body;

    // check if the user exists in the database
    const user = await User.findOne({username});

    // check if the email exists in the request body
    const userExists = req.body.username ? true : false;
    if (!userExists)
    {
        return res.status(400).send({ message: "Please enter a username"});
    }

    // If the user does not exist, return an error
    if (!user)
    {
        return res.status(404).send({message: "please enter a valid username"});
    }

    // Log the user's email
    console.log("Username:", user.username);

    // generate 2 digit confirmation number
    let confirmationNumber = Math.floor(10 + Math.random() * 90);

    // saving confirmation number to the user object
    user.emailConfirmNumber = confirmationNumber;
    
    // Save the user to the database
    await user.save();
    
    // Return the user object to the client
    res.json(user);

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
        text: `here is your reset password confirmation\n\n${user.emailConfirmNumber}\n\n`
      };
    
      // Send the email to the user with the reset link
      
        transporter.sendMail(mailOptions, (err) =>
    {
            if (err)
                return res.status(500).send({ message: 'Error sending email' });

            res.status(200).send({ message: 'Email sent' });
    });
});

// confirmation-number endpoint to confirm email
router.post('/Email-Confirmation-number', async (req, res) => 
{
    const { username, numberEntered } = req.body;

    // find the user by username
    const user = await User.findOne({ username });

    // if user doesn't exist, send an error message
    if (!user) {
        return res.status(404).send({ message: "User not found" });
    }

    // check if the confirmation number is correct
    if (numberEntered == user.emailConfirmNumber) {
        user.resetConfirm = true;
        await user.save();

        res.send({ message: "Confirmation number is correct" });
    } else {
        res.send({ message: "Invalid confirmation number" });
    }
});



// Reset password endpoint
router.post('/reset-password', async (req, res) => 
{
  // Get the username and password from request body
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

  if (!user.resetConfirm)
  {
    return res.status(400).send({ message: 'Must enter confirmation number before resetting password'});
  }

  // Password complexity check
  if (newPassword.length < 7 || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) 
  {
    return res.status(400).send({ message: "Password does not meet complexity requirements" });
  }

  // Update the user's password and clear the reset token and expiration
  user.password = req.body.newPassword;

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

// favorites matched with username and idMeal

router.get('/favorite-recipe/:username', async (req, res) => 
{
    // get the username from the request parameters
    const { username } = req.params;

    // if the username is not provided, return an error
    if (!username) 
    {
        return res.status(400).send({ error: 'username is required' });
    }

    // find the user in the database
    const user = await User.findOne({ username });

    // if the user does not exist, return an error
    if (!user) 
    {
        return res.status(404).send({ error: 'User not found' });
    }

    // get the user's favorite recipes
    const favorites = await Favorites.find({ userId: user._id });

    // if the user has no favorites, return an appropriate message
    if (favorites.length === 0) 
    {
        return res.send({ message: 'No favorite recipes found for this user' });
    }

    // send the favorites to the client
    res.send(favorites);
});

// Add a favorite recipe
router.post('/favorite-recipe', async (req, res) => 
{
    // get the username and idMeal from the request body
    const { username, idMeal } = req.body;

    // if the username or idMeal are not provided, return an error
    if (!username || !idMeal) 
    {
        return res.status(400).send({ error: 'username and idMeal are required' });
    }

    // find the user and the recipe in the database
    const user = await User.findOne({ username });
    const recipe = await Recipe.findOne({ 'meals.idMeal': idMeal });

    /* if the user or the recipe do not exist, return an error
    if (!user || !recipe) 
    {
        return res.status(404).send({ error: 'User or recipe not found' });
    }
    */

    // create a new favorite object with the user's id and recipe's idMeal and save it to the database
    try {
        const favorite = new Favorites({ userId: user._id, recipeId: idMeal });
        await favorite.save();
        res.send(favorite);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while saving the favorite' });
    }
});

// Export the router
module.exports = router;

