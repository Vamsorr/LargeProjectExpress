// Description: Model for Favorite collection
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//const { Schema } = mongoose;

// Create a favorite schema
const favoriteSchema = new Schema({
    _id: {
      type: Schema.Types.ObjectId,
      required: false,
      auto: true,
    },
    recipeId: {
      type: String,
      required: false
    },
    userId: {
      type: String,
      required: false
    }
  });

// Create a model for the favorite schema
const Favorites = mongoose.model('Favorite', favoriteSchema);
module.exports = Favorites;
