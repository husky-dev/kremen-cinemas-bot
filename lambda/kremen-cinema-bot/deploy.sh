#! /bin/bash

zip -r -X -q lambda.zip . -x 'deploy.sh' -x '*.DS_Store' -x '*.git*' -x '*yarn.lock' -x '*.env' -x '*event.json' -x '*context.json'
aws lambda update-function-code \
  --function-name kremen-cinema-bot-dev \
  --publish \
  --zip-file fileb://lambda.zip
rm -rf lambda.zip
