import json
import logging
from .connection import session

def get_reference_details(reference_name: str) -> list:
    """
    Get detailed information about all references including table names, database, and schema.
    
    Args:
        reference_name: The name of the reference (e.g., 'CONSUMER_TABLE')
        
    Returns:
        List of dictionaries containing reference details with keys:
        - alias: The system-generated alias for the reference (this is the reference ID)
        - database: The parent database name of the consumer object
        - schema: The parent schema of the consumer object  
        - name: The name of the consumer object (table name)
    """
    try:
        snowpark_session = session()
        
        # SYSTEM$GET_ALL_REFERENCES with include_details=True returns a JSON object
        # containing an array of objects with alias, database, schema, and name
        result = snowpark_session.sql(f"SELECT SYSTEM$GET_ALL_REFERENCES('{reference_name}', TRUE)").collect()
        
        if result and result[0][0]:
            # Parse the JSON string to get the array of reference details
            reference_details = json.loads(result[0][0])
            
            # Convert to list of dictionaries if it's not already
            if isinstance(reference_details, list):
                return reference_details
            else:
                return []
        else:
            return []
    except Exception as e:
        logging.error(f"Error getting reference details for {reference_name}: {e}")
        return []

def get_reference_ids(reference_name: str) -> list:
    """
    Get all available reference IDs for a multi-valued reference.
    This is now a convenience function that extracts IDs from the detailed results.
    
    Args:
        reference_name: The name of the reference (e.g., 'CONSUMER_TABLE')
        
    Returns:
        List of reference IDs that can be used to access individual tables
    """
    try:
        # Get all details and extract just the IDs
        details = get_reference_details(reference_name)
        return [ref['alias'] for ref in details]
    except Exception as e:
        logging.error(f"Error getting reference IDs for {reference_name}: {e}")
        return [] 