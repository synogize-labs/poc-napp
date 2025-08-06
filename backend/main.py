from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
import logging
from spcs_helpers import session, get_reference_ids, get_reference_details

# Log messages at INFO level and above (for debugging)
logging.basicConfig(level=logging.INFO)

load_dotenv()

app = FastAPI(title="Snowflake Native App POC", version="1.0.0")
class FeedbackRequest(BaseModel):
    text: str

class FeedbackResponse(BaseModel):
    original_text: str
    sentiment: str
    summary: str

@app.get("/")
async def root():
    return {"message": "Snowflake Native App POC - Feedback Analyzer API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "feedback-analyzer"}

@app.get("/test-db-connection")
async def test_db_connection():
    try:
        snowpark_session = session()
        
        # Simple test query to verify connection
        result = snowpark_session.sql("SELECT CURRENT_USER(), CURRENT_ROLE()").collect()
        
        if result and len(result) > 0:
            user, role = result[0]
            
            # Get available tables from current schema
            tables_result = snowpark_session.sql("SHOW TABLES").collect()
            tables = []
            
            for table_row in tables_result:
                table_name = table_row[1]  # Table name is in the second column
                schema_name = table_row[2]  # Schema name is in the third column
                
                # Skip tables that might cause permission issues
                if table_name.upper() == "FEEDBACK_HISTORY" and schema_name.upper() != "CORE":
                    # Skip feedback_history tables that aren't in the core schema
                    continue
                
                # Get columns for this table
                try:
                    columns_result = snowpark_session.sql(f"DESCRIBE TABLE {schema_name}.{table_name}").collect()
                    columns = []
                    for col_row in columns_result:
                        if col_row[0] and not col_row[0].startswith('#'):  # Skip comments
                            columns.append({
                                "name": col_row[0],
                                "type": col_row[1],
                                "nullable": col_row[2] if len(col_row) > 2 else "YES"
                            })
                    
                    tables.append({
                        "name": table_name,
                        "schema": schema_name,
                        "columns": columns
                    })
                except Exception as col_error:
                    # If we can't get columns, just add the table without columns
                    tables.append({
                        "name": table_name,
                        "schema": schema_name,
                        "columns": [],
                        "column_error": str(col_error)
                    })
            
            # Also check for feedback history table in core schema
            try:
                feedback_history_check = snowpark_session.sql("SELECT COUNT(*) FROM core.feedback_history").collect()
                if feedback_history_check:
                    # Get columns for feedback history table
                    try:
                        columns_result = snowpark_session.sql("DESCRIBE TABLE core.feedback_history").collect()
                        columns = []
                        for col_row in columns_result:
                            if col_row[0] and not col_row[0].startswith('#'):  # Skip comments
                                columns.append({
                                    "name": col_row[0],
                                    "type": col_row[1],
                                    "nullable": col_row[2] if len(col_row) > 2 else "YES"
                                })
                        
                        tables.append({
                            "name": "feedback_history",
                            "schema": "core",
                            "columns": columns
                        })
                    except Exception as col_error:
                        tables.append({
                            "name": "feedback_history",
                            "schema": "core",
                            "columns": [],
                            "column_error": str(col_error)
                        })
            except Exception as feedback_error:
                # Feedback history table doesn't exist or not accessible
                pass
            
            return {
                "connected": True,
                "message": "Database connection successful",
                "user": user,
                "role": role,
                "tables": tables
            }
        else:
            return {
                "connected": False,
                "message": "Connection test returned no results",
                "user": "",
                "role": "",
                "tables": []
            }
            
    except Exception as e:
        logging.error(f"Database connection test failed: {e}")
        return {
            "connected": False,
            "message": f"Connection failed: {str(e)}",
            "user": "",
            "role": "",
            "tables": []
        }

def get_openai_api_key():
    # Try file first (Snowflake Native App)
    secret_path = "/run/secrets/openai/secret_string"
    if os.path.exists(secret_path):
        with open(secret_path, "r") as f:
            return f.read().strip()
    # Fallback to env var (for local/dev)
    api_key = os.getenv("OPENAI_API_KEY")
    return api_key

@app.post("/analyze-feedback", response_model=FeedbackResponse)
async def analyze_feedback(request: FeedbackRequest):
    try:
        api_key = get_openai_api_key()
        if not api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not found")
        
        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that analyzes customer feedback. Please respond in the following JSON format:\n{\n  \"sentiment\": \"positive/negative/neutral\",\n  \"summary\": \"brief summary of the feedback\",\n  \"suggestions\": [\"suggestion 1\", \"suggestion 2\"]\n}"
                },
                {
                    "role": "user",
                    "content": f"Analyze this customer feedback: {request.text}"
                }
            ],
            max_tokens=300
        )
        
        analysis_text = response.choices[0].message.content
        
        # Try to parse JSON response, fallback to simple analysis if it fails
        try:
            import json
            analysis_data = json.loads(analysis_text)
            sentiment = analysis_data.get("sentiment", "neutral")
            summary = analysis_data.get("summary", analysis_text)
        except json.JSONDecodeError:
            # Fallback: try to extract sentiment from the text
            analysis_lower = analysis_text.lower()
            if any(word in analysis_lower for word in ["positive", "good", "great", "excellent", "love", "like"]):
                sentiment = "positive"
            elif any(word in analysis_lower for word in ["negative", "bad", "poor", "terrible", "hate", "dislike"]):
                sentiment = "negative"
            else:
                sentiment = "neutral"
            summary = analysis_text
        
        # Store the feedback and analysis result
        try:
            snowpark_session = session()
            snowpark_session.sql(f"""
                INSERT INTO core.feedback_history (customer_feedback, sentiment, summary)
                VALUES ('{request.text.replace("'", "''")}', '{sentiment}', '{summary.replace("'", "''")}')
            """).collect()
        except Exception as store_error:
            logging.warning(f"Failed to store feedback history: {store_error}")
            # Continue with the response even if storing fails
        
        return FeedbackResponse(
            original_text=request.text,
            sentiment=sentiment,
            summary=summary
        )
        
    except Exception as e:
        import traceback
        print("Exception in /analyze-feedback:", traceback.format_exc(), flush=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing feedback: {str(e)}")

@app.get("/test-consumer-table")
async def test_consumer_table():
    try:
        snowpark_session = session()
        
        # Get current session info
        session_info = snowpark_session.sql("SELECT CURRENT_USER(), CURRENT_ROLE()").collect()[0]
        
        # Get detailed reference information including table names and IDs
        reference_details = get_reference_details('CONSUMER_TABLE')
        
        # Extract reference IDs from the details
        reference_ids = [ref['alias'] for ref in reference_details]
        
        # Create a mapping of reference IDs to details for easy lookup
        ref_details_map = {ref['alias']: ref for ref in reference_details}
        
        # Unified logic for any number of tables (0, 1, or many)
        tables_info = []
        
        for ref_id in reference_ids:
            try:
                # Get row count using reference system
                count_result = snowpark_session.sql(f"SELECT COUNT(*) FROM reference('CONSUMER_TABLE', '{ref_id}')").collect()
                row_count = count_result[0][0] if count_result else 0
                
                # Get sample data using reference system
                sample_result = snowpark_session.sql(f"SELECT * FROM reference('CONSUMER_TABLE', '{ref_id}') LIMIT 3").collect()
                
                sample_data = []
                columns = []
                
                if sample_result:
                    # Get column names from the first row
                    columns = list(sample_result[0].asDict().keys())
                    for row in sample_result:
                        sample_data.append(row.asDict())
                
                # Get table details from the mapping
                table_details = ref_details_map.get(ref_id, {})
                
                tables_info.append({
                    "reference_id": ref_id,
                    "table_name": table_details.get('name', 'Unknown'),
                    "database": table_details.get('database', 'Unknown'),
                    "schema": table_details.get('schema', 'Unknown'),
                    "row_count": row_count,
                    "columns": columns,
                    "sample_data": sample_data,
                    "accessible": True
                })
                
            except Exception as table_error:
                # Get table details from the mapping
                table_details = ref_details_map.get(ref_id, {})
                
                tables_info.append({
                    "reference_id": ref_id,
                    "table_name": table_details.get('name', 'Unknown'),
                    "database": table_details.get('database', 'Unknown'),
                    "schema": table_details.get('schema', 'Unknown'),
                    "row_count": 0,
                    "columns": [],
                    "sample_data": [],
                    "accessible": False,
                    "error": str(table_error)
                })
        
        # Determine reference type based on count
        if len(reference_ids) == 0:
            reference_type = "none"
            message = "No consumer tables have been granted to this application"
        elif len(reference_ids) == 1:
            reference_type = "single_valued"
            message = "Successfully connected to consumer table"
        else:
            reference_type = "multi_valued"
            message = f"Successfully connected to {len(reference_ids)} consumer tables"
        
        return {
            "connected": len(reference_ids) > 0,
            "message": message,
            "user": session_info[0],
            "role": session_info[1],
            "reference_type": reference_type,
            "total_tables": len(reference_ids),
            "tables_info": tables_info
        }
            
    except Exception as e:
        logging.error(f"Consumer table connection test failed: {e}")
        return {
            "connected": False,
            "message": f"Connection failed: {str(e)}",
            "user": "",
            "role": "",
            "reference_type": "error",
            "error": str(e)
        }

@app.get("/test-feedback-history-table")
async def test_feedback_history_table():
    try:
        snowpark_session = session()
        
        # Check if table exists and get row count
        count_result = snowpark_session.sql("SELECT COUNT(*) FROM core.feedback_history").collect()
        row_count = count_result[0][0] if count_result else 0
        
        # Get sample data
        sample_result = snowpark_session.sql("""
            SELECT id, customer_feedback, sentiment, summary, created_at
            FROM core.feedback_history
            ORDER BY created_at DESC
            LIMIT 5
        """).collect()
        
        sample_data = []
        for row in sample_result:
            sample_data.append({
                "id": row[0],
                "customer_feedback": row[1],
                "sentiment": row[2],
                "summary": row[3],
                "created_at": str(row[4])
            })
        
        # Get table structure
        desc_result = snowpark_session.sql("DESCRIBE TABLE core.feedback_history").collect()
        columns_info = []
        for col_row in desc_result:
            if col_row[0] and not col_row[0].startswith('#'):
                columns_info.append({
                    "name": col_row[0],
                    "type": col_row[1],
                    "nullable": col_row[2] if len(col_row) > 2 else "YES"
                })
        
        return {
            "connected": True,
            "message": "Feedback history table is accessible",
            "row_count": row_count,
            "columns": columns_info,
            "sample_data": sample_data
        }
        
    except Exception as e:
        logging.error(f"Feedback history table test failed: {e}")
        return {
            "connected": False,
            "message": f"Error accessing feedback history table: {str(e)}",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 