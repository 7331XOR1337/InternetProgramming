const express = require('express');
const bodyParser = require('body-parser');
const DButilsAzure = require('./DButils');
const morgan = require('morgan');
var router = express.Router();


router.get('/getAvgRankOfPoi/:poiName', function (req, res) { /* Not finished */
    let poiName = req.params.poiName;

    for (let i = 0; i < userAddPoiArray; i++) {
        let query = "INSERT INTO PoiOfUsersTbl (userMailAddressFk, poiIdNameFk) Values (\'" + params.userName + "\',\'" + userAddPoiArray[i] + "\')";
        DButilsAzure.execQuery(query).catch(res.send(false));
    }
    res.send(true);
});

router.put('/setPoiAvgRank', function (req, res) {
    let poiName = req.body.poiName;
    let query = `SELECT AVG(userRank) as AVG FROM UsersReviewTbl Where poiNameFk = '${poiName}'`;

    DButilsAzure.execQuery(query).then((result) => {
        UpdateQquery = `UPDATE PointsOfInterestTbl SET poiRank = '${result[0].AVG}' WHERE poiName = '${poiName}'`;
        DButilsAzure.execQuery(UpdateQquery).then((result) => {
            res.send(true);
        })
    })
});

router.get('/poiReviews/:poiName', function (req, res) {
    let poiName = req.params.poiName;
    let query = `SELECT userReview FROM UsersReviewTbl WHERE poiNameFk='${poiName}'`;

    DButilsAzure.execQuery(query).then((result) => {

        res.send(result);
    });
});


router.get('/GetLastTwoSavedPointOfView', function (req, res) {
    let user = req.body;
    let query = "SELECT TOP (2) FROM UsersPointOfInterest WHERE Username=\'" + user.userName + "\'";
    DButilsAzure.execQuery(query).then(function (ans) {
        res.send(ans);
    });
});


/********************************************************/

router.get('/getPoiImage/:poiName', function (req, res) {
    let reqPoiName = req.params.poiName;
    let query = `SELECT poiImage FROM PointsOfInterestTbl WHERE poiName='${reqPoiName}'`;
    DButilsAzure.execQuery(query).then((result) => {
        res.send(result)
    });
});

router.get('/getPoiArrByCat/:categoryName', function (req, res) {
    let categoryName = req.params.categoryName;
    let query = `SELECT poiNameFk FROM PoiCategoriesTbl WHERE categoryNameFk='${categoryName}'`;
    DButilsAzure.execQuery(query).then((result) => {
        res.send(result)
    });
});

router.get('/getCategories/', function (req, res) {
    let query = `SELECT DISTINCT categoryNameFk FROM PoiCategoriesTbl`;
    DButilsAzure.execQuery(query).then((result) => {
        res.send(result)
    });
});

router.get('/:poiName', function (req, res) {
    let poiName = req.params.poiName;
    let query = `SELECT * FROM dbo.PointsOfInterestTbl WHERE poiName='${poiName}'`;
    DButilsAzure.execQuery(query).then((result) => {
        res.send(result)
    });
});

router.get('/', function (req, res) {
    let query = `SELECT poiName FROM PointsOfInterestTbl`;
    DButilsAzure.execQuery(query).then((result) => {
        res.send(result)
    });
});


/* Export the module */
module.exports = router;


/* End Of File */
