import { FileSpreadsheet, FileText } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../lib/reports';
import { usePermissions } from '../hooks/usePermissions';

interface ExportButtonProps {
  data: any[];
  filename: string;
  title?: string;
  showExcel?: boolean;
  showPDF?: boolean;
  className?: string;
}

export const ExportButton = ({ 
  data, 
  filename, 
  title = 'Report',
  showExcel = true,
  showPDF = true,
  className = ''
}: ExportButtonProps) => {
  const { isSuperAdmin } = usePermissions();

  if (!isSuperAdmin()) {
    return null;
  }

  const handleExportExcel = () => {
    try {
      exportToExcel(data, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel');
    }
  };

  const handleExportPDF = () => {
    try {
      exportToPDF(data, filename, title);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export to PDF');
    }
  };

  if (!showExcel && !showPDF) {
    return null;
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {showExcel && (
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          title="Export to Excel"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Excel</span>
        </button>
      )}
      {showPDF && (
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          title="Export to PDF"
        >
          <FileText className="w-4 h-4" />
          <span>PDF</span>
        </button>
      )}
    </div>
  );
};
