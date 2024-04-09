// models/User.js

// import mongoose and bcrypt, to create a user schema and hash passwords
const mongoose = require('mongoose');
const { Schema } = mongoose;
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

  /*
    
  */

  // Create a recipe schema
  const recipeSchema = new mongoose.Schema
  ({
    idmeal:
    {
      type: Number,
      required: true,
      unique: true
    },

    strMeal:
    {
      type: String,
      required: true,
      unique: true
    },

    strDrinkAlternate:
    {
      type: String,
      required: true,
      unique: true
    },

    strCategory:
    {
      type: String,
      required: true,
      unique: true
    },

    strArea:
    {
      type: String,
      required: true,
      unique: true
    },

    strInstructions:
    {
      type: String,
      required: true,
      unique: true
    },

    strMealThumb:
    {
      type: String,
      required: true,
      unique: true
    },

    strTags:
    {
      type: String,
      required: true,
      unique: true
    },

    strYoutube:
    {
      type: String,
      required: true,
      unique: true
    },

    strIngredient1:
    {
      type: String,
      required: true,
      unique: false
    },

    strIngredient2:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient3:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient4:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient5:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient6:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient7:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient8:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient9:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient10:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient11:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient12:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient13:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient14:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient15:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient16:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient17:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient18:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient19:
    {
      type: String,
      required: false,
      unique: false
    },

    strIngredient20:
    {
      type: String,
      required: false,
      unique: false
    },
    

    strMeasure1:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure2:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure3:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure4:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure5:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure6:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure7:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure8:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure9:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure10:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure11:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure12:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure13:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure14:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure15:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure16:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure17:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure18:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure19:
    {
      type: String,
      required: false,
      unique: false
    },

    strMeasure20:
    {
      type: String,
      required: false,
      unique: false
    },

    strSource:
    {
      type: Schema.Types.Mixed,
      required: false,
      unique: false
    },

    strImageSource:
    {
      type: Schema.Types.Mixed,
      required: false,
      unique: false
    },

    strCreativeCommonsConfirmed:
    {
      type: Schema.Types.Mixed,
      required: false,
      unique: false
    },

    dateModified:
    {
      type: Schema.Types.Mixed,
      required: false,
      unique: false
    },
  
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
const Recipe = mongoose.model('Recipe', recipeSchema);

// Export the user model and the recipe model so that they can be used in other modules
module.exports = Recipe;
module.exports = User;

