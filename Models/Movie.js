const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({

    title: {type: String, required: true, unique: true},
    description: {type: String, required: true},
    bannerImage: {type: String},
    trailer: {type: String},
    posterImage: {type: String},
    video: {type: String},
    year: {type:String, required: true},
    limit: {type: Number, required: true},
    genre: {type: String, required: true},
    category: {type: Array, required: true},

},{timestamps:true});

module.exports = mongoose.model('Movie', movieSchema);