// models/User.js

// import mongoose and bcrypt, to create a user schema and hash passwords
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create a user schema
const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true,
      unique: true
    }
    // Add more fields as needed
  })
// Hash the password before saving the user model
userSchema.pre('save', async function(next)
 {
    // Hash the password before saving the user model
    if (this.isModified('password')) 
    {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

// Add a method to the user schema to check password validity
userSchema.methods.isValidPassword = async function(password) 
{
    return await bcrypt.compare(password, this.password);
};

// Create a user model and export it
const User = mongoose.model('User', userSchema);
module.exports = User;

