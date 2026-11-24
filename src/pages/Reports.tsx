import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, FileText, Download, Filter, Calendar, Users, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
} from '../lib/reports';

export const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const reportTypes = [
    { id: 'employee', name: 'Employee Report', icon: Users, description: 'Complete employee directory' },
    { id: 'attendance', name: 'Attendance Report', icon: Clock, description: 'Attendance records and trends' },
    { id: 'leave', name: 'Leave Report', icon: Calendar, description: 'Leave usage and balances' },
    { id: 'payroll', name: 'Payroll Report', icon: DollarSign, description: 'Salary and payment details' },
    { id: 'overtime', name: 'Overtime Report', icon: TrendingUp, description: 'Overtime hours and costs' },
  ];

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    const filename = `${selectedReport}_report_${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'excel':
        exportToExcel([], filename);
        break;
      case 'csv':
        exportToCSV([], filename);
        break;
      case 'pdf':
        exportToPDF([], filename, `${selectedReport} Report`);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 sm:p-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Reports & Analytics</h1>
        <p className="text-secondary-600 mt-1">Generate and export HR reports</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedReport(report.id)}
            className={`cursor-pointer transition-all ${
              selectedReport === report.id
                ? 'ring-2 ring-primary-500 bg-primary-50'
                : 'hover:shadow-lg'
            }`}
          >
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${
                    selectedReport === report.id ? 'bg-primary-100' : 'bg-secondary-100'
                  }`}>
                    <report.icon className={`w-6 h-6 ${
                      selectedReport === report.id ? 'text-primary-600' : 'text-secondary-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-secondary-900">{report.name}</h3>
                    <p className="text-sm text-secondary-600 mt-1">{report.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Report Configuration */}
      {selectedReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-secondary-900">Report Configuration</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => handleExport('excel')}>
                  <Download className="w-5 h-5 mr-2" />
                  Export Excel
                </Button>
                <Button variant="secondary" onClick={() => handleExport('csv')}>
                  <Download className="w-5 h-5 mr-2" />
                  Export CSV
                </Button>
                <Button variant="secondary" onClick={() => handleExport('pdf')}>
                  <Download className="w-5 h-5 mr-2" />
                  Export PDF
                </Button>
                <Button variant="ghost">
                  <Filter className="w-5 h-5 mr-2" />
                  Advanced Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Total Reports</p>
                <p className="text-2xl font-bold text-secondary-900">5</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Generated This Month</p>
                <p className="text-2xl font-bold text-green-600">24</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Most Popular</p>
                <p className="text-2xl font-bold text-primary-600">Payroll</p>
              </div>
              <div className="p-2 bg-primary-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Last Export</p>
                <p className="text-2xl font-bold text-secondary-900">Today</p>
              </div>
              <div className="p-2 bg-secondary-100 rounded-lg">
                <Download className="w-5 h-5 text-secondary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary-900">Recent Reports</h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-secondary-600">
            No recent reports available
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
