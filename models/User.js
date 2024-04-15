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

    confirmationNumber:
    {
      type: String,
      required: false,
    },

    resetConfirm:
    {
      type: Boolean,
      required: false,
      default: false,
    },

    emailConfirmNumber:
    {
      type: String,
      required: false,
    },
  })

  
// Add a pre-save hook to hash the password before saving it to the database
userSchema.pre('save', async function(next)
 {
    // if password is changed, Hash the password before saving it to the database
    if (this.isModified('password')) 
    {
        // Hash the password using bcrypt
        this.password = await bcrypt.hash(this.password, 10);
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

// Export the user model
module.exports = User;

