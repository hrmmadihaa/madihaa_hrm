import jsPDF from 'jspdf';
import type { DisciplinaryAction } from '../types';

const formatDate = (value: any): string => {
  if (!value) return 'N/A';

  const date = value instanceof Date
    ? value
    : typeof value.toDate === 'function'
      ? value.toDate()
      : new Date(value);

  return Number.isNaN(date.getTime())
    ? 'N/A'
    : date.toLocaleDateString('en-GB');
};

const getActionType = (type: string) => {
  const types: Record<string, string> = {
    verbal_warning: 'Verbal Warning',
    written_warning_1: 'Written Warning 1',
    written_warning_2: 'Written Warning 2',
    written_warning_3: 'Written Warning 3',
    final_warning: 'Final Warning',
    termination: 'Termination',
  };

  return types[type] || type;
};

export const printDisciplinaryReport = async (
  action: DisciplinaryAction
) => {
  // Open the window immediately to avoid popup blocking.
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Please allow pop-ups to print this report.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const bottomMargin = 22;

  let y = 15;

  // Load company logo without blocking report generation.
  try {
    const logo = new Image();
    logo.src = '/madihaa (1).jpg';

    await new Promise<void>((resolve) => {
      logo.onload = () => {
        try {
          doc.addImage(logo, 'JPEG', 15, 9, 25, 25);
        } catch (error) {
          console.warn('Logo could not be added:', error);
        }
        resolve();
      };

      logo.onerror = () => resolve();
    });
  } catch (error) {
    console.warn('Logo loading failed:', error);
  }

  // ------------------------------------------------
  // COMPANY LETTERHEAD
  // ------------------------------------------------

  doc.setTextColor(0, 0, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('MADIHAA COMPANY (PTE) LTD', 105, 15, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  doc.text(
    'M.Madihaa, Shaheed Ali Higun, Malé, Republic of Maldives',
    105,
    22,
    { align: 'center' }
  );

  doc.setFontSize(7.5);

  doc.text(
    'Tel: 3328827 | Fax: 3313936 | Email: madicom@dhivehinet.net.mv',
    105,
    28,
    { align: 'center' }
  );

  doc.text('Web: www.madihaaa.com', 105, 33, {
    align: 'center',
  });

  doc.setLineWidth(0.5);
  doc.line(margin, 39, pageWidth - margin, 39);

  // ------------------------------------------------
  // REPORT TITLE
  // ------------------------------------------------

  y = 49;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);

  doc.text('Disciplinary Action Report', 105, y, {
    align: 'center',
  });

  y += 7;

  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  // ------------------------------------------------
  // HELPERS FOR AUTOMATIC PAGE BREAKS
  // ------------------------------------------------

  const checkPageSpace = (height: number) => {
    if (y + height > pageHeight - bottomMargin) {
      doc.addPage();
      y = 20;
    }
  };

  const addSection = (title: string, content: string) => {
    const lines = doc.splitTextToSize(
      String(content || 'N/A'),
      contentWidth
    );

    checkPageSpace(15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title, margin, y);

    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    lines.forEach((line: string) => {
      checkPageSpace(6);
      doc.text(line, margin, y);
      y += 5;
    });

    y += 5;
  };

  const addDetail = (label: string, value: string) => {
    checkPageSpace(8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    doc.text(label, margin, y);
    doc.text(String(value || 'N/A'), 65, y);

    y += 7;
  };

  // ------------------------------------------------
  // EMPLOYEE INFORMATION / INCIDENT DETAILS
  // ------------------------------------------------

  const columnWidth = contentWidth / 2;
  const rightColumn = margin + columnWidth + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  doc.text('Employee Information', margin, y);
  doc.text('Incident Details', rightColumn, y);

  const infoStartY = y + 9;

  const employeeInfo = [
    ['Name:', action.employeeName],
    ['Department:', action.employeeDepartment],
    ['Designation:', action.employeeDesignation],
    ['Employee ID:', action.employeeId],
  ];

  const incidentInfo = [
    ['Type:', getActionType(action.type)],
    ['Severity:', action.severity.toUpperCase()],
    ['Incident Date:', formatDate(action.incidentDate)],
    ['Reported Date:', formatDate(action.reportedDate)],
    ['Status:', action.status.toUpperCase()],
  ];

  const rowHeight = 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  for (
    let i = 0;
    i < Math.max(employeeInfo.length, incidentInfo.length);
    i++
  ) {
    const rowY = infoStartY + i * rowHeight;

    if (i < employeeInfo.length) {
      doc.setFont('helvetica', 'bold');
      doc.text(employeeInfo[i][0], margin, rowY);

      doc.setFont('helvetica', 'normal');

      const value = doc.splitTextToSize(
        String(employeeInfo[i][1] || 'N/A'),
        42
      );

      doc.text(value, margin + 25, rowY);
    }

    if (i < incidentInfo.length) {
      doc.setFont('helvetica', 'bold');
      doc.text(incidentInfo[i][0], rightColumn, rowY);

      doc.setFont('helvetica', 'normal');

      const value = doc.splitTextToSize(
        String(incidentInfo[i][1] || 'N/A'),
        45
      );

      doc.text(value, rightColumn + 27, rowY);
    }
  }

  // Divider between columns
  const infoEndY = infoStartY + 5 * rowHeight;

  doc.setLineWidth(0.3);
  doc.line(
    margin + columnWidth,
    y - 2,
    margin + columnWidth,
    infoEndY - 3
  );

  y = infoEndY + 5;

  // ------------------------------------------------
  // DESCRIPTION
  // ------------------------------------------------

  addSection('Description:', action.description);

  // ------------------------------------------------
  // ACTION TAKEN
  // ------------------------------------------------

  addSection('Action Taken:', action.actionTaken);

  // ------------------------------------------------
  // ADDITIONAL DETAILS
  // ------------------------------------------------

  checkPageSpace(15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  doc.text('Additional Details', margin, y);

  y += 8;

  doc.setLineWidth(0.3);
  doc.line(margin, y - 4, pageWidth - margin, y - 4);

  addDetail('Reported By:', action.reportedBy);
  addDetail('Approved By:', action.approvedBy || 'N/A');

  addDetail(
    'Warning Letter Issued:',
    action.warningLetterIssued ? 'Yes' : 'No'
  );

  if (action.suspensionDays) {
    addDetail(
      'Suspension Days:',
      String(action.suspensionDays)
    );
  }

  if (action.fineAmount) {
    addDetail(
      'Fine Amount:',
      `MVR ${action.fineAmount}` 
    );
  }

  // ------------------------------------------------
  // NOTES
  // ------------------------------------------------

  if (action.notes) {
    addSection('Notes:', action.notes);
  }

  // ------------------------------------------------
  // SIGNATURE SECTION
  // ------------------------------------------------

  // Reserve enough space for the entire signature section.
  // If there is not enough room, start a fresh page.

  checkPageSpace(62);

  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);

  doc.text('Signatures', 105, y, {
    align: 'center',
  });

  y += 7;

  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  // Three equal-width boxes within the A4 margins.
  const boxWidth = 54;
  const boxHeight = 22;
  const gap = 9;

  const signaturePositions = [
    margin,
    margin + boxWidth + gap,
    margin + (boxWidth + gap) * 2,
  ];

  const signatures = [
    {
      title: 'Employee Signature',
      name: '',
    },
    {
      title: 'Prepared By',
      name: action.preparedBy || 'N/A',
    },
    {
      title: 'Approved By',
      name: action.approvedBy || 'N/A',
    },
  ];

  signatures.forEach((signature, index) => {
    const x = signaturePositions[index];
    const center = x + boxWidth / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);

    doc.text(signature.title, center, y, {
      align: 'center',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const nameLines = doc.splitTextToSize(
      signature.name || 'Name:',
      boxWidth - 4
    );

    doc.text(nameLines.slice(0, 2), center, y + 6, {
      align: 'center',
    });

    doc.text('Date:', center, y + 15, {
      align: 'center',
    });

    doc.setLineWidth(0.5);

    doc.rect(
      x,
      y + 18,
      boxWidth,
      boxHeight
    );
  });

  // ------------------------------------------------
  // FOOTER ON EVERY PAGE
  // ------------------------------------------------

  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);

    doc.text(
      `Generated on: ${formatDate(new Date())}`,
      margin,
      pageHeight - 10
    );

    doc.text(
      `Page ${page} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // ------------------------------------------------
  // OPEN PDF PRINT PREVIEW
  // ------------------------------------------------

  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  printWindow.location.href = pdfUrl;
};
