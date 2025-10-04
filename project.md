# Fabric Management System - Complete Project Documentation

## Table of Contents
- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Module Details](#module-details)
  - [Vendor Module](#vendor-module)
  - [Fabric Stock Module](#fabric-stock-module)
  - [Cutting Module](#cutting-module)
  - [Worker Process Module](#worker-process-module)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Technology Stack](#technology-stack)
- [Setup and Installation](#setup-and-installation)
- [Development Workflow](#development-workflow)
- [User Guide](#user-guide)
- [Testing Strategy](#testing-strategy)
- [Deployment Strategy](#deployment-strategy)
- [Future Enhancements](#future-enhancements)

## Project Overview

The Fabric Management System is a comprehensive full-stack application designed to track and manage the entire lifecycle of fabric from procurement to finished garment production. The system streamlines operations across four interconnected modules: Vendor, Fabric Stock, Cutting, and Worker Process.

### Key Features
- Complete vendor management with detailed fabric procurement tracking
- Real-time fabric stock visualization and management
- Systematic cutting process workflow management
- Worker-wise operation tracking for garment assembly
- End-to-end visibility of production lifecycle
- Reporting and analytics capabilities

## System Architecture

### High-Level Architecture
```
┌─────────────────┐     ┌────────────────┐     ┌────────────────┐
│                 │     │                │     │                │
│  Client Layer   │◄───►│  Server Layer  │◄───►│  Database Layer│
│  (Frontend)     │     │  (Backend)     │     │                │
│                 │     │                │     │                │
└─────────────────┘     └────────────────┘     └────────────────┘
```

### Frontend Architecture
- Modern responsive web application
- Component-based UI architecture
- State management for complex data flows
- Data visualization components for stock management

### Backend Architecture
- RESTful API architecture
- Module-based code organization
- Authentication and authorization layer
- Business logic layer
- Data access layer

## Module Details

### Vendor Module

The Vendor module manages fabric procurement details and serves as the entry point for new fabric into the system.

#### Data Structure
- **Fabric From**: Source of the fabric (supplier details)
- **Shop Name**: Name of the shop/vendor
- **Date & Time**: Date and time of procurement
- **Bill No**: Vendor's bill number for reference
- **Fabric Details**:
  - Name: Fabric name/type
  - Color: Multiple color options available
  - Type: Fabric classification
  - Weight Type: Unit of measurement (kg, meters, etc.)
  - Actual Weight: Quantity in specified weight type
- **Total from all colors**: Aggregate quantity
- **Remarks**: Additional notes or information

#### Functionality
- Create, read, update, and delete vendor entries
- Search and filter vendors by various parameters
- Automatic calculation of total quantities
- Image upload for bill and fabric samples
- Generate procurement reports

### Fabric Stock Module

This module calculates and visualizes the current fabric inventory based on inputs from the Vendor module and consumption in the Cutting module.

#### Data Visualization
- Current stock levels by fabric type
- Stock breakdown by color
- Historical stock trends
- Low stock alerts
- Stock valuation

#### Functionality
- Real-time stock calculations
- Multiple visualization options (charts, tables)
- Stock movement tracking
- Stock reconciliation tools
- Export and reporting capabilities

### Cutting Module

The Cutting module manages the transformation of raw fabric into cut pieces ready for assembly, tracking both before and after cutting data.

#### Before Cutting Data
- **Lot No**: Unique identifier for the cutting batch
- **Pattern**: Pattern to be used for cutting
- **Date/Time**: When the cutting process starts
- **Size**: Multiple size options
- **Role**: 
  - Role No: Unique identifier for fabric roll
  - Role Weight: Weight of the fabric roll
  - Role Color: Color of the fabric roll

#### After Cutting Data
- Number of layers cut from each role
- Piece count per role (e.g., "brown role = 53")
- Cutting efficiency metrics
- Remaining fabric details

#### Functionality
- Step-by-step guided cutting process
- Automatic calculation of expected output
- Variance tracking between expected and actual output
- Cutting history and performance analytics
- Integration with stock module for automatic updates

### Worker Process Module

This module tracks the assembly process as cut pieces move through various operations performed by different workers.

#### Data Structure
- **Line No/Name**: Production line identifier
- **Operation/Work**: Specific operation being performed (stitching, button attachment, zipping, etc.)
- **Worker Details**: Worker assigned to the operation
- **Piece Count**: Number of pieces processed
- **Quality Check**: Pass/fail metrics

#### Functionality
- Work assignment and tracking
- Real-time progress monitoring
- Worker performance analytics
- Quality control integration
- Bottleneck identification

## Database Schema

### Entity Relationship Diagram
```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│    Vendor     │       │ Fabric Stock  │       │    Cutting    │
│───────────────│       │───────────────│       │───────────────│
│ vendor_id (PK)│       │ stock_id (PK) │       │ cutting_id(PK)│
│ shop_name     │       │ fabric_id (FK)│◄──────┤ lot_no        │
│ date_time     │       │ current_qty   │       │ pattern       │
│ bill_no       │       │ last_updated  │       │ datetime      │
└───────┬───────┘       └───────────────┘       │ size_details  │
        │                                       └───────┬───────┘
        │                                               │
        ▼                                               ▼
┌───────────────┐                              ┌───────────────┐       ┌───────────────┐
│ Fabric Details│                              │   Role Info   │       │ Worker Process│
│───────────────│                              │───────────────│       │───────────────│
│ fabric_id (PK)│                              │ role_id (PK)  │       │ process_id(PK)│
│ vendor_id (FK)│                              │ cutting_id(FK)│◄──────┤ line_no       │
│ name          │                              │ role_no       │       │ operation     │
│ type          │                              │ role_weight   │       │ worker_id (FK)│
│ weight_type   │                              │ role_color    │       │ piece_count   │
│ total_weight  │                              │ layers_cut    │       │ quality_status│
│ remarks       │                              │ pieces_count  │       │ datetime      │
└───────────────┘                              └───────────────┘       └───────────────┘
        ▲
        │
┌───────┴───────┐
│  Fabric Color │
│───────────────│
│ color_id (PK) │
│ fabric_id (FK)│
│ color_name    │
│ color_weight  │
└───────────────┘
```

## API Endpoints

### Vendor Module APIs
- `GET /api/vendors` - List all vendors
- `GET /api/vendors/:id` - Get vendor details
- `POST /api/vendors` - Create new vendor entry
- `PUT /api/vendors/:id` - Update vendor details
- `DELETE /api/vendors/:id` - Delete vendor entry
- `GET /api/vendors/:id/fabrics` - Get fabrics from specific vendor

### Fabric Stock APIs
- `GET /api/stock` - Get current stock details
- `GET /api/stock/history` - Get stock history
- `GET /api/stock/fabric/:fabricId` - Get stock for specific fabric
- `GET /api/stock/color/:colorId` - Get stock for specific color
- `POST /api/stock/reconcile` - Reconcile stock discrepancies

### Cutting Module APIs
- `GET /api/cutting` - List all cutting batches
- `GET /api/cutting/:id` - Get specific cutting batch
- `POST /api/cutting/before` - Create before-cutting entry
- `PUT /api/cutting/:id/after` - Update with after-cutting data
- `GET /api/cutting/:id/roles` - Get roles used in cutting batch

### Worker Process APIs
- `GET /api/process` - List all process entries
- `GET /api/process/line/:lineId` - Get processes by line
- `GET /api/process/operation/:opId` - Get processes by operation
- `POST /api/process` - Create new process entry
- `GET /api/process/analytics` - Get worker performance analytics

## Technology Stack

### Frontend
- **Framework**: React.js with Next.js
- **State Management**: Redux or Context API
- **UI Components**: Material-UI or Tailwind CSS
- **Data Visualization**: Chart.js or D3.js
- **Form Handling**: Formik with Yup validation

### Backend
- **Framework**: Node.js with Express or NestJS
- **API Documentation**: Swagger/OpenAPI
- **Authentication**: JWT with role-based access control
- **Validation**: Joi or class-validator

### Database
- **Primary Database**: PostgreSQL or MongoDB
- **ORM/ODM**: Prisma, Sequelize (SQL) or Mongoose (NoSQL)
- **Caching**: Redis for performance optimization

### DevOps & Infrastructure
- **CI/CD**: GitHub Actions or GitLab CI
- **Containerization**: Docker with Docker Compose
- **Deployment**: AWS, Azure, or GCP
- **Monitoring**: Prometheus with Grafana

## Setup and Installation

### Prerequisites
- Node.js (v16+)
- npm or Yarn
- Docker and Docker Compose
- Git

### Development Environment Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/fabric-management-system.git
cd fabric-management-system

# Install dependencies for backend
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the database
docker-compose up -d

# Run database migrations
npm run migrate

# Start the backend server
npm run dev

# In a new terminal, install dependencies for frontend
cd ../frontend
npm install

# Start the frontend development server
npm run dev

# The application should now be running at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/api-docs
```

## Development Workflow

### Branching Strategy
- `main` - Production ready code
- `develop` - Integration branch for features
- `feature/feature-name` - Feature development
- `bugfix/bug-description` - Bug fixes
- `release/version` - Release preparation

### Commit Guidelines
- Use conventional commit messages: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Keep commits atomic and focused on a single change

### Pull Request Process
1. Create feature/bugfix branch from develop
2. Implement changes with appropriate tests
3. Submit PR to develop branch
4. Ensure CI passes and code review is completed
5. Merge using squash and merge strategy

## User Guide

### Vendor Module Usage
1. Navigate to the Vendor section
2. Click "Add New Vendor Entry" to record new fabric procurement
3. Fill out all required fields including detailed fabric information
4. Upload bill image if available
5. Submit the form to save the vendor entry
6. Use the search and filter options to find existing entries

### Fabric Stock Management
1. Access the Stock Dashboard for an overview of current inventory
2. Use the filters to view stock by fabric type, color, or date range
3. Export reports for inventory management
4. Set up low stock alerts through the Settings menu

### Cutting Process Management
1. Start a new cutting batch by filling the "Before Cutting" form
2. Assign fabric roles to the batch
3. After cutting is complete, update with the "After Cutting" form
4. Track the status of all cutting batches through the dashboard

### Worker Process Tracking
1. Select the production line and operation
2. Enter the worker details and piece count
3. Submit to record the progress
4. View worker and line performance through analytics dashboard

## Testing Strategy

### Unit Testing
- Frontend component testing with Jest and React Testing Library
- Backend API testing with Jest or Mocha
- Service layer unit tests with high coverage targets

### Integration Testing
- API integration tests using Supertest
- Database integration tests for complex queries
- Module integration tests for critical workflows

### End-to-End Testing
- Critical user flows with Cypress
- Cross-browser compatibility testing
- Performance testing for high-traffic endpoints

## Deployment Strategy

### Staging Environment
- Automated deployment from the develop branch
- Full integration testing suite runs before deployment
- Manual QA verification of new features

### Production Environment
- Blue/green deployment strategy
- Automated rollback capabilities
- Performance monitoring post-deployment

## Future Enhancements

### Phase 2 Features
- Mobile application for warehouse staff
- Barcode/QR code scanning for fabric roles
- Advanced analytics and reporting dashboard
- Integration with accounting software
- Quality management system integration

### Phase 3 Features
- Machine learning for production optimization
- Predictive analytics for stock management
- Supplier performance scoring system
- Customer order integration and tracking
- Warehouse layout optimization