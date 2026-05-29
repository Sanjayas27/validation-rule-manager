# Validation Rule Manager

A full-stack web application that connects to Salesforce via OAuth 2.0 and allows you to manage Account validation rules directly from a React dashboard.

## Live Demo
- **Frontend**: [your-vercel-url]
- **Backend**: [your-render-url]

## Features
- 🔐 Login with Salesforce using OAuth 2.0
- 📋 Fetch all validation rules from the Account object
- ✅ View each rule's Active / Inactive status
- 🔄 Toggle individual rules on or off
- ⚡ Enable All / Disable All in one click
- 🚀 Deploy changes directly to Salesforce via Tooling API

## Tech Stack

### Frontend
- React + Vite
- Axios
- CSS3

### Backend
- Node.js + Express
- Salesforce Tooling API
- Salesforce Metadata API
- OAuth 2.0 (Authorization Code Flow)
- express-session

## Setup Instructions

### Prerequisites
- Node.js v18+
- Salesforce Developer Org
- Salesforce Connected App with OAuth enabled

### 1. Clone the repo
```bash
git clone https://github.com/Sanjayas27/validation-rule-manager.git
cd validation-rule-manager
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```env
PORT=5000
SF_LOGIN_URL=https://your-org.develop.my.salesforce.com
SF_CLIENT_ID=your_consumer_key
SF_CLIENT_SECRET=your_consumer_secret
SF_CALLBACK_URL=http://localhost:5000/oauth/callback
SESSION_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

Run the backend:
```bash
node index.js
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## Salesforce Setup

1. Sign up at [developer.salesforce.com/signup](https://developer.salesforce.com/signup)
2. Create 4-5 Validation Rules on the Account object
3. Create a Connected App (External Client App) with:
   - OAuth enabled
   - Scopes: `api`, `full`, `refresh_token`
   - Callback URL: your backend `/oauth/callback`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/login` | Initiate Salesforce OAuth |
| GET | `/oauth/callback` | OAuth callback handler |
| GET | `/auth/status` | Check authentication status |
| POST | `/auth/logout` | Logout |
| GET | `/api/validation-rules` | Fetch all Account validation rules |
| PATCH | `/api/validation-rules/:id` | Toggle a single rule |
| PATCH | `/api/validation-rules` | Toggle multiple rules |

## How It Works

1. User clicks "Login with Salesforce"
2. App redirects to Salesforce OAuth authorization page
3. User logs in and authorizes the app
4. Salesforce redirects back with an authorization code
5. Backend exchanges the code for an access token
6. Access token is stored in the server session
7. All subsequent API calls use the token to call the Salesforce Tooling API
8. Toggle changes are staged locally, then deployed to Salesforce on "Deploy" click

## Author
Sanjay A S
