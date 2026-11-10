const XLSX = require('xlsx');
const fs = require('fs');

try {
  const workbook = XLSX.readFile('Madihaa_Foreign _Male Salary_Oct 2026 no password.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Read the actual Excel data
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Header is at row 3 (index 2), employee names are in column 1 (index 1)
  const headerRowIndex = 2;
  const nameColIndex = 1;
  
  // Create row to employee mapping (data starts at row 4, which is index 3)
  const rowToEmployee = {};
  data.forEach((row, index) => {
    if (index < 3) return; // Skip header rows
    const rowNumber = index + 1; // Excel rows are 1-indexed
    if (row[nameColIndex]) {
      rowToEmployee[rowNumber] = row[nameColIndex];
    }
  });
  
  // Get comments
  const comments = [];
  Object.keys(sheet).forEach(key => {
    if (key.startsWith('!')) return;
    const cell = sheet[key];
    if (cell.c) {
      cell.c.forEach(comment => {
        comments.push({
          cell: key,
          author: comment.a,
          text: comment.t
        });
      });
    }
  });
  
  // Get row number from cell reference
  const getRowNumber = (cellRef) => {
    const match = cellRef.match(/[A-Z]+(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };
  
  // Build output with employee names
  let output = '=== Excel Comments with Employee Names ===\n\n';
  
  comments.forEach(c => {
    const rowNumber = getRowNumber(c.cell);
    const employeeName = rowToEmployee[rowNumber] || 'Unknown';
    output += `Cell ${c.cell} (Row ${rowNumber}) - Employee: ${employeeName}\n`;
    output += `Author: ${c.author}\n`;
    output += `Comment: ${c.text}\n`;
    output += '---\n';
  });
  
  output += `\nTotal comments found: ${comments.length}\n`;
  
  console.log(output);
  
  // Save to file
  fs.writeFileSync('excel-comments-detailed.txt', output, 'utf8');
  console.log('Saved to excel-comments-detailed.txt');
  
} catch (error) {
  console.error('Error:', error.message);
}
