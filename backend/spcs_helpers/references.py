import json
import logging
from .connection import session

def get_reference_ids(reference_name: str) -> list:
    """
    Get all available reference IDs for a multi-valued reference.
    
    Args:
        reference_name: The name of the reference (e.g., 'CONSUMER_TABLE')
        
    Returns:
        List of reference IDs that can be used to access individual tables
    """
    try:
        snowpark_session = session()
        
        # SYSTEM$GET_ALL_REFERENCES returns a JSON string containing an array of reference IDs
        # Examples of what Snowflake returns:
        # - Single table: '["16642610-c554-48ef-8392-dcd3cac56486"]'
        # - Multiple tables: '["16642610-c554-48ef-8392-dcd3cac56486", "4608a6c3-0577-4f58-a409-5409bc728fd8"]'
        # - No tables: '[]'
        result = snowpark_session.sql(f"SELECT SYSTEM$GET_ALL_REFERENCES('{reference_name}')").collect()
        
        # result[0][0] contains the JSON string from Snowflake
        # We need to parse it to convert from string to Python list
        if result and result[0][0]:
            # json.loads() converts: '["id1", "id2"]' → ["id1", "id2"]
            return json.loads(result[0][0])
        else:
            return []
    except Exception as e:
        logging.error(f"Error getting reference IDs for {reference_name}: {e}")
        return [] 