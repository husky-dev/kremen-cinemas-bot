#! /bin/bash

cd lambda/kremen-cinema-galaktika
zip -r -X -q lambda.zip .
aws lambda update-function-code \
  --function-name kremen-cinema-galaktika \
  --publish \
  --zip-file fileb://lambda.zip
rm -rf lambda.zip
cd ../..
