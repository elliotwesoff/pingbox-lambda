// one time use only!!! take all of the files in the S3 bucket and put everything in
// dynamoDB.

var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

AWS.config.update({ 
    maxRetries: 0,
    region: 'us-east-1'
});

exports.handler = function(event, context) {
    try {
        var params = {
            Bucket: 'pingbox-data-dev'
        };

        s3.listObjects(params, function(err, data) {
            // this function returns a max of 1000 objects in the bucket.

            if (!err) {
                var objects = data.Contents;

                for (var i in objects) {
                    var object = objects[i];

                    // get the item from S3, put the data in dynamoDB.
                }

            } else { 
                throw "Error listing objects: " + err;
            }

            context.succeed();
        });


    } catch(error) {
        console.log(error.message);
        context.fail(error);
    }
};
