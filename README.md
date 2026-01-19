# Checkout Dashboard

A modern checkout dashboard application built with Node.js, Express, Angular, and MySQL.

## Features

- User authentication with JWT
- Beautiful Material Design UI
- Secure password hashing with bcryptjs
- RESTful API architecture
- Responsive design

## Tech Stack

### Backend
- Node.js + Express
- MySQL database
- JWT authentication
- bcryptjs for password hashing
- CORS enabled

### Frontend
- Angular 17 (standalone components)
- Angular Material Design
- Reactive Forms
- RxJS for state management

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Setup Instructions

### Database Setup

1. Make sure MySQL is running and accessible
2. Update the `.env` file in the `backend` folder with your MySQL credentials
3. Run the database setup script:

```bash
cd backend
node setup-database.js
```

This will create the `checkout_dashboard` table and a test user.

### Backend Setup

```bash
cd backend
npm install
npm start
```

The backend server will run on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend
npm install
ng serve
```

The frontend application will run on `http://localhost:4300`

## Test Credentials

- **Email:** test@example.com
- **Password:** password123

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```

### Health Check

- `GET /api/health` - Server health check

## Project Structure

```
checkout-dashboard/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL connection configuration
│   ├── models/
│   │   └── User.js               # User model
│   ├── routes/
│   │   └── auth.js               # Authentication routes
│   ├── .env                      # Environment variables
│   ├── server.js                 # Express server
│   ├── test-connection.js        # Database connection test
│   └── setup-database.js         # Database setup script
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── login/        # Login component
    │   │   │   └── dashboard/    # Dashboard component
    │   │   ├── services/
    │   │   │   └── auth.service.ts # Authentication service
    │   │   └── app.routes.ts     # Application routes
    │   └── styles.scss            # Global styles
    └── angular.json               # Angular configuration
```

## Configuration

### Backend Environment Variables (.env)

```
PORT=3000
DB_HOST=192.168.2.2
DB_USER=appypieml
DB_PASSWORD=0ns!sdev_Secure#11
DB_NAME=appypieml_db_local
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRE=7d
```

### Database Connection

The application uses MySQL connection pooling for optimal performance:
- Connection limit: 10
- Wait for connections: enabled
- Queue limit: unlimited

## Security Features

- Password hashing with bcryptjs (10 salt rounds)
- JWT token-based authentication
- HTTP-only token storage
- CORS protection
- Input validation with express-validator
- SQL injection protection with parameterized queries

## Development

### Running Tests

Database connection test:
```bash
cd backend
node test-connection.js
```

### Building for Production

Frontend:
```bash
cd frontend
ng build --configuration production
```

The build artifacts will be stored in the `frontend/dist` directory.

## Troubleshooting

### MySQL Connection Issues

If you encounter connection errors:

1. Check if MySQL server is running
2. Verify the credentials in `.env` file
3. Ensure MySQL user has remote access permissions
4. Run `node test-connection.js` to diagnose

### Port Already in Use

If ports 3000 or 4300 are in use:

Kill the process:
```bash
# For backend (port 3000)
lsof -ti:3000 | xargs kill -9

# For frontend (port 4300)
lsof -ti:4300 | xargs kill -9
```

## License

Private project - All rights reserved

## Support

For issues or questions, contact your development team.
