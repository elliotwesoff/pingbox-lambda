require 'fileutils'
require 'aws-sdk'

file_name = 'ProcessPingsDev.zip'

### remove the old zip file if there is one.
if File.exists?(file_name)
  FileUtils.rm(file_name) 
  puts "Removed #{file_name}"
end

### create the new zip file.
puts `zip -9 ProcessPingsDev.zip ProcessPingsDev.js`

### initialize our S3 client and use it to upload our file to
###  our code-repo bucket, pingbox-lambda.

aws_key, secret = ENV['ec2_access_key_id'], ENV['ec2_secret_access_key']

Aws.config.update({
  region: 'us-east-1', 
  credentials: Aws::Credentials.new(aws_key, secret)
})

bucket_name = 'pingbox-lambda'

aws_lambda = Aws::Lambda::Client.new(region: Aws.config[:region], credentials: Aws.config[:credentials])
client = Aws::S3::Client.new(region: Aws.config[:region], credentials: Aws.config[:credentials])
bucket = Aws::S3::Bucket.new(bucket_name, client, region: Aws.config[:region])
obj = Aws::S3::Object.new(bucket_name, file_name, client: client)

obj.upload_file("#{Dir.pwd}/#{file_name}")
puts "\nUploaded code to S3 bucket: #{bucket.name}"

### clean up...
FileUtils.rm(file_name)

### update the source of the lambda function.  
### this tells the function to read the code we just uploaded.
puts "Updating lambda source..."

aws_lambda.update_function_code(
  function_name: "ProcessPingsDev",
  s3_bucket: bucket_name,
  s3_key: file_name
)

puts "done!\n\n"

