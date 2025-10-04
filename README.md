# Fabric Management System - MVP

A simple but complete system to track fabric from procurement to finished garment. This MVP focuses on core functionality with a clean, simple UI.

## Features

- **Vendor Management**: Track fabric procurement with detailed fabric information
- **Stock Management**: Auto-calculate stock levels from vendor entries and cutting usage
- **Cutting Process**: Record before and after cutting details with role tracking
- **Worker Process**: Track worker operations with piece count validation

## Tech Stack

- **Frontend**: React with Bootstrap for a clean, responsive UI
- **Backend**: Express.js with RESTful API architecture
- **Database**: MongoDB with Mongoose for flexible schema development
- **Authentication**: JWT (not fully implemented in MVP)

## Project Structure

```
fabric-management-system/
├── client/               # React frontend
│   ├── public/           # Static files
│   └── src/              # React source code
│       ├── components/   # React components by module
│       └── App.js        # Main application component
└── server/               # Express backend
    ├── config/           # Configuration files
    ├── controllers/      # Request handlers
    ├── models/           # Mongoose models
    ├── routes/           # API route definitions
    └── index.js          # Server entry point
```

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd fabric-management-system
   ```

2. Install server dependencies
   ```
   cd server
   npm install
   ```

3. Install client dependencies
   ```
   cd ../client
   npm install
   ```

4. Create a `.env` file in the server directory with:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/fabric-management
   JWT_SECRET=your-secret-key
   ```

### Running the Application

1. Start the server
   ```
   cd server
   npm run dev
   ```

2. Start the client
   ```
   cd ../client
   npm start
   ```

3. Access the application at http://localhost:3000

## Data Flow

1. **Fabric Entry**: Vendor adds fabric with details (name, type, color, weight)
2. **Stock Update**: System automatically calculates current stock
3. **Cutting Process**: 
   - Before Cutting: Record lot number, pattern, roles
   - After Cutting: Update with actual layers/pieces cut
4. **Worker Process**: Workers record operations performed with piece counts

## Deployment

This project is currently configured for deployment to an AWS EC2 instance via GitHub Actions and Nginx + PM2. See `.github/workflows/deploy.yml` for the CI/CD pipeline, and `scripts/ec2-setup.sh` for instance preparation.

## Future Enhancements

- User authentication and authorization
- Role-based access control
- Advanced reporting and analytics
- Image upload for fabric samples and bills
- Barcode/QR code integration for tracking
- Mobile application for shop floor usage

## Contributing

This is an MVP. Feel free to fork and enhance as needed for your specific requirements.

## License

This project is licensed under the MIT License. 