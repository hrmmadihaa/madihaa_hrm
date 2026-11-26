# Changelog

All notable changes to the Madihaa HRMS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Medical Tracking
- Medical application approval workflow in Xpats Staff Details page
- "Approve" button for medical applications in "submitted" or "under_review" status
- Medical expiry date input field during approval process
- Automatic update of employee medical expiry date upon approval
- "Apply Medical" button is hidden when an application already exists for an employee
- Activity logging for medical approval actions

#### Permissions
- Supervisors now have full access to Accommodation page:
  - ACCOMMODATION_VIEW - View accommodations
  - ACCOMMODATION_MANAGE - Create, edit, delete accommodations, floors, rooms, and beds
  - ACCOMMODATION_ASSIGN - Assign and unassign employees to beds

#### Salary Page Enhancements
- Added area filter dropdown with multiple filter options:
  - All Areas
  - Male-Junior
  - Hulhumale-Junior
  - Male-Senior
  - Hulhumale-Senior
  - Batuta Maldives
  - Madi Grand
  - Bokaifushi
  - Local
- Maldivian employees are now excluded from Male/Hulhumale senior/junior filter groups
- Maldivian employees are included in Batuta Maldives and Madi Grand filter groups
- Bokaifushi filter excludes Maldivian employees
- Added custom ordering system per filter group using `sortOrder` field
- Added "Arrange Order" modal for Super Admins to set custom employee order
- Modal includes search functionality for quick employee lookup
- Added Order column in salary table to display arrangement numbers
- Auto-calculated pension as 7% of basic salary for Maldivian employees under 65 years old
- Pension calculation is dynamic and based on current employee data (country and DOB)
- Updated employee loading to include `sortOrder` field from Firestore

#### Leave Page Dashboard
- Added Dashboard tab as default view on Leave page
- Dashboard displays summary cards with key metrics:
  - Staff Currently on Leave
  - Ending in 5 Days
  - Ending in 10 Days
  - Ending in 15 Days
  - Upcoming Leaves
- Staff Currently on Leave table shows:
  - Employee name and ID
  - Leave type with color-coded badges
  - Start and end dates
  - Days remaining
  - Sorted by days remaining (less to more)
- Annual Leave Ending Soon table shows:
  - Staff whose annual leave ends within 15 days
  - Color-coded status indicators (Critical, Warning, Soon)
  - Clickable stats cards to filter by time period
- Upcoming Leaves table shows:
  - Approved leaves starting within 30 days
  - Days until start
  - Leave type information
- Stats cards are clickable to filter the tables
- Clear filter button to reset filters
- All calculations are real-time based on current date

#### Task Management
- Added comprehensive task management system for assigning and tracking employee tasks
- Task creation with title, description, type, priority, due date, and due time
- Support for recurring tasks with multiple patterns:
  - Daily recurrence with optional day selection (e.g., only Mondays)
  - Weekly recurrence with specific day selection
  - Monthly recurrence with custom date selection (1-31)
  - Duration options for pre-creating tasks (30, 90, 180, 365 days/months, or custom)
- Task assignment to multiple employees with notification system
- Task detail view showing assigned to, assigned by, due date/time, status
- Task status update with automatic modal closure
- Edit and delete functionality for task creators
- Comment system with progress stage tracking (e.g., "Stage 1", "Review")
- Attachments and links support for tasks
- Resend notification feature for task creators
- Today's progress bar showing completion percentage
- Filter by status, type, and "Today Only" for tasks due today
- Fixed supervisor comment button to work without employeeId
- Fixed task status update to handle undefined completedAt field

### Changed

- Salary page now defaults to showing all employees with custom ordering support
- Leave page now defaults to Dashboard view instead of Pending tab

### Fixed

- Employee photo upload issue where wrong image was displayed after upload:
  - Added timestamp to Cloudinary public_id to prevent caching issues
  - Added useEffect to update photo preview when formData.photo changes
  - Added debug logging for photo upload troubleshooting
- Medical application approval workflow:
  - Fixed Firestore collection name from `medical_applications` to `medicalApplications`
  - Added document existence checks before updates
  - Improved error handling and data reloading
- Pension calculation now recalculates dynamically based on current employee data
- Employee ordering in modal now reflects saved sort order immediately
- `sortOrder` field now properly loaded from Firestore in employee data

## [1.0.0] - 2024-11-24

### Added

#### Initial Release
- Employee Management module
- Attendance Management module
- Leave Management module
- Payroll module
- Overtime module
- Reports & Analytics module
- Role-Based Access Control (RBAC) with 5 user roles
- Multi-device support (Desktop, Tablet, Mobile, PWA)
- Document generation (ID cards, appointment letters, payslips)
- Export options (PDF, Excel, CSV)
- Modern responsive UI with animations
