# TalkBuddy Backend Deployment Guide

## Render.com Deployment

### 1. Prerequisites
- GitHub repository with your backend code
- Render.com account
- Database (PostgreSQL) - can use NeonDB, Supabase, or Render's managed PostgreSQL
- Redis (optional) - can use Upstash Redis

### 2. Environment Variables
Set these in your Render dashboard:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 3. Build Configuration
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

### 4. Database Setup
1. Create a PostgreSQL database (NeonDB, Supabase, or Render)
2. Run the schema.sql file to create tables
3. Add the DATABASE_URL to your environment variables

### 5. Redis Setup (Optional)
1. Create an Upstash Redis instance
2. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to environment variables

### 6. Deployment Steps
1. Connect your GitHub repository to Render
2. Select the backend folder as the root directory
3. Set the environment variables
4. Deploy!

### 7. Testing
After deployment, test these endpoints:
- `GET /api/health` - Health check
- `GET /api/characters` - List characters
- `POST /api/chat` - Send message

### 8. Mobile App Configuration
Update your mobile app's axios config to use the production URL:
```javascript
baseURL: 'https://your-app-name.onrender.com/api/'
```
