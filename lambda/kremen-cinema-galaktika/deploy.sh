#! /bin/bash

echo "[+]: installing dependencies"
yanr install
echo "[+]: compiling"
yarn dist
echo "[+]: removing unneded modules"
yarn install --production
echo "[+]: creating zip"
zip -r -X -q lambda.zip . \
  -x 'deploy.sh' \
  -x '*.DS_Store' \
  -x '*src*' \
  -x '*.git*' \
  -x '*yarn.lock' \
  -x '*.env' \
  -x '*event.json' \
  -x '*context.json' \
  -x '*tslint.json' \
  -x '*tsconfig.json'
echo "[+]: deploying"
aws lambda update-function-code \
  --function-name kremen-cinema-galaktika-dev \
  --publish \
  --zip-file fileb://lambda.zip
echo "[+]: clearing"
rm -rf lambda.zip
echo "[+]: instaling needed modules"
yarn install
echo "[+]: done"
