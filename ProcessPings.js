var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({ apiVersion: "2012-08-10" })
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var async = require('async');
var srcBucket, srcKey, jsonData, testCaseId, reportDate, time, hostStats;

AWS.config.update({ 
    maxRetries: 0,
    region: 'us-east-1'
});

exports.handler = function(event, context) {

    srcBucket = event.Records[0].s3.bucket.name;
    srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));  

    // parse data out of the json file in S3.
    s3.getObject({Bucket: srcBucket, Key: srcKey}, function(err, fileData) {
        try {
            if (!err) {
                var jsonData = JSON.parse(fileData.Body.toString());

                var dbItem = {
                    "TestCaseId" : jsonData['test_case_id'],
                    "Time"       : jsonData['ping_day'],
                    "HostStats"  : jsonData['host_stats']
                };

                // shove our data right into the database. GIT IN THERE!!!
                writeItem({ tableName: 'PingData', object: dbItem });

                // remove the file from S3.
                deleteFile();

                context.succeed();

            } else {
                 throw("Error getting object " + srcKey + " from bucket " + srcBucket +
                        ". Make sure they exist and your bucket is in the same region as this function.");
            }
        } catch (e) {
            console.log(e.message);
            context.fail(e);
        }
    });
};

function writeItem(options) {
    // write an item to the database as specified by the 'tableName' option.
    
    console.log('writing to table: ' + options['tableName']);
    console.log('data: ' + options['object'].toString());

    if (!options['tableName'] || !options['object']) throw 'Insufficient parameters provided for database write.';

    var params = {
        TableName: options['tableName'],
        Item: options['object']
    };

    dynamodbDoc.put(params, function(err, data) {
        if (!err) {
            console.log('Successfully wrote data to the ' + options['tableName'] + ' table:');
            console.log(data);
        } else {
            throw "An error occurred writing to the database: " + err.toString();
        }
    });
}

function deleteFile() {
    // remove the file from our S3 data bucket.
    
    var params = {
        Bucket: srcBucket,
        Key:    srcKey
    };

    s3.deleteObject(params, function(err, data) {
        if (err) throw "Error deleting object from S3: " + err.toString();
        else     console.log("Deleted data file from source bucket: " + srcBucket + "/" + srcKey);
    });
}

//function updateStats() {
    //// first, we must look for a report date that already exists for
    //// this test case. if it doesn't exist, create it.  if it exists,
    //// update our reply stats with what he have received in this current file.

    //var data = {
        //"TestCaseId" : testCaseId.toString(),
        //"ReportDate" : reportDate
    //};

    //async.waterfall([
            //function queryDatabase(next) {
                ////var dbHostStats = getItem({ tableName: "HostStat", object: data });
                //dynamodbDoc.get(params, function(err, data) {
                    //if (!err) {
                        //console.log('Retrieved item from ' + options['tableName'] + ' table:');
                        //console.log(data);
                        //next(data.Body);
                    //} else {
                        //throw "An error occurred writing to the database: " + err.toString();
                    //}
                //});
                //next(null, dbHostStats);
            //}, 

            //function processData(dbHostStats, next) {

                //console.log('REALITY CHECK:');
                //console.log(dbHostStats);

                //for (var i in hostStats) {
                    //// organize our data so each host appears as a 'column' in the database.
                    //var host = hostStats[i];
                    //delete host.total_failed_pings;
                    //delete host.total_successful_pings;

                    //data[host.host_name] = host;
                //}

                //// check to see if the object already exists in the database.
                //if (Object.keys(dbHostStats).length > 0) {

                    //// update the stats with what we've received in the file.
                    //for (var i in dbHostStats.Item) {
                        //var host = dbHostStats.Item[i];
                        //var hostData = Object.keys(a)[0];
                        //host['total_pings'] += data[hostData['host_name']]['total_pings'];
                        //host['packet_loss'] += data[hostData['host_name']]['packet_loss'];
                    //}

                    //writeItem({ tableName: "HostStat", object: dbHostStats.Item })
                //} else {
                    //// create a new record.
                    //writeItem({ tableName: "HostStat", object: data })
                //}
            //}
    //], function(err) {
        //if (err) throw err;
        //else console.log('Stats updating operation completed successfully.');
    //});
//}

//function getItem(options) {
    //// retrieve an item from the database.
    
    //if (!options['tableName'] || !options['object']) throw 'Insufficient parameters provided for database read.';

    //var params = {
        //TableName: options['tableName'],
        //Key: options['object']
    //};

    //dynamodbDoc.get(params, function(err, data) {
        //if (!err) {
            //console.log('Retrieved item from ' + options['tableName'] + ' table:');
            //console.log(data);
            //return data.Body;
        //} else {
            //throw "An error occurred reading from the database: " + err.toString();
        //}
    //});
//}
