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

router.get('/signup', async (req, res) => {

    // serve the login page
    res.sendFile(path.join(__dirname, '/signup.html'));
});

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

        // Create a new user object
        const user = new User({ username, password, email});

        console.log(user);
        // Save the user to the database
        await user.save();

        // Return the user object to the client
        res.json(user);

        // Creating a token for the user
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Creating a url to send to the user's email with an embedded json web token
        // to confirm registration and direct user to login
        const url = `http://localhost:3000/api/users/confirmation/${token}`;

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
            subject: "Culinary Canvas Registration Confirmation",
            text: `Please click the following link to login and confirm your registration and login: \n\n${url}`
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

router.get('/confirmation/:token', async (req, res) => {
    try {
        // Get the token from the request parameters
        const token = req.params.token;
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // Convert the userId back to an ObjectId
        const ObjectId = mongoose.Types.ObjectId;
        const userId = new ObjectId(payload.userId);

        // Find the user with the userId
        const user = await User.findOne({ _id: userId });

        // If the user is not found, return an error
        if (!user) {
            return res.status(400).send({ message: 'We were unable to find a user for this token.' });
        }

        // If the user is already verified, return an error
        if (user.confirmed) {
            return res.status(200).send({ message: 'This user has been verified.' });
        }

        // If we found a user, set their `confirmed` field to true
        await User.updateOne({ _id: userId }, { $set: { confirmed: true } });

        res.status(200).send({ message: 'The account has been verified, successfully' });

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Invalid token' });
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
        text: `You are receiving this because you have requested the reset of the password
         for your Culinary Canvas account.\n\nPlease click on the following link, or paste this into your browser to complete
          the process:\n\nhttp://localhost:3000/api/user/reset-password/${user.resetPasswordToken}\n\n`
      };
    
      // Send the email to the user with the reset link
      transporter.sendMail(mailOptions, (err) =>
    {
        if (err)
            return res.status(500).send({ message: 'Error sending email' });

        res.status(200).send({ message: 'Email sent' });
    });
});

/*  // Confirmation password endpoint
router.get('/confirmation-pass/:token', async (req, res) => {
    try {
        // Find the user with the resetPasswordToken that matches the token in the URL
        const user = await User.findOne({ resetPasswordToken: req.params.token });

        // If no user is found, return an error
        if (!user) {
            return res.status(400).send({ message: "Invalid or expired token" });
        }

        // If a user is found, set resetPasswordToken to true
        user.resetPasswordToken = true;

        // Save the updated user to the database
        await user.save();

        // Redirect the user to the reset-password endpoint
        res.redirect('/api/user/reset-password');
    } catch (error) {
        // ... code to handle error
        res.status(500).send({ message: 'Server error' });
    }
});
*/

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
    const { userId, recipeId } = req.body;

    if (!userId || !recipeId) {
        return res.status(400).send({ error: 'userId and recipeId are required' });
    }

    try {
        const favorite = new Favorites({ userId, recipeId });
        await favorite.save();
        res.send(favorite);
    } catch (error) {
        console.error(error);   
        res.status(500).send({ error: 'An error occurred while saving the favorite' });
    }
});




// Export the router
module.exports = router;

