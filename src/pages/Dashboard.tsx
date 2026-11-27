import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, TrendingUp, AlertCircle, Briefcase, Building2, X, Calendar, Cake, Award, FileText, AlertTriangle, Plus, Plane } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TaskAssignment } from '../components/TaskAssignment';
import { getEmployees } from '../lib/employees';
import { getLeaveRequests } from '../lib/leave';
import { getAttendanceStats } from '../lib/attendance';
import { getAllWorkLocations } from '../lib/workLocation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import madihaaLogo from '/Madihaa 2026 (1).png';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatDate } from '../lib/dateUtils';

export const Dashboard = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [onLeaveEmployees, setOnLeaveEmployees] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [todayLeaveRequests, setTodayLeaveRequests] = useState<any[]>([]);
  const [workLocations, setWorkLocations] = useState<any[]>([]);
  const [expandedDocSections, setExpandedDocSections] = useState<Record<string, boolean>>({});
  const [expandedLeaveSection, setExpandedLeaveSection] = useState(true);
  const [expandedNewHiresSection, setExpandedNewHiresSection] = useState(true);
  const [upcomingNewHires, setUpcomingNewHires] = useState<any[]>([]);
  const [showTaskAssignment, setShowTaskAssignment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadEmployees();
    loadAttendanceStats();
    loadWorkLocations();
    loadUpcomingNewHires();
  }, []);

  const loadWorkLocations = async () => {
    try {
      const locations = await getAllWorkLocations();
      setWorkLocations(locations);
    } catch (error) {
      console.error('Error loading work locations:', error);
    }
  };

  const loadUpcomingNewHires = async () => {
    try {
      // Fetch all candidates and filter in JavaScript to debug
      const candidatesSnapshot = await getDocs(collection(db, 'recruitment_candidates'));
      const allCandidates = candidatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('All candidates:', allCandidates.length);
      console.log('Ticket approved candidates:', allCandidates.filter((c: any) => c.stage === 'ticket_approved'));

      const candidatesData = allCandidates.filter((c: any) =>
        c.stage === 'ticket_approved' &&
        c.arrival_date &&
        !c.directory_added
      );

      console.log('Filtered candidates:', candidatesData);

      // Sort by arrival date
      candidatesData.sort((a: any, b: any) => {
        const dateA = new Date(a.arrival_date);
        const dateB = new Date(b.arrival_date);
        return dateA.getTime() - dateB.getTime();
      });

      setUpcomingNewHires(candidatesData);
    } catch (error) {
      console.error('Error loading upcoming new hires:', error);
    }
  };

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

      // Get today's leave requests (all types, all statuses)
      const todayLeaves = leaveRequests.filter(lr => {
        const startDate = new Date(lr.startDate);
        const endDate = new Date(lr.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return startDate <= today && endDate >= today;
      });

      setTodayLeaveRequests(todayLeaves);
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

  // Group by work location (only active employees)
  const workLocationStats = employees.reduce((acc, emp) => {
    // Only count active employees
    if (emp.status !== 'active') return acc;
    const location = workLocations.find(loc => loc.assignedStaff?.includes(emp.id));
    const locationName = location?.name || 'Unassigned';
    acc[locationName] = (acc[locationName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);


  const stats = [
    { name: 'Total Employees', value: totalEmployees.toString(), icon: Users, color: 'bg-blue-500', filter: 'all' },
    { name: 'Active Staff', value: activeEmployees.toString(), icon: Users, color: 'bg-green-500', filter: 'active' },
    { name: 'On Leave', value: onLeaveCount.toString(), icon: Clock, color: 'bg-yellow-500', filter: 'on_leave' },
    { name: 'Upcoming New Hires', value: upcomingNewHires.length.toString(), icon: Plane, color: 'bg-indigo-500', filter: 'upcoming_hires' },
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

  const workLocationStatsList = (Object.entries(workLocationStats) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      value: count.toString(),
      icon: Building2,
      color: 'bg-indigo-500',
      filter: 'work_location',
      filterValue: name
    }));

  const handleStatClick = (stat: any) => {
    if (stat.filter === 'all') {
      setFilteredEmployees(employees);
    } else if (stat.filter === 'active') {
      setFilteredEmployees(employees.filter(e => e.status === 'active'));
    } else if (stat.filter === 'on_leave') {
      setFilteredEmployees(onLeaveEmployees);
    } else if (stat.filter === 'upcoming_hires') {
      // Expand the upcoming new hires section
      setExpandedNewHiresSection(true);
      // Scroll to the section
      setTimeout(() => {
        const element = document.getElementById('upcoming-new-hires');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      setSelectedStat(stat.name);
      return;
    } else if (stat.filter === 'resigned') {
      setFilteredEmployees(employees.filter(e => e.status === 'resigned'));
    } else if (stat.filter === 'position') {
      setFilteredEmployees(employees.filter(e => e.designation === stat.filterValue));
    } else if (stat.filter === 'work_location') {
      const location = workLocations.find(loc => loc.name === stat.filterValue);
      if (location) {
        setFilteredEmployees(employees.filter(e => location.assignedStaff?.includes(e.id)));
      }
    }
    setSelectedStat(stat.name);
  };

  const handleViewInEmployees = () => {
    navigate('/employees');
  };

  const toggleDocSection = (docType: string) => {
    setExpandedDocSections(prev => ({
      ...prev,
      [docType]: !prev[docType]
    }));
  };

  const recentActivities: any[] = [];

  // Calculate probation completion events (within next 30 days)
  const probationEvents: any[] = (() => {
    const today = new Date();
    const events: any[] = [];

    employees.forEach(emp => {
      // Only show active employees (case-insensitive check)
      if (!emp.status || emp.status.toLowerCase() !== 'active') return;

      let probationEndDate: Date | null = null;
      let hireDate: Date | null = null;

      // Check probation details first
      if (emp.probationDetails?.probationEndDate) {
        probationEndDate = new Date(emp.probationDetails.probationEndDate);
        hireDate = emp.probationDetails.probationStartDate ? new Date(emp.probationDetails.probationStartDate) : emp.joinDate ? new Date(emp.joinDate) : null;
      } else {
        // Fallback: check joinDate for 3-month probation
        if (emp.joinDate) {
          hireDate = new Date(emp.joinDate);
          probationEndDate = new Date(hireDate);
          probationEndDate.setMonth(probationEndDate.getMonth() + 3);
        }
      }

      if (probationEndDate) {
        const daysUntilProbationEnd = Math.ceil((probationEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilProbationEnd >= 0 && daysUntilProbationEnd <= 30) {
          events.push({
            id: `probation-${emp.id}`,
            title: `${emp.fullName} - Probation Completion`,
            date: formatDate(probationEndDate),
            hireDate: hireDate ? formatDate(hireDate) : 'N/A',
            daysRemaining: daysUntilProbationEnd
          });
        }
      }
    });

    return events.sort((a, b) => a.daysRemaining - b.daysRemaining);
  })();

  // Calculate birthday events (this month - only today and upcoming, not past)
  const birthdayEvents: any[] = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const events: any[] = [];

    employees.forEach(emp => {
      // Only show active employees (case-insensitive check)
      if (!emp.status || emp.status.toLowerCase() !== 'active' || !emp.dob) return;

      const dob = new Date(emp.dob);
      if (dob.getMonth() === currentMonth) {
        const birthdayThisYear = new Date(currentYear, currentMonth, dob.getDate());
        birthdayThisYear.setHours(0, 0, 0, 0);
        const daysUntilBirthday = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Only show today's birthday or upcoming birthdays (not past birthdays)
        if (daysUntilBirthday >= 0) {
          events.push({
            id: `birthday-${emp.id}`,
            title: `${emp.fullName}'s Birthday`,
            date: formatDate(birthdayThisYear),
            daysRemaining: daysUntilBirthday
          });
        }
      }
    });

    return events.sort((a, b) => a.daysRemaining - b.daysRemaining);
  })();

  // Calculate work anniversaries (this month)
  const anniversaryEvents: any[] = (() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const events: any[] = [];

    employees.forEach(emp => {
      // Only show active employees (case-insensitive check)
      if (!emp.status || emp.status.toLowerCase() !== 'active' || !emp.joinDate) return;

      const joinDate = new Date(emp.joinDate);
      if (joinDate.getMonth() === currentMonth && joinDate.getFullYear() < currentYear) {
        const yearsOfService = currentYear - joinDate.getFullYear();
        const anniversaryThisYear = new Date(currentYear, currentMonth, joinDate.getDate());
        const daysUntilAnniversary = Math.ceil((anniversaryThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        events.push({
          id: `anniversary-${emp.id}`,
          title: `${emp.fullName} - ${yearsOfService} Year${yearsOfService > 1 ? 's' : ''} Anniversary`,
          date: formatDate(anniversaryThisYear),
          hireDate: formatDate(joinDate),
          yearsOfService,
          daysRemaining: daysUntilAnniversary
        });
      }
    });

    return events.sort((a, b) => a.daysRemaining - b.daysRemaining);
  })();

  // Calculate document expiry alerts (next 3 months) - grouped by document type
  const documentExpiryAlerts: Record<string, any[]> = (() => {
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    const alerts: Record<string, any[]> = {
      'Work Permit': [],
      'Passport': [],
      'Medical': [],
      'Visa': [],
      'Insurance': []
    };

    employees.forEach(emp => {
      // Only show active employees
      if (!emp.status || emp.status.toLowerCase() !== 'active') return;

      const expiryFields = [
        { field: 'wpExpDate', label: 'Work Permit' },
        { field: 'ppIdExpDate', label: 'Passport' },
        { field: 'medExpDate', label: 'Medical' },
        { field: 'visaExpiryDate', label: 'Visa' },
        { field: 'insuranceExpDate', label: 'Insurance' },
      ];

      expiryFields.forEach(({ field, label }) => {
        const expiryDate = emp[field];
        if (expiryDate) {
          const expDate = new Date(expiryDate);
          const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          // Show if expiring within next 3 months (90 days)
          if (daysUntilExpiry >= 0 && daysUntilExpiry <= 90) {
            alerts[label].push({
              id: `${field}-${emp.id}`,
              title: `${emp.fullName}`,
              date: formatDate(expDate),
              documentType: label,
              daysRemaining: daysUntilExpiry,
              employeeId: emp.employeeId,
              expiryMonth: expDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            });
          }
        }
      });
    });

    // Sort each group by days remaining
    Object.keys(alerts).forEach(key => {
      alerts[key].sort((a, b) => a.daysRemaining - b.daysRemaining);
    });

    return alerts;
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-secondary-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={madihaaLogo} alt="Madihaa Logo" className="w-12 h-10 sm:w-16 sm:h-14 object-contain" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Dashboard</h1>
            <p className="text-secondary-600 mt-1">Welcome back! Here's what's happening today.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowTaskAssignment(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Assign Task
          </Button>
          <div className="text-right sm:text-left">
            <p className="text-sm text-secondary-600">Today's Date</p>
            <p className="text-lg sm:text-xl font-semibold text-secondary-900">
              {formatDate(new Date())}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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

      {/* Today's Leave Requests */}
      <Card>
        <CardHeader>
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-secondary-50 transition-colors p-2 -m-2 rounded"
            onClick={() => setExpandedLeaveSection(!expandedLeaveSection)}
          >
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">Today's Leave Requests</h2>
              <p className="text-sm text-secondary-600">{todayLeaveRequests.filter(lr => {
                const employee = employees.find(e => e.id === lr.employeeId);
                return employee?.status === 'active';
              }).length} active employees on leave today</p>
            </div>
            <div className={`transform transition-transform ${expandedLeaveSection ? 'rotate-180' : ''}`}>
              <X className="w-5 h-5 text-secondary-600 rotate-45" />
            </div>
          </div>
        </CardHeader>
        {expandedLeaveSection && (
          <CardContent className="py-2">
            {todayLeaveRequests.length > 0 ? (
              <div className="space-y-3">
                {todayLeaveRequests.map((leave) => {
                  const employee = employees.find(e => e.id === leave.employeeId);
                  // Only show active employees
                  if (!employee || employee.status !== 'active') return null;
                  return (
                    <div
                      key={leave.id}
                      className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {employee?.photo ? (
                          <img
                            src={employee.photo}
                            alt={employee.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-secondary-900">{employee?.fullName || 'Unknown'}</p>
                          <p className="text-sm text-secondary-600">{employee?.employeeId || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-secondary-900 capitalize">{leave.leaveType || 'Leave'}</p>
                          <p className="text-xs text-secondary-600">
                            {formatDate(new Date(leave.startDate))} - {formatDate(new Date(leave.endDate))}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          leave.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : leave.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : leave.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        } capitalize`}>
                          {leave.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                <p className="text-secondary-600">No leave requests for today</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Upcoming New Hires */}
      <div id="upcoming-new-hires">
        <Card>
          <CardHeader>
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-secondary-50 transition-colors p-2 -m-2 rounded"
            onClick={() => setExpandedNewHiresSection(!expandedNewHiresSection)}
          >
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">Upcoming New Hires</h2>
              <p className="text-sm text-secondary-600">{upcomingNewHires.length} candidates arriving soon</p>
            </div>
            <div className={`transform transition-transform ${expandedNewHiresSection ? 'rotate-180' : ''}`}>
              <X className="w-5 h-5 text-secondary-600 rotate-45" />
            </div>
          </div>
        </CardHeader>
        {expandedNewHiresSection && (
          <CardContent className="py-2">
            {upcomingNewHires.length > 0 ? (
              <div className="space-y-3">
                {upcomingNewHires.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Plane className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-secondary-900">{candidate.Name || 'Unknown'}</p>
                        <p className="text-sm text-secondary-600">{candidate.POSITION || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-secondary-900">Arriving {formatDate(new Date(candidate.arrival_date))}</p>
                        <p className="text-xs text-secondary-600">
                          {candidate.flight_number ? `Flight ${candidate.flight_number}` : 'Flight TBD'}
                          {candidate.arrival_time ? ` at ${candidate.arrival_time}` : ''}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        Ticket Approved
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Plane className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
                <p className="text-secondary-600">No upcoming new hires</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
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

      {/* Work Locations Grid */}
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Staff by Work Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workLocationStatsList.map((stat, index) => (
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

      {/* Probation Completions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary-900">Probation Completions (Next 30 Days)</h2>
          <p className="text-sm text-secondary-600">{probationEvents.length} employees completing probation</p>
        </CardHeader>
        <CardContent>
          {probationEvents.length > 0 ? (
            <div className="space-y-3">
              {probationEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-secondary-900">{event.title}</p>
                      <p className="text-sm text-secondary-600">Hire Date: {event.hireDate}</p>
                      <p className="text-sm text-secondary-600">Completion: {event.date}</p>
                      <p className="text-xs text-secondary-500">
                        {event.daysRemaining === 0 ? 'Today' : event.daysRemaining === 1 ? 'Tomorrow' : `In ${event.daysRemaining} days`}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 capitalize">
                    Probation
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
              <p className="text-secondary-600">No probation completions in the next 30 days</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Birthdays This Month */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary-900">Birthdays This Month</h2>
          <p className="text-sm text-secondary-600">{birthdayEvents.length} employees have birthdays this month</p>
        </CardHeader>
        <CardContent>
          {birthdayEvents.length > 0 ? (
            <div className="space-y-3">
              {birthdayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Cake className="w-5 h-5 text-pink-600" />
                    <div>
                      <p className="font-medium text-secondary-900">{event.title}</p>
                      <p className="text-sm text-secondary-600">{event.date}</p>
                      <p className="text-xs text-secondary-500">
                        {event.daysRemaining === 0 ? 'Today' : event.daysRemaining === 1 ? 'Tomorrow' : `In ${event.daysRemaining} days`}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-700 capitalize">
                    Birthday
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Cake className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
              <p className="text-secondary-600">No birthdays this month</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Anniversaries This Month */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary-900">Work Anniversaries This Month</h2>
          <p className="text-sm text-secondary-600">{anniversaryEvents.length} employees completing work anniversary</p>
        </CardHeader>
        <CardContent>
          {anniversaryEvents.length > 0 ? (
            <div className="space-y-3">
              {anniversaryEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Award className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-secondary-900">{event.title}</p>
                      <p className="text-sm text-secondary-600">Hire Date: {event.hireDate}</p>
                      <p className="text-sm text-secondary-600">Anniversary: {event.date}</p>
                      <p className="text-xs text-secondary-500">
                        {event.daysRemaining === 0 ? 'Today' : event.daysRemaining === 1 ? 'Tomorrow' : `In ${event.daysRemaining} days`}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 capitalize">
                    {event.yearsOfService} Year{event.yearsOfService > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
              <p className="text-secondary-600">No work anniversaries this month</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Expiry Alerts (Next 3 Months) */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-secondary-900">Document Expiry Alerts (Next 3 Months)</h2>
        {Object.entries(documentExpiryAlerts).map(([docType, alerts]) => {
          const totalAlerts = alerts.length;
          if (totalAlerts === 0) return null;
          const isExpanded = expandedDocSections[docType] || false;
          const criticalCount = alerts.filter(a => a.daysRemaining <= 7).length;
          const urgentCount = alerts.filter(a => a.daysRemaining <= 30 && a.daysRemaining > 7).length;
          
          return (
            <Card key={docType}>
              <CardHeader>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-secondary-50 transition-colors p-2 -m-2 rounded"
                  onClick={() => toggleDocSection(docType)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {criticalCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          {criticalCount} Critical
                        </span>
                      )}
                      {urgentCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                          {urgentCount} Urgent
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900">{docType}</h3>
                    <p className="text-sm text-secondary-600">{totalAlerts} expiring</p>
                  </div>
                  <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <X className="w-5 h-5 text-secondary-600 rotate-45" />
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="py-2">
                  <div className="space-y-1">
                    {alerts.map((alert) => {
                      const isUrgent = alert.daysRemaining <= 30;
                      const isCritical = alert.daysRemaining <= 7;
                      return (
                        <div
                          key={alert.id}
                          className={`flex items-center justify-between p-2 rounded transition-colors ${
                            isCritical ? 'bg-red-50 hover:bg-red-100' : isUrgent ? 'bg-orange-50 hover:bg-orange-100' : 'bg-secondary-50 hover:bg-secondary-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            {isCritical ? (
                              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            ) : isUrgent ? (
                              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-secondary-900 truncate">{alert.title}</p>
                              <p className="text-xs text-secondary-600 truncate">{alert.employeeId} • {alert.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-secondary-500">
                              {alert.daysRemaining === 0 ? 'Today' : alert.daysRemaining === 1 ? 'Tomorrow' : `${alert.daysRemaining}d`}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              isCritical
                                ? 'bg-red-100 text-red-700'
                                : isUrgent
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {isCritical ? 'Critical' : isUrgent ? 'Urgent' : 'Normal'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
        {Object.values(documentExpiryAlerts).every(alerts => alerts.length === 0) && (
          <div className="text-center py-8 bg-white rounded-lg border border-secondary-200">
            <FileText className="w-12 h-12 text-secondary-400 mx-auto mb-2" />
            <p className="text-secondary-600">No documents expiring in the next 3 months</p>
          </div>
        )}
      </div>

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

      {/* Task Assignment Modal */}
      <TaskAssignment
        isOpen={showTaskAssignment}
        onClose={() => setShowTaskAssignment(false)}
        onTaskCreated={() => {
          // Refresh tasks if needed
        }}
      />
    </div>
  );
};
