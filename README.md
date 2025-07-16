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

3. **Test the application:**
   - Frontend: http://localhost:8080/
   - Backend API: http://localhost:8080/api/health
   - Router test page: http://localhost:8080/test

### Testing API Endpoints

```bash
# Health check
curl http://localhost:8080/api/health

# Analyze feedback
curl -X POST http://localhost:8080/api/analyze-feedback \
  -H "Content-Type: application/json" \
  -d '{"text": "This product is amazing!"}'
```

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

1. **Update `snowflake/stage/service_spec.yaml` with correct image paths**
2. **Deploy using Snowflake CLI or UI:**
   ```sql
   CREATE SERVICE poc_napp_service
   IN COMPUTE POOL your_compute_pool
   FROM SPECIFICATION $$
   -- Copy contents from service_spec.yaml
   $$;
   ```

### 3. Test SPCS Deployment

1. **Get the public endpoint:**

   ```sql
   SHOW ENDPOINTS IN SERVICE poc_napp_service;
   ```

2. **Test the application using the public endpoint URL**

## Key Changes from Original

- **Router Pattern**: All traffic goes through NGINX router
- **Path Rewriting**: `/api/*` requests are rewritten to remove `/api` prefix
- **Environment Variables**: Router uses `$FRONTEND_SERVICE` and `$BACKEND_SERVICE`
- **Single Public Endpoint**: Only the router is exposed publicly

## Troubleshooting

### Common Issues

1. **Router not starting**: Check that environment variables are set correctly
2. **API calls failing**: Verify that backend routes don't expect `/api` prefix
3. **Frontend not loading**: Check that `NEXT_PUBLIC_API_URL` is set to `/api`

### Debug Endpoints

- **Router test**: `http://localhost:8080/test` (shows environment variables)
- **Backend health**: `http://localhost:8080/api/health`
- **Frontend**: `http://localhost:8080/`

## File Structure

```
├── frontend/          # Next.js frontend application
├── backend/           # FastAPI backend application
├── router/            # NGINX router configuration
├── snowflake/         # SPCS service specification
├── docker-compose.yml # Local development setup
├── build-and-push.sh  # Image build and push script
└── README.md          # This file
```
