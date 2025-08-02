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
        result = snowpark_session.sql(f"SELECT SYSTEM$GET_ALL_REFERENCES('{reference_name}')").collect()
        
        if result and result[0][0]:
            return json.loads(result[0][0])
        else:
            return []
    except Exception as e:
        logging.error(f"Error getting reference IDs for {reference_name}: {e}")
        return []

def query_reference_table(reference_name: str, reference_id: str, query: str) -> list:
    """
    Execute a query on a specific reference table.
    
    Args:
        reference_name: The name of the reference (e.g., 'CONSUMER_TABLE')
        reference_id: The specific ID of the table to query
        query: The SQL query to execute (should be a complete SELECT statement)
        
    Returns:
        List of results from the query
    """
    try:
        snowpark_session = session()
        # Replace any existing FROM clause with our reference
        if "FROM" in query.upper():
            # If query already has FROM, replace everything after FROM
            from_index = query.upper().find("FROM")
            base_query = query[:from_index].strip()
            full_query = f"{base_query} FROM reference('{reference_name}', '{reference_id}')"
        else:
            # If no FROM clause, add it
            full_query = f"{query} FROM reference('{reference_name}', '{reference_id}')"
        
        result = snowpark_session.sql(full_query).collect()
        return result
    except Exception as e:
        logging.error(f"Error querying reference table {reference_name} with ID {reference_id}: {e}")
        raise e

def get_all_reference_tables_info(reference_name: str) -> list:
    """
    Get information about all available reference tables.
    
    Args:
        reference_name: The name of the reference (e.g., 'CONSUMER_TABLE')
        
    Returns:
        List of dictionaries with table information
    """
    reference_ids = get_reference_ids(reference_name)
    tables_info = []
    
    for ref_id in reference_ids:
        try:
            # Get row count
            count_result = query_reference_table(reference_name, ref_id, "SELECT COUNT(*)")
            row_count = count_result[0][0] if count_result else 0
            
            # Get sample data for column info
            sample_result = query_reference_table(reference_name, ref_id, "SELECT * LIMIT 1")
            
            columns = []
            if sample_result:
                columns = list(sample_result[0].asDict().keys())
            
            tables_info.append({
                "reference_id": ref_id,
                "row_count": row_count,
                "columns": columns,
                "accessible": True
            })
            
        except Exception as e:
            tables_info.append({
                "reference_id": ref_id,
                "row_count": 0,
                "columns": [],
                "accessible": False,
                "error": str(e)
            })
    
    return tables_info 