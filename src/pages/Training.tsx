import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CalendarCheck, Trophy, DollarSign, Flag, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import {
  getTrainingNeedsAnalysis,
  createTrainingNeedsAnalysis,
  getTrainingCourses,
  getTrainingSessions,
  getTrainingNominations,
  getTrainingAttendanceRecords,
  getTrainingAssessments,
  getTrainingEvaluations,
  getTrainingNotifications,
  getTrainingReportSummary,
} from '../lib/training';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../lib/permissions';
import type {
  TrainingNeedsAnalysis,
  TrainingCourse,
  TrainingSession,
  TrainingNomination,
  TrainingAttendance,
  TrainingAssessment,
  TrainingEvaluation,
  TrainingNotification,
  TrainingReportSummary,
} from '../types';
import { logActivity } from '../lib/activityLog';
import { formatDate } from '../lib/dateUtils';

export const Training = () => {
  const { can } = usePermissions();
  const [needs, setNeeds] = useState<TrainingNeedsAnalysis[]>([]);
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [nominations, setNominations] = useState<TrainingNomination[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<TrainingAttendance[]>([]);
  const [assessments, setAssessments] = useState<TrainingAssessment[]>([]);
  const [evaluations, setEvaluations] = useState<TrainingEvaluation[]>([]);
  const [notifications, setNotifications] = useState<TrainingNotification[]>([]);
  const [summary, setSummary] = useState<TrainingReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNeedTitle, setNewNeedTitle] = useState('');
  const [newNeedDepartment, setNewNeedDepartment] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [needsData, courseData, sessionData, nominationData, attendanceData, assessmentData, evaluationData, notificationData, reportData] = await Promise.all([
        getTrainingNeedsAnalysis(),
        getTrainingCourses(),
        getTrainingSessions(),
        getTrainingNominations(),
        getTrainingAttendanceRecords(),
        getTrainingAssessments(),
        getTrainingEvaluations(),
        getTrainingNotifications(),
        getTrainingReportSummary(),
      ]);
      setNeeds(needsData);
      setCourses(courseData);
      setSessions(sessionData);
      setNominations(nominationData);
      setAttendanceRecords(attendanceData);
      setAssessments(assessmentData);
      setEvaluations(evaluationData);
      setNotifications(notificationData);
      setSummary(reportData);
    } catch (error) {
      console.error('Error loading training data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNeedsAnalysis = async () => {
    if (!newNeedTitle || !newNeedDepartment) return;
    setCreating(true);
    try {
      const result = await createTrainingNeedsAnalysis({
        title: newNeedTitle,
        department: newNeedDepartment,
        impactArea: 'competency_gap',
        status: 'draft',
        createdBy: 'HR Manager',
      });
      await logActivity(
        'created',
        'training_needs_analysis',
        result,
        `Created training needs analysis: ${newNeedTitle}`
      );
      setNewNeedTitle('');
      setNewNeedDepartment('');
      await loadData();
    } catch (error) {
      console.error('Unable to create TNA entry:', error);
    } finally {
      setCreating(false);
    }
  };

  const renderSummaryCard = (label: string, value: number, icon: ReactNode) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-secondary-600">{label}</p>
            <p className="text-3xl font-bold text-secondary-900">{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Training & Development</h1>
          <p className="text-secondary-600 mt-1">Manage training needs, courses, sessions, learners, and certifications.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Button variant="secondary" className="text-xs sm:text-sm">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            TNA
          </Button>
          <Button variant="secondary" className="text-xs sm:text-sm">
            <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Sessions
          </Button>
          <Button variant="secondary" className="text-xs sm:text-sm">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Certificates
          </Button>
          <Button variant="secondary" className="text-xs sm:text-sm">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Budget
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary ? (
          <>
            {renderSummaryCard('TNA Entries', summary.needsAnalysisCount, <Flag className="w-6 h-6 text-primary-600" />)}
            {renderSummaryCard('Courses', summary.coursesCount, <BookOpen className="w-6 h-6 text-green-600" />)}
            {renderSummaryCard('Sessions', summary.sessionsCount, <CalendarCheck className="w-6 h-6 text-blue-600" />)}
            {renderSummaryCard('Certifications', summary.certificatesCount, <Trophy className="w-6 h-6 text-yellow-600" />)}
            {renderSummaryCard('Attendance Records', attendanceRecords.length, <CalendarCheck className="w-6 h-6 text-secondary-600" />)}
            {renderSummaryCard('Assessments', assessments.length, <Flag className="w-6 h-6 text-secondary-600" />)}
            {renderSummaryCard('Evaluations', evaluations.length, <DollarSign className="w-6 h-6 text-secondary-600" />)}
            {renderSummaryCard('Notifications', notifications.length, <BookOpen className="w-6 h-6 text-secondary-600" />)}
          </>
        ) : (
          <div className="col-span-full text-sm text-secondary-500">Loading training summary...</div>
        )}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary-900">Training Needs Analysis (TNA)</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Training Need</label>
              <input
                value={newNeedTitle}
                onChange={(e) => setNewNeedTitle(e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Department</label>
              <input
                value={newNeedDepartment}
                onChange={(e) => setNewNeedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-end">
              {can(PERMISSIONS.TRAINING_MANAGE) && (
                <Button onClick={handleCreateNeedsAnalysis} loading={creating} className="w-full">
                  <Plus className="w-5 h-5 mr-2" />
                  Create TNA Plan
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Training Needs Analysis</h2>
              <span className="text-sm text-secondary-600">{needs.length} items</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {needs.length === 0 ? (
                <p className="text-sm text-secondary-500">No training needs analysis plans found.</p>
              ) : (
                needs.map((need) => (
                  <div key={need.id} className="p-4 border border-secondary-200 rounded-lg bg-secondary-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-secondary-900">{need.title}</p>
                        <p className="text-sm text-secondary-600">{need.department} • {need.status}</p>
                      </div>
                      <span className="text-xs uppercase tracking-wider text-secondary-500">{formatDate(new Date(need.createdAt))}</span>
                    </div>
                    <p className="mt-2 text-sm text-secondary-700">Impact: {need.impactArea}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Upcoming Sessions</h2>
              <span className="text-sm text-secondary-600">{sessions.length} sessions</span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-4">
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-sm text-secondary-500">No sessions scheduled yet.</div>
              ) : (
                sessions.map((session) => (
                  <motion.div key={session.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow p-4 border border-secondary-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-bold text-secondary-900 text-sm">{session.courseTitle || session.id}</div>
                      <span className="text-xs uppercase tracking-wider font-medium text-secondary-900">{session.status}</span>
                    </div>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Date:</span>
                        <span className="font-medium">{session.sessionDate ? formatDate(new Date(session.sessionDate)) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Location:</span>
                        <span className="font-medium">{session.location || 'N/A'}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Course</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Venue</th>
                    <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-secondary-500">No sessions scheduled yet.</td>
                    </tr>
                  ) : (
                    sessions.map((session) => (
                      <motion.tr key={session.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="hover:bg-secondary-50">
                        <td className="px-4 py-4 text-sm text-secondary-900">{session.courseTitle}</td>
                        <td className="px-4 py-4 text-sm text-secondary-600">{formatDate(new Date(session.sessionDate))}</td>
                        <td className="px-4 py-4 text-sm text-secondary-600">{session.location}</td>
                        <td className="px-4 py-4 text-sm font-medium text-secondary-900">{session.status}</td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary-900">Training Catalog</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courses.length === 0 ? (
                <p className="text-sm text-secondary-500">No training courses available.</p>
              ) : (
                courses.map((course) => (
                  <div key={course.id} className="p-4 border border-secondary-200 rounded-lg bg-secondary-50">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-secondary-900">{course.title}</p>
                      <span className="text-xs uppercase tracking-wider text-secondary-500">{course.category}</span>
                    </div>
                    <p className="mt-2 text-sm text-secondary-700">Delivery: {course.deliveryMethod}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary-900">Nomination & Attendance</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-secondary-900">Nominations</h3>
                <p className="text-sm text-secondary-600">{nominations.length} requests</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary-50 border-b border-secondary-200">
                    <tr>
                      <th className="px-4 py-3 text-secondary-600 uppercase tracking-wider">Employee</th>
                      <th className="px-4 py-3 text-secondary-600 uppercase tracking-wider">Course</th>
                      <th className="px-4 py-3 text-secondary-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {nominations.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-secondary-500">No nominations submitted.</td>
                      </tr>
                    ) : (
                      nominations.map((nomination) => (
                        <motion.tr key={nomination.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="hover:bg-secondary-50">
                          <td className="px-4 py-4 text-secondary-900">{nomination.employeeName}</td>
                          <td className="px-4 py-4 text-secondary-600">{nomination.courseTitle}</td>
                          <td className="px-4 py-4 text-secondary-900">{nomination.status}</td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
