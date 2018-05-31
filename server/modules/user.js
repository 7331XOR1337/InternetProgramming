const superSecret = "InbarYagil";
const express = require('express');
const bodyParser = require('body-parser');
const DButilsAzure = require('./DButils');
const jwt = require('jsonwebtoken');
var router = express.Router();


router.use('/', function (req, res, next) {

    // check header or url parameters or post parameters for token
    let token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, superSecret, function (err, decoded) {
            if (err) {
                return res.json({success: false, message: 'Failed to authenticate token.'});
            } else {
                // if everything is good, save to request for use in other routes
                // get the decoded payload and header
                let decoded = jwt.decode(token, {complete: true});
                req.userUsername = decoded.payload.userName;
                next();
            }
        });

    } else {
        return res.status(403).send({
            status: 403,
            message: 'Error! token not valid'
        });
    }
});


router.get('/getUserNMostPopular', function (req, res) {
    let poi = req.body;
    let query = `SELECT * FROM dbo.PointsOfInterestTbl JOIN PoiOfUsersTbl ON
		 PoiOfUsersTbl.poiIdNameFk = PointsOfInterestTbl.poiName WHERE PoiOfUsersTbl.userMailAddressFk='${req.username}'`;
    DButilsAzure.execQuery(query).then((result) => {
        res.send(result)
    });
});

router.post('/getUserSavedPOI', function (req, res) {
    let user = req.body.username;
    let query = `SELECT poiNameFk FROM PoiOfUsersTbl WHERE userUsernameFk='${user}'`;
    DButilsAzure.execQuery(query).then(function (ans) {
        res.send(ans);
    });
});


router.delete('/deleteUserPoiArray', function (req, res) {
    let userDeletePoiArray = req.body.poiArrayToDelete;
    let username = req.userUsername;

    for (let i = 0; i < userDeletePoiArray.length; i++) {
        let query = "DELETE FROM PoiOfUsersTbl WHERE userUsernameFk=\'" + username + "\'" + "AND poiNameFk=\'" + userDeletePoiArray[i] + "\'";
        DButilsAzure.execQuery(query).catch((result) => {
            res.send(result)
        });
    }
    res.send(200, {"result": true})
});


router.post('/addUserReview', function (req, res) {
    let username = req.userUsername;
    let poiName = req.body.poiName;
    let poiReviewText = req.body.poiReviewText;
    let date = req.body.date;
    let poiReviewRank = req.body.poiReviewRank;

    let query = `INSERT INTO UsersReviewTbl VALUES('${username}', '${poiReviewText}', '${poiName}', '${date}', ${poiReviewRank})`;
    DButilsAzure.execQuery(query).then(res.send(true));
});


router.post('/getUserPoiArray', function (req, res) {
    let username = req.userUsername;
    let query = `SELECT * FROM PointsOfInterestTbl JOIN PoiOfUsersTbl ON PointsOfInterestTbl.poiName=PoiOfUsersTbl.poiNameFk WHERE PoiOfUsersTbl.userUsernameFk='${username}'`;

    DButilsAzure.execQuery(query).then((result) => {
        res.send(result);
    });
});

router.post('/getUserPoiArraySize', function (req, res) {
    let username = req.userUsername;
    let query = `SELECT COUNT(*) AS UserPoiArraySize FROM PointsOfInterestTbl JOIN PoiOfUsersTbl ON PointsOfInterestTbl.poiName=PoiOfUsersTbl.poiNameFk WHERE PoiOfUsersTbl.userUsernameFk='${username}'`;

    DButilsAzure.execQuery(query).then((result) => {
        res.send(result);
    });
});

router.post('/addUserPoi', function (req, res) {
    let username = req.userUsername;
    let poiName = req.body.poiName;

    let checkPoiQuery = `SELECT * FROM PoiOfUsersTbl WHERE userUsernameFk = '${username}' , poiNameFk = '${poiName}'`;
    DButilsAzure.execQuery(checkPoiQuery).then((result) => {
        if (result.length > 0)
            res.send("Poi already exists!");
        else {
            DButilsAzure.execQuery("SELECT MAX(userPoiPriority) FROM PoiOfUsersTbl WHERE userUsernameFk=\'" + username + "\' AND poiNameFk='" + poiName + "' GROUP BY userUsernameFk AND poiNameFk")
                .then(function (priority) {
                    let query = "INSERT INTO PoiOfUsersTbl (userUsernameFk, poiNameFk, userPoiPriority, userSavePoiDate) VALUES (\'" + username + "\',\'" + poiName + "\'" + "," + priority + "," + " GETDATE())";
                    DButilsAzure.execQuery(query)
                        .then(ans => res.send(true))
                        .catch(err => res.send(err));
                })
        }
    })
});


/* Export the module */
module.exports = router;


/* End Of File */
