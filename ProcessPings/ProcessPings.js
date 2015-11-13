// take the file that was just uploaded to our S3 bucket by a pingbox and
// process the data.  for now we only have stats and pings to cache.
// pings will go into a table called CachedPing.  host stats will be
// placed in a table called HostStat.

var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({ apiVersion: "2012-08-10" })
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var jsonData, testCaseId, reportDate, time, hostStats;

// don't retry if failed.  not in dev at least...
AWS.config.update({ maxRetries: 0 });

exports.handler = function(event, context) {

    var srcBucket = event.Records[0].s3.bucket.name;
    var srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));  

    // parse data out of the json file in S3.
    s3.getObject({Bucket: srcBucket, Key: srcKey}, function(err, fileData) {
        try {
            if (!err) {

                jsonData    = JSON.parse(fileData.Body.toString());
                testCaseId  = jsonData['test_case_id'];
                time        = jsonData['ping_day'];
                reportDate  = formattedDate(new Date(time));
                hostStats = jsonData['host_stats'];

                // update host stats.
                updateStats();

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

function updateStats() {
    for (var i in hostStats) {
        var host = hostStats[i];
        var packetLoss = host['packet_loss'];
        var totalPings = host['total_pings'];

        var data = {
            "TestCaseId" : { "S" : testCaseId.toString() },
            "ReportDate" : { "S" : reportDate }
        };

        writeItem({ tableName: "HostStat", object: data })
    }
}


function writeItem(options) {
    // write an item to the database as specified by the 'tableName' option.
    
    console.log('writing to table: ' + options['tableName']);
    console.log('data: ' + options['object']);

    if (!options['tableName'] || !options['object']) throw 'Insufficient parameters provided for database write.';

    var params = {
        TableName: options['tableName'],
        Item: options['object']
    };

    dynamodb.putItem(params, function(err, data) {
        if (!err) {
            console.log('Successfully wrote data to the ' + options['tableName'] + ' table:');
            console.log(data);
        } else {
            throw "An error occurred writing to the database: " + err.toString();
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

function cachePings() {
    //var params = {
        //TableName: "CachedPing",
        //Key: {
            //"TestCaseId": testCaseId,
            //"ReportDate": reportDate
        //},

        //UpdateExpression: "SET " + time.toString() + " = :data",
        //ExpressionAttributeValues: { 
            //":data": data
        //},
        //ReturnValues: "ALL_NEW"
    //};

    //dynamodb.updateItem(params, function(err, data) {
        //if (err)
            //console.log(JSON.stringify(err, null, 2));
        //else
            //console.log(JSON.stringify(data, null, 2));
    //});

}
