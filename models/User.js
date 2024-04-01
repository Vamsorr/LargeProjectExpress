// models/User.js

// import mongoose and bcrypt, to create a user schema and hash passwords
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create a user schema
const userSchema = new mongoose.Schema({
    name: 
    {
      type: String,
      required: true,
      unique: true
    },
    email: 
    {
      type: String,
      required: true,
      unique: true
    },
    password: 
    {
      type: String,
      required: true
    },
    username: 
    {
      type: String,
      required: true,
      unique: true
    }
    
  })

  // Create a recipe schema
  const recipeSchema = new mongoose.Schema({
    recipeName:
    {
      type: String,
      required: true,
      unique: true
    },

    category:
    {
      type: String,
      required: true,
    },

    ingredients:
    {
      type: String,
      required: true,
    },

    directions:
    {
      type: [String],
      required: true,
    },

    nutritionalFacts:
    {
      type: String,
      required: true,
    }
  })

// Add a pre-save hook to hash the password before saving it to the database
userSchema.pre('save', async function(next)
 {
    // if password is changed, Hash the password before saving it to the database
    if (this.isModified('password')) 
    {
        // Hash the password using bcrypt
        this.password = await bcrypt.hash(this.password, 8);
    }

    // Continue with the save operation
    next();
});

// Add a method to the user schema to check password validity
userSchema.methods.isValidPassword = async function(password) 
{

    // Compare the password with the hashed password in order to validate the user
    return await bcrypt.compare(password, this.password);
};

// Create a user model and a recipe model
const User = mongoose.model('User', userSchema);
const Recipe = mongoose.model('Recipe', recipeScheme);

// Export the user model and the recipe model
module.exports = Recipe;
module.exports = User;

