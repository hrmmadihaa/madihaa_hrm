import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Search, Menu, X, Info, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

const manualContent = {
  introduction: {
    title: 'Introduction',
    content: 'Madihaa HRMS is a comprehensive Human Resource Management System designed for Madihaa Company (PTE) Ltd. This manual provides detailed instructions on using the system\'s key features.',
    details: [
      'The system is designed to streamline HR processes and improve efficiency',
      'Provides real-time access to employee information and HR data',
      'Supports multiple user roles with appropriate access controls',
      'Accessible from desktop, tablet, and mobile devices'
    ]
  },
  gettingStarted: {
    title: 'Getting Started',
    sections: [
      {
        subtitle: 'Login',
        content: 'Navigate to the application URL, enter your email and password, and click "Sign In". You will be redirected to the Dashboard based on your role.',
        steps: [
          'Open your web browser and navigate to the Madihaa HRMS URL',
          'Enter your registered email address in the email field',
          'Enter your password in the password field',
          'Click the "Sign In" button',
          'If credentials are correct, you will be redirected to your dashboard'
        ]
      },
      {
        subtitle: 'Navigation',
        content: 'Use the sidebar to navigate between modules. Each module has its own dedicated page. Your access to features depends on your user role.',
        tips: [
          'The sidebar is located on the left side of the screen',
          'Click on any menu item to navigate to that module',
          'Mobile users can access the sidebar via the hamburger menu',
          'Your role determines which modules you can access'
        ]
      }
    ]
  },
  dashboard: {
    title: 'Dashboard',
    sections: [
      {
        subtitle: 'Key Metrics',
        content: 'The Dashboard provides an overview of key HR metrics including total employees, employees on leave, pending leave requests, pending overtime requests, and recent activities.',
        metrics: [
          'Total Employees: Shows the count of all active employees in the system',
          'Employees on Leave: Displays the number of staff currently on approved leave',
          'Pending Leave Requests: Shows leave requests awaiting approval',
          'Pending Overtime Requests: Displays overtime requests awaiting approval',
          'Recent Activities: Lists the latest system activities and updates'
        ]
      },
      {
        subtitle: 'Quick Actions',
        content: 'Quick links to frequently used modules, access to recent employee records, and shortcuts to pending approvals.',
        actions: [
          'Add Employee: Quick link to add a new employee',
          'Request Leave: Quick link to submit a leave request',
          'View Reports: Quick access to HR reports',
          'Pending Approvals: Direct access to items needing approval'
        ]
      }
    ]
  },
  employees: {
    title: 'Employee Management',
    sections: [
      {
        subtitle: 'Adding a New Employee',
        content: 'Navigate to the Employees page, click "Add Employee", fill in personal information, employment details, contact information, education, and medical information. Upload required documents and click "Save".',
        steps: [
          'Go to the Employees page from the sidebar',
          'Click the "Add Employee" button in the top right',
          'Fill in Personal Information: Name, DOB, gender, nationality, contact details',
          'Fill in Employment Details: Employee ID, join date, department, job title, work location',
          'Fill in Contact Information: Phone, email, emergency contact',
          'Fill in Education: Qualifications, institutions, dates',
          'Fill in Medical Information: Blood type, allergies, medical conditions',
          'Upload required documents (photo, ID, certificates)',
          'Click "Save" to create the employee record'
        ]
      },
      {
        subtitle: 'Viewing Employee Details',
        content: 'Use the search box to find an employee by name or ID, click on an employee\'s name to view their full profile with all information organized in tabs.',
        tabs: [
          'Personal Information: Basic employee details',
          'Employment Details: Job-related information',
          'Contact Information: Phone, email, emergency contacts',
          'Education: Academic qualifications',
          'Medical: Health-related information',
          'Documents: Uploaded files and certificates'
        ]
      },
      {
        subtitle: 'Editing Employee Information',
        content: 'Find and select the employee, click "Edit", modify the required fields, and click "Update" to save changes.',
        note: 'Changes are saved immediately and reflected across the system.'
      }
    ]
  },
  attendance: {
    title: 'Attendance Management',
    sections: [
      {
        subtitle: 'Viewing Attendance',
        content: 'Select the date range and view attendance records showing employee name, ID, check-in time, check-out time, total hours worked, and attendance status.',
        statuses: [
          'Present: Employee attended work on time',
          'Absent: Employee did not attend work',
          'Late: Employee arrived after scheduled time',
          'Half-day: Employee worked only half the scheduled time'
        ]
      },
      {
        subtitle: 'Manual Attendance Entry',
        content: 'Click "Add Attendance", select the employee, enter check-in and check-out times, add notes if necessary, and click "Save".',
        note: 'Manual entry is used when biometric data is unavailable or needs correction.'
      },
      {
        subtitle: 'Attendance Adjustments',
        content: 'Find the attendance record to adjust, click "Edit" or "Adjust", modify the times or status, add reason for adjustment, and submit for approval if required.',
        warning: 'All adjustments require a reason for audit purposes.'
      }
    ]
  },
  leave: {
    title: 'Leave Management',
    sections: [
      {
        subtitle: 'Dashboard Overview',
        content: 'The Dashboard is the default view showing summary cards for staff on leave, ending in 5/10/15 days, and upcoming leaves. Click cards to filter tables.',
        cards: [
          'Staff on Leave: Total count of employees currently on approved leave',
          'Ending in 5 Days: Critical - staff returning within 5 days',
          'Ending in 10 Days: Warning - staff returning within 6-10 days',
          'Ending in 15 Days: Soon - staff returning within 11-15 days',
          'Upcoming Leaves: Staff with approved leaves starting within 30 days'
        ]
      },
      {
        subtitle: 'Staff Currently on Leave Table',
        content: 'Displays all employees currently on approved leave with employee name, ID, leave type, start/end dates, and days remaining. Sorted by days remaining (less to more).',
        columns: [
          'Employee: Name of the staff member',
          'Employee ID: Unique identification number',
          'Leave Type: Type of leave with color-coded badge',
          'Start Date: When the leave began',
          'End Date: When the leave ends',
          'Days Remaining: How many days until return'
        ]
      },
      {
        subtitle: 'Annual Leave Ending Soon Table',
        content: 'Displays staff whose annual leave ends within 15 days with color-coded status indicators (Critical, Warning, Soon). Click summary cards to filter.',
        statusColors: [
          'Critical (Red): Ending in 5 days or less',
          'Warning (Orange): Ending in 6-10 days',
          'Soon (Yellow): Ending in 11-15 days'
        ]
      },
      {
        subtitle: 'Requesting Leave',
        content: 'Click "Request Leave", fill in employee, leave type, start/end dates, and reason, then click "Submit".',
        leaveTypes: [
          'Annual: Regular annual leave based on nationality',
          'Medical Sick leave with medical certificate',
          'Emergency: Urgent personal matters',
          'Duty: Official duty assignments',
          'Unpaid: Leave without pay',
          'Maternity: For female employees',
          'Paternity: For male employees',
          'Compassionate: For family emergencies'
        ]
      },
      {
        subtitle: 'Annual Leave Plan',
        content: 'Shows staff leave accumulation based on nationality: Indian & Maldivian staff get 30 days after 1 year, Bangladeshi staff get 60 days after 2 years.',
        rules: [
          'Indian & Maldivian: 30 days after 1 year of service',
          'Bangladeshi: 60 days after 2 years of service',
          'Leave accumulates based on completed service periods'
        ]
      }
    ]
  },
  salary: {
    title: 'Salary Management',
    sections: [
      {
        subtitle: 'Area Filters',
        content: 'Use filters to organize employees by work location and job level: All Areas, Male-Junior, Hulhumale-Junior, Male-Senior, Hulhumale-Senior, Batuta Maldives, Madi Grand, Bokaifushi, and Local.',
        filters: [
          'All Areas: Shows all active employees',
          'Male-Junior: Male work site, Junior level (excludes Maldivians)',
          'Hulhumale-Junior: Hulhumale work site, Junior level (excludes Maldivians)',
          'Male-Senior: Male work site, Senior level (excludes Maldivians)',
          'Hulhumale-Senior: Hulhumale work site, Senior level (excludes Maldivians)',
          'Batuta Maldives: Batuta work site (includes Maldivians)',
          'Madi Grand: Madi Grand work site (includes Maldivians)',
          'Bokaifushi: Bokaifushi work site (excludes Maldivians)',
          'Local: Maldivian employees only'
        ]
      },
      {
        subtitle: 'Custom Employee Ordering',
        content: 'Super Admins can arrange employees in custom order for each filter group using the "Arrange Order" button. Set order numbers and save.',
        steps: [
          'Select the desired area filter',
          'Click "Arrange Order" button',
          'Use search to find specific employees',
          'Enter order number for each employee',
          'Click "Save Order" to save arrangement'
        ]
      },
      {
        subtitle: 'Pension Calculation',
        content: 'Automatically calculated as 7% of basic salary for Maldivian employees under 65 years old. Based on country and date of birth, recalculated dynamically.',
        rules: [
          'Eligibility: Maldivian employees under 65 years old',
          'Rate: 7% of basic salary',
          'Calculation: Based on country and date of birth',
          'Dynamic: Recalculated in real-time'
        ]
      }
    ]
  },
  overtime: {
    title: 'Overtime Management',
    sections: [
      {
        subtitle: 'Requesting Overtime',
        content: 'Click "Request Overtime", fill in employee, date, start/end time, and reason, then click "Submit".',
        note: 'Overtime requests require approval before being processed.'
      },
      {
        subtitle: 'Approving Overtime',
        content: 'Navigate to the "Pending" tab, review the request, click "Approve" or "Reject", add comments, and click "Confirm".',
        workflow: [
          'Requests appear in the Pending tab',
          'Review the details and reason',
          'Approve or reject based on business needs',
          'Add comments for audit trail',
          'Confirm the decision'
        ]
      }
    ]
  },
  accommodation: {
    title: 'Accommodation Management',
    sections: [
      {
        subtitle: 'Adding Accommodation',
        content: 'Click "Add Accommodation", enter building name, floor number, room number, capacity, and amenities, then click "Save".',
        fields: [
          'Building name: Name of the accommodation building',
          'Floor number: Floor level',
          'Room number: Room identifier',
          'Capacity: Maximum occupants',
          'Amenities: Available facilities'
        ]
      },
      {
        subtitle: 'Assigning Employee to Room',
        content: 'Select a room, click "Assign Employee", select the employee, set assignment date, and click "Save".',
        note: 'Track room occupancy and availability in real-time.'
      }
    ]
  },
  recruitment: {
    title: 'Recruitment',
    sections: [
      {
        subtitle: 'Creating Job Requisition',
        content: 'Click "Create Requisition", fill in job title, department, description, requirements, salary range, and start date, then submit for approval.',
        details: [
          'Job title: Position name',
          'Department: Hiring department',
          'Job description: Role responsibilities',
          'Requirements: Qualifications needed',
          'Salary range: Expected compensation',
          'Start date: Position start date'
        ]
      },
      {
        subtitle: 'Recruitment Pipeline',
        content: 'View applications by status, review candidate profiles, move candidates through pipeline stages (Applied, Screening, Interview, Assessment, Offer, Hired, Rejected).',
        stages: [
          'Applied: Initial application received',
          'Screening: Initial review of qualifications',
          'Interview: Candidate interview scheduled',
          'Assessment: Skills or background check',
          'Offer: Job offer extended',
          'Hired: Candidate accepted offer',
          'Rejected: Candidate not selected'
        ]
      }
    ]
  },
  training: {
    title: 'Training',
    sections: [
      {
        subtitle: 'Creating Training Programs',
        content: 'Click "Add Training", enter training title, description, dates, location, instructor, and maximum participants, then click "Save".',
        fields: [
          'Training title: Name of the training program',
          'Description: Training objectives and content',
          'Start/End dates: Training schedule',
          'Location: Training venue',
          'Instructor: Trainer information',
          'Maximum participants: Capacity limit'
        ]
      },
      {
        subtitle: 'Assigning Employees',
        content: 'Select a training program, click "Assign Employees", select employees to enroll, and click "Save".',
        note: 'Track attendance and completion status for each participant.'
      }
    ]
  },
  performance: {
    title: 'Performance Management',
    sections: [
      {
        subtitle: 'Creating Performance Reviews',
        content: 'Click "Add Review", select the employee, set review period, add performance criteria, and click "Save".',
        criteria: [
          'Job knowledge and skills',
          'Quality of work',
          'Productivity',
          'Communication',
          'Teamwork',
          'Attendance and punctuality'
        ]
      },
      {
        subtitle: 'Conducting Reviews',
        content: 'Select an employee review, rate performance on criteria, add comments and feedback, set overall rating, and submit for approval.',
        ratings: [
          'Excellent: Exceeds expectations',
          'Good: Meets expectations',
          'Satisfactory: Meets minimum requirements',
          'Needs Improvement: Below expectations',
          'Poor: Significantly below expectations'
        ]
      }
    ]
  },
  disciplinary: {
    title: 'Disciplinary Management',
    sections: [
      {
        subtitle: 'Recording Disciplinary Actions',
        content: 'Click "Add Record", select the employee, enter type of infraction, date of incident, description, action taken, and warning level, then click "Save".',
        warningLevels: [
          'Verbal Warning: First offense',
          'Written Warning: Repeated offense',
          'Final Warning: Serious offense',
          'Suspension: Severe violation',
          'Termination: Most serious violations'
        ]
      }
    ]
  },
  ticketing: {
    title: 'Ticketing',
    sections: [
      {
        subtitle: 'Creating Ticket Requests',
        content: 'Click "Request Ticket", enter travel details including departure/destination cities, dates, ticket type, number of passengers, and special requests, then click "Submit".',
        details: [
          'Departure city: Where the journey begins',
          'Destination city: Final destination',
          'Departure/Return dates: Travel schedule',
          'Ticket type: One-way or round-trip',
          'Passengers: Number of travelers',
          'Special requests: Additional requirements'
        ]
      }
    ]
  },
  fleet: {
    title: 'Fleet Management',
    sections: [
      {
        subtitle: 'Vehicle Management',
        content: 'Navigate to Fleet Vehicles, click "Add Vehicle", enter vehicle type, make and model, registration number, capacity, and fuel type, then click "Save".',
        note: 'Track vehicle maintenance and usage history.'
      },
      {
        subtitle: 'License Management',
        content: 'Navigate to Fleet Licenses, add driver license information, set expiration dates, and track license renewals.',
        alert: 'Ensure licenses are renewed before expiration.'
      }
    ]
  },
  workLocation: {
    title: 'Work Location Management',
    sections: [
      {
        subtitle: 'Adding Work Locations',
        content: 'Click "Add Location", enter location name, address, type, and contact information, then click "Save".',
        types: [
          'Office: Administrative locations',
          'Site: Work sites and facilities',
          'Warehouse: Storage locations',
          'Remote: Off-site work locations'
        ]
      }
    ]
  },
  medical: {
    title: 'Medical Management',
    sections: [
      {
        subtitle: 'Medical History',
        content: 'Navigate to Medical History, select an employee, and view medical information including blood type, allergies, medical conditions, and vaccination records.',
        importance: 'Critical for emergency situations and workplace safety.'
      },
      {
        subtitle: 'Medical Requisitions',
        content: 'Click "Add Requisition", enter employee, type of medical service, date, and reason, then submit for approval.',
        note: 'All medical services require approval before processing.'
      }
    ]
  },
  reports: {
    title: 'Reports',
    sections: [
      {
        subtitle: 'Generating Reports',
        content: 'Navigate to the Reports page, select the report type, set parameters (date range, filters), click "Generate", view the report, and export to PDF, Excel, or CSV.',
        reportTypes: [
          'Employee reports: Staff demographics and statistics',
          'Attendance reports: Attendance patterns and summaries',
          'Leave reports: Leave usage and balances',
          'Payroll reports: Salary and compensation data',
          'Overtime reports: OT hours and costs',
          'Performance reports: Review summaries and trends'
        ]
      }
    ]
  },
  userManagement: {
    title: 'User Management',
    sections: [
      {
        subtitle: 'Adding Users',
        content: 'Click "Add User", enter email, name, role (Super Admin, HR Manager, Dept Manager, Supervisor, Employee), department if applicable, set temporary password, and click "Save".',
        roles: [
          'Super Admin: Full system access',
          'HR Manager: HR operations access',
          'Department Manager: Department-level access',
          'Supervisor: Team-level access',
          'Employee: Self-view only'
        ]
      }
    ]
  },
  formsAndLetters: {
    title: 'Forms and Letters',
    sections: [
      {
        subtitle: 'Generating Documents',
        content: 'Navigate to Forms and Letters, select the document type (Offer Letters, Appointment Letters, Termination Letters, etc.), choose an employee, fill in required details, preview the document, and download or print.',
        documents: [
          'Offer Letters: Employment offers',
          'Appointment Letters: Job appointments',
          'Termination Letters: Employment termination',
          'Probation Non-Renewal Letters: Probation ending',
          'Holiday Status Letters: Leave confirmation'
        ]
      }
    ]
  },
  payroll: {
    title: 'Payroll',
    sections: [
      {
        subtitle: 'Processing Payroll',
        content: 'Navigate to Payroll, select the pay period (month/year), click "Generate Payroll" to process salaries, review records, click "Process Payroll" to finalize. Status changes from draft to processed to approved to paid.',
        steps: [
          'Select month and year',
          'Click "Generate Payroll"',
          'Review generated records',
          'Click "Process Payroll"',
          'Status updates to processed',
          'Approve when ready',
          'Mark as paid after payment'
        ]
      },
      {
        subtitle: 'Generating Payslips',
        content: 'Find the employee\'s payroll record, click "Download Payslip" or "Print Payslip". The payslip is generated as PDF with employee details, payment period, earnings breakdown, deductions breakdown, and net salary.',
        note: 'Payslips can be downloaded individually or in bulk.'
      }
    ]
  },
  recruitmentPipeline: {
    title: 'Recruitment Pipeline',
    sections: [
      {
        subtitle: 'Pipeline Stages',
        content: 'Candidates move through stages: CV Received, Shortlisted, Interview Scheduled, Interview Completed, Offer Letter Sent, Offer Signed, Work Permit Applied, Payment Pending, Payment Completed, Entry Pass Pending, Entry Pass Received, Ticket Purchased, Ticket Approved, Departed, Van Arranged, Airport Pickup, Arrived, Added to Directory.',
        stages: [
          'CV Received: Initial application received',
          'Shortlisted: Candidate selected for interview',
          'Interview Scheduled: Interview date set',
          'Interview Completed: Interview conducted',
          'Offer Letter Sent: Offer letter generated and sent',
          'Offer Signed: Candidate accepted offer',
          'Work Permit Applied: Work permit application submitted',
          'Payment Pending: Work permit payment pending',
          'Payment Completed: Work permit payment done',
          'Entry Pass Pending: Entry pass application in progress',
          'Entry Pass Received: Entry pass approved',
          'Ticket Purchased: Flight ticket booked',
          'Ticket Approved: Ticket approved',
          'Departed: Candidate departed from home country',
          'Van Arranged: Airport pickup van arranged',
          'Airport Pickup: Airport pickup scheduled',
          'Arrived: Candidate arrived in Maldives',
          'Added to Directory: Candidate onboarded as employee'
        ]
      },
      {
        subtitle: 'Adding Candidates',
        content: 'Click "Add Candidate", fill in candidate details including name, employee ID, position, salary, nationality, DOB, gender, passport details, contact information, emergency contact, and date of joining.',
        fields: [
          'Name: Full name of candidate',
          'Employee ID: Unique identifier',
          'Position: Job title',
          'Salary: Expected compensation',
          'Nationality: Country of origin',
          'Passport details: Number, issue/expiry dates'
        ]
      }
    ]
  },
  staffDisciplinary: {
    title: 'Staff Disciplinary',
    sections: [
      {
        subtitle: 'Viewing Disciplinary Records',
        content: 'Navigate to Staff Disciplinary to view personal disciplinary history, check warning status, view disciplinary action details, sign disciplinary records if required, and print disciplinary reports.',
        note: 'Employees can only view their own disciplinary records.'
      },
      {
        subtitle: 'Signing Disciplinary Records',
        content: 'Click "Sign" on pending records, add your signature if required, and click "Save".',
        warning: 'Signatures are legally binding and cannot be removed once added.'
      }
    ]
  },
  petrolRequests: {
    title: 'Petrol Requests',
    sections: [
      {
        subtitle: 'Creating Petrol Requests',
        content: 'Click "Add Request", fill in request date, vehicle number, vehicle type, driver name, driver employee ID, KM start, KM end, petrol amount, receipt number, and requested by. KM End must be greater than KM Start.',
        fields: [
          'Request date: Date of fuel request',
          'Vehicle number: Vehicle registration',
          'Driver name: Driver\'s full name',
          'KM start: Starting odometer reading',
          'KM end: Ending odometer reading',
          'Petrol amount: Fuel cost'
        ]
      },
      {
        subtitle: 'Printing Petrol Slips',
        content: 'Find the approved request, click "Print Slip". The slip is generated with slip number (auto-generated), vehicle details, driver details, KM readings, and fuel amount.',
        note: 'Slip numbers are generated sequentially for tracking.'
      }
    ]
  },
  organizationChart: {
    title: 'Organization Chart',
    sections: [
      {
        subtitle: 'Viewing Organization Chart',
        content: 'Select a work location from the dropdown to view the organizational tree structure. Use zoom in/out, pan by dragging, and expand/collapse nodes to navigate the chart.',
        tips: [
          'Click employee nodes to expand or collapse subordinates',
          'Use mouse wheel to zoom in and out',
          'Click and drag to pan around the chart',
          'Root node shows the head of the location'
        ]
      }
    ]
  },
  digitalPersonnelFiles: {
    title: 'Digital Personnel Files',
    sections: [
      {
        subtitle: 'Overview Tab',
        content: 'Shows summary statistics: total expiring documents, expired documents, active alerts, and personnel file summary.',
        metrics: [
          'Total expiring documents',
          'Expired documents',
          'Active alerts',
          'Personnel file summary'
        ]
      },
      {
        subtitle: 'Expiring Documents Tab',
        content: 'View documents expiring soon with employee name, document type, expiry date, days until expiry, and status.',
        note: 'Documents expiring within 90 days are flagged as expiring.'
      },
      {
        subtitle: 'Alerts Tab',
        content: 'View active alerts with alert type (urgent, warning, expired), employee name, document type, expiry date, and message. Click "Acknowledge" to mark alerts as read.',
        alert: 'Regularly review alerts to ensure documents are renewed on time.'
      }
    ]
  },
  bonusManagement: {
    title: 'Bonus Management',
    sections: [
      {
        subtitle: 'Creating Bonus',
        content: 'Click "Create Bonus" tab, select employees (by search, work location, or select all), enter individual or bulk bonus amount, bonus date, and description. Click "Preview" then "Save".',
        steps: [
          'Select employees using search or location',
          'Enter bonus amount (individual or bulk)',
          'Set bonus date and description',
          'Click "Preview" to see breakdown',
          'Click "Save" to create records'
        ]
      },
      {
        subtitle: 'Adjustment Mode',
        content: 'Enable "Adjustment Mode" to set different amounts per employee. Reduced employees are marked and excluded from redistribution.',
        note: 'Use adjustment mode when some employees should receive different amounts.'
      }
    ]
  },
  deductions: {
    title: 'Deductions',
    sections: [
      {
        subtitle: 'Creating Deduction',
        content: 'Click "Create" tab, fill in employee, deduction name, amount, type (fixed or percentage), month, year, recurring status, number of months if recurring, and reason.',
        fields: [
          'Employee: Select from dropdown',
          'Deduction name: Name of the deduction',
          'Amount: Deduction value',
          'Type: Fixed or percentage of salary',
          'Is recurring: Apply for multiple months'
        ]
      },
      {
        subtitle: 'Recurring Deductions',
        content: 'Select "Is recurring" and enter number of months. The deduction will be applied for the specified number of months, with each month tracked separately.',
        warning: 'Ensure the total deduction amount does not exceed legal limits.'
      }
    ]
  },
  fridayDuty: {
    title: 'Friday Duty',
    sections: [
      {
        subtitle: 'Setting Duty Status',
        content: 'Find the employee and date, click the status dropdown, select On (working), Off (off duty), or Holiday (public holiday), add remarks if needed. Status is saved automatically.',
        statuses: [
          'On: Employee working on Friday',
          'Off: Employee off duty on Friday',
          'Holiday: Public holiday'
        ]
      },
      {
        subtitle: 'Filtering by Work Location',
        content: 'Use the work location dropdown to select specific location or "All". Schedule updates to show employees from selected location.',
        note: 'Schedule shows past 4 Fridays and next Friday.'
      }
    ]
  },
  settlement: {
    title: 'Settlement',
    sections: [
      {
        subtitle: 'Creating Settlement',
        content: 'Employee details are auto-populated. Enter settlement month, last working date, salary days, salary divisor. Load attendance and overtime data. Enter leave balances and other details. Click "Calculate" then "Print".',
        steps: [
          'Enter settlement details',
          'Load attendance data for the period',
          'Load overtime data for the period',
          'Enter leave balances (MC, EL, AL, etc.)',
          'Enter overtime amount, hours, rate',
          'Enter food allowance details',
          'Click "Calculate" to compute settlement',
          'Click "Print" to generate letter'
        ]
      },
      {
        subtitle: 'Settlement Calculation',
        content: 'The system calculates salary based on salary days and divisor, overtime pay based on hours and rate, food allowance based on days, total earnings, total deductions, and net settlement amount.',
        importance: 'Ensure all attendance and overtime data is loaded accurately for correct calculation.'
      }
    ]
  },
  employeeLifecycle: {
    title: 'Employee Lifecycle',
    sections: [
      {
        subtitle: 'Offboarding Tasks',
        content: 'In the Tasks section, enter task description, select assignee, set due date, and click "Create Task". Click "Complete" to mark tasks as done.',
        workflow: [
          'Create offboarding tasks',
          'Assign to responsible person',
          'Set due dates',
          'Track completion status',
          'Mark as complete when done'
        ]
      },
      {
        subtitle: 'Lifecycle Summary',
        content: 'The dashboard shows exit interviews count, offboarding tasks count, completed tasks count, and lifecycle events count.',
        metrics: [
          'Exit interviews count',
          'Offboarding tasks count',
          'Completed tasks count',
          'Lifecycle events count'
        ]
      }
    ]
  },
  xpatsStaffDetails: {
    title: 'Xpats Staff Details',
    sections: [
      {
        subtitle: 'Overview Dashboard',
        content: 'Shows expat statistics including total expat staff, Madihaa/Batuta/Madigrand staff counts, active/departed staff, work permits/passports/visas/medical/insurance expiring (90 days), and pending deposits.',
        metrics: [
          'Total expat staff',
          'Active staff by company',
          'Departed staff',
          'Documents expiring in 90 days',
          'Pending deposits'
        ]
      },
      {
        subtitle: 'Tabs',
        content: 'Overview (dashboard), All Staff (list), Ongoing (processes in progress), Work Visa (permit/visa tracking), Medical (insurance tracking), Insurance (additional insurance), Deposits (security deposits), Left Staffs (departed), Expiry Center (expiring documents), Reports.',
        tabs: [
          'Overview: Dashboard with statistics',
          'All Staff: Complete staff list',
          'Ongoing: Active processes',
          'Work Visa: Permit and visa tracking',
          'Medical: Medical insurance',
          'Insurance: Additional insurance',
          'Deposits: Security deposits',
          'Left Staffs: Departed staff',
          'Expiry Center: Expiring documents',
          'Reports: Expat reports'
        ]
      },
      {
        subtitle: 'Expiry Center',
        content: 'Toggle "Show expiring only" to see documents expiring soon. View expiring documents by type: work permits, passports, visas, medical insurance, and regular insurance.',
        alert: 'Regularly check the Expiry Center to ensure all documents are renewed on time.'
      }
    ]
  },
  monthlyAttendanceExcel: {
    title: 'Monthly Attendance Excel',
    sections: [
      {
        subtitle: 'Generating Report',
        content: 'Select month and year, select date range (full month, first half, second half), select area filter (All, Male-Junior, Hulhumale-Junior, Male-Senior, Hulhumale-Senior, Local), click "Export to Excel".',
        filters: [
          'All: All employees',
          'Male-Junior: Male work site, Junior level, non-Maldivian',
          'Hulhumale-Junior: Hulhumale work site, Junior level, non-Maldivian',
          'Male-Senior: Male work site, Senior level, non-Maldivian',
          'Hulhumale-Senior: Hulhumale work site, Senior level, non-Maldivian',
          'Local: Maldivian employees only'
        ]
      },
      {
        subtitle: 'Attendance Status Codes',
        content: 'OFF (Off day), MC (Medical Casual), EL (Earned Leave), AL (Annual Leave), SUS (Suspension), FL (Family Leave), SICK (Sick leave), HD (Half day), AB (Absent), NL (No pay leave), SP (Special leave).',
        note: 'Status codes are used for payroll calculations.'
      }
    ]
  },
  staffAttendanceReport: {
    title: 'Staff Attendance Report',
    sections: [
      {
        subtitle: 'Generating Report',
        content: 'Select employee from dropdown, set date range for attendance, set date range for overtime, set date range for food allowance, click "Generate Report". View employee details, daily attendance, overtime summary, and food allowance summary.',
        steps: [
          'Select employee',
          'Set attendance date range',
          'Set overtime date range',
          'Set food allowance date range',
          'Click "Generate Report"',
          'View report details',
          'Export to Excel if needed'
        ]
      }
    ]
  },
  staffDashboard: {
    title: 'Staff Dashboard',
    sections: [
      {
        subtitle: 'Viewing Personal Profile',
        content: 'View personal information including name, employee ID, department, designation, contact details, work location, and join date.',
        details: [
          'Name: Full name',
          'Employee ID: Unique identifier',
          'Department: Work department',
          'Designation: Job title',
          'Contact details: Phone and email',
          'Work location: Assigned location',
          'Join date: Employment start date'
        ]
      },
      {
        subtitle: 'Viewing Disciplinary Actions',
        content: 'Scroll to Disciplinary Actions section to view personal disciplinary history including date of incident, description, action taken, warning level (minor, moderate, serious, severe), and status.',
        warningLevels: [
          'Minor: First offense',
          'Moderate: Repeated offense',
          'Serious: Significant violation',
          'Severe: Most serious violations'
        ]
      }
    ]
  },
  staffAttendance: {
    title: 'Staff Attendance',
    sections: [
      {
        subtitle: 'Viewing Attendance History',
        content: 'View attendance statistics (total records, present days, late arrivals) and attendance records showing date, check-in time, check-out time, and status (Present, Absent, Late).',
        statuses: [
          'Present: Employee checked in and out',
          'Absent: Employee did not check in',
          'Late: Employee checked in after start time'
        ]
      }
    ]
  },
  staffPayslip: {
    title: 'Staff Payslip',
    sections: [
      {
        subtitle: 'Viewing Payslips',
        content: 'Select month and year from dropdowns. View payslip details including basic salary, allowances breakdown, deductions breakdown, gross salary, and net salary.',
        details: [
          'Basic salary: Base compensation',
          'Allowances: Other, Food, Overtime, SP, Friday',
          'Deductions: Pension and other deductions',
          'Gross salary: Total earnings',
          'Net salary: Take-home pay'
        ]
      },
      {
        subtitle: 'Downloading Payslip',
        content: 'Select month and year, click "Download Payslip" button. The payslip is downloaded as PDF with employee information, payment period, earnings breakdown, deductions breakdown, and net salary.',
        note: 'Payslips are available for all processed payroll periods.'
      }
    ]
  },
  offerLetter: {
    title: 'Offer Letter',
    sections: [
      {
        subtitle: 'Generating Offer Letter',
        content: 'Select candidate from dropdown, fill in offer details (letter date, position, department, employment type, start date, salary, working hours, work location, reporting to, signatory, signatory designation). Preview, print, or save to Firestore.',
        steps: [
          'Select candidate from dropdown',
          'Details auto-populate from candidate data',
          'Fill in any missing details',
          'Preview the letter',
          'Click "Print" to print',
          'Click "Save to Firestore" to save'
        ]
      },
      {
        subtitle: 'Auto-Population',
        content: 'When a candidate is selected, position, department, employment type, start date, salary, working hours, work location, and reporting to are auto-populated from candidate data.',
        note: 'Maldivian candidates get local offer letter format, expat candidates get expat format with additional clauses.'
      }
    ]
  },
  medicalRequisitions: {
    title: 'Medical Requisitions',
    sections: [
      {
        subtitle: 'Creating Medical Requisitions',
        content: 'Click "Add Requisition", fill in department, date, staff name (auto-populates designation and department), staff sickness, remarks, requested by, requested by position, approved by (optional), and approved by position (optional).',
        steps: [
          'Enter department and date',
          'Select staff name (auto-populates details)',
          'Enter staff sickness',
          'Add remarks if needed',
          'Enter requested by details',
          'Add approved by details if available',
          'Click "Save"'
        ]
      },
      {
        subtitle: 'Adding Consultation Details',
        content: 'Find assigned requisitions, click "Add Consultation", fill in hospital, doctor name, doctor comments, visit time, medicine taken (yes/no), and medicines (name, tablets, value).',
        fields: [
          'Hospital: Medical facility name',
          'Doctor name: Attending physician',
          'Doctor comments: Medical notes',
          'Visit time: Consultation date/time',
          'Medicines: Prescribed medications'
        ]
      }
    ]
  },
  medicalHistory: {
    title: 'Medical History',
    sections: [
      {
        subtitle: 'Viewing Medical Records',
        content: 'View your personal medical consultation history. Each record shows department, date, staff members involved, sickness details, consultation details (if completed), hospital and doctor information, medicines prescribed, and status.',
        statuses: [
          'Pending: Awaiting approval',
          'Approved: Approved for processing',
          'In Progress: Being processed',
          'Completed: Consultation done',
          'Rejected: Request denied'
        ]
      }
    ]
  }
};

