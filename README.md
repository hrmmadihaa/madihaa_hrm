# Madihaa HRMS

Enterprise-grade Human Resource Management System for Male' Water and Sewerage Company (MWSC).

## Overview

Madihaa HRMS is a comprehensive, cloud-based HR management solution designed to streamline and automate HR processes while improving efficiency, governance, data management, reporting, and user experience.

## Features

### Core Modules

- **Employee Management**: Complete employee profiles, employment records, education, medical info, and document management
- **Attendance Management**: Biometric integration, web/mobile check-in/out, shift management, and attendance tracking
- **Leave Management**: Multiple leave types, approval workflows, leave balances, carry-forward, and dashboard with real-time insights
- **Payroll**: Salary processing, allowances, deductions, pension calculation, area-based filtering, and custom employee ordering
- **Overtime**: OT requests, pre-approval workflows, calculations, and reporting
- **Reports & Analytics**: Custom report builder, historical reporting, trend analysis, and export capabilities

### Key Features

- **Role-Based Access Control (RBAC)**: 5 user roles with granular permissions
- **Multi-Device Support**: Desktop, tablet, mobile, and PWA
- **Real-time Notifications**: Email and push notifications
- **Document Generation**: ID cards, appointment letters, payslips, and HR chits
- **Export Options**: PDF, Excel, and CSV exports
- **Modern UI/UX**: Responsive design with smooth animations

## Tech Stack

### Frontend
- **React (Vite)**: Modern React framework with TypeScript
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Recharts**: Chart library for analytics
- **Lucide React**: Icon library

### Backend
- **Firebase Authentication**: User authentication and authorization
- **Firebase Firestore**: NoSQL database for data storage
- **Firebase Storage**: File storage for documents
- **Firebase Cloud Functions**: Server-side logic (to be implemented)
- **Firebase Cloud Messaging**: Push notifications (to be configured)

### Deployment
- **Development**: Local environment
- **Production**: Vercel
- **Future**: Android Play Store and Apple App Store

## Documentation

- **[User Manual](USER_MANUAL.md)**: Comprehensive guide for using all HRMS features
- **[Changelog](CHANGELOG.md)**: Version history and recent updates
- **[Roles and Access](ROLES_AND_ACCESS.md)**: Detailed explanation of user roles and permissions
- **[Excel Import Guide](EXCEL_IMPORT_GUIDE.md)**: Guide for importing data from Excel files
- **[Attendance Upload Rules](ATTENDANCE_UPLOAD_RULES.md)**: Rules for attendance data uploads

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mwse-hrms
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Enable Storage
   - Copy your Firebase configuration

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
mwse-hrms/
├── public/
│   ├── manifest.json      # PWA manifest
│   └── sw.js             # Service worker
├── src/
│   ├── components/
│   │   ├── Layout/       # Layout components
│   │   ├── ui/           # Reusable UI components
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── firebase.ts   # Firebase configuration
│   │   ├── auth.ts       # Authentication functions
│   │   ├── employees.ts  # Employee CRUD operations
│   │   ├── attendance.ts # Attendance functions
│   │   ├── leave.ts      # Leave management
│   │   ├── payroll.ts    # Payroll functions
│   │   ├── overtime.ts   # Overtime management
│   │   └── reports.ts    # Report generation
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Employees.tsx
│   │   ├── Attendance.tsx
│   │   ├── Leave.tsx
│   │   ├── Payroll.tsx
│   │   ├── Overtime.tsx
│   │   └── Reports.tsx
│   ├── types/
│   │   └── index.ts      # TypeScript type definitions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## User Roles

1. **Super Administrator**: Full system access and management
2. **HR Manager**: Manage employees, attendance, leaves, payroll, and approvals
3. **Department Manager**: View and manage department-specific data
4. **Supervisor**: Approve team leaves and overtime requests
5. **Employee**: View own profile, attendance, payslips, and submit requests

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

### PWA Installation

The application supports PWA installation on mobile devices. Users can install it from their browser's "Add to Home Screen" option.

## Data Migration

The system includes utilities for:
- Data assessment and mapping
- Validation and reconciliation
- Clean data transformation
- Bulk data import

## Security Features

- Role-Based Access Control (RBAC)
- Two-Factor Authentication (2FA) - to be implemented
- Password policies
- Audit logs
- Automated backups
- Data encryption

## Future Enhancements

- Firebase Cloud Functions for backend logic
- Firebase Cloud Messaging for notifications
- Multi-language support (English/Dhivehi)
- Native mobile apps (Android/iOS)
- Advanced analytics and AI-powered insights
- Integration with biometric systems

## Support

For technical support or questions, please contact the development team.

## License

Copyright © 2024 Male' Water and Sewerage Company. All rights reserved.
