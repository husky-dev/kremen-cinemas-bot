#! /bin/bash

cd cinema-kremen-galaktika
zip -r -X -q lambda.zip .
# aws lambda update-function-code \
#   --publish \
#   --function-name cinema-kremen-galaktika \
#   --zip-file fileb://cinema-kremen-galaktika/lambda.zip
aws lambda update-function-code \
  --function-name cinema-kremen-galaktika \
  --zip-file fileb://lambda.zip
rm -rf lambda.zip
cd ..
