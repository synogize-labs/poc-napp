# Snowflake Native App POC - Frontend

This is the Next.js frontend for the Snowflake Native App POC Feedback Analyzer.

## Features

- Modern, responsive UI built with Next.js 14 and Tailwind CSS
- Real-time feedback analysis using OpenAI API
- Sentiment analysis and summary generation
- Backend health monitoring
- Docker support for easy deployment

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend service running on port 8000

### Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

1. Build the application:

   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

### Docker

The frontend can be run using Docker:

```bash
# Build the image
docker build -t snowflake-poc-frontend .

# Run the container
docker run -p 3000:3000 snowflake-poc-frontend
```

Or use docker-compose from the root directory:

```bash
docker-compose up frontend
```

## API Integration

The frontend connects to the FastAPI backend on `http://localhost:8000` and provides:

- **Health Check**: `/health` - Verify backend connectivity
- **Feedback Analysis**: `/analyze-feedback` - Analyze customer feedback using OpenAI

## Environment Variables

No environment variables are required for the frontend. The backend URL is hardcoded to `http://localhost:8000` for development.

For production, you may want to make this configurable via environment variables.

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── components/         # React components
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── public/                 # Static assets
├── Dockerfile              # Docker configuration
└── package.json            # Dependencies and scripts
```
