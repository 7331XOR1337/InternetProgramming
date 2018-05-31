/* Load Modules */
const express = require('express');
var app = express();
const bodyParser = require('body-parser');
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const TYPES = require('tedious').TYPES;
const xml2js = require('xml2js');
const fs = require('fs');
const DButilsAzure = require('./modules/DButils');
const ConnectionPool = require('tedious-connection-pool');
const jwt = require('jsonwebtoken');
const superSecret = "InbarYagil";
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


/* Handle poi module */
var poi = require('./modules/poi'); // Load the js file
app.use('/poi', poi); // Whenever a call to poi URI is made, the middleware poi.js will handle the request


/* Handle poi module */
var user = require('./modules/user'); // Load the js file
app.use('/user', user); // Whenever a call to poi URI is made, the middleware poi.js will handle the request


/* Not sure if we need this */
//const cors = require('cors');
//app.use(cors());
//
app.get('/', function (req, res) {
    res.send('Welcome to my page!');
});

app.get('/getCountries', function (req, res) {
    let parser = new xml2js.Parser(); // Creating XML to JSON parser object
    fs.readFile(__dirname + '/countries.xml', function (err, data) {
        parser.parseString(data, function (err, result) {
            res.send(result);
        });
    });
});

app.get('/getCategories', function (req, res) {
    let query = `SELECT * FROM CategoriesTbl`;
    DButilsAzure.execQuery(query).then((result) => {
        res.send(result)
    });
});

app.post('/register', function (req, res) {
    let parser = new xml2js.Parser(); // Creating XML to JSON parser object
    fs.readFile(__dirname + '/countries.xml', function (err, data) {
        parser.parseString(data, function (err, result) {
            let countryArray = result.Countries.Country;
            isCountryInList = false;
            for (let i = 0; i < result.Countries.Country.length; i++) {
                if (data.Country === countryArray[i].Name[0]) {
                    isCountryInList = true;
                    break;
                }
            }
            if (false === isCountryInList)
                return Promise.reject('Supplied country doesn\'t appear in the list of countries');
        })
    });
    DButilsAzure.execQuery("SELECT * FROM UsersTbl WHERE userMailAddress=\'" + data.userMailAddress + "\';")
        .then(function (ans) {
            if (0 < ans.length)
                return Promise.reject('User already exists');
        })
        .then(function () {
            console.log(data.userMailAddress);
            let query = "INSERT INTO UsersTbl (userFirstName,userLastName,userCity,userCountry,userMailAddress,userPassword)" +
                " VALUES (\'" + data.userFirstName + "\',\'" + data.userLastName + "\',\'" + data.userCity + "\',\'" + data.userCountry + "\',\'" + data.userMailAddress + "\',\'" + data.userPassword + "\')";
            DButilsAzure.execQuery(query);
        })
        .then(ans => addUserCategories(data.userMailAddress, data.userCategories))
        .then(ans => addUserQuestions(data.userMailAddress, data.userQuestions, data.userAnswers))
        .then(ans => res.send(true))
        .catch(ans => res.send(ans));
});

function addUserCategories(userMailAddress, userCategoryArray) {

    for (let i = 0; i < userCategoryArray.length; i++) {
        let categoryQuery = `INSERT INTO CategoriesTbl (categoryName) Values ('${userCategoryArray[i]}')`;
        DButilsAzure.execQuery(categoryQuery).catch(err => {
        });
        let query = "INSERT INTO UsersCategoriesTbl (userCategoryFk, userMailAddressFk) Values (\'" + userCategoryArray[i] + "\',\'" + userMailAddress + "\')";
        DButilsAzure.execQuery(query);
    }
    return true;
}

function addUserQuestions(userName, questionsArray, answersArray) {

    for (let i = 0; i < questionsArray.length; i++) {

        let query = "INSERT INTO UserQuestionsTbl (userMailAddressFk, userQuestion, userAnswer) Values (\'" + userName + "\',\'" + questionsArray[i] + "\',\'" + answersArray[i] + "\')";
        DButilsAzure.execQuery(query);
    }
    return true;
}


app.post('/getUserCurrentPassword', function (req, res) {
    let userData = req.body;
    let username = req.userUsername;
    DButilsAzure.execQuery("SELECT userAnswer FROM UserQuestionsTbl where userUsername=\'" + username + "\' AND Question=\'" + userData.Question + "\'")
        .then(function (ans) {
            if (0 == ans.length)
                return Promise.reject('Wrong Username or Question');
            if (ans.userAnswer != userData.userAnswer)
                return Promise.reject('Wrong answer');

            DButilsAzure.execQuery("SELECT userPassword FROM UsersTbl WHERE userUsername=\'" + username + "\'")
                .then(function (ans) {

                    if (ans.length == 0)
                        return Promise.reject('Wrong Username');
                    else
                        res.send(ans.userPassword);
                })
                .catch(err => res.send(err));
        })
        .catch(err => res.send(err));
});

app.post('/getUserQuestion', function (req, res) {
    let username = req.userUsername;
    DButilsAzure.execQuery("SELECT TOP 1 userQuestion FROM UserQuestionsTbl WHERE userUsername=\'" + username + "\'" + " ORDER BY NEWID()")
        .then(function (ans) {
            if (0 == ans.length) {
                return Promise.reject('Wrong Username');
            } else {
                res.send(ans);
            }
        });
});


app.post('/login', function (req, res) {
    let userToCheck = req.body;
    if (!userToCheck) {
        res.send("login failure");
        res.end();
    }
    console.log(req.body.user);
    DButilsAzure.execQuery("SELECT userPassword FROM UsersTbl WHERE userUsername=\'" + req.body.user + "\'")
        .then(function (ans) {
            if (ans.length == 0)
                return Promise.reject('Wrong Username');
            else if (!(ans[0].userPassword == req.body.pass)) {
                return Promise.reject('Wrong Password');
            }

            let userName = {
                userName: req.body.user
            }
            let token = jwt.sign(userName, superSecret, {
                expiresIn: "1d" // expires in 24 hours
            });
            console.log(token);
            // return the information including token as
            JSON
            res.json({
                token: token
            });
            res.end();
        })
        .catch(ans => res.send("" + ans));
});

//--DatabaseConnection-----------------------------------------------------------------------------------------------

const port = 3030;
const poolConfig = {
    min: 2,
    max: 1500,
    log: true,
};

const connectionConfig = {
    userName: 'yagilo@internetprogramming',
    password: 'qwerty123456Q#',
    server: 'internetprogramming.database.windows.net',
    options: {encrypt: true, database: 'myDB'},
};

var pool = new ConnectionPool(poolConfig, connectionConfig);

pool.on('error', function (err) {
    if (err) {
        console.log(err);
        reject(err);
    }
});

//-------------------------------------------------------------------------------------------------------------------


//-------------------------------------------------------------------------------------------------------------------
var server = app.listen(port, function () {
    let port = server.address().port
    console.log("Listening on port '%s'", port);
});
//-------------------------------------------------------------------------------------------------------------------





