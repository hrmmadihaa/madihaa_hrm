import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle, FileText, Calendar, Download, Archive } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  getExpiringDocuments,
  getExpiredDocuments,
  getAllActiveAlerts,
  acknowledgeAlert,
  archiveDocument,
  getPersonnelFileSummary
} from '../lib/personnelFiles';
import { getEmployees } from '../lib/employees';
import type { Employee } from '../types';
import { formatDate } from '../lib/dateUtils';

export const DigitalPersonnelFiles = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'expiring' | 'expired' | 'alerts'>('overview');
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
  const [expiredDocs, setExpiredDocs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [personnelFileSummary, setPersonnelFileSummary] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [expiringDocs, expiredDocs, alerts, employees] = await Promise.all([
        getExpiringDocuments(),
        getExpiredDocuments(),
        getAllActiveAlerts(),
        getEmployees()
      ]);
      
      setExpiringDocs(expiringDocs);
      setExpiredDocs(expiredDocs);
      setAlerts(alerts);
      setEmployees(employees);
      
      // Set first employee as default
      if (employees.length > 0) {
        setSelectedEmployeeId(employees[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPersonnelFileSummary = useCallback(async (employeeId: string) => {
    try {
      const summary = await getPersonnelFileSummary(employeeId);
      setPersonnelFileSummary(summary);
    } catch (error) {
      console.error('Error loading personnel file summary:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadPersonnelFileSummary(selectedEmployeeId);
    }
  }, [selectedEmployeeId, loadPersonnelFileSummary]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId, 'current-user-id');
      await loadData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleArchiveDocument = async (documentId: string) => {
    try {
      await archiveDocument(documentId);
      await loadData();
    } catch (error) {
      console.error('Error archiving document:', error);
    }
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'expired':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Digital Personnel Files</h1>
        <p className="text-secondary-600 mt-1">Manage employee documents and track expiry dates</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-secondary-600">Total Expiring</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{expiringDocs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-secondary-600">Expired</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{expiredDocs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-secondary-600">Active Alerts</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{alerts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-secondary-600">Employees</p>
            <p className="text-2xl font-bold text-primary-600 mt-1">{employees.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-secondary-600">Files Complete</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {personnelFileSummary ? `${personnelFileSummary.totalDocuments}` : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-secondary-200 overflow-x-auto pb-2 sm:pb-0">
        {(['overview', 'expiring', 'expired', 'alerts'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-secondary-600 hover:text-secondary-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Employee Selection */}
      {activeTab === 'overview' && (
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Select Employee
            </label>
            <select
              value={selectedEmployeeId || ''}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && personnelFileSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{personnelFileSummary.activeDocuments}</p>
                <p className="text-xs text-secondary-600">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{personnelFileSummary.warningDocuments}</p>
                <p className="text-xs text-secondary-600">Warning</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{personnelFileSummary.urgentDocuments}</p>
                <p className="text-xs text-secondary-600">Urgent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{personnelFileSummary.expiredDocuments}</p>
                <p className="text-xs text-secondary-600">Expired</p>
              </CardContent>
            </Card>
          </div>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Personnel File Documents</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {personnelFileSummary.documents.map((doc: any, index: number) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg hover:bg-secondary-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(doc.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-900 truncate">{doc.name}</p>
                      {doc.expiryDate && (
                        <p className="text-xs text-secondary-600">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Expires: {formatDate(new Date(doc.expiryDate))}
                          {doc.daysUntilExpiry !== null && (
                            <span className={doc.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                              ({doc.daysUntilExpiry} days)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {doc.url && (
                      <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg">
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleArchiveDocument(doc.id)}
                      className="p-2 text-secondary-600 hover:bg-secondary-100 rounded-lg"
                    >
                      <Archive className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expiring Tab */}
      {activeTab === 'expiring' && (
        <Card>
          <CardContent className="space-y-3 p-4">
            {expiringDocs.length === 0 ? (
              <p className="text-secondary-600">No documents expiring soon</p>
            ) : (
              expiringDocs.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-secondary-900">{doc.name}</p>
                    <p className="text-sm text-secondary-600">
                      Expires in {doc.daysUntilExpiry} days • {formatDate(new Date(doc.expiryDate))}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm">
                    Renew
                  </Button>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Expired Tab */}
      {activeTab === 'expired' && (
        <Card>
          <CardContent className="space-y-3 p-4">
            {expiredDocs.length === 0 ? (
              <p className="text-secondary-600">No expired documents</p>
            ) : (
              expiredDocs.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-secondary-900">{doc.name}</p>
                    <p className="text-sm text-red-600">
                      Expired {doc.daysOverdue} days ago • {formatDate(new Date(doc.expiryDate))}
                    </p>
                  </div>
                  <Button onClick={() => alert('Renew document')} size="sm" className="bg-red-600 hover:bg-red-700">
                    Renew Now
                  </Button>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <Card>
          <CardContent className="space-y-3 p-4">
            {alerts.length === 0 ? (
              <p className="text-secondary-600">No active alerts</p>
            ) : (
              alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 border rounded-lg ${getAlertColor(alert.alertType)}`}
                >
                  <div className="flex-1">
                    <p className="font-medium capitalize">{alert.alertType} Alert</p>
                    <p className="text-sm">Document {alert.documentId}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
