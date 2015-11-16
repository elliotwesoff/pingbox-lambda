// one time use only!!! take all of the files in the S3 bucket and put everything in
// dynamoDB.

var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({ apiVersion: "2012-08-10" })
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var srcBucket, srcKey, jsonData, testCaseId, reportDate, time, hostStats;

AWS.config.update({ 
    maxRetries: 0,
    region: 'us-east-1'
});

exports.handler = function(event, context) {
    try {
        srcBucket = event.Records[0].s3.bucket.name;
        srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));  

        s3.listObjects(params, function(err, data) {
            if (err) throw "Error listing objects: " + err;
            else     console.log(data);
        }

    } catch(error) {
        console.log(error.message);
        context.fail(error);
    }
}
