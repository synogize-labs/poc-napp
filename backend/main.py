from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
import logging
import socket
import http.client

logging.basicConfig(level=logging.INFO)

load_dotenv()

app = FastAPI(title="Snowflake Native App POC", version="1.0.0")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI will be configured per request

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
    # --- DEBUG LOGGING START ---
    secret_path = "/run/secrets/openai/secret_string"
    if os.path.exists(secret_path):
        logging.info(f"Secret file found at {secret_path}")
        try:
            with open(secret_path, "r") as f:
                key = f.read().strip()
            logging.info(f"Secret file read successfully. Key length: {len(key)}. Starts with: {key[:5]}...")
        except Exception as e:
            logging.error(f"Error reading secret file: {e}")
    else:
        logging.error(f"Secret file NOT found at {secret_path}")
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            logging.info(f"OPENAI_API_KEY env var found. Key length: {len(api_key)}. Starts with: {api_key[:5]}...")
        else:
            logging.error("OPENAI_API_KEY env var NOT found.")
    logging.info("DEBUG: After secret file check, before marker")
    logging.info("MARKER: About to check DNS for api.openai.com")
    try:
        ip = socket.gethostbyname("api.openai.com")
        logging.info(f"api.openai.com resolves to {ip}")
    except Exception as e:
        logging.error(f"DNS resolution error for api.openai.com: {e}")
    logging.info("DEBUG: After DNS check, before HTTPS check")
    try:
        conn = http.client.HTTPSConnection("api.openai.com", timeout=5)
        conn.request("HEAD", "/")
        resp = conn.getresponse()
        logging.info(f"HTTPS connection to api.openai.com succeeded. Status: {resp.status}")
        conn.close()
    except Exception as e:
        logging.error(f"HTTPS connection to api.openai.com failed: {e}")
    logging.info("MARKER: Finished DNS check")
    # --- DEBUG LOGGING END ---
    try:
        # Test OpenAI API access
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
        
        return FeedbackResponse(
            original_text=request.text,
            sentiment=sentiment,
            summary=summary
        )
        
    except Exception as e:
        import traceback
        print("Exception in /analyze-feedback:", traceback.format_exc(), flush=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing feedback: {str(e)}")

# Backward compatibility route - this will be handled by the router rewrite
@app.post("/api/analyze-feedback", response_model=FeedbackResponse)
async def analyze_feedback_api(request: FeedbackRequest):
    return await analyze_feedback(request)

@app.get("/api/health")
async def health_check_api():
    return await health_check()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 