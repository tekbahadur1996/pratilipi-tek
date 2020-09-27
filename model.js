
// setting basic model for storing data in mongodb
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    matrix: Array,
    turn: String,
    winner: String,
    color1: String,
    color2: String,
    rows: Number,
    columns: Number,
    token: String
});

// registering model
mongoose.model('PratilipiData', schema, 'PratilipiData');