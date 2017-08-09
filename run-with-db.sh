#!/bin/bash

CONCURRENTLY=./node_modules/.bin/concurrently

if [ ! -d "./mongodb-data" ]; then
  mkdir ./mongodb-data
fi
$CONCURRENTLY \
  -k \
  -p name -n mongodb,$1 \
  -c blue.bgBlack,green.bgBlack \
  "mongod --dbpath ./mongodb-data" "npm run $1"
