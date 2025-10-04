# Fabric Management System - Requirements Document

## Executive Summary

The Fabric Management System is a comprehensive full-stack web application designed to track and manage the entire lifecycle of fabric from procurement to finished garment production. The system provides end-to-end visibility across four interconnected modules: Fabric Income (Vendor Management), Fabric Stock Management, Cutting Process Management, and Worker Process Tracking.

## 1. Project Overview

### 1.1 Purpose
The system streamlines fabric management operations in garment manufacturing by providing:
- Real-time tracking of fabric inventory
- Systematic cutting process workflow management
- Worker-wise operation tracking
- Comprehensive reporting and analytics
- End-to-end visibility of production lifecycle

### 1.2 Target Users
- **Production Managers**: Oversee entire production process
- **Warehouse Staff**: Manage fabric inventory and stock
- **Cutting Department**: Record cutting operations
- **Production Workers**: Track individual work progress
- **Management**: Access reports and analytics

### 1.3 Business Value
- **Inventory Optimization**: Real-time stock tracking prevents overstocking and stockouts
- **Process Efficiency**: Streamlined workflows reduce manual errors and improve productivity
- **Cost Control**: Better tracking of material usage and waste
- **Quality Assurance**: Traceability from procurement to delivery
- **Data-Driven Decisions**: Comprehensive reporting for strategic planning

## 2. System Architecture

### 2.1 Technology Stack

#### Frontend
- **Framework**: React.js 18.2.0
- **UI Library**: React Bootstrap 2.8.0 + Tailwind CSS 3.4.17
- **Icons**: Heroicons 2.2.0, React Icons 5.5.0
- **Charts**: Recharts 2.15.3
- **Forms**: React Bootstrap forms with custom validation
- **Routing**: React Router DOM 6.20.0
- **HTTP Client**: Axios 1.4.0
- **PDF Generation**: jsPDF 3.0.1 + html2canvas 1.4.1
- **CSV Export**: react-csv 2.2.2
- **Date Handling**: react-datepicker 8.3.0

#### Backend
- **Runtime**: Node.js with Express.js 4.19.2
- **Database**: MongoDB with Mongoose 8.3.2
- **Authentication**: JWT 9.0.2 + bcrypt 5.1.1
- **Middleware**: CORS 2.8.5, Morgan 1.10.0
- **Environment**: dotenv 16.4.5

#### Deployment
- **Frontend**: Vercel (configured)
- **Backend**: Node.js hosting
- **Database**: MongoDB Atlas

### 2.2 System Architecture Diagram
```
┌─────────────────┐     ┌────────────────┐     ┌────────────────┐
│                 │     │                │     │                │
│  React Frontend │◄───►│  Express API   │◄───►│  MongoDB Atlas │
│                 │     │                │     │                │
└─────────────────┘     └────────────────┘     └────────────────┘
```

## 3. Functional Requirements

### 3.1 Module 1: Fabric Income Management (Vendor Module)

#### 3.1.1 Core Functionality
- **Vendor Registration**: Create and manage vendor/supplier information
- **Fabric Procurement**: Record fabric purchases with detailed specifications
- **Multi-Color Support**: Track multiple colors per fabric type
- **Bill Management**: Link purchases to vendor bills
- **Contact Information**: Store vendor contact details and GST information

#### 3.1.2 Data Structure
```javascript
{
  shop_name: String (required),
  party_name: String (required),
  contact_number: String,
  address: String,
  gstin: String,
  date_time: Date,
  bill_no: String (required),
  fabricDetails: [{
    name: String (required),
    type: String (required),
    weight_type: 'kg' | 'meter',
    total_weight: Number (required),
    remarks: String,
    fabricColors: [{
      color_name: String (required),
      color_hex: String,
      color_weight: Number (required)
    }]
  }]
}
```

#### 3.1.3 User Stories
- **US-FI-001**: As a warehouse manager, I want to record new fabric purchases so that inventory is updated automatically
- **US-FI-002**: As a procurement officer, I want to track vendor information so that I can maintain supplier relationships
- **US-FI-003**: As a manager, I want to view purchase history so that I can analyze procurement patterns

### 3.2 Module 2: Fabric Stock Management

#### 3.2.1 Core Functionality
- **Real-time Stock Calculation**: Automatic stock updates based on income and consumption
- **Stock Visualization**: Dashboard with charts and tables showing current inventory
- **Color-wise Tracking**: Separate stock tracking for each fabric color
- **Stock Alerts**: Low stock notifications
- **Stock History**: Historical stock movement tracking

#### 3.2.2 Data Structure
```javascript
{
  fabric_name: String (required),
  color: String (required),
  color_hex: String,
  current_quantity: Number (required),
  standard_weight: Number,
  last_updated: Date,
  vendor: ObjectId (reference),
  processed: Boolean,
  processedAt: Date
}
```

#### 3.2.3 User Stories
- **US-FS-001**: As a warehouse manager, I want to see current stock levels so that I can plan procurement
- **US-FS-002**: As a production manager, I want to check fabric availability so that I can plan cutting operations
- **US-FS-003**: As a manager, I want to view stock trends so that I can optimize inventory levels

