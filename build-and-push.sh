#!/bin/bash

DB_NAME="poc_napp_db"
SCHEMA_NAME="schema"
IMAGE_REPO_NAME="image_repo"
SNOWFLAKE_USER="henry"

IMAGE_REPO_URL=$(snow spcs image-repository url $IMAGE_REPO_NAME --database $DB_NAME --schema $SCHEMA_NAME)

# Login
# docker login $IMAGE_REPO_URL -u $SNOWFLAKE_USER

# Build and push frontend
cd frontend/poc-napp
docker build --platform linux/amd64 -t frontend .
docker tag frontend $IMAGE_REPO_URL/frontend
docker push $IMAGE_REPO_URL/frontend
cd ../..

# Build and push backend
cd backend
docker build --platform linux/amd64 -t backend .
docker tag backend $IMAGE_REPO_URL/backend
docker push $IMAGE_REPO_URL/backend