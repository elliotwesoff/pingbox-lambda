// take the file that was just uploaded to our S3 bucket by a pingbox and
// process the data.  for now we only have stats and pings to cache.
// pings will go into a table called CachedPing.  host stats will be
// placed in a table called HostStat.

var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({ apiVersion: "2012-08-10" })
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var async = require('async');
var srcBucket, srcKey, jsonData, testCaseId, reportDate, time, hostStats;

// set up configuration...
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

                jsonData    = JSON.parse(fileData.Body.toString());
                testCaseId  = jsonData['test_case_id'];
                time        = jsonData['ping_day'];
                reportDate  = formattedDate(new Date(time));
                hostStats = jsonData['host_stats'];

                console.log('hihihihihihihihi');
                // update host stats.
                //updateStats();

                // add items to the cached ping table.
                //cachePings();

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
    console.log('data: ' + options['object']);

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

function getItem(options) {
    // retrieve an item from the database.
    
    if (!options['tableName'] || !options['object']) throw 'Insufficient parameters provided for database read.';

    var params = {
        TableName: options['tableName'],
        Key: options['object']
    };

    dynamodbDoc.get(params, function(err, data) {
        if (!err) {
            console.log('Retrieved item from ' + options['tableName'] + ' table:');
            console.log(data);
            return data.Body;
        } else {
            throw "An error occurred reading from the database: " + err.toString();
        }
    });
}

function formattedDate(input) {
    try {

        var date = input ? new Date(input) : new Date();
        var m_names = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
        var curr_date = date.getDate();
        var curr_month = m_names[date.getMonth()];
        var curr_year = date.getFullYear();
        if (curr_date < 10) curr_date = "0" + curr_date;
        return curr_year + "-" + curr_month + "-" + curr_date;

    } catch(err) {
        throw "the submitted date format was incorrect --- " + err.message;
    }
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

//function cachePings() {
//}
