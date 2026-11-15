import ExcelJS from "exceljs";

export interface StaffAttendance {
  userId: string;
  name: string;
  attendance: Record<
    number,
    {
      inTime?: string;
      outTime?: string;
      status?: string;
    }
  >;
  summary: {
    presentDays?: number;
    fridays?: number;
    OFF?: number;
    MC?: number;
    EL?: number;
    AL?: number;
    SUS?: number;
    FL?: number;
    SICK?: number;
    HD?: number;
    AB?: number;
    NL?: number;
    SP?: number;
    remarks?: string;
  };
}

interface ExportProps {
  month: number; // 0 = January, 11 = December
  year: number;
  seniorStaff: StaffAttendance[];
  juniorStaff: StaffAttendance[];
}

const STATUS_COLUMNS = [
  "OFF", "MC", "EL", "AL", "SUS", "FL",
  "SICK", "HD", "AB", "NL", "SP"
];

const MONTHS = [
  "January", "February", "March",
  "April", "May", "June",
  "July", "August", "September",
  "October", "November", "December"
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function exportMonthlyAttendanceExcel({
  month,
  year,
  seniorStaff,
  juniorStaff
}: ExportProps) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Madihaa HR Management";
  workbook.subject = "Monthly Staff Attendance";
  workbook.title = `Attendance ${MONTHS[month]} ${year}`;

  const sheet = workbook.addWorksheet("Monthly Attendance", {
    views: [{ state: "frozen", xSplit: 3, ySplit: 4 }]
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const fixedHeaders = [
    "S NO",
    "User ID",
    "Name"
  ];

  const summaryHeaders = [
    "Present Days",
    "Fridays",
    ...STATUS_COLUMNS,
    "Remarks"
  ];

  const totalColumns =
    fixedHeaders.length +
    daysInMonth * 2 +
    summaryHeaders.length;

  const lastColumn = totalColumns;

  const border = {
    top: { style: "thin" as const, color: { argb: "FF808080" } },
    left: { style: "thin" as const, color: { argb: "FF808080" } },
    bottom: { style: "thin" as const, color: { argb: "FF808080" } },
    right: { style: "thin" as const, color: { argb: "FF808080" } }
  };

  const styleHeader = (row: ExcelJS.Row) => {
    row.eachCell(cell => {
      cell.font = { bold: true, size: 9 };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9EAF7" }
      };
      cell.border = border;
    });
  };

  // Column widths
  sheet.getColumn(1).width = 7;
  sheet.getColumn(2).width = 13;
  sheet.getColumn(3).width = 26;

  for (let day = 1; day <= daysInMonth; day++) {
    const col = 4 + (day - 1) * 2;
    sheet.getColumn(col).width = 11;
    sheet.getColumn(col + 1).width = 11;
  }

  const summaryStart = 4 + daysInMonth * 2;

  summaryHeaders.forEach((header, index) => {
    sheet.getColumn(summaryStart + index).width =
      header === "Remarks" ? 24 : 11;
  });

  let currentRow = 1;

  function addStaffSection(
    sectionTitle: string,
    staff: StaffAttendance[]
  ) {
    // Section title
    sheet.mergeCells(currentRow, 1, currentRow, lastColumn);
    const titleCell = sheet.getCell(currentRow, 1);
    titleCell.value = sectionTitle;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB4C7E7" }
    };
    titleCell.border = border;
    sheet.getRow(currentRow).height = 28;
    currentRow++;

    // Day names row
    const dayRow = sheet.getRow(currentRow);

    fixedHeaders.forEach((header, index) => {
      sheet.mergeCells(currentRow, index + 1, currentRow + 2, index + 1);
      dayRow.getCell(index + 1).value = header;
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const col = 4 + (day - 1) * 2;
      const weekday = DAY_NAMES[new Date(year, month, day).getDay()];

      sheet.mergeCells(currentRow, col, currentRow, col + 1);
      dayRow.getCell(col).value = weekday;
    }

    summaryHeaders.forEach((header, index) => {
      const col = summaryStart + index;
      sheet.mergeCells(currentRow, col, currentRow + 2, col);
      dayRow.getCell(col).value = header;
    });

    // Date row
    const dateRow = currentRow + 1;

    for (let day = 1; day <= daysInMonth; day++) {
      const col = 4 + (day - 1) * 2;
      const dateLabel =
        `${String(day).padStart(2, "0")}-${MONTHS[month]}-${String(year).slice(-2)}`;

      sheet.mergeCells(dateRow, col, dateRow, col + 1);
      sheet.getCell(dateRow, col).value = dateLabel;
    }

    // IN / OUT row
    const subHeaderRow = currentRow + 2;

    for (let day = 1; day <= daysInMonth; day++) {
      const col = 4 + (day - 1) * 2;
      sheet.getCell(subHeaderRow, col).value = "IN";
      sheet.getCell(subHeaderRow, col + 1).value = "OUT";
    }

    [currentRow, dateRow, subHeaderRow].forEach(rowNumber => {
      styleHeader(sheet.getRow(rowNumber));
      sheet.getRow(rowNumber).height = 23;
    });

    currentRow += 3;

    // Employee rows
    staff.forEach((employee, index) => {
      const row = sheet.getRow(currentRow);

      row.getCell(1).value = index + 1;
      row.getCell(2).value = employee.userId;
      row.getCell(3).value = employee.name;

      for (let day = 1; day <= daysInMonth; day++) {
        const col = 4 + (day - 1) * 2;
        const record = employee.attendance?.[day];

        row.getCell(col).value = record?.inTime || "";
        row.getCell(col + 1).value = record?.outTime || "";

        if (record?.status) {
          row.getCell(col).note = `Status: ${record.status}`;
        }
      }

      const summary = employee.summary || {};

      row.getCell(summaryStart).value = summary.presentDays ?? 0;
      row.getCell(summaryStart + 1).value = summary.fridays ?? 0;

      STATUS_COLUMNS.forEach((status, index) => {
        row.getCell(summaryStart + 2 + index).value =
          summary[status as keyof typeof summary] ?? 0;
      });

      row.getCell(summaryStart + summaryHeaders.length - 1).value =
        summary.remarks || "";

      row.eachCell(cell => {
        cell.border = border;
        cell.font = { size: 9 };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true
        };
      });

      row.getCell(3).alignment = {
        vertical: "middle",
        horizontal: "left"
      };

      row.getCell(summaryStart + summaryHeaders.length - 1).alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: true
      };

      row.height = 21;
      currentRow++;
    });

    // Space between sections
    currentRow += 2;
  }

  addStaffSection(
    `ATTENDANCE FOR ${MONTHS[month].toUpperCase()} ${year} - MALE SENIOR FOREIGN STAFFS`,
    seniorStaff
  );

  addStaffSection(
    `ATTENDANCE FOR ${MONTHS[month].toUpperCase()} ${year} - MALE JUNIOR FOREIGN STAFFS`,
    juniorStaff
  );

  // Leave legend
  sheet.mergeCells(currentRow, 1, currentRow, 4);
  sheet.getCell(currentRow, 1).value = "LEAVE / ATTENDANCE LEGEND";
  sheet.getCell(currentRow, 1).font = { bold: true };
  currentRow++;

  const legend = [
    ["OFF", "Day Off"],
    ["MC", "Medical Certificate"],
    ["EL", "Emergency Leave"],
    ["AL", "Annual Leave"],
    ["SUS", "Suspended"],
    ["FL", "Family Leave"],
    ["SICK", "Sick Leave"],
    ["HD", "Half Day"],
    ["AB", "Absent"],
    ["NL", "No Pay Leave"],
    ["SP", "Special Leave"]
  ];

  legend.forEach(([code, description]) => {
    sheet.getCell(currentRow, 1).value = code;
    sheet.getCell(currentRow, 2).value = description;
    currentRow++;
  });

  currentRow += 2;

  // Signatures
  const signatureStart = currentRow;

  const signatures = [
    ["Prepared By", "Lila Ibrahim", "HR Executive"],
    ["Checked By", "Hussain Mahir", "Office Manager"],
    ["Approved By", "Moosa Ahmed", "Chairman"]
  ];

  signatures.forEach((signature, index) => {
    const col = 1 + index * 5;

    sheet.getCell(signatureStart, col).value = signature[0];
    sheet.getCell(signatureStart + 2, col).value = signature[1];
    sheet.getCell(signatureStart + 3, col).value = signature[2];

    sheet.getCell(signatureStart, col).font = { bold: true };
    sheet.getCell(signatureStart + 2, col).font = { bold: true };
  });

  // Print settings
  sheet.pageSetup = {
    paperSize: 8 as any, // A3
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.2,
      right: 0.2,
      top: 0.4,
      bottom: 0.4,
      header: 0.1,
      footer: 0.1
    }
  };

  sheet.properties.defaultRowHeight = 20;
  sheet.pageSetup.printArea = `A1:${sheet.getColumn(lastColumn).letter}${currentRow + 3}`;

  // Download Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    `Staff_Attendance_${MONTHS[month]}_${year}.xlsx`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
