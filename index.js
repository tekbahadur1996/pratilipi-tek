
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

var app = express();
var PORT = process.env.PORT || 8000;
const SECRET = "TEST_SECRET";
var connectionStatus = {};

// you can change winner count but it must be less than min(rows, columns)
const WINNER_COUNT = 4;

// temp database stored in local memory, NOT FOR PRODUCTION
var allTempData = [];

// connecting DB
require('./dbConnection')().then(conn => {
    connectionStatus = conn;
    // connectionStatus = { connection: false }
    if (!conn.connection) {
        console.log("Error while connecting DB, Storing data in server");
    }
});

// registering model
require('./model');
let PratilipiModel = mongoose.model('PratilipiData');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.disable("x-powered-by");

var model = {
    matrix: [[0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0]],
    turn: "1",
    winner: null,
    color1: "RED",
    color2: "Yellow",
    rows: 6,
    columns: 7
};

var basicData = JSON.parse(JSON.stringify(model));

// adding coin to the matrix, if possible
function addNewCoinFunction(allData, col, t) {
    // console.log('addNewCoinFunction called')
    if (allData[0][col]) {
        return { status: false };
    }
    let index;
    for (let i = allData.length - 1; i >= 0; i--) {
        if (!allData[i][col]) {
            allData[i][col] = Number(t);
            index = i;
            break;
        }
    }
    return { index, status: true };
}

function checkWinnerHelper(allData, col, row, direction) {
    // return the count of continous coins according to direction

    let col_max = allData.columns - 1, row_max = allData.rows - 1;
    let count = 0;
    if (direction === 'right') {
        if (col === col_max) return count;
        for (let i = col + 1; i <= col_max; i++) {
            // console.log('hey ',allData.matrix[row][i], row, col, i);
            if (allData.matrix[row][i] == allData.turn) {
                count++;
            }
            else break;
        }
        return count;
    }
    else if (direction === 'left') {
        if (col === 0) return count;
        for (let i = col - 1; i >= 0; i--) {
            if (allData.matrix[row][i] == allData.turn) {
                count++;
            }
            else break;
        }
        return count;
    }
    else if (direction === 'top') {
        if (row === 0) return count;
        for (let i = row - 1; i >= 0; i--) {
            if (allData.matrix[i][col] == allData.turn) {
                count++;
            }
            else break;
        }
        return count;
    }
    else if (direction === 'down') {
        if (row === row_max) return count;
        for (let i = row + 1; i <= row_max; i++) {
            // console.log('hey ',allData.matrix[i][col], row, col, i);
            if (allData.matrix[i][col] == allData.turn) {
                count++;
            }
            else break;
        }
        return count;
    }
    else if (direction === 'right-top') {
        if (row === 0 || col === col_max) return count;
        while (row !== 0 && col !== col_max) {
            row--;
            col++;
            // console.log('hey ',allData.matrix[row][col], row, col);
            if (allData.matrix[row][col] == allData.turn) {
                count++;
            }
            else break;
        }
        return count;
    }
    else if (direction === 'right-down') {
        if (row === row_max || col === col_max) return count;
        while (row !== row_max && col !== col_max) {
            row++;
            col++;
            if (allData.matrix[row][col] == allData.turn) {
                count++;
            }
            else break;
        }
        return count;
    }
    else if (direction === 'left-top') {
        if (row === 0 || col === 0) return count;
        while (row !== 0 && col !== 0) {
            row--;
            col--;
            if (allData.matrix[row][col] == allData.turn) {
                count++;
            }
            else break;
        }
        return count;
    }
    else if (direction === 'left-down') {
        if (row === row_max || col === 0) return count;
        while (row !== row_max && col !== 0) {
            row++;
            col--;
            if (allData.matrix[row][col] == allData.turn) {
                count++;
            }
            else break;
        }
        return count;
    }
}
// let tempData = {
//     matrix: [[1, 1, 1, 0, 0, 0, 0],
//             [0, 1, 0, 0, 0, 0, 0],
//             [1, 1, 0, 0, 0, 0, 0],
//             [0, 1, 0, 0, 0, 0, 0],
//             [0, 0, 0, 0, 0, 0, 0],
//             [0, 0, 0, 0, 0, 0, 0]],
//     turn: "1",
//     winner: null
// };
// console.log('checkWinnerHelper left', checkWinnerHelper(tempData, 2, 0, "left-down"))
// console.log('checkWinnerHelper right', checkWinnerHelper(tempData, 4, 3, "right-down"))