export const UserManual = () => {
  const [activeSection, setActiveSection] = useState('introduction');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = Object.keys(manualContent);

  const filteredSections = sections.filter(section => {
    const sectionData = manualContent[section as keyof typeof manualContent];
    const titleMatch = sectionData.title.toLowerCase().includes(searchQuery.toLowerCase());
    let contentMatch = false;
    
    if ('content' in sectionData && sectionData.content) {
      contentMatch = sectionData.content.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    if ('sections' in sectionData && sectionData.sections) {
      contentMatch = contentMatch || sectionData.sections.some(s => 
        s.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return titleMatch || contentMatch;
  });

  const currentContent = manualContent[activeSection as keyof typeof manualContent];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Manual</h1>
                <p className="text-sm text-gray-500">Complete guide to Madihaa HRMS</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search manual..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:block w-full lg:w-72 flex-shrink-0`}>
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {filteredSections.map((section) => (
                    <button
                      key={section}
                      onClick={() => {
                        setActiveSection(section);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all ${
                        activeSection === section
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-medium text-sm">{manualContent[section as keyof typeof manualContent].title}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === section ? 'rotate-90' : ''}`} />
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="mb-6">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                  <h2 className="text-2xl sm:text-3xl font-bold">{currentContent.title}</h2>
                </CardHeader>
                <CardContent className="p-6">
                  {'content' in currentContent && currentContent.content && (
                    <p className="text-gray-700 leading-relaxed text-lg mb-6">{currentContent.content}</p>
                  )}
                  
                  {'details' in currentContent && currentContent.details && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        Key Information
                      </h3>
                      <ul className="space-y-2">
                        {currentContent.details.map((detail, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {'sections' in currentContent && currentContent.sections && (
                    <div className="space-y-8">
                      {currentContent.sections.map((section, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-3">{section.subtitle}</h3>
                          <p className="text-gray-700 leading-relaxed mb-4">{section.content}</p>
                          
                          {'steps' in section && section.steps && (
                            <div className="bg-blue-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-blue-900 mb-2">Steps:</h4>
                              <ol className="space-y-2 text-blue-800">
                                {section.steps.map((step: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="font-medium">{i + 1}.</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                          
                          {'tabs' in section && section.tabs && (
                            <div className="bg-purple-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-purple-900 mb-2">Available Tabs:</h4>
                              <ul className="space-y-1 text-purple-800">
                                {section.tabs.map((tab: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{tab}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'metrics' in section && section.metrics && (
                            <div className="bg-green-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-green-900 mb-2">Metrics Displayed:</h4>
                              <ul className="space-y-1 text-green-800">
                                {section.metrics.map((metric: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{metric}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'cards' in section && section.cards && (
                            <div className="bg-amber-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-amber-900 mb-2">Summary Cards:</h4>
                              <ul className="space-y-1 text-amber-800">
                                {section.cards.map((card: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{card}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'columns' in section && section.columns && (
                            <div className="bg-cyan-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-cyan-900 mb-2">Table Columns:</h4>
                              <ul className="space-y-1 text-cyan-800">
                                {section.columns.map((col: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{col}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'statusColors' in section && section.statusColors && (
                            <div className="bg-red-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-red-900 mb-2">Status Indicators:</h4>
                              <ul className="space-y-1 text-red-800">
                                {section.statusColors.map((status: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{status}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'leaveTypes' in section && section.leaveTypes && (
                            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-indigo-900 mb-2">Leave Types:</h4>
                              <ul className="space-y-1 text-indigo-800">
                                {section.leaveTypes.map((type: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{type}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'rules' in section && section.rules && (
                            <div className="bg-orange-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-orange-900 mb-2">Rules:</h4>
                              <ul className="space-y-1 text-orange-800">
                                {section.rules.map((rule: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{rule}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'filters' in section && section.filters && (
                            <div className="bg-teal-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-teal-900 mb-2">Available Filters:</h4>
                              <ul className="space-y-1 text-teal-800">
                                {section.filters.map((filter: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{filter}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'statuses' in section && section.statuses && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">Attendance Statuses:</h4>
                              <ul className="space-y-1 text-gray-800">
                                {section.statuses.map((status: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{status}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'fields' in section && section.fields && (
                            <div className="bg-pink-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-pink-900 mb-2">Required Fields:</h4>
                              <ul className="space-y-1 text-pink-800">
                                {section.fields.map((field: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{field}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'note' in section && section.note && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                              <p className="text-yellow-800 flex items-start gap-2">
                                <Lightbulb className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>{section.note}</span>
                              </p>
                            </div>
                          )}
                          
                          {'warning' in section && section.warning && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                              <p className="text-red-800 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>{section.warning}</span>
                              </p>
                            </div>
                          )}
                          
                          {'alert' in section && section.alert && (
                            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4">
                              <p className="text-orange-800 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>{section.alert}</span>
                              </p>
                            </div>
                          )}
                          
                          {'importance' in section && section.importance && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                              <p className="text-blue-800 flex items-start gap-2">
                                <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <span>{section.importance}</span>
                              </p>
                            </div>
                          )}
                          
                          {'workflow' in section && section.workflow && (
                            <div className="bg-violet-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-violet-900 mb-2">Workflow:</h4>
                              <ul className="space-y-1 text-violet-800">
                                {section.workflow.map((step: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'stages' in section && section.stages && (
                            <div className="bg-fuchsia-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-fuchsia-900 mb-2">Pipeline Stages:</h4>
                              <ul className="space-y-1 text-fuchsia-800">
                                {section.stages.map((stage: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{stage}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'criteria' in section && section.criteria && (
                            <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-emerald-900 mb-2">Performance Criteria:</h4>
                              <ul className="space-y-1 text-emerald-800">
                                {section.criteria.map((criterion: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{criterion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'ratings' in section && section.ratings && (
                            <div className="bg-lime-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-lime-900 mb-2">Rating Scale:</h4>
                              <ul className="space-y-1 text-lime-800">
                                {section.ratings.map((rating: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{rating}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'warningLevels' in section && section.warningLevels && (
                            <div className="bg-rose-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-rose-900 mb-2">Warning Levels:</h4>
                              <ul className="space-y-1 text-rose-800">
                                {section.warningLevels.map((level: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{level}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'details' in section && section.details && (
                            <div className="bg-sky-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-sky-900 mb-2">Details:</h4>
                              <ul className="space-y-1 text-sky-800">
                                {section.details.map((detail: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'actions' in section && section.actions && (
                            <div className="bg-slate-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-slate-900 mb-2">Quick Actions:</h4>
                              <ul className="space-y-1 text-slate-800">
                                {section.actions.map((action: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'tips' in section && section.tips && (
                            <div className="bg-lime-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-lime-900 mb-2">Tips:</h4>
                              <ul className="space-y-1 text-lime-800">
                                {section.tips.map((tip: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'roles' in section && section.roles && (
                            <div className="bg-violet-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-violet-900 mb-2">User Roles:</h4>
                              <ul className="space-y-1 text-violet-800">
                                {section.roles.map((role: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{role}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'types' in section && section.types && (
                            <div className="bg-cyan-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-cyan-900 mb-2">Location Types:</h4>
                              <ul className="space-y-1 text-cyan-800">
                                {section.types.map((type: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{type}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'reportTypes' in section && section.reportTypes && (
                            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-indigo-900 mb-2">Report Types:</h4>
                              <ul className="space-y-1 text-indigo-800">
                                {section.reportTypes.map((type: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{type}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {'documents' in section && section.documents && (
                            <div className="bg-purple-50 rounded-lg p-4 mb-4">
                              <h4 className="font-medium text-purple-900 mb-2">Available Documents:</h4>
                              <ul className="space-y-1 text-purple-800">
                                {section.documents.map((doc: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{doc}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Quick Tips
                  </h3>
                  <ul className="space-y-2 text-amber-800">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Use the search functionality to quickly find specific information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Click on navigation items to jump between sections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Regularly check the Dashboard for important updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Contact IT support if you encounter any issues</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
