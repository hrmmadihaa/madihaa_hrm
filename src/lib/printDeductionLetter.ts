import jsPDF from 'jspdf';
import type { CustomDeduction } from './payroll';
import { formatDate } from './dateUtils';

export const printDeductionLetter = async (
  deduction: CustomDeduction,
  preparedBy: string,
  preparedByPosition: string,
  approvedBy: string,
  approvedByPosition: string
) => {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Please allow pop-ups to print this letter.');
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
  doc.setFontSize(14);
  doc.text('DEDUCTION ACKNOWLEDGMENT LETTER', 105, y, {
    align: 'center',
  });

  y += 15;

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Date: ${formatDate(new Date())}`, margin, y);

  y += 10;

  // Employee Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('To:', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.text(deduction.employeeName, margin, y);
  y += 6;
  doc.text(`Employee ID: ${deduction.employeeIdNumber}`, margin, y);
  y += 6;
  doc.text(`Madihaa Company (Pte) Ltd`, margin, y);

  y += 15;

  // Subject
  doc.setFont('helvetica', 'bold');
  doc.text('Subject: Deduction Notification', margin, y);

  y += 10;

  // Letter Body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const letterBody = `Dear ${deduction.employeeName},

This letter serves as formal notification of a salary deduction that will be applied to your payroll as detailed below:

Deduction Details:
- Deduction Name: ${deduction.name}
- Amount: ${deduction.amount.toFixed(2)} ${deduction.type === 'percentage' ? '%' : 'MVR'}
- Type: ${deduction.type === 'fixed' ? 'Fixed Amount' : 'Percentage of Salary'}
${deduction.isRecurring ? `- Recurring: Yes (${deduction.numberOfMonths || 'N/A'} months)` : '- Recurring: No'}
${deduction.month && deduction.year ? `- Period: Starting ${new Date(deduction.year, deduction.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : ''}
${deduction.reason ? `- Reason: ${deduction.reason}` : ''}

${deduction.isRecurring 
  ? `This deduction will be applied to your salary for ${deduction.numberOfMonths} month(s) starting from the specified period. After this period, the deduction will automatically stop unless renewed.`
  : 'This is a one-time deduction and will be applied to your salary for the specified period only.'}

If you believe this deduction has been applied in error or have any questions, please contact the HR Department immediately.

By signing below, you acknowledge that you have received this notification and understand the deduction details.`;

  const lines = doc.splitTextToSize(letterBody, contentWidth);
  doc.text(lines, margin, y);
  y += lines.length * 5 + 15;

  // Signature Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Employee Acknowledgment:', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Signature: ___________________', margin, y);
  y += 7;
  doc.text('Date: ___________________', margin, y);
  y += 7;
  doc.text(`Name: ${deduction.employeeName}`, margin, y);

  y += 20;

  // Approval Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('HR Approval:', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Prepared By: ${preparedBy}`, margin, y);
  y += 7;
  if (preparedByPosition) {
    doc.text(`Position: ${preparedByPosition}`, margin, y);
    y += 7;
  }
  doc.text('Signature: ___________________', margin, y);
  y += 7;
  doc.text(`Date: ${formatDate(new Date())}`, margin, y);

  y += 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Management Approval:', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Approved By: ${approvedBy}`, margin, y);
  y += 7;
  if (approvedByPosition) {
    doc.text(`Position: ${approvedByPosition}`, margin, y);
    y += 7;
  }
  doc.text('Signature: ___________________', margin, y);
  y += 7;
  doc.text(`Date: ___________________`, margin, y);

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
