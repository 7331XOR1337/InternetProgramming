    const ConnectionPool = require('tedious-connection-pool');
    const Request = require('tedious').Request;
    const TYPES = require('tedious').TYPES;

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

    //create the pool
    var pool = new ConnectionPool(poolConfig, connectionConfig)

    pool.on('error', function (err) {
        if (err) {
            console.log(err);
            reject(err);
        }
    });
    console.log('pool connection on');


    //----------------------------------------------------------------------------------------------------------------------
    exports.execQuery = function (query) {
        return new Promise(function (resolve, reject) {

            try {

                let ans = [];
                let properties = [];

                //acquire a connection
                pool.acquire(function (err, connection) {
                    if (err) {
                        console.log('acquire ' + err);
                        reject(err);
                    }
                    console.log('connection on');

                    var dbReq = new Request(query, function (err, rowCount) {
                        if (err) {
                            console.log('Request ' + err);
                            reject(err);
                        }
                    });

                    dbReq.on('columnMetadata', function (columns) {
                        columns.forEach(function (column) {
                            if (column.colName != null)
                                properties.push(column.colName);
                        });
                    });
                    dbReq.on('row', function (row) {
                        let item = {};
                        for (i = 0; i < row.length; i++) {
                            item[properties[i]] = row[i].value;
                        }
                        ans.push(item);
                    });

                    dbReq.on('requestCompleted', function () {
                        console.log('request Completed: ' + dbReq.rowCount + ' row(s) returned');
                        console.log(ans);
                        connection.release();
                        resolve(ans);

                    });
                    connection.execSql(dbReq);

                });
            }
            catch (err) {
                reject(err)
            }
        });

    };
