# Changelog

All notable changes to the Madihaa HRMS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

### Changed

- Salary page now defaults to showing all employees with custom ordering support
- Leave page now defaults to Dashboard view instead of Pending tab

### Fixed

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
