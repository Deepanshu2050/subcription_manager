# Smart Expense & Subscription Manager

A production-ready MERN stack application for tracking expenses, managing subscriptions, setting budgets, and receiving intelligent alerts.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

## Features

### Core Features
- **User Authentication** - Secure JWT-based authentication with password hashing
- **Expense Management** - Track expenses with categories, dates, and payment methods
- **Subscription Tracking** - Manage recurring subscriptions with renewal reminders
- **Budget Management** - Set monthly/yearly budgets with smart alerts
- **Dashboard** - Beautiful visualizations with charts and analytics
- **Email Notifications** - Automated alerts for budgets and subscription renewals
- **CSV Export** - Export expense data for external analysis
- **Dark Mode** - Full dark mode support

### Tech Stack

**Frontend:**
- React 18.2
- React Router v6
- Tailwind CSS
- Chart.js & Recharts
- Axios
- React Icons

**Backend:**
- Node.js & Express
- MongoDB & Mongoose
- JWT Authentication
- bcrypt for password hashing
- Nodemailer for emails
- node-cron for scheduled tasks

## Project Structure

```
expense-subscription-manager/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── expenseController.js
│   │   ├── subscriptionController.js
│   │   └── budgetController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Expense.js
│   │   ├── Subscription.js
│   │   └── Budget.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── subscriptionRoutes.js
│   │   └── budgetRoutes.js
│   ├── services/
│   │   ├── emailService.js
│   │   └── cronJobs.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Expenses.jsx
│   │   │   ├── Subscriptions.jsx
│   │   │   ├── Budget.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd expense-subscription-manager
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Backend Environment**
   
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   NODE_ENV=development
   
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/expense-manager
   # Or use MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-manager
   
   # JWT Secret (use a strong random string)
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   
   # Email Configuration (Gmail example)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-specific-password
   EMAIL_FROM=Expense Manager <your-email@gmail.com>
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

   **Setting up Gmail for Email Notifications:**
   1. Go to your Google Account settings
   2. Enable 2-Step Verification
   3. Generate an App Password
   4. Use the App Password in EMAIL_PASSWORD

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Configure Frontend Environment**
   
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on http://localhost:5000

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on http://localhost:3000

4. **Access the Application**
   
   Open your browser and navigate to http://localhost:3000

## Troubleshooting

### Common Issues

1.  **Connection Refused (frontend or backend not loading)**
    *   Ensure **both** servers are running. You need two terminal windows:
        *   Terminal 1 (Backend): `cd backend && npm run dev` (Runs on port 5001)
        *   Terminal 2 (Frontend): `cd frontend && npm run dev` (Runs on port 3000)

2.  **MongoDB Connection Error**
    *   If you see `Could not connect to any servers in your MongoDB Atlas cluster...`, your IP address might not be whitelisted.
    *   Go to MongoDB Atlas -> Network Access -> Add IP Address -> Add Current IP Address.
    *   **For Render Deployment**: Render uses dynamic IPs. You must allow access from **Anywhere**.
        *   Click "Add IP Address" -> Select "Allow Access from Anywhere" (`0.0.0.0/0`) -> Confirm.

3.  **Login Failed / Demo Credentials Not Working**
    *   If "Demo Credentials" fail, it means the user `test@example.com` does not exist in your database.
    *   **Solution**: Use the **Sign Up** page to create a new account. You can then log in with those credentials.

## API Documentation

### Authentication Endpoints

```
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me (Protected)
```

### Expense Endpoints

```
GET    /api/expenses (Protected)
POST   /api/expenses (Protected)
GET    /api/expenses/:id (Protected)
PUT    /api/expenses/:id (Protected)
DELETE /api/expenses/:id (Protected)
GET    /api/expenses/summary/:period (Protected)
GET    /api/expenses/export/csv (Protected)
```

### Subscription Endpoints

```
GET    /api/subscriptions (Protected)
POST   /api/subscriptions (Protected)
GET    /api/subscriptions/:id (Protected)
PUT    /api/subscriptions/:id (Protected)
DELETE /api/subscriptions/:id (Protected)
GET    /api/subscriptions/upcoming/:days (Protected)
GET    /api/subscriptions/analysis/cost (Protected)
POST   /api/subscriptions/:id/renew (Protected)
```

### Budget Endpoints

```
GET    /api/budgets (Protected)
POST   /api/budgets (Protected)
GET    /api/budgets/:id (Protected)
PUT    /api/budgets/:id (Protected)
DELETE /api/budgets/:id (Protected)
GET    /api/budgets/current/status (Protected)
GET    /api/budgets/check-alerts (Protected)
```

## Testing the Application

### Create a Test User

1. Navigate to http://localhost:3000/signup
2. Fill in the registration form
3. You'll be automatically logged in

### Add Test Data

**Add an Expense:**
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.00,
    "category": "Food & Dining",
    "description": "Lunch at restaurant",
    "date": "2026-01-31",
    "paymentMethod": "Credit Card"
  }'
```

**Add a Subscription:**
```bash
curl -X POST http://localhost:5000/api/subscriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "Netflix",
    "cost": 199.00,
    "billingCycle": "Monthly",
    "startDate": "2026-01-01",
    "nextBillingDate": "2026-02-01",
    "category": "Entertainment"
  }'
```

**Create a Budget:**
```bash
curl -X POST http://localhost:5000/api/budgets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "period": "Monthly",
    "totalLimit": 10000,
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  }'
```

## Automated Notifications

The application runs two cron jobs:

1. **Subscription Renewal Check** - Runs daily at 9 AM
   - Checks for upcoming subscription renewals
   - Sends email reminders based on user preferences

2. **Budget Alert Check** - Runs daily at 8 PM
   - Monitors budget spending
   - Sends alerts at 80% and 100% thresholds

## Features in Detail

### Expense Categories
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Education
- Travel
- Groceries
- Rent
- Insurance
- Personal Care
- Gifts & Donations
- Other

### Subscription Billing Cycles
- Daily
- Weekly
- Monthly
- Quarterly
- Yearly

### Budget Alert Thresholds
- Warning: 80% of budget used
- Critical: 100% of budget used

## Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables from `.env`
6. Deploy!

### Frontend Deployment (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend directory
3. Run: `vercel`
4. Follow the prompts
5. Set environment variable: `VITE_API_URL=your-backend-url/api`

## Development

### Code Structure

- **Controllers**: Handle business logic
- **Models**: Define database schemas
- **Routes**: Define API endpoints
- **Middleware**: Authentication and validation
- **Services**: Email and cron job services
- **Components**: Reusable React components
- **Pages**: Route-specific page components
- **Context**: Global state management

### Best Practices

- All API routes (except auth) are protected with JWT
- Passwords are hashed using bcrypt
- Input validation on both frontend and backend
- Error handling with try-catch blocks
- Responsive design with Tailwind CSS
- Dark mode support
- Clean code with comments

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, email your-email@example.com or create an issue in the repository.

## Acknowledgments

- Built with MERN Stack
- UI inspired by modern finance apps
- Icons from React Icons
- Charts from Chart.js and Recharts

---

**Happy Expense Tracking!**
