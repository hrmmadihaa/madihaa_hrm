import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Building2, AlertTriangle, FileText, 
  Shield, Heart, DollarSign, LogOut, Search,
  Plus, Upload, Clock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { ExportButton } from '../components/ExportButton';
import { ExpatStaffForm } from '../components/ExpatStaffForm';
import type { 
  ExpatStaff, 
  ExpatCompany,
  ExpatDashboardStats,
  Employee,
  MedicalApplication
} from '../types';
import {
  createExpatStaff,
  updateExpatStaff
} from '../lib/expatStaff';
import { getEmployees, updateEmployee } from '../lib/employees';
import { 
  getAllMedicalApplications, 
  createMedicalApplication
} from '../lib/medicalApplications';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

type TabType = 'overview' | 'all-staff' | 'ongoing' | 'work-visa' | 'medical' | 'insurance' | 'deposits' | 'left-staffs' | 'expiry-center' | 'reports';

export const XpatsStaffDetails = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedCompany, setSelectedCompany] = useState<ExpatCompany | 'all'>('all');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recruitmentCandidates, setRecruitmentCandidates] = useState<any[]>([]);
  const [medicalApplications, setMedicalApplications] = useState<MedicalApplication[]>([]);
  const [stats, setStats] = useState<ExpatDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm] = useState('');
  const [tabSearchTerm, setTabSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<ExpatStaff | null>(null);
  const [showVisaCancelModal, setShowVisaCancelModal] = useState(false);
  const [cancellingStaff, setCancellingStaff] = useState<ExpatStaff | null>(null);
  const [cancellingEmployee, setCancellingEmployee] = useState<Employee | null>(null);
  const [visaCancelData, setVisaCancelData] = useState({
    submittedDate: '',
    requestNumber: '',
    egovLink: ''
  });
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [selectedStaffForMedical, setSelectedStaffForMedical] = useState<ExpatStaff | null>(null);
  const [medicalFormData, setMedicalFormData] = useState({
    refNumber: '',
    egovLink: ''
  });
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load employees from Employees collection
      const employeeData = await getEmployees();
      setEmployees(employeeData);
      console.log('Loaded employees:', employeeData.length);
      
      // Load medical applications
      const medicalApps = await getAllMedicalApplications();
      setMedicalApplications(medicalApps);
      
      // Load recruitment pipeline candidates with work permit approval
      const allRecruitmentQuery = query(collection(db, 'recruitment_candidates'));
      const allRecruitmentSnapshot = await getDocs(allRecruitmentQuery);
      const allRecruitmentData = allRecruitmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      console.log('All recruitment candidates:', allRecruitmentData.length);
      
      // Filter candidates with work permit related stages
      const recruitmentData = allRecruitmentData.filter((candidate: any) => 
        candidate.stage === 'work_permit_applied' || 
        candidate.status === 'work permit applied' ||
        candidate.stage === 'payment_pending' ||
        candidate.stage === 'payment_completed' ||
        candidate.stage === 'entry_pass_pending' ||
        candidate.stage === 'entry_pass_received' ||
        candidate.stage === 'ticket_purchased' ||
        candidate.stage === 'ticket_approved' ||
        candidate.stage === 'departed' ||
        candidate.stage === 'van_arranged' ||
        candidate.stage === 'airport_pickup' ||
        candidate.stage === 'arrived' ||
        candidate.stage === 'onboarded'
      );
      console.log('Filtered recruitment candidates:', recruitmentData.length);
      setRecruitmentCandidates(recruitmentData);
      
      // Calculate dashboard stats from employees
      const activeEmployees = employeeData.filter(e => e.status === 'active');
      const today = new Date();
      const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      const dashboardStats: ExpatDashboardStats = {
        totalExpatStaff: employeeData.length,
        madihaaStaff: activeEmployees.filter(e => e.department === 'General').length,
        batutaStaff: 0,
        madigrandStaff: 0,
        activeStaff: activeEmployees.length,
        departedStaff: employeeData.filter(e => e.status === 'resigned' || e.status === 'terminated').length,
        workPermitsExpiring: activeEmployees.filter(e => {
          const expiry = e.wpExpDate;
          return expiry && new Date(expiry) <= ninetyDaysFromNow;
        }).length,
        passportsExpiring: activeEmployees.filter(e => {
          const expiry = e.ppIdExpDate;
          return expiry && new Date(expiry) <= ninetyDaysFromNow;
        }).length,
        visasExpiring: activeEmployees.filter(e => {
          const expiry = e.visaExpiryDate;
          return expiry && new Date(expiry) <= ninetyDaysFromNow;
        }).length,
        medicalExpiring: activeEmployees.filter(e => {
          const expiry = e.medExpDate;
          return expiry && new Date(expiry) <= ninetyDaysFromNow;
        }).length,
        insuranceExpiring: activeEmployees.filter(e => {
          const expiry = e.insuranceExpDate;
          return expiry && new Date(expiry) <= ninetyDaysFromNow;
        }).length,
        pendingDeposits: 0,
      };
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCompanyChange = (company: ExpatCompany | 'all') => {
    setSelectedCompany(company);
  };

  const handleSaveStaff = async (staff: Omit<ExpatStaff, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingStaff) {
        await updateExpatStaff(editingStaff.id, staff);
      } else {
        await createExpatStaff(staff);
      }
      setShowAddModal(false);
      setEditingStaff(null);
      loadData();
    } catch (error) {
      console.error('Error saving staff:', error);
    }
  };

  const handleEmployeeVisaCancel = (employee: Employee) => {
    setCancellingEmployee(employee);
    setCancellingStaff(null);
    setVisaCancelData({
      submittedDate: employee.visaCancellation?.submittedDate ? new Date(employee.visaCancellation.submittedDate).toISOString().split('T')[0] : '',
      requestNumber: employee.visaCancellation?.requestNumber || '',
      egovLink: employee.visaCancellation?.egovLink || ''
    });
    setShowVisaCancelModal(true);
  };

  const handleVisaCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (cancellingStaff) {
        // Cancel visa for Expat Staff
        const updatedVisa = {
          ...cancellingStaff.visa,
          status: 'cancelled',
          cancellation: {
            submittedDate: visaCancelData.submittedDate ? new Date(visaCancelData.submittedDate) : undefined,
            requestNumber: visaCancelData.requestNumber,
            egovLink: visaCancelData.egovLink,
            cancelledAt: new Date()
          }
        };

        await updateExpatStaff(cancellingStaff.id, { visa: updatedVisa });
      } else if (cancellingEmployee) {
        // Cancel visa for Employee
        const updatedEmployee = {
          ...cancellingEmployee,
          visaCancellation: {
            submittedDate: visaCancelData.submittedDate ? new Date(visaCancelData.submittedDate) : undefined,
            requestNumber: visaCancelData.requestNumber,
            egovLink: visaCancelData.egovLink,
            cancelledAt: new Date()
          }
        };

        await updateEmployee(cancellingEmployee.id, updatedEmployee);
      }

      setShowVisaCancelModal(false);
      setCancellingStaff(null);
      setCancellingEmployee(null);
      setVisaCancelData({ submittedDate: '', requestNumber: '', egovLink: '' });
      loadData();
    } catch (error) {
      console.error('Error cancelling visa:', error);
      alert('Failed to cancel visa');
    }
  };

  const handleMedicalApply = (staff: ExpatStaff) => {
    setSelectedStaffForMedical(staff);
    setMedicalFormData({ refNumber: '', egovLink: '' });
    setShowMedicalModal(true);
  };

  const handleMedicalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForMedical) return;

    try {
      await createMedicalApplication({
        staffId: selectedStaffForMedical.id,
        staffName: selectedStaffForMedical.fullName,
        refNumber: medicalFormData.refNumber,
        egovLink: medicalFormData.egovLink,
        createdDate: new Date(),
        status: 'submitted',
      });

      setShowMedicalModal(false);
      setSelectedStaffForMedical(null);
      setMedicalFormData({ refNumber: '', egovLink: '' });
      loadData();
    } catch (error) {
      console.error('Error submitting medical application:', error);
      alert('Failed to submit medical application');
    }
  };

  const getDocumentStatusColor = (daysRemaining?: number) => {
    if (!daysRemaining) return 'bg-gray-100 text-gray-600';
    if (daysRemaining < 0) return 'bg-red-100 text-red-700';
    if (daysRemaining <= 7) return 'bg-red-100 text-red-700';
    if (daysRemaining <= 30) return 'bg-orange-100 text-orange-700';
    if (daysRemaining <= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getDocumentStatusText = (daysRemaining?: number) => {
    if (!daysRemaining) return 'Missing';
    if (daysRemaining < 0) return 'Expired';
    if (daysRemaining <= 7) return 'Critical';
    if (daysRemaining <= 30) return 'Expiring Soon';
    if (daysRemaining <= 60) return 'Warning';
    return 'Valid';
  };

  const isExpiringWithin3Months = (daysRemaining?: number) => {
    if (daysRemaining === undefined) return false;
    return daysRemaining >= 0 && daysRemaining <= 90;
  };

  const calculateDaysRemaining = (expiryDate?: Date): number | undefined => {
    if (!expiryDate) return undefined;
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filterEmployees = (data: Employee[], term: string) => {
    if (!term) return data;
    const lowerTerm = term.toLowerCase();
    return data.filter(emp =>
      emp.fullName.toLowerCase().includes(lowerTerm) ||
      emp.employeeId.toLowerCase().includes(lowerTerm) ||
      (emp.department && emp.department.toLowerCase().includes(lowerTerm)) ||
      (emp.designation && emp.designation.toLowerCase().includes(lowerTerm))
    );
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    onClick 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    color: string;
    onClick?: () => void;
  }) => (
    <div 
      className={`cursor-pointer hover:shadow-lg transition-shadow ${onClick ? '' : ''}`}
      onClick={onClick}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">{title}</p>
              <p className="text-2xl font-bold text-secondary-900">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Xpats Staff Details</h1>
          <p className="text-secondary-600 mt-1">Manage expatriate staff information</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExportButton
            data={employees.map(e => ({
              'Employee ID': e.employeeId,
              'Name': e.fullName,
              'Department': e.department,
              'Designation': e.designation,
              'Work Permit': e.wpNo,
              'Passport/ID': e.ppIdNumber,
              'Status': e.status,
            }))}
            filename={`expat-staff-${new Date().toISOString().split('T')[0]}`}
            title="Expat Staff Report"
          />
          <Button variant="secondary" onClick={() => {}}>
            <Upload className="w-5 h-5 mr-2" />
            Import Excel
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Expat Staff
          </Button>
        </div>
      </div>

      {/* Company Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCompany === 'all' ? 'primary' : 'secondary'}
          onClick={() => handleCompanyChange('all')}
          size="sm"
        >
          All Companies
        </Button>
        <Button
          variant={selectedCompany === 'Madihaa' ? 'primary' : 'secondary'}
          onClick={() => handleCompanyChange('Madihaa')}
          size="sm"
        >
          Madihaa
        </Button>
        <Button
          variant={selectedCompany === 'Batuta' ? 'primary' : 'secondary'}
          onClick={() => handleCompanyChange('Batuta')}
          size="sm"
        >
          Batuta
        </Button>
        <Button
          variant={selectedCompany === 'Madigrand' ? 'primary' : 'secondary'}
          onClick={() => handleCompanyChange('Madigrand')}
          size="sm"
        >
          Madigrand
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-secondary-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {[
            { id: 'overview' as TabType, label: 'Overview', icon: Users },
            { id: 'all-staff' as TabType, label: 'All Staff', icon: Users },
            { id: 'ongoing' as TabType, label: 'Ongoing', icon: Clock },
            { id: 'work-visa' as TabType, label: 'Work Visa', icon: FileText },
            { id: 'medical' as TabType, label: 'Medical', icon: Heart },
            { id: 'insurance' as TabType, label: 'Insurance', icon: Shield },
            { id: 'deposits' as TabType, label: 'Deposits', icon: DollarSign },
            { id: 'left-staffs' as TabType, label: 'Left Staffs', icon: LogOut },
            { id: 'expiry-center' as TabType, label: 'Expiry Center', icon: AlertTriangle },
            { id: 'reports' as TabType, label: 'Reports', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:border-secondary-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Dashboard Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
              <StatCard
                title="Total Expat Staff"
                value={stats?.totalExpatStaff || 0}
                icon={Users}
                color="bg-blue-500"
                onClick={() => setActiveTab('all-staff')}
              />
              <StatCard
                title="Madihaa Staff"
                value={stats?.madihaaStaff || 0}
                icon={Building2}
                color="bg-purple-500"
                onClick={() => { setSelectedCompany('Madihaa'); setActiveTab('all-staff'); }}
              />
              <StatCard
                title="Batuta Staff"
                value={stats?.batutaStaff || 0}
                icon={Building2}
                color="bg-green-500"
                onClick={() => { setSelectedCompany('Batuta'); setActiveTab('all-staff'); }}
              />
              <StatCard
                title="Madigrand Staff"
                value={stats?.madigrandStaff || 0}
                icon={Building2}
                color="bg-orange-500"
                onClick={() => { setSelectedCompany('Madigrand'); setActiveTab('all-staff'); }}
              />
              <StatCard
                title="Active Staff"
                value={stats?.activeStaff || 0}
                icon={Users}
                color="bg-green-600"
                onClick={() => { setSelectedCompany('all'); setActiveTab('all-staff'); }}
              />
              <StatCard
                title="Departed Staff"
                value={stats?.departedStaff || 0}
                icon={LogOut}
                color="bg-red-500"
                onClick={() => setActiveTab('left-staffs')}
              />
            </div>

            {/* Expiry Alerts */}
            <h2 className="text-xl font-bold text-secondary-900 mb-4">Document Expiry Alerts</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <StatCard
                title="Work Permits Expiring"
                value={stats?.workPermitsExpiring || 0}
                icon={FileText}
                color="bg-red-500"
                onClick={() => setActiveTab('expiry-center')}
              />
              <StatCard
                title="Passports Expiring"
                value={stats?.passportsExpiring || 0}
                icon={FileText}
                color="bg-orange-500"
                onClick={() => setActiveTab('expiry-center')}
              />
              <StatCard
                title="Visas Expiring"
                value={stats?.visasExpiring || 0}
                icon={FileText}
                color="bg-yellow-500"
                onClick={() => setActiveTab('expiry-center')}
              />
              <StatCard
                title="Medical Expiring"
                value={stats?.medicalExpiring || 0}
                icon={Heart}
                color="bg-orange-500"
                onClick={() => setActiveTab('medical')}
              />
              <StatCard
                title="Insurance Expiring"
                value={stats?.insuranceExpiring || 0}
                icon={Shield}
                color="bg-red-500"
                onClick={() => setActiveTab('insurance')}
              />
            </div>

            {/* Deposit Tracking */}
            <h2 className="text-xl font-bold text-secondary-900 mb-4">Deposit Tracking</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Pending Deposits"
                value={stats?.pendingDeposits || 0}
                icon={DollarSign}
                color="bg-yellow-500"
                onClick={() => setActiveTab('deposits')}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'all-staff' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-bold text-secondary-900">All Expat Staff</h2>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search by name, ID, passport..."
                        value={tabSearchTerm}
                        onChange={(e) => setTabSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider sticky left-0 bg-white">
                          Employee ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Nationality
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Occupation
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Work Permit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Passport
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Visa Expiry
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-200">
                      {filterEmployees(employees, tabSearchTerm).map((emp) => (
                        <tr key={emp.id} className="hover:bg-secondary-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 font-medium">
                            {emp.employeeId}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900">
                            {emp.fullName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {emp.department || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {emp.country || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {emp.designation || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {emp.wpNo || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {emp.ppIdNumber || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {emp.visaExpiryDate ? new Date(emp.visaExpiryDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded ${getDocumentStatusColor(calculateDaysRemaining(emp.wpExpDate))}`}>
                              {getDocumentStatusText(calculateDaysRemaining(emp.wpExpDate))}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                              Employees
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {!emp.visaCancellation?.cancelledAt && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEmployeeVisaCancel(emp)}
                                className="text-xs"
                              >
                                Cancel Visa
                              </Button>
                            )}
                            {emp.visaCancellation?.cancelledAt && (
                              <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                                Cancelled
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'ongoing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-secondary-900">Ongoing - Recruitment Pipeline</h2>
                <p className="text-sm text-secondary-600">Candidates with work permit approval in progress</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Employee ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Expat Ref No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Submitted Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Slot Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Stage
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          E-Gov Link
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-200">
                      {recruitmentCandidates.map((candidate) => (
                        <tr key={candidate.id} className="hover:bg-secondary-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 font-medium">
                            {candidate.Name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {candidate['EMP ID'] || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {candidate.POSITION}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {candidate.expat_reference_number || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {candidate.submitted_date || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {candidate.slot_number || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700">
                              {candidate.stage?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {candidate.egov_link ? (
                              <a
                                href={candidate.egov_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                View
                              </a>
                            ) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'work-visa' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-bold text-secondary-900">Work Visa Tracking</h2>
                  <div className="flex gap-2 items-center">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showExpiringOnly}
                        onChange={(e) => setShowExpiringOnly(e.target.checked)}
                        className="rounded"
                      />
                      Show expiring within 3 months
                    </label>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={tabSearchTerm}
                      onChange={(e) => setTabSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-secondary-300 rounded-lg text-sm w-48"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Work Permit No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Visa Expiry
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Days Remaining
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-200">
                      {filterEmployees(employees.filter(e => e.status === 'active'), tabSearchTerm)
                        .filter(e => !showExpiringOnly || isExpiringWithin3Months(calculateDaysRemaining(e.visaExpiryDate)))
                        .map((emp) => {
                          const daysRemaining = calculateDaysRemaining(emp.visaExpiryDate);
                          return (
                            <tr key={emp.id} className="hover:bg-secondary-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 font-medium">
                                {emp.fullName}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                                {emp.department || 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                                {emp.wpNo || 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                                {emp.visaExpiryDate ? new Date(emp.visaExpiryDate).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                                {daysRemaining !== undefined ? daysRemaining : 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded ${getDocumentStatusColor(daysRemaining)}`}>
                                  {getDocumentStatusText(daysRemaining)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'medical' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-secondary-900">Medical Applications</h2>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Ref Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Staff Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Created Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Last Submitted Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          State Change Remarks
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          E-Gov Link
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-200">
                      {medicalApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-secondary-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 font-medium">
                            {app.refNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {app.staffName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {new Date(app.createdDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {app.lastSubmittedDate ? new Date(app.lastSubmittedDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {app.stateChangeRemarks || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded ${
                              app.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                              app.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' :
                              app.status === 'approved' ? 'bg-green-100 text-green-700' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {app.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {app.egovLink ? (
                              <a
                                href={app.egovLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                View
                              </a>
                            ) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-bold text-secondary-900">Medical Tracking</h2>
                  <div className="flex gap-2 items-center">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showExpiringOnly}
                        onChange={(e) => setShowExpiringOnly(e.target.checked)}
                        className="rounded"
                      />
                      Show expiring within 3 months
                    </label>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={tabSearchTerm}
                      onChange={(e) => setTabSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-secondary-300 rounded-lg text-sm w-48"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Medical Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Next Due Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Days Remaining
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-200">
                      {filterEmployees(employees.filter(e => e.status === 'active'), tabSearchTerm)
                        .filter(e => !showExpiringOnly || isExpiringWithin3Months(calculateDaysRemaining(e.medExpDate)))
                        .map((emp) => {
                          const daysRemaining = calculateDaysRemaining(emp.medExpDate);
                          return (
                            <tr key={emp.id} className="hover:bg-secondary-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 font-medium">
                                {emp.fullName}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                                {emp.department || 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                                {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                                {emp.medExpDate ? new Date(emp.medExpDate).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                                {daysRemaining !== undefined ? daysRemaining : 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded ${getDocumentStatusColor(daysRemaining)}`}>
                                  {getDocumentStatusText(daysRemaining)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleMedicalApply(emp as any)}
                                  className="text-xs"
                                >
                                  Apply Medical
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'insurance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-bold text-secondary-900">Insurance Tracking</h2>
                  <div className="flex gap-2 items-center">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showExpiringOnly}
                        onChange={(e) => setShowExpiringOnly(e.target.checked)}
                        className="rounded"
                      />
                      Show expiring within 3 months
                    </label>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={tabSearchTerm}
                      onChange={(e) => setTabSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-secondary-300 rounded-lg text-sm w-48"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Provider
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Policy Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Expiry Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Days Remaining
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-200">
                      {filterEmployees(employees.filter(e => e.status === 'active'), tabSearchTerm)
                        .filter(e => !showExpiringOnly || isExpiringWithin3Months(calculateDaysRemaining(e.insuranceExpDate)))
                        .map((emp) => {
                          const daysRemaining = calculateDaysRemaining(emp.insuranceExpDate);
                          return (
                            <tr key={emp.id} className="hover:bg-secondary-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 font-medium">
                                {emp.fullName}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                                {emp.department || 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                                'N/A'
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                                {emp.insuranceNumber || 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                                {emp.insuranceExpDate ? new Date(emp.insuranceExpDate).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                                {daysRemaining !== undefined ? daysRemaining : 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded ${getDocumentStatusColor(daysRemaining)}`}>
                                  {getDocumentStatusText(daysRemaining)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'deposits' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-bold text-secondary-900">Deposit Tracking</h2>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={tabSearchTerm}
                    onChange={(e) => setTabSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-secondary-300 rounded-lg text-sm w-48"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Deposit Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Paid
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Refund Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Refund Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-200">
                      {filterEmployees(employees, tabSearchTerm).map((emp) => (
                        <tr key={emp.id} className="hover:bg-secondary-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 font-medium">
                            {emp.fullName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {emp.department || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            N/A
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            N/A
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            N/A
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                              N/A
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'left-staffs' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-bold text-secondary-900">Left Staffs</h2>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={tabSearchTerm}
                    onChange={(e) => setTabSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-secondary-300 rounded-lg text-sm w-48"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Work Permit No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Visa Cancelled
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Request No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          E-Gov Link
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-200">
                      {filterEmployees(employees.filter(e => e.status === 'resigned' || e.status === 'terminated'), tabSearchTerm).map((emp) => (
                        <tr key={emp.id} className="hover:bg-secondary-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 font-medium">
                            {emp.fullName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {emp.wpNo || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {emp.status === 'resigned' ? 'Resigned' : 'Terminated'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {emp.visaCancellation?.submittedDate ? new Date(emp.visaCancellation.submittedDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {emp.visaCancellation?.requestNumber || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {emp.visaCancellation?.egovLink ? (
                              <a
                                href={emp.visaCancellation.egovLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                View
                              </a>
                            ) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                              Employees
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {!emp.visaCancellation?.cancelledAt && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEmployeeVisaCancel(emp)}
                                className="text-xs"
                              >
                                Cancel Visa
                              </Button>
                            )}
                            {emp.visaCancellation?.cancelledAt && (
                              <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                                Cancelled
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'expiry-center' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-bold text-secondary-900">Expiry Center</h2>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={tabSearchTerm}
                    onChange={(e) => setTabSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-secondary-300 rounded-lg text-sm w-48"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Document Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Document Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Expiry Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Days Remaining
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-200">
                      {filterEmployees(employees.filter(e => e.status === 'active'), tabSearchTerm).flatMap(emp => [
                        { type: 'Passport', number: emp.ppIdNumber, expiry: emp.ppIdExpDate, days: calculateDaysRemaining(emp.ppIdExpDate) },
                        { type: 'Visa', number: emp.wpNo || '', expiry: emp.visaExpiryDate, days: calculateDaysRemaining(emp.visaExpiryDate) },
                        { type: 'Work Permit', number: emp.wpNo, expiry: emp.wpExpDate, days: calculateDaysRemaining(emp.wpExpDate) },
                        { type: 'Medical', number: '-', expiry: emp.medExpDate, days: calculateDaysRemaining(emp.medExpDate) },
                        { type: 'Insurance', number: emp.insuranceNumber, expiry: emp.insuranceExpDate, days: calculateDaysRemaining(emp.insuranceExpDate) },
                      ]).filter(doc => doc.days !== undefined && doc.days <= 60).sort((a, b) => (a.days || 0) - (b.days || 0)).map((doc, idx) => (
                        <tr key={`${doc.type}-${idx}`} className="hover:bg-secondary-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 font-medium">
                            {employees.find(e => e.ppIdNumber === doc.number || e.wpNo === doc.number)?.fullName || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {employees.find(e => e.ppIdNumber === doc.number || e.wpNo === doc.number)?.department || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {doc.type}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {doc.number}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {doc.expiry ? new Date(doc.expiry).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                            {doc.days}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded ${getDocumentStatusColor(doc.days)}`}>
                              {getDocumentStatusText(doc.days)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-secondary-900">Reports</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Full Employee List', data: employees },
                    { title: 'Department-wise Report', data: employees },
                    { title: 'Passport Expiry Report', data: employees.filter(e => {
                      const days = calculateDaysRemaining(e.ppIdExpDate);
                      return days !== undefined && days! <= 60;
                    }) },
                    { title: 'Visa Expiry Report', data: employees.filter(e => {
                      const days = calculateDaysRemaining(e.visaExpiryDate);
                      return days !== undefined && days! <= 60;
                    }) },
                    { title: 'Work Permit Expiry Report', data: employees.filter(e => {
                      const days = calculateDaysRemaining(e.wpExpDate);
                      return days !== undefined && days! <= 60;
                    }) },
                    { title: 'Medical Due Report', data: employees.filter(e => {
                      const days = calculateDaysRemaining(e.medExpDate);
                      return days !== undefined && days! <= 60;
                    }) },
                    { title: 'Insurance Expiry Report', data: employees.filter(e => {
                      const days = calculateDaysRemaining(e.insuranceExpDate);
                      return days !== undefined && days! <= 60;
                    }) },
                    { title: 'Deposit Report', data: employees },
                    { title: 'Left Staff Report', data: employees.filter(e => e.status === 'resigned' || e.status === 'terminated') },
                  ].map((report, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <h3 className="text-sm font-medium text-secondary-900 mb-2">{report.title}</h3>
                        <p className="text-xs text-secondary-600 mb-3">{report.data.length} records</p>
                        <ExportButton
                          data={report.data.map(e => ({
                            'Employee ID': e.employeeId,
                            'Name': e.fullName,
                            'Department': e.department,
                            'Designation': e.designation,
                            'Status': e.status,
                          }))}
                          filename={`${report.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`}
                          title={report.title}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Add/Edit Staff Modal */}
      {(showAddModal || editingStaff) && (
        <ExpatStaffForm
          staff={editingStaff || undefined}
          onSave={handleSaveStaff}
          onCancel={() => {
            setShowAddModal(false);
            setEditingStaff(null);
          }}
        />
      )}

      {/* Visa Cancellation Modal */}
      {showVisaCancelModal && (cancellingStaff || cancellingEmployee) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Cancel Visa</h2>
              <button onClick={() => { setShowVisaCancelModal(false); setCancellingStaff(null); setCancellingEmployee(null); }}>
                ✕
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-secondary-600">
                Cancelling visa for: <span className="font-medium text-secondary-900">{cancellingStaff?.fullName || cancellingEmployee?.fullName}</span>
              </p>
              <p className="text-sm text-secondary-600">
                Employee ID: <span className="font-medium text-secondary-900">{cancellingStaff?.employeeId || cancellingEmployee?.employeeId}</span>
              </p>
            </div>
            <form onSubmit={handleVisaCancelSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted Date *</label>
                  <input
                    type="date"
                    value={visaCancelData.submittedDate}
                    onChange={(e) => setVisaCancelData({ ...visaCancelData, submittedDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Number *</label>
                  <input
                    type="text"
                    value={visaCancelData.requestNumber}
                    onChange={(e) => setVisaCancelData({ ...visaCancelData, requestNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., DCRW/2026/63906"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Gov Link</label>
                  <input
                    type="url"
                    value={visaCancelData.egovLink}
                    onChange={(e) => setVisaCancelData({ ...visaCancelData, egovLink: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://xpat.egov.mv/EmploymentApproval/EmploymentApproval/DepositRefund?id=..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => { setShowVisaCancelModal(false); setCancellingStaff(null); setCancellingEmployee(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medical Application Modal */}
      {showMedicalModal && selectedStaffForMedical && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Apply for Medical</h2>
              <button onClick={() => { setShowMedicalModal(false); setSelectedStaffForMedical(null); }}>
                ✕
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-secondary-600">
                Applying for medical for: <span className="font-medium text-secondary-900">{selectedStaffForMedical.fullName}</span>
              </p>
              <p className="text-sm text-secondary-600">
                Employee ID: <span className="font-medium text-secondary-900">{selectedStaffForMedical.employeeId}</span>
              </p>
            </div>
            <form onSubmit={handleMedicalSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number *</label>
                  <input
                    type="text"
                    value={medicalFormData.refNumber}
                    onChange={(e) => setMedicalFormData({ ...medicalFormData, refNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., EMR/2026/221188"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Gov Link</label>
                  <input
                    type="url"
                    value={medicalFormData.egovLink}
                    onChange={(e) => setMedicalFormData({ ...medicalFormData, egovLink: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://xpat.egov.mv/..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => { setShowMedicalModal(false); setSelectedStaffForMedical(null); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
