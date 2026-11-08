import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { getAttendanceStats } from '../lib/attendance';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const StaffAttendance = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayStats, setTodayStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
  });

  useEffect(() => {
    loadAttendanceData();
  }, [user]);

  const loadAttendanceData = async () => {
    console.log('Loading attendance data for user:', user);
    if (!user?.employeeId) {
      console.log('No employeeId found for user');
      return;
    }

    setLoading(true);
    try {
      console.log('Querying attendance for employeeId:', user.employeeId);
      // Load attendance records for this employee
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', user.employeeId)
      );
      const querySnapshot = await getDocs(q);
      console.log('Query snapshot size:', querySnapshot.size);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        checkInTime: doc.data().checkInTime?.toDate(),
        checkOutTime: doc.data().checkOutTime?.toDate(),
      }));

      // Deduplicate records by date (keep the most recent one based on document ID or timestamp)
      const uniqueRecords = new Map<string, any>();
      records.forEach(record => {
        if (!record.date) return;
        const dateKey = record.date.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!uniqueRecords.has(dateKey) || record.id > uniqueRecords.get(dateKey).id) {
          uniqueRecords.set(dateKey, record);
        }
      });
      const deduplicatedRecords = Array.from(uniqueRecords.values());

      // Sort by date descending
      deduplicatedRecords.sort((a, b) => b.date - a.date);
      setAttendanceRecords(deduplicatedRecords);

      // Load stats
      const stats = await getAttendanceStats(new Date());
      setTodayStats(stats);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    // Use UTC methods to ensure consistent date display regardless of timezone
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${month}/${day}/${year}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">My Attendance</h1>
        <p className="text-secondary-600 mt-1">View your attendance history</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Total Records</p>
                <p className="text-2xl font-bold text-secondary-900">{attendanceRecords.length}</p>
              </div>
              <div className="p-2 bg-secondary-100 rounded-lg">
                <Calendar className="w-5 h-5 text-secondary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Present Days</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.present}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Late Arrivals</p>
                <p className="text-2xl font-bold text-yellow-600">{todayStats.late}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary-900">Attendance History</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-secondary-600">
              Loading attendance records...
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-12 text-secondary-600">
              No attendance records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200 bg-secondary-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Check In</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Check Out</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-secondary-700">Late</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-4 text-sm text-secondary-900">
                        {record.date ? formatDate(record.date) : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-900">
                        {record.checkInTime ? formatTime(record.checkInTime) : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-900">
                        {record.checkOutTime ? formatTime(record.checkOutTime) : 'Pending'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          record.status === 'present' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {record.lateArrival ? (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">Yes</span>
                        ) : (
                          <span className="text-secondary-600">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
