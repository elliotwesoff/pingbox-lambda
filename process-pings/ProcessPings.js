var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({ apiVersion: "2012-08-10" })
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var srcBucket, srcKey, jsonData, testCaseId, reportDate, time, hostStats, globalContext;

AWS.config.update({ 
    maxRetries: 5,
    region: 'us-east-1'
});

exports.handler = function(event, context) {
    globalContext = context;

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
            setTimeout(function() { globalContext.fail(e) }, 3000);
        }
    });
};

function writeItem(options) {
    // write an item to the database as specified by the 'tableName' option.

    if (!options['tableName'] || !options['object']) throw 'Insufficient parameters provided for database write.';

    var params = {
        TableName: options['tableName'],
        Item: options['object']
    };

    dynamodbDoc.put(params, function(err, data) {
        if (!err) console.log('Successfully wrote to the ' + options['tableName'] + ' table.');
        else      throw "An error occurred writing to the database: " + err.toString();
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
        else     console.log("Deleted data file from source bucket\n: " + srcBucket + "/" + srcKey);
    });
}

