# Madihaa HRMS User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Task Management](#task-management)
5. [Employee Management](#employee-management)
6. [Attendance Management](#attendance-management)
7. [Leave Management](#leave-management)
8. [Salary Management](#salary-management)
9. [Payroll](#payroll)
10. [Overtime Management](#overtime-management)
11. [Accommodation Management](#accommodation-management)
12. [Recruitment](#recruitment)
13. [Recruitment Pipeline](#recruitment-pipeline)
14. [Training](#training)
15. [Performance Management](#performance-management)
16. [Disciplinary Management](#disciplinary-management)
17. [Staff Disciplinary](#staff-disciplinary)
18. [Ticketing](#ticketing)
19. [Fleet Management](#fleet-management)
20. [Petrol Requests](#petrol-requests)
21. [Work Location Management](#work-location-management)
22. [Organization Chart](#organization-chart)
23. [Medical Management](#medical-management)
24. [Medical Requisitions](#medical-requisitions)
25. [Medical History](#medical-history)
25. [Digital Personnel Files](#digital-personnel-files)
26. [Bonus Management](#bonus-management)
27. [Deductions](#deductions)
28. [Friday Duty](#friday-duty)
29. [Settlement](#settlement)
30. [Employee Lifecycle](#employee-lifecycle)
31. [Xpats Staff Details](#xpats-staff-details)
32. [Reports](#reports)
33. [Monthly Attendance Excel](#monthly-attendance-excel)
34. [Staff Attendance Report](#staff-attendance-report)
35. [Staff Dashboard](#staff-dashboard)
36. [Staff Attendance](#staff-attendance)
37. [Staff Payslip](#staff-payslip)
38. [Offer Letter](#offer-letter)
39. [User Management](#user-management)
40. [Forms and Letters](#forms-and-letters)
41. [Role-Based Access](#role-based-access)

---

## Introduction

Madihaa HRMS is a comprehensive Human Resource Management System designed for Madihaa Company (PTE) Ltd. This manual provides detailed instructions on using the system's key features.

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

## Task Management

### Overview

The Task Management module allows HR managers, supervisors, and super admins to assign, track, and manage tasks for employees. It supports recurring tasks with customizable schedules and progress tracking.

### Viewing Tasks

1. Navigate to My Tasks page
2. View task statistics:
   - Pending tasks count
   - In Progress tasks count
   - Completed tasks count
   - Today's progress bar with percentage
3. Use filters to narrow down tasks:
   - Filter by status (All, Pending, In Progress, Completed, Cancelled)
   - Filter by type (Medical, Document, Training, Meeting, Report, Other)
   - Filter by "Today Only" to show tasks due today
   - Search by task title or description

### Creating Tasks

1. Navigate to Dashboard
2. Click "Assign Task" button
3. Fill in task details:
   - Title
   - Description
   - Type (Medical, Document, Training, Meeting, Report, Other)
   - Priority (Low, Medium, High, Urgent)
   - Assign to (select one or multiple employees)
   - Due Date
   - Due Time (optional, in HH:MM format)
4. Set recurrence options:
   - **No Recurrence**: One-time task
   - **Daily**: Creates tasks daily
     - Optional: Select specific days (e.g., only Mondays)
     - Duration: Number of days to create ahead (30, 90, 180, 365, or custom)
   - **Weekly**: Creates tasks for selected days
     - Select days of the week (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
   - **Monthly**: Creates tasks on specific dates
     - Select dates (1-31) or leave empty for default (15th & 30th)
     - Duration: Number of months to create ahead
5. Click "Create Task"

### Recurring Task Examples

- **Daily attendance submission**: Daily recurrence, 365 days duration, due time 11:00 AM
- **Weekly meeting**: Weekly recurrence, select Mon/Wed/Fri
- **Monthly food allowance**: Monthly recurrence, select 15th and 30th, 12 months duration
- **Monthly attendance report**: Monthly recurrence, select 14th only, 12 months duration

### Managing Tasks

#### Viewing Task Details

1. Click "View Details" on any task card
2. View complete task information:
   - Title, description, type, priority
   - Assigned To and Assigned By names
   - Due date and due time
   - Status
   - Attachments, links, and comments

#### Updating Task Status

1. Open task details modal
2. Change status from dropdown (Pending, In Progress, Completed, Cancelled)
3. Click "Update Status"
4. Modal closes automatically after update

#### Editing Tasks

1. Open task details modal
2. Click "Edit" button (visible only to task creator)
3. Modify title, description, or priority
4. Click "Save"

#### Deleting Tasks

1. Open task details modal
2. Click "Delete" button (visible only to task creator)
3. Confirm deletion

#### Adding Comments with Progress Stages

1. Open task details modal
2. In the Comments section:
   - Enter progress stage (e.g., "Stage 1", "Review", "Final Approval")
   - Enter comment text
   - Click message icon button
3. Progress stage appears as a badge next to author name
4. Use this to track different stages of task progress

#### Adding Attachments

1. Open task details modal
2. In the Attachments section, click "Choose File"
3. Select file to upload
4. File is uploaded and displayed in the list

#### Adding Links

1. Open task details modal
2. In the Links section, enter:
   - Link title
   - URL (https://...)
3. Click "Add"

#### Resending Notifications

1. Open task details modal
2. Click "Resend Notification" button (visible only to task creator)
3. A new notification is sent to the assigned employee

### Today's Progress

The My Tasks page displays a progress bar showing:
- Percentage of today's tasks completed
- Number of completed tasks vs total tasks due today
- Updates in real-time as tasks are marked complete

### Task Permissions

- **Super Admin, HR Manager, Supervisor**: Can create, view, and manage all tasks
- **Assigned Employee**: Can view and update status of assigned tasks
- **Task Creator**: Can edit, delete, and resend notifications for their tasks

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

## Payroll

### Overview

The Payroll module handles salary processing, payslip generation, and payroll management for all employees.

### Viewing Payroll

1. Navigate to the Payroll page
2. Select the month and year
3. View payroll records showing:
   - Employee name and ID
   - Basic salary
   - Allowances (OT, Food, Friday, SP, Other)
   - Deductions (Pension, PF, etc.)
   - Gross salary
   - Net salary
   - Payment status

### Processing Payroll

1. Navigate to the Payroll page
2. Select the pay period (month/year)
3. Click "Generate Payroll" to process salaries
4. Review the generated payroll records
5. Click "Process Payroll" to finalize
6. Status changes from "draft" to "processed" to "approved" to "paid"

### Editing Payroll Records

1. Navigate to the Payroll page
2. Find the payroll record to edit
3. Click "Edit" button
4. Modify salary, allowances, or deductions
5. Click "Update" to save changes
6. Note: Can only edit records in "draft" or "processed" status

### Generating Payslips

1. Navigate to the Payroll page
2. Find the employee's payroll record
3. Click "Download Payslip" or "Print Payslip"
4. The payslip is generated as PDF with:
   - Employee details
   - Payment period
   - Earnings breakdown
   - Deductions breakdown
   - Net salary

### Payroll Summary

The payroll summary shows:
- Total employees
- Total gross salary
- Total net salary
- Total allowances
- Total deductions
- Total bonuses
- Status breakdown (draft, processed, approved, paid)

### Exporting Payroll

1. Navigate to the Payroll page
2. Click "Export" button
3. Select export format (Excel, PDF, CSV)
4. The file downloads with all payroll data

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

## Recruitment Pipeline

### Overview

The Recruitment Pipeline module manages the complete hiring process from CV receipt to onboarding for expatriate staff.

### Pipeline Stages

Candidates move through the following stages:

1. **CV Received** - Initial application received
2. **Shortlisted** - Candidate selected for interview
3. **Interview Scheduled** - Interview date set
4. **Interview Completed** - Interview conducted
5. **Offer Letter Sent** - Offer letter generated and sent
6. **Offer Signed** - Candidate accepted offer
7. **Work Permit Applied** - Work permit application submitted
8. **Payment Pending** - Work permit payment pending
9. **Payment Completed** - Work permit payment done
10. **Entry Pass Pending** - Entry pass application in progress
11. **Entry Pass Received** - Entry pass approved
12. **Ticket Purchased** - Flight ticket booked
13. **Ticket Approved** - Ticket approved
14. **Departed** - Candidate departed from home country
15. **Van Arranged** - Airport pickup van arranged
16. **Airport Pickup** - Airport pickup scheduled
17. **Arrived** - Candidate arrived in Maldives
18. **Added to Directory** - Candidate onboarded as employee

### Adding Candidates

1. Navigate to Recruitment Pipeline
2. Click "Add Candidate" button
3. Fill in candidate details:
   - Name
   - Employee ID
   - Position
   - Salary
   - Nationality
   - Date of birth
   - Gender
   - Passport number
   - Passport issue/expiry dates
   - Email
   - Phone
   - Address
   - Emergency contact
   - Date of joining
4. Click "Save"

### Editing Candidates

1. Navigate to Recruitment Pipeline
2. Find the candidate
3. Click "Edit" button
4. Modify required fields
5. Click "Update"

### Moving Candidates Through Stages

1. Navigate to Recruitment Pipeline
2. Select the candidate
3. Click the stage dropdown
4. Select the new stage
5. Add notes if required
6. Click "Update"

### Work Permit Application

1. Navigate to Recruitment Pipeline
2. Select candidate at "Offer Signed" stage
3. Click "Work Permit Applied" button
4. Enter work permit details:
   - Expat reference number
   - New work permit number
   - Submitted date
   - eGov link
   - Slot number
5. Click "Save"

### Flight Details

1. Navigate to Recruitment Pipeline
2. Select candidate after work permit approval
3. Click "Flight Details" button
4. Enter flight information:
   - Flight number
   - Flight date
   - Flight time
   - Arrival date
   - Arrival time
   - Departure airport
   - Arrival airport
5. Click "Save"

### Deleting Candidates

1. Navigate to Recruitment Pipeline
2. Find the candidate
3. Click "Delete" button
4. Confirm deletion

### Filtering and Search

- Filter by stage using the stage dropdown
- Search by name, position, or employee ID
- Filter by position using the position dropdown

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
4. View disciplinary action details
5. Sign disciplinary records if required
6. Print disciplinary reports

### Viewing Disciplinary Details

1. Navigate to Staff Disciplinary
2. Click "View" on any disciplinary record
3. View full details including:
   - Date of incident
   - Description
   - Action taken
   - Warning level
   - Prepared by
   - Approved by

### Signing Disciplinary Records

1. Navigate to Staff Disciplinary
2. Click "Sign" on pending records
3. Add your signature (if required)
4. Click "Save"

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

## Petrol Requests

### Overview

The Petrol Requests module manages fuel requests for company vehicles, including tracking fuel consumption and approvals.

### Creating Petrol Requests

1. Navigate to Petrol Requests page
2. Click "Add Request" button
3. Fill in the form:
   - Request date
   - Vehicle number
   - Vehicle type
   - Driver name
   - Driver employee ID
   - KM start
   - KM end
   - Petrol amount
   - Receipt number
   - Requested by
4. Click "Submit"

### Validating KM Values

- KM End must be greater than KM Start
- Driven KM is automatically calculated (KM End - KM Start)
- System will alert if validation fails

### Approving Petrol Requests

1. Navigate to Petrol Requests page
2. Find pending requests
3. Click "Approve" button
4. Add approved by name
5. Click "Confirm"

### Rejecting Petrol Requests

1. Navigate to Petrol Requests page
2. Find pending requests
3. Click "Reject" button
4. Add rejection reason
5. Click "Confirm"

### Viewing Petrol Requests

- View all requests with status (Pending, Approved, Rejected)
- Filter by time period (all-time, this-month, last-month)
- View request details including vehicle, driver, and fuel amount

### Printing Petrol Slips

1. Navigate to Petrol Requests page
2. Find the approved request
3. Click "Print Slip" button
4. The slip is generated with:
   - Slip number (auto-generated)
   - Vehicle details
   - Driver details
   - KM readings
   - Fuel amount

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

## Organization Chart

### Overview

The Organization Chart module displays the hierarchical structure of employees within each work location.

### Viewing Organization Chart

1. Navigate to Organization Chart page
2. Select a work location from the dropdown
3. View the organizational tree structure

### Navigation Controls

- **Zoom In**: Click the zoom in button or use mouse wheel
- **Zoom Out**: Click the zoom out button or use mouse wheel
- **Pan**: Click and drag to move the chart
- **Expand/Collapse**: Click on employee nodes to expand or collapse their subordinates

### Organization Tree Structure

- Root node shows the head of the location
- Child nodes show direct reports
- Each node displays:
  - Employee photo (if available)
  - Employee name
  - Employee ID
  - Designation
- Expand/collapse icons show if node has children

### Printing Organization Chart

1. Navigate to Organization Chart page
2. Click "Print" button
3. The chart is printed in current zoom level

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

## Offer Letter

### Overview

The Offer Letter module generates and manages offer letters for recruitment candidates.

### Generating Offer Letter

1. Navigate to Offer Letter page
2. Select candidate from dropdown
3. Fill in offer details:
   - Letter date
   - Position
   - Department
   - Employment type
   - Start date
   - Salary
   - Working hours
   - Work location
   - Reporting to
   - Signatory
   - Signatory designation
4. Preview the letter
5. Click "Print" to print
6. Click "Save to Firestore" to save

### Auto-Population

When a candidate is selected, the following are auto-populated:
- Position (from candidate data)
- Department (from candidate data)
- Employment type (from candidate data)
- Start date (from candidate data)
- Salary (from candidate data)
- Working hours (from candidate data)
- Work location (from candidate data)
- Reporting to (from candidate data)

### Maldivian vs Expat Letters

The system automatically detects:
- Maldivian candidates get local offer letter format
- Expat candidates get expat offer letter format with additional clauses

### Saving to Firestore

1. Navigate to Offer Letter page
2. Fill in all details
3. Click "Save to Firestore" button
4. The offer letter HTML is saved to the candidate record
5. Status is updated to "offer_sent"

### Printing Offer Letter

1. Navigate to Offer Letter page
2. Select candidate
3. Click "Print" button
4. The offer letter is printed directly

---

## Medical Management

### Overview

The Medical module manages employee medical records and requisitions.

### Medical History

#### Viewing Medical Records

1. Navigate to Medical History
2. View your personal medical consultation history
3. Each record shows:
   - Department
   - Date
   - Staff members involved
   - Sickness details
   - Consultation details (if completed)
   - Hospital and doctor information
   - Medicines prescribed
   - Status (Pending, Approved, In Progress, Completed, Rejected)

#### Viewing Consultation Details

1. Navigate to Medical History
2. Click on a medical requisition
3. View consultation details including:
   - Hospital name
   - Doctor name
   - Doctor comments
   - Visit time
   - Medicines taken
   - Medicine details (name, tablets, value)

---

## Digital Personnel Files

### Overview

The Digital Personnel Files module manages employee documents, tracks expiry dates, and provides alerts for expiring documents.

### Overview Tab

Shows summary statistics:
- Total expiring documents
- Expired documents
- Active alerts
- Personnel file summary

### Expiring Documents Tab

1. Navigate to Digital Personnel Files
2. Click "Expiring" tab
3. View documents expiring soon:
   - Employee name
   - Document type
   - Expiry date
   - Days until expiry
   - Status

### Expired Documents Tab

1. Navigate to Digital Personnel Files
2. Click "Expired" tab
3. View expired documents:
   - Employee name
   - Document type
   - Expiry date
   - Days since expiry
   - Status

### Alerts Tab

1. Navigate to Digital Personnel Files
2. Click "Alerts" tab
3. View active alerts:
   - Alert type (urgent, warning, expired)
   - Employee name
   - Document type
   - Expiry date
   - Message

### Acknowledging Alerts

1. Navigate to Digital Personnel Files
2. Click "Alerts" tab
3. Find the alert to acknowledge
4. Click "Acknowledge" button
5. The alert is marked as acknowledged

### Archiving Documents

1. Navigate to Digital Personnel Files
2. Find the document to archive
3. Click "Archive" button
4. Confirm archiving
5. The document is moved to archive

### Personnel File Summary

1. Navigate to Digital Personnel Files
2. Select an employee from dropdown
3. View personnel file summary:
   - Total documents
   - Active documents
   - Expiring documents
   - Expired documents
   - Document list with details

---

### Medical Requisitions

#### Creating Medical Requisitions

1. Navigate to Medical Requisitions
2. Click "Add Requisition" button
3. Fill in the form:
   - Department
   - Date
   - Staff name (auto-populates designation and department)
   - Staff sickness
   - Remarks
   - Requested by
   - Requested by position
   - Approved by (optional)
   - Approved by position (optional)
4. Click "Save"

#### Adding Multiple Staff

1. In the requisition form, click "Add Staff"
2. Enter additional staff member details
3. Repeat for more staff members
4. All staff are included in one requisition

#### Approving Medical Requisitions

1. Navigate to Medical Requisitions
2. Find pending requisitions
3. Click "Approve" button
4. Add approved by name and position
5. Click "Confirm"

#### Assigning Medical Requisitions

1. Navigate to Medical Requisitions
2. Find approved requisitions
3. Click "Assign" button
4. Select the person to assign to
5. Click "Confirm"

#### Adding Consultation Details

1. Navigate to Medical Requisitions
2. Find assigned requisitions
3. Click "Add Consultation" button
4. Fill in consultation details:
   - Hospital
   - Doctor name
   - Doctor comments
   - Visit time
   - Medicine taken (yes/no)
   - Medicines (name, tablets, value)
5. Click "Save"

#### Completing Medical Requisitions

1. Navigate to Medical Requisitions
2. Find requisitions with consultation details
3. Click "Complete" button
4. Click "Confirm"

#### Editing Medical Requisitions

1. Navigate to Medical Requisitions
2. Find the requisition
3. Click "Edit" button
4. Modify required fields
5. Click "Update"

#### Deleting Medical Requisitions

1. Navigate to Medical Requisitions
2. Find the requisition
3. Click "Delete" button
4. Confirm deletion

#### Printing Medical Requisitions

1. Navigate to Medical Requisitions
2. Find the requisition
3. Click "Print" button
4. The requisition is printed with all details

---

## Bonus Management

### Overview

The Bonus module manages bonus payments for employees, including bulk bonus creation and history tracking.

### Creating Bonus

1. Navigate to Bonus page
2. Click "Create Bonus" tab
3. Select employees:
   - Use search to find specific employees
   - Select by work location (expand location to see employees)
   - Use "Select All" to select all employees
4. Enter bonus details:
   - Individual bonus amount (per employee)
   - Or bulk bonus amount for all selected
   - Bonus date
   - Description
5. Click "Preview" to see breakdown
6. Click "Save" to create bonus records

### Bulk Bonus Creation

1. Navigate to Bonus page
2. Click "Create Bonus" tab
3. Select multiple employees
4. Enter bulk bonus amount
5. Enable "Custom Amount Mode" to set different amounts per employee
6. Click "Save"

### Adjustment Mode

1. Navigate to Bonus page
2. Click "Create Bonus" tab
3. Select employees
4. Click "Adjustment Mode" toggle
5. Adjust individual amounts as needed
6. Reduced employees are marked and excluded from redistribution
7. Click "Save"

### Bonus History

1. Navigate to Bonus page
2. Click "History" tab
3. View all bonus records:
   - Date
   - Employee name
   - Amount
   - Description
   - Batch ID

### Editing Bonus Records

1. Navigate to Bonus page
2. Click "History" tab
3. Find the bonus record
4. Click "Edit" button
5. Modify amount or description
6. Click "Update"

### Deleting Bonus Records

1. Navigate to Bonus page
2. Click "History" tab
3. Find the bonus record
4. Click "Delete" button
5. Confirm deletion

### Deleting All Bonuses

1. Navigate to Bonus page
2. Click "History" tab
3. Click "Delete All" button
4. Confirm deletion (this cannot be undone)

### Exporting Bonus Records

1. Navigate to Bonus page
2. Click "History" tab
3. Click "Export" button
4. Select format (Excel, PDF)
5. File downloads with all bonus data

---

## Deductions

### Overview

The Deductions module manages custom deductions for employees, including recurring deductions.

### Creating Deduction

1. Navigate to Deductions page
2. Click "Create" tab
3. Fill in the form:
   - Employee
   - Deduction name
   - Deduction amount
   - Deduction type (fixed or percentage)
   - Month
   - Year
   - Is recurring (yes/no)
   - Number of months (if recurring)
   - Reason
4. Click "Save"

### Recurring Deductions

1. Navigate to Deductions page
2. Click "Create" tab
3. Select "Is recurring"
4. Enter number of months
5. The deduction will be applied for the specified number of months
6. Each month's deduction is tracked separately

### Editing Deductions

1. Navigate to Deductions page
2. Click "History" tab
3. Find the deduction
4. Click "Edit" button
5. Modify required fields
6. Click "Update"

### Deleting Deductions

1. Navigate to Deductions page
2. Click "History" tab
3. Find the deduction
4. Click "Delete" button
5. Confirm deletion

### Deduction History

1. Navigate to Deductions page
2. Click "History" tab
3. View all deductions:
   - Employee name
   - Deduction name
   - Amount
   - Type
   - Month/Year
   - Recurring status
   - Reason

### Printing Deduction Letter

1. Navigate to Deductions page
2. Click "History" tab
3. Find the deduction
4. Click "Print Letter" button
5. The deduction letter is generated with:
   - Employee details
   - Deduction details
   - Prepared by
   - Approved by

---

## Friday Duty

### Overview

The Friday Duty module manages Friday duty schedules for employees across different work locations.

### Viewing Friday Schedule

1. Navigate to Friday Duty page
2. Select work location (or "All" for all locations)
3. View schedule showing:
   - Past 4 Fridays
   - Next Friday
   - Employee names
   - Duty status (On, Off, Holiday)
   - Remarks

### Setting Duty Status

1. Navigate to Friday Duty page
2. Find the employee and date
3. Click the status dropdown
4. Select status:
   - On (employee working)
   - Off (employee off duty)
   - Holiday (public holiday)
5. Add remarks if needed
6. Status is saved automatically

### Filtering by Work Location

1. Navigate to Friday Duty page
2. Use the work location dropdown
3. Select specific location or "All"
4. Schedule updates to show employees from selected location

### Saving Schedule

1. Navigate to Friday Duty page
2. Make duty status changes
3. Click "Save Schedule" button
4. All changes are saved to database

### Printing Schedule

1. Navigate to Friday Duty page
2. Click "Print" button
3. The schedule is printed with all Friday dates and employee status

---

## Settlement

### Overview

The Settlement module calculates and generates final settlement for employees leaving the company.

### Creating Settlement

1. Navigate to Settlement page (via employee record)
2. Employee details are auto-populated:
   - Employee name
   - Designation
   - Nationality
   - Work permit
   - Monthly salary
3. Enter settlement details:
   - Settlement month
   - Last working date
   - Salary days
   - Salary divisor
4. Load attendance data:
   - Set attendance date range
   - Click "Load Attendance"
   - Attendance data is populated
5. Load overtime data:
   - Set overtime date range
   - Click "Load Overtime"
   - Overtime data is populated
6. Enter leave balances:
   - MC (Medical Casual)
   - EL (Earned Leave)
   - AL (Annual Leave)
   - SUS (Suspension)
   - FL (Family Leave)
   - Sick leave
   - Half days
   - Absent days
   - No pay leave
   - Special leave
7. Enter other details:
   - Overtime amount
   - Overtime hours
   - Overtime rate
   - Food allowance days
   - Food allowance per day
   - Other earnings
   - Deductions
   - Advance deduction
   - Remarks
8. Click "Calculate" to compute settlement
9. Click "Print" to generate settlement letter

### Settlement Calculation

The system calculates:
- Salary based on salary days and divisor
- Overtime pay based on hours and rate
- Food allowance based on days
- Total earnings
- Total deductions
- Net settlement amount

### Printing Settlement Letter

1. Navigate to Settlement page
2. Complete settlement calculation
3. Click "Print" button
4. The settlement letter is generated with:
   - Employee details
   - Settlement period
   - Earnings breakdown
   - Deductions breakdown
   - Net settlement amount
   - Signatures

---

## Employee Lifecycle

### Overview

The Employee Lifecycle module manages offboarding tasks, exit interviews, and lifecycle transitions.

### Offboarding Tasks

#### Creating Offboarding Task

1. Navigate to Employee Lifecycle page
2. In the Tasks section, enter task description
3. Select assignee
4. Set due date
5. Click "Create Task"

#### Completing Offboarding Task

1. Navigate to Employee Lifecycle page
2. Find pending tasks
3. Click "Complete" button
4. The task is marked as completed

### Exit Interviews

#### Viewing Exit Interviews

1. Navigate to Employee Lifecycle page
2. View exit interview summary
3. See total number of exit interviews conducted

### Lifecycle Summary

The dashboard shows:
- Exit interviews count
- Offboarding tasks count
- Completed tasks count
- Lifecycle events count

---

## Xpats Staff Details

### Overview

The Xpats Staff Details module manages expatriate staff information, including work permits, visas, medical insurance, and deposits.

### Tabs

- **Overview**: Dashboard with expat statistics
- **All Staff**: All expatriate staff list
- **Ongoing**: Staff with ongoing processes
- **Work Visa**: Work permit and visa tracking
- **Medical**: Medical insurance tracking
- **Insurance**: Additional insurance details
- **Deposits**: Security deposits tracking
- **Left Staffs**: Staff who have left
- **Expiry Center**: Documents expiring soon
- **Reports**: Expat-related reports

### Overview Dashboard

Shows expat statistics:
- Total expat staff
- Madihaa staff count
- Batuta staff count
- Madigrand staff count
- Active staff
- Departed staff
- Work permits expiring (90 days)
- Passports expiring (90 days)
- Visas expiring (90 days)
- Medical expiring (90 days)
- Insurance expiring (90 days)
- Pending deposits

### Adding Expat Staff

1. Navigate to Xpats Staff Details page
2. Click "Add Staff" button
3. Fill in staff details:
   - Personal information
   - Work permit details
   - Visa details
   - Passport details
   - Medical insurance details
   - Deposit details
4. Click "Save"

### Editing Expat Staff

1. Navigate to Xpats Staff Details page
2. Find the staff member
3. Click "Edit" button
4. Modify required fields
5. Click "Update"

### Cancelling Visa

1. Navigate to Xpats Staff Details page
2. Find the staff member
3. Click "Cancel Visa" button
4. Enter visa cancellation details:
   - Submitted date
   - Request number
   - eGov link
5. Click "Confirm"

### Adding Medical Application

1. Navigate to Xpats Staff Details page
2. Find the staff member
3. Click "Add Medical" button
4. Enter medical details:
   - Reference number
   - eGov link
5. Click "Save"

### Filtering Staff

- Filter by company (Madihaa, Batuta, Madigrand, All)
- Use search to find specific staff
- Filter by tab (ongoing, left staff, etc.)

### Expiry Center

1. Navigate to Xpats Staff Details page
2. Click "Expiry Center" tab
3. Toggle "Show expiring only" to see documents expiring soon
4. View expiring documents by type:
   - Work permits
   - Passports
   - Visas
   - Medical insurance
   - Regular insurance

---

## Monthly Attendance Excel

### Overview

The Monthly Attendance Excel module generates detailed monthly attendance reports in Excel format.

### Generating Report

1. Navigate to Monthly Attendance Excel page
2. Select month and year
3. Select date range:
   - Full month
   - First half (1-15)
   - Second half (16-end)
4. Select area filter:
   - All
   - Male-Junior
   - Hulhumale-Junior
   - Male-Senior
   - Hulhumale-Senior
   - Local
5. Click "Export to Excel"
6. The Excel file downloads with:
   - Employee details
   - Daily attendance status
   - Total present days
   - Total absent days
   - Leave types
   - Overtime hours
   - Food allowance

### Attendance Status Codes

- **OFF**: Off day
- **MC**: Medical Casual
- **EL**: Earned Leave
- **AL**: Annual Leave
- **SUS**: Suspension
- **FL**: Family Leave
- **SICK**: Sick leave
- **HD**: Half day
- **AB**: Absent
- **NL**: No pay leave
- **SP**: Special leave

### Area Filter Logic

- **Male-Junior**: Male work site, Junior job level, non-Maldivian
- **Hulhumale-Junior**: Hulhumale work site, Junior job level, non-Maldivian
- **Male-Senior**: Male work site, Senior job level, non-Maldivian
- **Hulhumale-Senior**: Hulhumale work site, Senior job level, non-Maldivian
- **Local**: Maldivian employees only

---

## Staff Attendance Report

### Overview

The Staff Attendance Report module generates detailed attendance reports for individual employees.

### Generating Report

1. Navigate to Staff Attendance Report page
2. Select employee from dropdown
3. Set date range for attendance
4. Set date range for overtime
5. Set date range for food allowance
6. Click "Generate Report"
7. View report showing:
   - Employee details
   - Daily attendance
   - Overtime summary
   - Food allowance summary

### Exporting Report

1. Navigate to Staff Attendance Report page
2. Generate report
3. Click "Export to Excel"
4. The Excel file downloads with all attendance data

---

## Staff Dashboard

### Overview

The Staff Dashboard provides employees with a view of their personal information and disciplinary records.

### Viewing Personal Profile

1. Navigate to Staff Dashboard page
2. View personal information:
   - Name
   - Employee ID
   - Department
   - Designation
   - Contact details
   - Work location
   - Join date

### Viewing Disciplinary Actions

1. Navigate to Staff Dashboard page
2. Scroll to Disciplinary Actions section
3. View personal disciplinary history:
   - Date of incident
   - Description
   - Action taken
   - Warning level (minor, moderate, serious, severe)
   - Status

### Viewing Disciplinary Details

1. Navigate to Staff Dashboard page
2. Click "View" on any disciplinary action
3. View full details in modal

### Printing Disciplinary Report

1. Navigate to Staff Dashboard page
2. Find the disciplinary action
3. Click "Print" button
4. The report is generated as PDF

---

## Staff Attendance

### Overview

The Staff Attendance module allows employees to view their personal attendance history.

### Viewing Attendance History

1. Navigate to Staff Attendance page
2. View attendance statistics:
   - Total records
   - Present days
   - Late arrivals
3. View attendance records showing:
   - Date
   - Check-in time
   - Check-out time
   - Status (Present, Absent, Late)

### Attendance Status

- **Present**: Employee checked in and out
- **Absent**: Employee did not check in
- **Late**: Employee checked in after start time

---

## Staff Payslip

### Overview

The Staff Payslip module allows employees to view and download their payslips.

### Viewing Payslips

1. Navigate to Staff Payslip page
2. Select month from dropdown
3. Select year from dropdown
4. View payslip details:
   - Basic salary
   - Allowances breakdown
   - Deductions breakdown
   - Gross salary
   - Net salary

### Downloading Payslip

1. Navigate to Staff Payslip page
2. Select month and year
3. Click "Download Payslip" button
4. The payslip is downloaded as PDF

### Payslip Details

The payslip includes:
- Employee information
- Payment period
- Earnings:
  - Basic salary
  - Other allowance
  - Food allowance
  - Overtime allowance
  - SP allowance
  - Friday allowance
- Deductions:
  - Pension (if applicable)
  - Other deductions
- Total earnings
- Total deductions
- Net salary

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
- Email: support@madihaa.com

---

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and recent updates.
