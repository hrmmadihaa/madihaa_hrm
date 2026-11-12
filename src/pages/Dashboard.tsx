import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, TrendingUp, AlertCircle, Briefcase, Building2, X } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getEmployees } from '../lib/employees';
import { getLeaveRequests } from '../lib/leave';
import { getAttendanceStats } from '../lib/attendance';
import { useNavigate } from 'react-router-dom';
import madihaaLogo from '/madihaa (1).jpg';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Dashboard = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [onLeaveEmployees, setOnLeaveEmployees] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadEmployees();
    loadAttendanceStats();
  }, []);

  const loadAttendanceStats = async () => {
    try {
      const stats = await getAttendanceStats(new Date());
      setAttendanceStats(stats);
    } catch (error) {
      console.error('Error loading attendance stats:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
      
      // Fetch leave requests to determine actual on-leave status
      const leaveRequests = await getLeaveRequests();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find employees with approved leave that includes today
      const currentlyOnLeave = data.filter(employee => {
        const employeeLeaves = leaveRequests.filter(
          lr => lr.employeeId === employee.id &&
          lr.status === 'approved' &&
          new Date(lr.startDate) <= today &&
          new Date(lr.endDate) >= today
        );
        return employeeLeaves.length > 0;
      });
      
      setOnLeaveEmployees(currentlyOnLeave);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const onLeaveCount = onLeaveEmployees.length;
  const resignedEmployees = employees.filter(e => e.status === 'resigned').length;

  // Group by position/designation
  const positions = employees.reduce((acc, emp) => {
    const position = emp.designation || 'Unknown';
    acc[position] = (acc[position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by department
  const departments = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);


  const stats = [
    { name: 'Total Employees', value: totalEmployees.toString(), icon: Users, color: 'bg-blue-500', filter: 'all' },
    { name: 'Active Staff', value: activeEmployees.toString(), icon: Users, color: 'bg-green-500', filter: 'active' },
    { name: 'On Leave', value: onLeaveCount.toString(), icon: Clock, color: 'bg-yellow-500', filter: 'on_leave' },
    { name: 'Resigned', value: resignedEmployees.toString(), icon: AlertCircle, color: 'bg-red-500', filter: 'resigned' },
  ];

  const positionStats = (Object.entries(positions) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      value: count.toString(),
      icon: Briefcase,
      color: 'bg-purple-500',
      filter: 'position',
      filterValue: name
    }));

  const departmentStats = (Object.entries(departments) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      value: count.toString(),
      icon: Building2,
      color: 'bg-indigo-500',
      filter: 'department',
      filterValue: name
    }));

  const handleStatClick = (stat: any) => {
    if (stat.filter === 'all') {
      setFilteredEmployees(employees);
    } else if (stat.filter === 'active') {
      setFilteredEmployees(employees.filter(e => e.status === 'active'));
    } else if (stat.filter === 'on_leave') {
      setFilteredEmployees(onLeaveEmployees);
    } else if (stat.filter === 'resigned') {
      setFilteredEmployees(employees.filter(e => e.status === 'resigned'));
    } else if (stat.filter === 'position') {
      setFilteredEmployees(employees.filter(e => e.designation === stat.filterValue));
    } else if (stat.filter === 'department') {
      setFilteredEmployees(employees.filter(e => e.department === stat.filterValue));
    }
    setSelectedStat(stat.name);
  };

  const handleViewInEmployees = () => {
    navigate('/employees');
  };

  const recentActivities: any[] = [];

  const upcomingEvents: any[] = [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-secondary-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <img src={madihaaLogo} alt="Madihaa Logo" className="w-16 h-14 object-contain" />
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div 
              className="cursor-pointer group"
              onClick={() => handleStatClick(stat)}
            >
              <Card hover className="group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-secondary-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-primary-600 mt-1 group-hover:underline">Click to view</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Positions Grid */}
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Staff by Position</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positionStats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div 
                className="cursor-pointer group"
                onClick={() => handleStatClick(stat)}
              >
              <Card hover className="group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-600 truncate">{stat.name}</p>
                      <p className="text-xl font-bold text-secondary-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.color} group-hover:scale-110 transition-transform ml-3`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Departments Grid */}
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Staff by Department</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentStats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div 
                className="cursor-pointer group"
                onClick={() => handleStatClick(stat)}
              >
              <Card hover className="group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-600 truncate">{stat.name}</p>
                      <p className="text-xl font-bold text-secondary-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.color} group-hover:scale-110 transition-transform ml-3`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary-900">Attendance Overview</h2>
          </CardHeader>
          <CardContent>
            {attendanceStats ? (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={[
                  { name: 'Present', value: attendanceStats.present, fill: '#22c55e' },
                  { name: 'Absent', value: attendanceStats.absent, fill: '#ef4444' },
                  { name: 'Late', value: attendanceStats.late, fill: '#eab308' },
                  { name: 'On Leave', value: attendanceStats.onLeave, fill: '#3b82f6' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center bg-secondary-50 rounded-lg">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                  <p className="text-secondary-600">Loading attendance data...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary-900">Recent Activities</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary-500"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary-900">{activity.message}</p>
                    <p className="text-xs text-secondary-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary-900">Upcoming Events</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <AlertCircle className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="font-medium text-secondary-900">{event.title}</p>
                    <p className="text-sm text-secondary-600">{event.date}</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 capitalize">
                  {event.type}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtered Employees Modal */}
      {selectedStat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-secondary-900">
                    {selectedStat}
                  </h2>
                  <p className="text-sm text-secondary-600 mt-1">
                    {filteredEmployees.length} employees
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedStat(null); setFilteredEmployees([]); }}
                  className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-secondary-600" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-4 p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
                  >
                    {employee.photo ? (
                      <img
                        src={employee.photo}
                        alt={employee.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-900">{employee.fullName}</p>
                      <p className="text-sm text-secondary-600">{employee.employeeId}</p>
                      <div className="flex gap-2 mt-1">
                        {employee.designation && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            {employee.designation}
                          </span>
                        )}
                        {employee.department && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                            {employee.department}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-700' :
                      employee.status === 'on_leave' 
                        ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {employee.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                ))}
                {filteredEmployees.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-secondary-600">No employees found</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardContent className="border-t border-secondary-200 pt-4">
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => { setSelectedStat(null); setFilteredEmployees([]); }}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button onClick={handleViewInEmployees} className="flex-1">
                  View in Employees Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
