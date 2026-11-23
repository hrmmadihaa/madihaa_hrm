import jsPDF from 'jspdf';
import type { MedicalRequisition } from './medicalRequisition';
import { formatDate } from './dateUtils';

export const printMedicalRequisition = async (requisition: MedicalRequisition) => {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Please allow pop-ups to print this requisition.');
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

  // Load company logo
  try {
    const logo = new Image();
    logo.src = '/Madihaa 2026 (1).png';

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

  // COMPANY LETTERHEAD
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

  doc.text(
    'Email: info@madihaa.com.mv | Tel: +960 333-9999',
    105,
    26,
    { align: 'center' }
  );

  // Line separator
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, 30, pageWidth - margin, 30);

  y = 40;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MEDICAL REQUISITION SLIP', 105, y, {
    align: 'center',
  });

  y += 15;

  // Department and Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Department: ${requisition.department}`, margin, y);
  doc.text(`Date: ${formatDate(requisition.date)}`, pageWidth - margin, y, { align: 'right' });

  y += 15;

  // Staff Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Staff Members:', margin, y);
  y += 8;

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Name', margin + 2, y + 5);
  doc.text('Designation', margin + 60, y + 5);
  doc.text('Detail of Sickness', margin + 110, y + 5);

  y += 8;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  requisition.staff.forEach((staffMember) => {
    if (y > pageHeight - bottomMargin - 30) {
      doc.addPage();
      y = 20;
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 2;
    
    doc.text(staffMember.name || '-', margin + 2, y);
    doc.text(staffMember.designation || '-', margin + 60, y);
    
    const sicknessLines = doc.splitTextToSize(staffMember.sickness || '-', contentWidth - 110);
    doc.text(sicknessLines, margin + 110, y);
    y += sicknessLines.length * 5 + 3;
  });

  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Remarks
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Remarks:', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  if (requisition.remarks) {
    const remarksLines = doc.splitTextToSize(requisition.remarks, contentWidth);
    doc.text(remarksLines, margin, y);
    y += remarksLines.length * 5 + 10;
  } else {
    doc.text('-', margin, y);
    y += 10;
  }

  // Approval Section
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Requested By:', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Name: ${requisition.requestedBy}`, margin, y);
  y += 5;
  if (requisition.requestedByPosition) {
    doc.text(`Position: ${requisition.requestedByPosition}`, margin, y);
    y += 5;
  }
  doc.text('Signature: ___________________', margin, y);
  y += 5;
  doc.text(`Date: ${formatDate(new Date())}`, margin, y);

  y += 20;

  if (requisition.approvedBy) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Approved By:', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Name: ${requisition.approvedBy}`, margin, y);
    y += 5;
    if (requisition.approvedByPosition) {
      doc.text(`Position: ${requisition.approvedByPosition}`, margin, y);
      y += 5;
    }
    doc.text('Signature: ___________________', margin, y);
    y += 5;
    doc.text(`Date: ___________________`, margin, y);
  }

  // Footer
  y = pageHeight - bottomMargin;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'This is an official document from Madihaa Company (Pte) Ltd',
    105,
    y,
    { align: 'center' }
  );

  // Generate and print
  doc.autoPrint();
  const pdfUrl = doc.output('bloburl');
  printWindow.location.href = pdfUrl.toString();
};