### 3.3 Module 3: Cutting Process Management

#### 3.3.1 Core Functionality
- **Before Cutting**: Record cutting plans with lot numbers, patterns, and fabric roles
- **After Cutting**: Update with actual cutting results and piece counts
- **Role Management**: Track individual fabric roles used in cutting
- **Size Management**: Support for multiple sizes per cutting batch
- **Cutting Efficiency**: Track expected vs actual output

#### 3.3.2 Data Structure
```javascript
{
  lot_no: String (required, unique),
  pattern: String (required),
  fabric: String (required),
  datetime: Date,
  sizes: [String] (required),
  roles: [{
    role_no: String (required),
    role_weight: Number (required),
    role_color: String (required),
    layers_cut: Number,
    pieces_cut: Number
  }],
  before_cutting_complete: Boolean,
  after_cutting_complete: Boolean,
  total_pieces: Number
}
```

#### 3.3.3 User Stories
- **US-C-001**: As a cutting supervisor, I want to plan cutting operations so that I can allocate resources efficiently
- **US-C-002**: As a cutting operator, I want to record actual cutting results so that I can track efficiency
- **US-C-003**: As a manager, I want to view cutting performance so that I can optimize processes

### 3.4 Module 4: Worker Process Tracking

#### 3.4.1 Core Functionality
- **Process Output Recording**: Track worker operations and piece counts
- **Load Management**: Manage production loads and lot tracking
- **Worker Performance**: Monitor individual worker productivity
- **Quality Control**: Track pass/fail rates
- **Process Analytics**: Generate performance reports

#### 3.4.2 Data Structure
```javascript
{
  loadId: String (required),
  lotNo: String (required),
  size: String (required),
  processItems: [{
    color: String (required),
    expectedQuantity: Number (required),
    actualQuantity: Number (required),
    difference: Number (required)
  }],
  workerName: String (required),
  completedBy: String,
  completedAt: Date
}
```

#### 3.4.3 User Stories
- **US-WP-001**: As a line supervisor, I want to record worker output so that I can track productivity
- **US-WP-002**: As a worker, I want to log my completed work so that my performance is recorded
- **US-WP-003**: As a manager, I want to view worker performance so that I can identify training needs

### 3.5 Module 5: Delivery Management

#### 3.5.1 Core Functionality
- **Delivery Creation**: Create delivery orders with customer information
- **Item Tracking**: Link delivery items to production lots
- **Status Management**: Track delivery status (pending, delivered, cancelled)
- **Customer Management**: Store customer information
- **Delivery Reports**: Generate delivery summaries

#### 3.5.2 Data Structure
```javascript
{
  deliveryNumber: String (required, unique),
  customerName: String (required),
  deliveryDate: Date (required),
  status: 'pending' | 'delivered' | 'cancelled',
  items: [{
    lotNo: String (required),
    pattern: String (required),
    size: String (required),
    color: String (required),
    quantity: Number (required),
    processOutputId: ObjectId (reference)
  }],
  totalQuantity: Number,
  remarks: String,
  createdBy: String
}
```

### 3.6 Module 6: Reporting and Analytics

#### 3.6.1 Core Functionality
- **Output Reports**: Production output summaries
- **Delivery Reports**: Delivery performance analytics
- **Stock Reports**: Inventory status and trends
- **Export Capabilities**: PDF and CSV export
- **Data Visualization**: Charts and graphs for key metrics

## 4. Non-Functional Requirements

### 4.1 Performance Requirements
- **Response Time**: API responses within 2 seconds
- **Concurrent Users**: Support for 50+ simultaneous users
- **Data Volume**: Handle 10,000+ records efficiently
- **Uptime**: 99.5% availability

### 4.2 Security Requirements
- **Authentication**: JWT-based authentication (partially implemented)
- **Data Validation**: Input validation on all forms
- **CORS**: Proper CORS configuration for API access
- **Data Privacy**: Secure handling of business data

### 4.3 Usability Requirements
- **Responsive Design**: Mobile-friendly interface
- **Intuitive Navigation**: Clear menu structure and breadcrumbs
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback for async operations

### 4.4 Scalability Requirements
- **Modular Architecture**: Easy to extend with new features
- **Database Optimization**: Efficient queries and indexing
- **Code Organization**: Maintainable and well-structured codebase

## 5. User Interface Requirements

### 5.1 Design Principles
- **Clean and Modern**: Professional appearance suitable for business use
- **Consistent**: Uniform design language across all modules
- **Accessible**: WCAG 2.1 AA compliance
- **Responsive**: Works on desktop, tablet, and mobile devices

### 5.2 Navigation Structure
```
Fabric Management System
├── Fabric Income
│   ├── Fabric Income List
│   └── Add Fabric Income
├── Fabric Stock
├── Cutting
│   ├── Cutting List
│   ├── Before Cutting
│   ├── Cutting Stock
│   └── Inline Stock
├── Worker Process
│   └── Output
├── Delivery
│   ├── Delivery List
│   └── New Delivery
└── Reports
    ├── Output Reports
    └── Delivery Reports
```

