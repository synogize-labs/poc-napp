USE ROLE ACCOUNTADMIN;

-- Warehouse
CREATE WAREHOUSE IF NOT EXISTS poc_napp_wh
    WITH WAREHOUSE_SIZE = 'X-SMALL'
    AUTO_SUSPEND = 60
    AUTO_RESUME = true;

-- Database
CREATE DATABASE IF NOT EXISTS poc_napp_db;

-- Schema
CREATE SCHEMA IF NOT EXISTS poc_napp_db.schema;

-- Stage
CREATE STAGE IF NOT EXISTS poc_napp_db.schema.stage
    directory = (enable = true);

-- Docker image repo.
CREATE IMAGE REPOSITORY IF NOT EXISTS poc_napp_db.schema.image_repo;

-- Tell us where to upload our docker image to. This will be used later.
SHOW IMAGE REPOSITORIES;

-- Build and Package Application into Native App
USE ROLE ACCOUNTADMIN;

-- Create the package.
CREATE APPLICATION PACKAGE IF NOT EXISTS poc_napp_provider_package;

-- Copy our native app code and docker image over to the package.
ALTER APPLICATION PACKAGE poc_napp_provider_package ADD VERSION v1 USING @poc_napp_db.schema.stage;

-- Install the native app into "consumer" account.
CREATE APPLICATION IF NOT EXISTS poc_napp_consumer_app FROM APPLICATION PACKAGE poc_napp_provider_package USING VERSION v1;



-- Drop the application (ONLY RUN TO UNINSTALL THE NATIVE APP FROM THE CONSUMER ACCOUNT)
DROP APPLICATION IF EXISTS poc_napp_consumer_app CASCADE;
DROP APPLICATION PACKAGE IF EXISTS poc_napp_provider_package CASCADE;


ALTER APPLICATION poc_napp_consumer_app SET DEBUG_MODE = TRUE;

DESC APPLICATION poc_napp_consumer_app;