# Madihaa HRMS User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Employee Management](#employee-management)
5. [Attendance Management](#attendance-management)
6. [Leave Management](#leave-management)
7. [Salary Management](#salary-management)
8. [Overtime Management](#overtime-management)
9. [Accommodation Management](#accommodation-management)
10. [Recruitment](#recruitment)
11. [Training](#training)
12. [Performance Management](#performance-management)
13. [Disciplinary Management](#disciplinary-management)
14. [Ticketing](#ticketing)
15. [Fleet Management](#fleet-management)
16. [Work Location Management](#work-location-management)
17. [Medical Management](#medical-management)
18. [Reports](#reports)
19. [User Management](#user-management)
20. [Forms and Letters](#forms-and-letters)
21. [Role-Based Access](#role-based-access)

---

## Introduction

Madihaa HRMS is a comprehensive Human Resource Management System designed for Male' Water and Sewerage Company (MWSC). This manual provides detailed instructions on using the system's key features.

---

## Getting Started

### Login

1. Navigate to the application URL
2. Enter your email and password
3. Click "Sign In"
4. You will be redirected to the Dashboard based on your role

### Navigation

- Use the sidebar to navigate between modules
- Each module has its own dedicated page
- Your access to features depends on your user role

---

## Salary Management

### Overview

The Salary module allows HR managers and Super Admins to manage employee salaries, allowances, and pension calculations.

### Area Filters

The Salary page includes area-based filtering to organize employees by work location and job level:

#### Available Filters

- **All Areas**: Shows all active employees
- **Male-Junior**: Employees in Male work site with Junior job level (excludes Maldivians)
- **Hulhumale-Junior**: Employees in Hulhumale work site with Junior job level (excludes Maldivians)
- **Male-Senior**: Employees in Male work site with Senior job level (excludes Maldivians)
- **Hulhumale-Senior**: Employees in Hulhumale work site with Senior job level (excludes Maldivians)
- **Batuta Maldives**: Employees at Batuta Maldives work site (includes Maldivians)
- **Madi Grand**: Employees at Madi Grand work site (includes Maldivians)
- **Bokaifushi**: Employees at Bokaifushi work site (excludes Maldivians)
- **Local**: Maldivian employees only

#### Using Area Filters

1. Navigate to the Salary page
2. Use the "Filter by Area" dropdown at the top
3. Select the desired filter
4. The employee list will update automatically

### Custom Employee Ordering

Super Admins can arrange employees in a custom order for each filter group.

#### Setting Custom Order

1. Navigate to the Salary page
2. Select the desired area filter
3. Click the "Arrange Order" button (visible to Super Admins only)
4. In the modal, use the search box to find specific employees
5. Enter the order number for each employee
6. Click "Save Order" to save the arrangement
7. The employee list will now display in the custom order

#### Viewing Order Numbers

- The "Order" column in the salary table displays the custom arrangement number
- Employees without an order number are sorted alphabetically

### Pension Calculation

The system automatically calculates pension for eligible employees.

#### Pension Rules

- **Eligibility**: Maldivian employees under 65 years old
- **Rate**: 7% of basic salary
- **Calculation**: Based on employee's country and date of birth
- **Dynamic**: Pension is recalculated in real-time based on current data

#### Viewing Pension

- Pension is displayed in the "Pension" column of the salary table
- Net salary is calculated as: Gross Salary - Pension
- Pension is shown as "0" for ineligible employees

### Managing Salaries

#### Adding Salary

1. Click "Add Salary" button
2. Select an employee
3. Enter salary details:
   - Basic Salary
   - OT Allowances
   - Other Allowances
   - Attendance Allowance
   - Living Allowance
   - Food Allowance
4. Pension is automatically calculated for eligible employees
5. Click "Save"

#### Editing Salary

1. Click "Edit" button next to an employee's salary record
2. Modify the required fields
3. Pension is automatically recalculated
4. Click "Update"

---

## Dashboard

### Overview

The Dashboard provides a comprehensive overview of HR metrics and activities at a glance.

### Main Dashboard Features

#### Key Metrics

- **Total Employees**: Total number of active employees in the system
- **Employees on Leave**: Number of employees currently on leave
- **Pending Leave Requests**: Number of leave requests awaiting approval
- **Pending Overtime Requests**: Number of overtime requests awaiting approval
- **Recent Activities**: Latest system activities and updates

#### Quick Actions

- Quick links to frequently used modules
- Access to recent employee records
- Shortcut to pending approvals

### Staff Dashboard

The Staff Dashboard is available for employees to view their personal information:

- Personal profile summary
- Attendance summary
- Leave balance
- Recent payslips
- Upcoming schedules

---

## Employee Management

### Overview

The Employee Management module allows HR personnel to manage all employee records, including personal information, employment details, education, medical records, and documents.

### Adding a New Employee

1. Navigate to the Employees page
2. Click "Add Employee" button
3. Fill in the required information:
   - **Personal Information**: Name, date of birth, gender, nationality, contact details
   - **Employment Details**: Employee ID, join date, department, job title, work location
   - **Contact Information**: Phone, email, emergency contact
   - **Education**: Qualifications, institutions, dates
   - **Medical Information**: Blood type, allergies, medical conditions
4. Upload required documents (photo, ID, certificates)
5. Click "Save"

### Viewing Employee Details

1. Navigate to the Employees page
2. Use the search box to find an employee by name or ID
3. Click on an employee's name to view their full profile
4. The profile shows all employee information in organized tabs

### Editing Employee Information

1. Navigate to the Employees page
2. Find and select the employee
3. Click "Edit" button
4. Modify the required fields
5. Click "Update" to save changes

### Deleting an Employee

1. Navigate to the Employees page
2. Find and select the employee
3. Click "Delete" button
4. Confirm the deletion
5. Note: This action cannot be undone

### Employee Search and Filter

- **Search**: Use the search box to find employees by name, ID, or department
- **Filter**: Use filter options to narrow down by department, work location, or job level
- **Sort**: Click column headers to sort by any field

### Digital Personnel Files

Access and manage employee documents:

1. Navigate to Digital Personnel Files
2. Select an employee
3. View, upload, or download documents:
   - Employment contracts
   - Educational certificates
   - Medical records
   - ID documents
   - Training certificates

---

## Attendance Management

### Overview

The Attendance Management module tracks employee attendance, check-in/check-out times, and attendance patterns.

### Viewing Attendance

1. Navigate to the Attendance page
2. Select the date range
3. View attendance records showing:
   - Employee name and ID
   - Check-in time
   - Check-out time
   - Total hours worked
   - Attendance status (Present, Absent, Late, Half-day)

### Recording Attendance

#### Manual Attendance Entry

1. Navigate to the Attendance page
2. Click "Add Attendance" button
3. Select the employee
4. Enter check-in and check-out times
5. Add notes if necessary
6. Click "Save"

#### Biometric Integration

- Attendance is automatically recorded from biometric devices
- Data syncs with the system in real-time
- Manual adjustments can be made if needed

### Attendance Adjustments

1. Navigate to the Attendance page
2. Find the attendance record to adjust
3. Click "Edit" or "Adjust"
4. Modify the times or status
5. Add reason for adjustment
6. Submit for approval (if required)

### Monthly Attendance Reports

1. Navigate to Monthly Attendance Excel
2. Select the month and year
3. Choose the area filter (Male, Hulhumale, etc.)
4. Generate the report
5. Export to Excel if needed

### Staff Attendance

Individual staff can view their own attendance:

1. Navigate to Staff Attendance
2. View personal attendance history
3. Check attendance patterns
4. Download personal attendance reports

---

## Leave Management

### Overview

The Leave module provides comprehensive leave management with a dashboard view for quick insights into staff on leave and upcoming leaves.

### Dashboard

The Dashboard is the default view on the Leave page, providing at-a-glance information about leave status.

#### Summary Cards

The dashboard displays 5 summary cards:

1. **Staff on Leave**: Total number of employees currently on leave
2. **Ending in 5 Days**: Staff whose leave ends within 5 days (critical)
3. **Ending in 10 Days**: Staff whose leave ends within 6-10 days (warning)
4. **Ending in 15 Days**: Staff whose leave ends within 11-15 days (soon)
5. **Upcoming Leaves**: Staff with approved leaves starting within 30 days

#### Using Summary Cards

- Click on any summary card to filter the "Annual Leave Ending Soon" table
- The selected card will be highlighted with a colored ring
- Click "Clear Filter" to show all records again
- Click "Staff on Leave" card to reset to default view

#### Staff Currently on Leave Table

Displays all employees currently on approved leave:

- **Employee**: Employee name
- **Employee ID**: Employee identification number
- **Leave Type**: Type of leave with color-coded badge
- **Start Date**: Leave start date
- **End Date**: Leave end date
- **Days Remaining**: Number of days until leave ends

**Sorting**: The table is sorted by days remaining (less to more), so staff ending leave soonest appear at the top.

#### Annual Leave Ending Soon Table

Displays staff whose annual leave ends within 15 days:

- **Employee**: Employee name
- **Employee ID**: Employee identification number
- **Start Date**: Leave start date
- **End Date**: Leave end date
- **Days Until End**: Number of days until leave ends
- **Status**: Color-coded status indicator
  - **Critical** (Red): Ending in 5 days or less
  - **Warning** (Orange): Ending in 6-10 days
  - **Soon** (Yellow): Ending in 11-15 days

**Filtering**: Click on the summary cards (5, 10, 15 days) to filter this table to show only staff in that time range.

#### Upcoming Leaves Table

Displays approved leaves starting within the next 30 days:

- **Employee**: Employee name
- **Employee ID**: Employee identification number
- **Leave Type**: Type of leave with color-coded badge
- **Start Date**: Leave start date
- **End Date**: Leave end date
- **Days Until Start**: Number of days until leave starts

**Sorting**: The table is sorted by days until start (less to more), so leaves starting soonest appear at the top.

### Leave Requests

#### Tabs

- **Pending**: Leave requests awaiting approval
- **Approved**: Approved leave requests
- **Rejected**: Rejected leave requests
- **Tickets**: Ticket management for travel arrangements
- **Annual Leave Plan**: Staff leave accumulation and eligibility
- **Dashboard**: Overview dashboard (default view)

#### Requesting Leave

1. Navigate to the Leave page
2. Click "Request Leave" button
3. Fill in the form:
   - Employee (if requesting for someone else)
   - Leave Type (Annual, Medical, Emergency, etc.)
   - Start Date
   - End Date
   - Reason
4. Click "Submit"

#### Approving/Rejecting Leave

1. Navigate to the "Pending" tab
2. Review the leave request
3. Click "Approve" or "Reject"
4. Add comments (optional)
5. Click "Confirm"

#### Bulk Approval

1. Select multiple leave requests using checkboxes
2. Click "Bulk Approve" or "Bulk Reject"
3. Add comments (optional)
4. Click "Confirm"

### Annual Leave Plan

The Annual Leave Plan shows staff leave accumulation based on nationality:

- **Indian & Maldivian Staff**: 30 days after 1 year of service
- **Bangladeshi Staff**: 60 days after 2 years of service

#### Viewing Leave Accumulation

1. Navigate to the "Annual Leave Plan" tab
2. Select the year
3. View the table showing:
   - Employee details
   - Nationality
   - Last return date
   - Accumulated days
   - Days taken
   - Remaining days
   - Next eligible date

---

## Salary Management

### Overview

The Salary module allows HR managers and Super Admins to manage employee salaries, allowances, and pension calculations.

### Area Filters

The Salary page includes area-based filtering to organize employees by work location and job level:

#### Available Filters

- **All Areas**: Shows all active employees
- **Male-Junior**: Employees in Male work site with Junior job level (excludes Maldivians)
- **Hulhumale-Junior**: Employees in Hulhumale work site with Junior job level (excludes Maldivians)
- **Male-Senior**: Employees in Male work site with Senior job level (excludes Maldivians)
- **Hulhumale-Senior**: Employees in Hulhumale work site with Senior job level (excludes Maldivians)
- **Batuta Maldives**: Employees at Batuta Maldives work site (includes Maldivians)
- **Madi Grand**: Employees at Madi Grand work site (includes Maldivians)
- **Bokaifushi**: Employees at Bokaifushi work site (excludes Maldivians)
- **Local**: Maldivian employees only

#### Using Area Filters

1. Navigate to the Salary page
2. Use the "Filter by Area" dropdown at the top
3. Select the desired filter
4. The employee list will update automatically

### Custom Employee Ordering

Super Admins can arrange employees in a custom order for each filter group.

#### Setting Custom Order

1. Navigate to the Salary page
2. Select the desired area filter
3. Click the "Arrange Order" button (visible to Super Admins only)
4. In the modal, use the search box to find specific employees
5. Enter the order number for each employee
6. Click "Save Order" to save the arrangement
7. The employee list will now display in the custom order

#### Viewing Order Numbers

- The "Order" column in the salary table displays the custom arrangement number
- Employees without an order number are sorted alphabetically

### Pension Calculation

The system automatically calculates pension for eligible employees.

#### Pension Rules

- **Eligibility**: Maldivian employees under 65 years old
- **Rate**: 7% of basic salary
- **Calculation**: Based on employee's country and date of birth
- **Dynamic**: Pension is recalculated in real-time based on current data

#### Viewing Pension

- Pension is displayed in the "Pension" column of the salary table
- Net salary is calculated as: Gross Salary - Pension
- Pension is shown as "0" for ineligible employees

### Managing Salaries

#### Adding Salary

1. Click "Add Salary" button
2. Select an employee
3. Enter salary details:
   - Basic Salary
   - OT Allowances
   - Other Allowances
   - Attendance Allowance
   - Living Allowance
   - Food Allowance
4. Pension is automatically calculated for eligible employees
5. Click "Save"

#### Editing Salary

1. Click "Edit" button next to an employee's salary record
2. Modify the required fields
3. Pension is automatically recalculated
4. Click "Update"

### Payroll Processing

1. Navigate to the Payroll page
2. Select the pay period
3. Review salary records
4. Process payroll
5. Generate payslips
6. Export payroll reports

---

## Overtime Management

### Overview

The Overtime module manages overtime requests, approvals, and calculations.

### Requesting Overtime

1. Navigate to the Overtime page
2. Click "Request Overtime" button
3. Fill in the form:
   - Employee
   - Date
   - Start time
   - End time
   - Reason
4. Click "Submit"

### Approving Overtime

1. Navigate to the "Pending" tab
2. Review the overtime request
3. Click "Approve" or "Reject"
4. Add comments (optional)
5. Click "Confirm"

### Overtime Calculation

- Overtime is calculated based on hours worked beyond regular hours
- Rates may vary based on time (regular, weekend, holiday)
- Calculated overtime is displayed in the employee's record

### Overtime Reports

1. Navigate to the Overtime page
2. Select the date range
3. View overtime summary
4. Export to Excel if needed

---

## Accommodation Management

### Overview

The Accommodation module manages employee housing assignments, room allocations, and facility management.

### Managing Accommodations

#### Adding Accommodation

1. Navigate to the Accommodation page
2. Click "Add Accommodation" button
3. Enter accommodation details:
   - Building name
   - Floor number
   - Room number
   - Capacity
   - Amenities
4. Click "Save"

#### Assigning Employee to Room

1. Navigate to the Accommodation page
2. Select a room
3. Click "Assign Employee"
4. Select the employee
5. Set assignment date
6. Click "Save"

#### Viewing Accommodation Status

- View all accommodations with occupancy status
- See available rooms
- View current occupants
- Check room capacity

---

## Recruitment

### Overview

The Recruitment module manages job postings, applications, and the hiring pipeline.

### Job Requisitions

#### Creating Job Requisition

1. Navigate to the Recruitment page
2. Click "Create Requisition" button
3. Fill in job details:
   - Job title
   - Department
   - Job description
   - Requirements
   - Salary range
   - Start date
4. Submit for approval

#### Managing Applications

1. Navigate to the Recruitment Pipeline
2. View applications by status
3. Review candidate profiles
4. Move candidates through pipeline stages
5. Schedule interviews
6. Send offer letters

### Recruitment Pipeline

The pipeline tracks candidates through stages:
- Applied
- Screening
- Interview
- Assessment
- Offer
- Hired
- Rejected

---

## Training

### Overview

The Training module manages employee training programs, courses, and certifications.

### Creating Training Programs

1. Navigate to the Training page
2. Click "Add Training" button
3. Enter training details:
   - Training title
   - Description
   - Start date
   - End date
   - Location
   - Instructor
   - Maximum participants
4. Click "Save"

### Assigning Employees to Training

1. Select a training program
2. Click "Assign Employees"
3. Select employees to enroll
4. Click "Save"

### Tracking Training Progress

- View enrolled employees
- Track attendance
- Record completion status
- Issue certificates

---

## Performance Management

### Overview

The Performance module manages employee appraisals, reviews, and performance ratings.

### Creating Performance Reviews

1. Navigate to the Performance page
2. Click "Add Review" button
3. Select the employee
4. Set review period
5. Add performance criteria
6. Click "Save"

### Conducting Reviews

1. Navigate to the Performance page
2. Select an employee review
3. Rate performance on criteria
4. Add comments and feedback
5. Set overall rating
6. Submit for approval

### Performance Reports

- View performance trends
- Compare ratings across periods
- Generate performance summaries

---

## Disciplinary Management

### Overview

The Disciplinary module manages disciplinary actions, warnings, and records.

### Recording Disciplinary Actions

1. Navigate to the Disciplinary page
2. Click "Add Record" button
3. Select the employee
4. Enter details:
   - Type of infraction
   - Date of incident
   - Description
   - Action taken
   - Warning level
5. Click "Save"

### Staff Disciplinary

Employees can view their own disciplinary records:
1. Navigate to Staff Disciplinary
2. View personal disciplinary history
3. Check warning status

---

## Ticketing

### Overview

The Ticketing module manages travel ticket requests for employees going on leave.

### Creating Ticket Requests

1. Navigate to the Ticketing page
2. Click "Request Ticket" button
3. Enter travel details:
   - Departure city
   - Destination city
   - Departure date
   - Return date
   - Ticket type (one-way/round-trip)
   - Number of passengers
   - Special requests
4. Click "Submit"

### Managing Tickets

- View pending ticket requests
- Approve or reject requests
- Track ticket status
- Upload ticket documents

---

## Fleet Management

### Overview

The Fleet module manages company vehicles, licenses, and airport passes.

### Vehicle Management

#### Adding Vehicles

1. Navigate to Fleet Vehicles
2. Click "Add Vehicle" button
3. Enter vehicle details:
   - Vehicle type
   - Make and model
   - Registration number
   - Capacity
   - Fuel type
4. Click "Save"

### License Management

#### Managing Driver Licenses

1. Navigate to Fleet Licenses
2. Add driver license information
3. Set expiration dates
4. Track license renewals

### Airport Passes

#### Managing Airport Passes

1. Navigate to Fleet Airport Passes
2. Add airport pass details
3. Set expiration dates
4. Track pass renewals

---

## Work Location Management

### Overview

The Work Location module manages various work sites and locations.

### Adding Work Locations

1. Navigate to Work Location page
2. Click "Add Location" button
3. Enter location details:
   - Location name
   - Address
   - Type (office, site, etc.)
   - Contact information
4. Click "Save"

### Managing Locations

- View all work locations
- Edit location details
- Assign employees to locations
- Track location capacity

---

## Medical Management

### Overview

The Medical module manages employee medical records and requisitions.

### Medical History

#### Viewing Medical Records

1. Navigate to Medical History
2. Select an employee
3. View medical information:
   - Blood type
   - Allergies
   - Medical conditions
   - Vaccination records

### Medical Requisitions

#### Creating Medical Requisitions

1. Navigate to Medical Requisitions
2. Click "Add Requisition" button
3. Enter requisition details:
   - Employee
   - Type of medical service
   - Date
   - Reason
4. Submit for approval

---

## Reports

### Overview

The Reports module provides various HR reports and analytics.

### Available Reports

- Employee reports
- Attendance reports
- Leave reports
- Payroll reports
- Overtime reports
- Performance reports

### Generating Reports

1. Navigate to the Reports page
2. Select the report type
3. Set parameters (date range, filters, etc.)
4. Click "Generate"
5. View the report
6. Export to PDF, Excel, or CSV

---

## User Management

### Overview

The User Management module (Super Admin only) manages system users and their roles.

### Adding Users

1. Navigate to User Management page
2. Click "Add User" button
3. Enter user details:
   - Email
   - Name
   - Role (Super Admin, HR Manager, Dept Manager, Supervisor, Employee)
   - Department (if applicable)
4. Set temporary password
5. Click "Save"

### Managing Users

- View all system users
- Edit user details
- Change user roles
- Reset passwords
- Deactivate users

---

## Forms and Letters

### Overview

The Forms and Letters module generates various HR documents.

### Available Documents

- Offer Letters
- Appointment Letters
- Termination Letters
- Probation Non-Renewal Letters
- Holiday Status Letters

### Generating Documents

1. Navigate to Forms and Letters
2. Select the document type
3. Choose an employee
4. Fill in required details
5. Preview the document
6. Download or print

---

## Tips and Best Practices

### Salary Management

- Use area filters to quickly find specific employee groups
- Set custom orders for frequently accessed employee lists
- Verify pension calculations for Maldivian employees
- Regularly review and update salary records

### Leave Management

- Check the Dashboard daily for staff on leave
- Monitor the "Ending in 5 Days" card for critical returns
- Use the "Upcoming Leaves" card to plan for upcoming absences
- Approve leave requests promptly to avoid delays

### Attendance Management

- Review attendance records regularly
- Address attendance issues promptly
- Use monthly attendance reports for trend analysis
- Ensure biometric data is synced correctly

### General

- Log out when not using the system
- Keep your password secure
- Report any issues to the IT department
- Use the search functionality to quickly find records
- Regularly update employee information

---

## Role-Based Access

### Super Administrator

**Full Access** to all features including:
- User management
- Employee management
- Salary management with custom ordering
- Leave management
- All reports
- System settings

### HR Manager

**High Access** to HR operations:
- Employee management
- Salary management
- Leave management (approve/reject)
- Payroll processing
- Reports

### Department Manager

**Department-Level Access**:
- View and manage department employees
- Approve department leave requests
- View department payroll (read-only)
- Department reports

### Supervisor

**Team-Level Access**:
- View team information
- Approve team leave requests
- Approve team overtime requests

### Employee

**Self-View Only**:
- View own profile
- View own attendance
- View own payslips
- View own leave records

---

## Tips and Best Practices

### Salary Management

- Use area filters to quickly find specific employee groups
- Set custom orders for frequently accessed employee lists
- Verify pension calculations for Maldivian employees
- Regularly review and update salary records

### Leave Management

- Check the Dashboard daily for staff on leave
- Monitor the "Ending in 5 Days" card for critical returns
- Use the "Upcoming Leaves" card to plan for upcoming absences
- Approve leave requests promptly to avoid delays

### General

- Log out when not using the system
- Keep your password secure
- Report any issues to the IT department
- Use the search functionality to quickly find records

---

## Support

For technical support or questions:
- Contact the HR department
- Submit a support ticket
- Email: support@madihaa.mwsc.mv

---

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and recent updates.
