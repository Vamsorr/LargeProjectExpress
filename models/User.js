// models/User.js

// import mongoose and bcrypt, to create a user schema and hash passwords
const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');

// Create a user schema
const userSchema = new mongoose.Schema({
    username: 
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

    email: 
    {
      type: String,
      required: true,
    },

    confirmationNumber:
    {
      type: Number,
      required: false,
    },

    emailAuthenticated:
    {
      type: Boolean,
      required: false,
      default: false,
    },

    resetPasswordToken: 
    { 
      type: String,
      required: false 
    },

    resetPasswordTokenExpires:
    { 
      type: Date,
      required: false
    },
  })

  // Create a recipe schema
  const recipeSchema = new Schema({
    idMeal: { type: String, required: true, unique: true },
    strMeal: { type: String, required: true },
    strDrinkAlternate: { type: String },
    strCategory: { type: String },
    strArea: { type: String },
    strInstructions: { type: String },
    strMealThumb: { type: String },
    strTags: { type: String },
    strYoutube: { type: String },
    strIngredients: { type: [String] },
    strMeasures: { type: [String] },
    strSource: { type: String },
    strImageSource: { type: String },
    strCreativeCommonsConfirmed: { type: String },
    dateModified: { type: String }
  });
  

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
const Recipe = mongoose.model('Recipe', recipeSchema);

// Export the user model and the recipe model so that they can be used in other modules
module.exports = Recipe;
module.exports = User;

