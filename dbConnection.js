
// connecting to DB
// here you can set DB credentials using .env file
const mongoose = require('mongoose');

// all these data must be in .env file
var DB_USER = "", DB_PASS = "", DB = "pratilipi", DB_PORT = "27017", DB_URL = "127.0.0.1";

module.exports = async function () {
    try {
        await mongoose.connect(`mongodb://${DB_URL}:${DB_PORT}/${DB}`, { useNewUrlParser: true, useUnifiedTopology: true });
        mongoose.set('useFindAndModify', false);
        console.log("Connected to Database");
        return { connection: true };
    }
    catch(e) {
        console.log("Error while connecting to DB");
        return { connection: false };
    }
}