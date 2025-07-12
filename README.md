# Snowflake Native App POC - OpenAI Integration

This POC demonstrates how to create a Snowflake Native App that can access external APIs (OpenAI) from within Snowflake's secure environment.

## Project Overview

**Customer Feedback Analyzer**: A simple application that:

- Takes customer feedback text as input
- Uses OpenAI API to analyze sentiment, generate summary, and provide suggestions
- Demonstrates external API access from Snowflake Native Apps

## Architecture

- **Frontend**: Next.js application with a simple UI
- **Backend**: FastAPI service that handles OpenAI API calls
- **Docker**: Both services are containerized for Snowflake Native App deployment

## Local Testing

### Prerequisites

1. Docker and Docker Compose installed
2. OpenAI API key

### Setup

1. Copy the environment file:

   ```bash
   cp env.example .env
   ```

2. Add your OpenAI API key to `.env`:

   ```
   OPENAI_API_KEY=your_actual_openai_api_key
   ```

3. Run the application:

   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

### Testing the API

You can test the backend API directly:

```bash
curl -X POST http://localhost:8000/analyze-feedback \
  -H "Content-Type: application/json" \
  -d '{"text": "I love this product! It works perfectly and the customer service is amazing."}'
```

## Snowflake Native App Deployment

### 1. Prepare the Application Package

The application is already containerized and ready for Snowflake Native App deployment.

### 2. Create the Native App in Snowflake

```sql
-- Create the application package
CREATE APPLICATION PACKAGE feedback_analyzer_package;

-- Create the application
CREATE APPLICATION feedback_analyzer
FROM APPLICATION PACKAGE feedback_analyzer_package
USING @your_stage_name
EXTERNAL_ACCESS_INTEGRATIONS = (your_external_access_integration);
```

### 3. Configure External Access

You'll need to configure external access to allow OpenAI API calls:

```sql
-- Create external access integration
CREATE EXTERNAL ACCESS INTEGRATION openai_access
ALLOWED_NETWORK_RULES = (openai_rule)
ALLOWED_AUTHENTICATION_SECRETS = (openai_secret);

-- Create network rule for OpenAI
CREATE NETWORK RULE openai_rule
MODE = EGRESS
TYPE = HOST_PORT
VALUE_LIST = ('api.openai.com:443');

-- Create secret for OpenAI API key
CREATE SECRET openai_secret
TYPE = GENERIC_STRING
SECRET_STRING = 'your_openai_api_key';
```

### 4. Deploy the Application

Upload your Docker images to Snowflake and configure the application to use the external access integration.

## Testing External API Access

Once deployed as a Snowflake Native App:

1. The application will be accessible through Snowflake's interface
2. Users can input customer feedback
3. The app will call OpenAI API through the configured external access
4. Results will be displayed in the Snowflake Native App interface

## Key Features Demonstrated

✅ **External API Access**: Successfully calls OpenAI API from within Snowflake  
✅ **Containerized Services**: Both frontend and backend are Dockerized  
✅ **Simple UI**: Clean, user-friendly interface for testing  
✅ **Error Handling**: Proper error handling for API failures  
✅ **Environment Configuration**: Secure handling of API keys

## Files Structure

```
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile          # Backend container
├── frontend/poc-napp/
│   ├── app/page.tsx        # Next.js main page
│   └── Dockerfile          # Frontend container
├── docker-compose.yml      # Local development setup
├── env.example            # Environment variables template
└── README.md              # This file
```

## Next Steps

After confirming external API access works, you can extend this POC to:

- Add Snowflake table access through references
- Implement more complex AI workflows
- Add authentication and user management
- Create more sophisticated data processing pipelines

## Troubleshooting

### Common Issues

1. **OpenAI API Key Error**: Ensure your API key is valid and has sufficient credits
2. **CORS Issues**: The backend is configured to allow all origins for testing
3. **Network Access**: In Snowflake, ensure external access integration is properly configured

### Logs

Check container logs for debugging:

```bash
docker-compose logs backend
docker-compose logs frontend
```