### 5.3 Key UI Components
- **Dashboard Cards**: Summary information with visual indicators
- **Data Tables**: Sortable and filterable data presentation
- **Forms**: Multi-step forms with validation
- **Charts**: Bar charts, pie charts, and line graphs
- **Modals**: Confirmation dialogs and quick actions
- **Notifications**: Success, error, and warning messages

## 6. Data Requirements

### 6.1 Database Schema
The system uses MongoDB with the following collections:
- **Parties**: Vendor/supplier information
- **FabricStock**: Current inventory levels
- **Cutting**: Cutting process records
- **CuttingTracking**: Detailed cutting tracking
- **ProcessOutput**: Worker process records
- **Delivery**: Delivery management
- **InlineStock**: Inline stock tracking
- **WorkerProcess**: Worker performance data

### 6.2 Data Integrity
- **Referential Integrity**: Proper relationships between collections
- **Data Validation**: Schema-level validation rules
- **Audit Trail**: Timestamps for all records
- **Backup Strategy**: Regular database backups

## 7. Integration Requirements

### 7.1 External Systems
- **MongoDB Atlas**: Cloud database hosting
- **Vercel**: Frontend deployment platform
- **Email Service**: For notifications (future enhancement)
- **SMS Service**: For alerts (future enhancement)

### 7.2 API Requirements
- **RESTful Design**: Standard HTTP methods and status codes
- **JSON Format**: All API responses in JSON format
- **Error Handling**: Consistent error response format
- **Documentation**: API documentation for developers

## 8. Testing Requirements

### 8.1 Testing Strategy
- **Unit Testing**: Component and function testing
- **Integration Testing**: API endpoint testing
- **End-to-End Testing**: Complete user workflow testing
- **Performance Testing**: Load and stress testing

### 8.2 Test Coverage
- **Frontend**: 80% code coverage for React components
- **Backend**: 85% code coverage for API endpoints
- **Critical Paths**: 100% coverage for business-critical functions

## 9. Deployment Requirements

### 9.1 Environment Setup
- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live application environment

### 9.2 Deployment Process
- **Automated Deployment**: CI/CD pipeline integration
- **Environment Variables**: Secure configuration management
- **Health Checks**: Application health monitoring
- **Rollback Strategy**: Quick rollback capabilities

## 10. Maintenance and Support

### 10.1 Monitoring Requirements
- **Application Monitoring**: Performance and error tracking
- **Database Monitoring**: Query performance and storage
- **User Analytics**: Usage patterns and feature adoption
- **Security Monitoring**: Threat detection and prevention

### 10.2 Support Requirements
- **Documentation**: Comprehensive user and technical documentation
- **Training Materials**: User training guides and videos
- **Help System**: In-app help and FAQ
- **Support Channels**: Email and ticketing system

## 11. Future Enhancements

### 11.1 Phase 2 Features
- **Mobile Application**: Native mobile app for shop floor usage
- **Barcode Integration**: QR code scanning for fabric roles
- **Advanced Analytics**: Machine learning for production optimization
- **Supplier Portal**: Vendor self-service portal
- **Quality Management**: Integrated quality control system

### 11.2 Phase 3 Features
- **Predictive Analytics**: AI-powered demand forecasting
- **IoT Integration**: Smart sensors for real-time monitoring
- **Blockchain**: Supply chain transparency
- **Multi-language Support**: Internationalization
- **Advanced Reporting**: Custom report builder

## 12. Success Criteria

### 12.1 Business Metrics
- **Inventory Accuracy**: 95%+ stock accuracy
- **Process Efficiency**: 20% reduction in manual data entry
- **User Adoption**: 90%+ user adoption rate
- **Data Quality**: 99%+ data integrity

### 12.2 Technical Metrics
- **System Performance**: <2 second response times
- **Uptime**: 99.5% availability
- **Bug Rate**: <5% defect rate
- **User Satisfaction**: 4.5/5 rating

## 13. Risk Assessment

### 13.1 Technical Risks
- **Data Migration**: Complex data migration from existing systems
- **Performance**: Handling large data volumes
- **Integration**: Third-party system integration challenges
- **Security**: Data security and privacy concerns

### 13.2 Business Risks
- **User Adoption**: Resistance to change from existing processes
- **Training**: User training and onboarding challenges
- **Data Quality**: Inconsistent or incomplete data
- **Scope Creep**: Feature creep during development

## 14. Conclusion

The Fabric Management System provides a comprehensive solution for garment manufacturing operations, offering end-to-end visibility and control over the fabric lifecycle. The modular architecture ensures scalability and maintainability, while the modern technology stack provides performance and reliability.

The system addresses key business challenges including inventory management, process efficiency, quality control, and cost optimization. With proper implementation and user adoption, the system will deliver significant business value and competitive advantages.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Prepared By**: AI Assistant  
**Review Status**: Draft
