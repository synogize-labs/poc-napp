# Snowflake Native App POC with SPCS Router Pattern

This project demonstrates a Snowflake Native App using Snowpark Container Services (SPCS) with a router pattern, following the Snowflake Labs example architecture.

## Architecture

The application consists of three containers:

- **Frontend**: Next.js application serving the UI
- **Backend**: FastAPI application providing the API
- **Router**: NGINX router that proxies requests to frontend/backend

## Local Development

### Prerequisites

- Docker and Docker Compose
- Node.js and npm (for local frontend development)
- Python 3.8+ (for local backend development)

### Running Locally

1. **Set up environment variables:**

   ```bash
   cp env.example .env
   # Edit .env with your OpenAI API key
   ```

2. **Start all services:**

   ```bash
   docker-compose up --build
   ```

3. **Test application**

   After running `docker-compose up --build`, you can access the following endpoints:

   - **Frontend:** http://localhost:8000/
   - **Backend API (health):** http://localhost:8000/api/health
   - **Router test page:** http://localhost:8000/test

## SPCS Deployment

### 1. Build and Push Images

1. **Update the registry URL in `build-and-push.sh`:**

   ```bash
   # Replace with your actual registry URL
   REPO_URL="your-account.registry.snowflakecomputing.com/poc_napp_db/schema/image_repo"
   ```

2. **Login to Snowflake registry:**

   ```bash
   docker login your-account.registry.snowflakecomputing.com
   ```

3. **Build and push images:**
   ```bash
   ./build-and-push.sh
   ```

### 2. Deploy to SPCS

- To be updated...

## Key Changes from Original

- **Router Pattern**: All traffic goes through NGINX router
- **Environment Variables**: Router uses `$FRONTEND_SERVICE` and `$BACKEND_SERVICE`
- **Single Public Endpoint**: Only the router is exposed publicly
