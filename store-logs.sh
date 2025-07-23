#!/bin/bash

# Get current timestamp for folder name
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Create a new subfolder under temp/logs with the timestamp
LOG_DIR="temp/logs/${TIMESTAMP}"
mkdir -p "$LOG_DIR"

# Store frontend logs
snow spcs service logs poc_napp_app_service --container-name frontend --instance-id 0 --database POC_NAPP_CONSUMER_APP --schema CORE > "$LOG_DIR/frontend.txt"

# Store backend logs
snow spcs service logs poc_napp_app_service --container-name backend --instance-id 0 --database POC_NAPP_CONSUMER_APP --schema CORE > "$LOG_DIR/backend.txt"

# Store router logs
snow spcs service logs poc_napp_app_service --container-name router --instance-id 0 --database POC_NAPP_CONSUMER_APP --schema CORE > "$LOG_DIR/router.txt" 