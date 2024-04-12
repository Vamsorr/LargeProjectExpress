// models/User.js

// import mongoose and bcrypt, to create a user schema and hash passwords
const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');

// Create a user schema
const userSchema = new mongoose.Schema
({
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

    confirmed:
    {
      type: Boolean,
      required: false,
      default: false,
    },

    resetConfirm:
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

  const favoriteSchema = new Schema({
    _id: {
      type: Schema.Types.ObjectId,
      required: false,
      auto: true,
    },
    recipeId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    }
  });


  // Create a recipe schema
  const recipeSchema = new Schema({
    _id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    meals: [{
      idMeal: String,
      strMeal: String,
      strDrinkAlternate: { type: String, default: null },
      strCategory: String,
      strArea: String,
      strInstructions: String,
      strMealThumb: String,
      strTags: String,
      strYoutube: String,
      strIngredient1: String,
      strIngredient2: String,
      strIngredient3: String,
      strIngredient4: String,
      strIngredient5: String,
      strIngredient6: String,
      strIngredient7: String,
      strIngredient8: String,
      strIngredient9: String,
      strIngredient10: String,
      strIngredient11: String,
      strIngredient12: String,
      strIngredient13: String,
      strIngredient14: String,
      strIngredient15: String,
      strIngredient16: String,
      strIngredient17: String,
      strIngredient18: String,
      strIngredient19: String,
      strIngredient20: String,
      strMeasure1: String,
      strMeasure2: String,
      strMeasure3: String,
      strMeasure4: String,
      strMeasure5: String,
      strMeasure6: String,
      strMeasure7: String,
      strMeasure8: String,
      strMeasure9: String,
      strMeasure10: String,
      strMeasure11: String,
      strMeasure12: String,
      strMeasure13: String,
      strMeasure14: String,
      strMeasure15: String,
      strMeasure16: String,
      strMeasure17: String,
      strMeasure18: String,
      strMeasure19: String,
      strMeasure20: String,
      strSource: { type: String, default: null },
      strImageSource: { type: String, default: null },
      strCreativeCommonsConfirmed: { type: String, default: null },
      dateModified: { type: Date, default: null }
    }]
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
const Favorites = mongoose.model('Favorite', favoriteSchema);

// Export the user model and the recipe model so that they can be used in other modules
module.exports = Recipe;
module.exports = User;
module.exports = Favorites;
