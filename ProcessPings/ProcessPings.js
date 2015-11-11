// take the file that was just uploaded to our S3 bucket by a pingbox and
// process the data.  for now we only have stats and pings to cache.
// pings will go into a table called CachedPing.  host stats will be
// placed in a table called HostStat.

var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({ apiVersion: "2012-08-10" })
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var testCaseId, reportDate, time;


exports.handler = function(event, context) {

    var srcBucket = event.Records[0].s3.bucket.name;
    var srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));  

    s3.getObject({Bucket: srcBucket, Key: srcKey}, function(err, data) {
        if (!err) {
            var jsonData = JSON.parse(data.Body.toString());

            testCaseId  = jsonData['test_case_id'];
            time        = jsonData['report_date'];
            reportDate  = formattedDate(new Date(time));

            // add items to the cached ping table.
            
            
            // update host stats.
            
            var params = {
                TableName: "PingDay",
                Key: {
                    "TestCaseId": testCaseId,
                    "ReportDate": reportDate
                },

                UpdateExpression: "SET " + time.toString() + " = :data",
                ExpressionAttributeValues: { 
                    ":data": data
                },
                ReturnValues: "ALL_NEW"
            };


            dynamodb.updateItem(params, function(err, data) {
                if (err)
                    console.log(JSON.stringify(err, null, 2));
                else
                    console.log(JSON.stringify(data, null, 2));
            });


            context.succeed();
        } else {
            console.log("Error getting object " + srcKey + " from bucket " + srcBucket +
                    ". Make sure they exist and your bucket is in the same region as this function.");
            context.fail ("Error getting file: " + err)      
        }
    });
};

function cachePings(data) {
}

function formattedDate(date) {
    try {

        if (! date) date = new Date();
        var m_names = new Array("01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12");
        var curr_date = date.getDate();
        var curr_month = m_names[date.getMonth()];
        var curr_year = date.getFullYear();
        if (curr_date < 10) curr_date = "0" + curr_date;
        return curr_year + "-" + curr_month + "-" + curr_date;

    } catch(err) {
        console.log("the submitted date format was incorrect.");
        return false;
    }
}
