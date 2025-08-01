CREATE APPLICATION ROLE IF NOT EXISTS app_user;
CREATE SCHEMA IF NOT EXISTS core;
GRANT USAGE ON SCHEMA core TO APPLICATION ROLE app_user;

-- Create feedback history table for storing customer feedback and analysis results
CREATE TABLE IF NOT EXISTS core.feedback_history (
    id NUMBER AUTOINCREMENT,
    customer_feedback STRING,
    sentiment STRING,
    summary STRING,
    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Grant permissions on feedback history table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.feedback_history TO APPLICATION ROLE app_user;

-- Configuration callback function for reference
CREATE OR REPLACE PROCEDURE core.get_config_for_ref(ref_name STRING)
  RETURNS STRING
  LANGUAGE SQL
AS
$$
BEGIN
  CASE (ref_name)
    WHEN 'OPENAI_EXTERNAL_ACCESS' THEN
      RETURN '{
        "type": "CONFIGURATION",
        "payload": {
          "host_ports": ["api.openai.com"],
          "allowed_secrets": "LIST",
          "secret_references": ["OPENAI_SECRET"]
        }
      }';
    WHEN 'OPENAI_SECRET' THEN 
      RETURN '{
        "type": "CONFIGURATION",
        "payload": {
          "type": "GENERIC_STRING"
        }
      }';
  END CASE;
  RETURN '';
END;
$$;

-- Register reference callback
CREATE OR REPLACE PROCEDURE core.register_reference(ref_name STRING, operation STRING, ref_or_alias STRING)
  RETURNS STRING
  LANGUAGE SQL
  AS $$
    BEGIN
      CASE (operation)
        WHEN 'ADD' THEN
          SELECT SYSTEM$SET_REFERENCE(:ref_name, :ref_or_alias);
        WHEN 'REMOVE' THEN
          SELECT SYSTEM$REMOVE_REFERENCE(:ref_name, :ref_or_alias);
        WHEN 'CLEAR' THEN
          SELECT SYSTEM$REMOVE_ALL_REFERENCES(:ref_name);
      ELSE
        RETURN 'unknown operation: ' || operation;
      END CASE;
      RETURN NULL;
    END;
  $$;

-- Register multi-valued reference callback
CREATE OR REPLACE PROCEDURE core.register_multi_reference(ref_name STRING, operation STRING, ref_or_alias STRING)
RETURNS STRING
LANGUAGE SQL
AS $$
BEGIN
    CASE (operation)
        WHEN 'ADD' THEN
            SELECT SYSTEM$ADD_REFERENCE(:ref_name, :ref_or_alias);
        WHEN 'REMOVE' THEN
            SELECT SYSTEM$REMOVE_REFERENCE(:ref_name, :ref_or_alias);
        WHEN 'CLEAR' THEN
            SELECT SYSTEM$REMOVE_ALL_REFERENCES(:ref_name);
        ELSE
            RETURN 'unknown operation: ' || operation;
    END CASE;
      RETURN NULL;
    END;
  $$;

-- When you click the activate button --
CREATE OR REPLACE PROCEDURE core.start_app(privileges ARRAY)
  RETURNS STRING
  LANGUAGE SQL
AS $$
BEGIN
   CREATE WAREHOUSE IF NOT EXISTS poc_napp_app_wh
       WAREHOUSE_SIZE = 'XSMALL'
       AUTO_SUSPEND = 60
       AUTO_RESUME = TRUE;
   
   CREATE COMPUTE POOL IF NOT EXISTS poc_napp_app_pool
       FOR APPLICATION poc_napp_consumer_app
       MIN_NODES = 1
       MAX_NODES = 1
       INSTANCE_FAMILY = 'cpu_x64_s'
       AUTO_RESUME = TRUE;
   
   CREATE SERVICE IF NOT EXISTS poc_napp_app_service
    IN COMPUTE POOL poc_napp_app_pool
    FROM SPECIFICATION_FILE = 'service_spec.yaml'
    QUERY_WAREHOUSE = poc_napp_app_wh
    EXTERNAL_ACCESS_INTEGRATIONS = (reference('OPENAI_EXTERNAL_ACCESS'));
   
   GRANT SERVICE ROLE poc_napp_app_service!ALL_ENDPOINTS_USAGE TO APPLICATION ROLE app_user;
   GRANT USAGE ON WAREHOUSE poc_napp_app_wh TO APPLICATION ROLE app_user;
   RETURN 'DONE';
END;
$$;

GRANT USAGE ON PROCEDURE core.start_app(ARRAY) TO APPLICATION ROLE app_user;
GRANT USAGE ON PROCEDURE core.get_config_for_ref(STRING) TO APPLICATION ROLE app_user;
GRANT USAGE ON PROCEDURE core.register_reference(STRING, STRING, STRING) TO APPLICATION ROLE app_user;
GRANT USAGE ON PROCEDURE core.register_multi_reference(STRING, STRING, STRING) TO APPLICATION ROLE app_user;