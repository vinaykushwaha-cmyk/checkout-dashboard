# Checkout Dashboard Backend

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Make sure MongoDB is running on your local machine

3. Update the `.env` file with your configuration

4. Start the server:
```bash
npm run dev
```

The server will run on http://localhost:3000

## API Endpoints

- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/health` - Health check
