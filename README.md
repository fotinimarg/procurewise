## Project Overview
ProcureWise is a full-stack B2B e-commerce platform designed to help small businesses
browse products from multiple suppliers, compare prices, and place multi-supplier orders.

## Live Demo
https://procurewise-tawny.vercel.app/
> Note: The backend is hosted on Render (free tier), so the first request may take a few seconds to respond due to cold start.

## Key Features
- User authentication with JWT and role-based access (admin / user)
- Multi-supplier pricing per product with lowest-price aggregation
- Product, supplier, and user management (admin dashboard)
- Multi-supplier checkout logic
- Order history and reorder functionality

## Tech Stack
### Frontend
- React
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Passport.js

### Infrastructure
- Frontend deployed on Vercel
- Backend deployed on Render
- MongoDB Atlas
- Firebase Storage (for file uploads)

## Local Setup
1. Clone the repository
   ```bash
   git clone https://github.com/fotinimarg/procurewise
   cd procurewise
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Create a .env file (see .env.example)
   ```bash
   cp .env.example .env
   ```
4. Start the backend
   ```bash
   cd server
   npm start
   ```
5. Start the frontend
   ```bash
   cd client
   npm run dev
   ```