function checkWinner(allData, col, row) {
    let { matrix, turn } = allData;

    // check horizontal
    let horizontalCount = checkWinnerHelper(allData, col, row, "left") + checkWinnerHelper(allData, col, row, "right") + 1;
    if (horizontalCount == WINNER_COUNT) {
        allData.winner = allData.turn;
        return true;
    }

    let verticalCount = checkWinnerHelper(allData, col, row, "top") + checkWinnerHelper(allData, col, row, "down") + 1;
    if (verticalCount == WINNER_COUNT) {
        allData.winner = allData.turn;
        return true;
    }

    let diagonal1 = checkWinnerHelper(allData, col, row, "left-top") + checkWinnerHelper(allData, col, row, "right-down") + 1;
    if (diagonal1 == WINNER_COUNT) {
        allData.winner = allData.turn;
        return true;
    }

    let diagonal2 = checkWinnerHelper(allData, col, row, "right-top") + checkWinnerHelper(allData, col, row, "left-down") + 1;
    if (diagonal2 == WINNER_COUNT) {
        allData.winner = allData.turn;
        return true;
    }
}

async function authMiddleware(req, res, next) {
    // middleware function to check the token, except for the START
    // setting current user data in req.locals
    try {
        if (String(req.body.payload).toUpperCase() === "START") {
            next();
        }
        else {
            // check token
            let token = req.query.token;
            if (!token) {
                return res.send("Token required or start new game");
            }

            // check for token
            let checkToken = connectionStatus.connection ? await PratilipiModel.findOne({ token }).lean() : await allTempData.find(x => x.token == token);
            if (!checkToken) {
                return res.send("Invalid Token");
            }
            else {
                req.locals = checkToken;
                next();
            }
        }
    }
    catch (e) {
        return res.send("Error");
    }
}
async function updateDatabase(currentUserData) {
    // updating DB/local server variable

    try {
        let updateData = connectionStatus.connection ?
            await PratilipiModel.update({ token: currentUserData.token }, { $set: { matrix: currentUserData.matrix, turn: currentUserData.turn, winner: currentUserData.winner } }) : updateLocal();
        // console.log(allTempData)
        return updateData;
    }
    catch (e) {
        console.log("Error while updating", e);
    }

    function updateLocal() {
        let item = allTempData.find(x => x.token == currentUserData.token);
        item.matrix = currentUserData.matrix;
        item.turn = currentUserData.turn;
        item.winner = currentUserData.winner;
    }
}

app.post('/', authMiddleware, async (req, res) => {
    try {
        console.log('---NEW REQUEST')
        let payload = req.body.payload;

        // if starting then, create data and token, store in DB, return token
        if (String(payload).toUpperCase() === 'START') {
            let userData = JSON.parse(JSON.stringify(basicData));
            // create token
            userData.token = jwt.sign({}, SECRET);
            userData.createdAt = new Date();
            userData.color1 = "RED";
            userData.color2 = "Yellow";

            // save the data in DB
            let saveData = connectionStatus.connection ? await new PratilipiModel(userData).save() : allTempData.push(userData);

            // console.log('saveData', saveData, userData);
            return res.send({
                data: "READY",
                token: userData.token
            });
        }
        let currentUserData = req.locals;

        // not valid data, either column number is not valid or greater than max value
        if (isNaN(Number(payload)) || payload < 0 || payload > (currentUserData.columns - 1)) {
            return res.send("Invalid");
        }

        // current token already has a winner
        if (currentUserData.winner) {
            return res.send(`WINNER ${currentUserData.winner == "1" ? currentUserData.color1 : currentUserData.color2}`)
        }

        // adding a new coin of the current user, if possible
        let addCoin = addNewCoinFunction(currentUserData.matrix, payload, currentUserData.turn);
        if (!addCoin.status) {
            return res.send("Invalid");
        }

        // check after inserting coin, does user becomes the winner or not
        let checkWin = checkWinner(currentUserData, payload, addCoin.index);
        if (checkWin) {
            // current user is the winner
            // console.log(currentUserData);
            let updateData = await updateDatabase(currentUserData);
            return res.send(`WINNER ${currentUserData.winner == "1" ? currentUserData.color1 : currentUserData.color2}`)
        }

        // change turn to next user
        currentUserData.turn = currentUserData.turn == "1" ? "2" : "1";
        // updating changed data
        let updateData = await updateDatabase(currentUserData);

        // console.log(currentUserData);
        res.send("Valid");
    }
    catch (e) {
        console.log(e);
        res.send({ success: false, message: "Error", error: e });
    }
});

app.listen(PORT, () => {
    console.log(`Server started at ${PORT}`);
});

setInterval(x => {
    console.log("this is temp data", allTempData.map(x => x.token));
}, 5000)
