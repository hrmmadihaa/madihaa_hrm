# Attendance Upload and Fetch Rules

## Overview
This document explains the rules for uploading Excel attendance data and how the system processes and displays the attendance records.

## Date Format Detection
The Excel file can contain dates in either format:
- **MM/DD/YY** (e.g., 11/2/26 = November 2, 2026)
- **DD/MM/YY** (e.g., 28/10/26 = October 28, 2026)

**Automatic Detection:**
- If the first part of the date is > 12, the system treats it as **DD/MM/YY**
- Otherwise, it treats it as **MM/DD/YY**

**Examples:**
- `28/10/26` → First part (28) > 12 → Treated as DD/MM/YY → October 28, 2026
- `11/2/26` → First part (11) ≤ 12 → Treated as MM/DD/YY → November 2, 2026

## Next-Day Early Morning Punches
Punches that occur after midnight but before 4 AM on the next day are treated as part of the previous day's attendance.

**Rule:**
- When you select a date (e.g., November 2nd), the system includes:
  - All punches on November 2nd
  - Early morning punches on November 3rd (before 4:00 AM)

**Purpose:**
- Employees who work late and punch out after midnight should have that punch count as their check-out for the previous day.

**Example:**
```
Selected Date: November 2, 2026
Excel Data:
- 11/2/26 08:29 (check-in)
- 11/3/26 00:05 (check-out) ← Included as check-out for Nov 2nd
- 11/3/26 08:27 (check-in) ← NOT included (after 4 AM)

Result for Nov 2nd:
First Punch: 11/2/2026, 08:29
Last Punch: 11/3/2026, 00:25 (displays actual date)
```

## Punch Status Classification
The system automatically determines whether a punch is a check-in or check-out:

**Same Day Punches:**
- **Check-in (0)**: Before 12:00 PM (morning shifts)
- **Check-out (1)**: After 12:00 PM (afternoon/evening shifts)

**Next-Day Early Morning Punches (before 4 AM):**
- Always treated as **Check-out (1)** for the previous day

**Examples:**
```
08:29 → Check-in (before 12 PM)
23:42 → Check-out (after 12 PM)
00:05 (next day) → Check-out (early morning next day)
```

## Display Date vs Grouping Date
- **Grouping Date**: All punches are grouped under the selected date for attendance calculation
- **Display Date**: Next-day early punches show their actual date (the next day) for clarity

**Example:**
When viewing November 2nd attendance:
- A punch at 00:25 on November 3rd will:
  - Be grouped under November 2nd for attendance
  - Display as "11/3/2026, 00:25" for accuracy

## Upload Process
1. Select the date you want to view attendance for
2. Upload the Excel file containing attendance data
3. The system:
   - Parses all date/time records
   - Detects date format automatically
   - Includes next-day early punches (before 4 AM)
   - Classifies each punch as check-in or check-out
   - Groups punches by employee
   - Calculates first punch, last punch, and total punches

## Employee ID Matching
The system supports partial ID matching:
- `326` matches `MAD0326`
- `21` matches `MAD0021`
- Full IDs like `MAD0021` work as expected

## Common Issues

### "Missing" Last Punch
This occurs when:
1. An employee only has check-in punches (no check-out in the data)
2. The check-out is after 4 AM on the next day (not included)
3. The check-out is on a different day beyond the next day

### Incorrect First Punch
This can happen if:
1. Date format is misdetected (rare with automatic detection)
2. Early morning punches on the same day are excluded
3. The Excel data is incomplete

### Date Format Confusion
If you see dates appearing incorrectly:
- Check the Excel file format
- The system auto-detects based on whether the first number > 12
- Ensure the Excel date format is consistent
