import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ClipboardList, Briefcase, Users, Calendar, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import {
  getJobRequisitions,
  createJobRequisition,
  changeJobRequisitionStatus,
  getVacancies,
  publishVacancy,
  getCandidateApplications,
  updateCandidateApplicationStatus,
  scheduleInterview,
  getInterviews,
  updateInterviewStatus,
  getOffers,
  updateOfferStatus,
  getOnboardingTasks,
  completeOnboardingTask,
  getRecruitmentReportSummary,
} from '../lib/recruitment';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../lib/permissions';
import type { JobRequisition, Vacancy, CandidateApplication, InterviewSchedule, Offer, OnboardingTask, RecruitmentReportSummary } from '../types';
import { formatDate } from '../lib/dateUtils';

export const Recruitment = () => {
  const { can } = usePermissions();
  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([]);
  const [summary, setSummary] = useState<RecruitmentReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqs, vacs, apps, ivs, ofs, onboard, report] = await Promise.all([
        getJobRequisitions(),
        getVacancies(),
        getCandidateApplications(),
        getInterviews(),
        getOffers(),
        getOnboardingTasks(),
        getRecruitmentReportSummary(),
      ]);
      setRequisitions(reqs);
      setVacancies(vacs);
      setApplications(apps);
      setInterviews(ivs);
      setOffers(ofs);
      setOnboardingTasks(onboard);
      setSummary(report);
    } catch (error) {
      console.error('Error loading recruitment data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRequisition = async () => {
    if (!newTitle || !newDepartment) return;
    setCreating(true);
    try {
      await createJobRequisition({
        title: newTitle,
        department: newDepartment,
        grade: newGrade,
        description: newDescription,
        status: 'draft',
        positionType: 'new_position',
        priority: 'medium',
        requiredApprovals: ['HR Manager'],
      });
      setNewTitle('');
      setNewDepartment('');
      setNewGrade('');
      setNewDescription('');
      loadData();
    } catch (error) {
      console.error('Unable to create requisition:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitRequisition = async (requestId: string) => {
    setActionLoading(true);
    try {
      await changeJobRequisitionStatus(requestId, 'submitted');
      await loadData();
    } catch (error) {
      console.error('Unable to submit requisition:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRequisition = async (requestId: string) => {
    setActionLoading(true);
    try {
      await changeJobRequisitionStatus(requestId, 'approved');
      await loadData();
    } catch (error) {
      console.error('Unable to approve requisition:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishVacancy = async (vacancyId: string) => {
    setActionLoading(true);
    try {
      await publishVacancy(vacancyId);
      await loadData();
    } catch (error) {
      console.error('Unable to publish vacancy:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShortlistApplication = async (applicationId: string) => {
    setActionLoading(true);
    try {
      await updateCandidateApplicationStatus(applicationId, 'shortlisted');
      await loadData();
    } catch (error) {
      console.error('Unable to shortlist application:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleInterview = async (applicationId: string) => {
    setActionLoading(true);
    try {
      await scheduleInterview({
        applicationId,
        panel: ['Hiring Manager', 'HR'],
        scheduledAt: new Date(),
        mode: 'video',
        status: 'scheduled',
        createdAt: new Date(),
      });
      await loadData();
    } catch (error) {
      console.error('Unable to schedule interview:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOnboardingTask = async (taskId: string) => {
    setActionLoading(true);
    try {
      await completeOnboardingTask(taskId);
      await loadData();
    } catch (error) {
      console.error('Unable to complete onboarding task:', error);
    } finally {
      setActionLoading(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Recruitment</h1>
          <p className="text-secondary-600 mt-1">Manage requisitions, vacancies, applications, and offers</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Button variant="secondary" className="text-xs sm:text-sm">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Requisitions
          </Button>
          <Button variant="secondary" className="text-xs sm:text-sm">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Candidates
          </Button>
          <Button variant="secondary" className="text-xs sm:text-sm">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Interviews
          </Button>
          <Button variant="secondary" className="text-xs sm:text-sm">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Compliance
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Requisitions</p>
                  <p className="text-3xl font-bold text-secondary-900">{summary.requisitions}</p>
                </div>
                <ClipboardList className="w-6 h-6 text-primary-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Vacancies</p>
                  <p className="text-3xl font-bold text-secondary-900">{summary.vacancies}</p>
                </div>
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Applications</p>
                  <p className="text-3xl font-bold text-secondary-900">{summary.applications}</p>
                </div>
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Interviews</p>
                  <p className="text-3xl font-bold text-secondary-900">{summary.interviews}</p>
                </div>
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Offers</p>
                  <p className="text-3xl font-bold text-secondary-900">{summary.offers}</p>
                </div>
                <ShieldCheck className="w-6 h-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600">Onboarding</p>
                  <p className="text-3xl font-bold text-secondary-900">{summary.onboardingTasks}</p>
                </div>
                <ClipboardList className="w-6 h-6 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary-900">Create New Requisition</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Job Title</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Department</label>
              <input
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Grade</label>
              <input
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-end">
              {can(PERMISSIONS.RECRUITMENT_MANAGE) && (
                <Button onClick={handleCreateRequisition} loading={creating} className="w-full">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Requisition
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary-900">Requisition Pipeline</h2>
        </CardHeader>
        <CardContent>
          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4">
            {requisitions.map((req, index) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white rounded-lg shadow p-4 border border-secondary-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-secondary-900 text-sm">{req.title}</div>
                    <div className="text-xs text-secondary-500">{req.requisitionNumber || req.id}</div>
                  </div>
                  <span className="text-xs uppercase tracking-wider font-medium text-secondary-900">{req.status}</span>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Department:</span>
                    <span className="font-medium">{req.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Grade:</span>
                    <span className="font-medium">{req.grade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Created:</span>
                    <span className="font-medium">{formatDate(new Date(req.createdAt))}</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  {can(PERMISSIONS.RECRUITMENT_MANAGE) && req.status === 'draft' && (
                    <Button variant="secondary" size="sm" onClick={() => handleSubmitRequisition(req.id)} disabled={actionLoading}>
                      Submit
                    </Button>
                  )}
                  {can(PERMISSIONS.RECRUITMENT_APPROVE) && req.status === 'submitted' && (
                    <Button variant="primary" size="sm" onClick={() => handleApproveRequisition(req.id)} disabled={actionLoading}>
                      Approve
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-secondary-50 border-b border-secondary-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Requisition #</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {requisitions.map((req, index) => (
                  <motion.tr
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-secondary-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">{req.requisitionNumber || req.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">{req.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{req.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{req.grade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{req.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{formatDate(new Date(req.createdAt))}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 space-x-2">
                      {can(PERMISSIONS.RECRUITMENT_MANAGE) && req.status === 'draft' && (
                        <Button variant="secondary" size="sm" onClick={() => handleSubmitRequisition(req.id)} disabled={actionLoading}>
                          Submit
                        </Button>
                      )}
                      {can(PERMISSIONS.RECRUITMENT_APPROVE) && req.status === 'submitted' && (
                        <Button variant="primary" size="sm" onClick={() => handleApproveRequisition(req.id)} disabled={actionLoading}>
                          Approve
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Vacancy & Posting</h2>
              <span className="text-sm text-secondary-600">{vacancies.length} Openings</span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile Cards */}
            <div className="sm:hidden space-y-4">
              {vacancies.length === 0 ? (
                <div className="text-center py-12 text-sm text-secondary-500">No vacancies configured yet.</div>
              ) : (
                vacancies.map((vacancy) => (
                  <motion.div
                    key={vacancy.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow p-4 border border-secondary-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-bold text-secondary-900 text-sm">{vacancy.title}</div>
                      <span className="text-xs uppercase tracking-wider font-medium text-secondary-900">{vacancy.status}</span>
                    </div>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-secondary-600">Location:</span>
                        <span className="font-medium">{vacancy.location}</span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      {vacancy.status === 'draft' && (
                        <Button variant="secondary" size="sm" onClick={() => handlePublishVacancy(vacancy.id)} disabled={actionLoading}>
                          Publish
                        </Button>
                      )}
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
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {vacancies.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-secondary-500">No vacancies configured yet.</td>
                    </tr>
                  ) : (vacancies.map((vacancy) => (
                    <motion.tr
                      key={vacancy.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-secondary-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">{vacancy.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{vacancy.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{vacancy.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {vacancy.status === 'draft' && (
                          <Button variant="secondary" size="sm" onClick={() => handlePublishVacancy(vacancy.id)} disabled={actionLoading}>
                            Publish
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))) }
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Candidates & Screening</h2>
              <span className="text-sm text-secondary-600">{applications.length} Applications</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Vacancy</th>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-secondary-500">No candidate applications yet.</td>
                    </tr>
                  ) : (applications.map((application) => (
                    <motion.tr
                      key={application.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-secondary-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">{application.candidateName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{application.vacancyId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{application.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 space-x-2">
                        {application.status === 'submitted' && (
                          <>
                            <Button variant="secondary" size="sm" onClick={() => handleShortlistApplication(application.id)} disabled={actionLoading}>
                              Shortlist
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleScheduleInterview(application.id)} disabled={actionLoading}>
                              Interview
                            </Button>
                          </>
                        )}
                      </td>
                    </motion.tr>
                  ))) }
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Interview Management</h2>
              <span className="text-sm text-secondary-600">{interviews.length} Scheduled</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Application</th>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Panel</th>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {interviews.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-secondary-500">No interviews scheduled.</td>
                    </tr>
                  ) : (interviews.map((interview) => (
                    <motion.tr
                      key={interview.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-secondary-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">{interview.applicationId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{interview.panel.join(', ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{interview.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {interview.status === 'scheduled' && (
                          <Button variant="secondary" size="sm" onClick={() => updateInterviewStatus(interview.id, 'completed')} disabled={actionLoading}>
                            Complete
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))) }
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">Offer & Onboarding</h2>
              <span className="text-sm text-secondary-600">{offers.length} Offers</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Offer Date</th>
                    <th className="px-6 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {offers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-secondary-500">No offer letters generated yet.</td>
                    </tr>
                  ) : (offers.map((offer) => (
                    <motion.tr
                      key={offer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-secondary-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">{offer.applicationId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{offer.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{formatDate(new Date(offer.offerDate))}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {offer.status === 'sent' && (
                          <Button variant="secondary" size="sm" onClick={() => updateOfferStatus(offer.id, 'accepted')} disabled={actionLoading}>
                            Accept
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))) }
                </tbody>
              </table>
            </div>
            <div className="mt-6">
              <h3 className="text-md font-semibold text-secondary-900">Onboarding Tasks</h3>
              <div className="space-y-3 mt-3">
                {onboardingTasks.length === 0 ? (
                  <p className="text-sm text-secondary-500">No onboarding tasks are configured yet.</p>
                ) : (
                  onboardingTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border border-secondary-200 bg-secondary-50">
                      <div>
                        <p className="font-medium text-secondary-900">{task.task}</p>
                        <p className="text-sm text-secondary-600">Assigned to {task.assignedTo} • Due {formatDate(new Date(task.dueDate))}</p>
                      </div>
                      <Button variant={task.completed ? 'ghost' : 'secondary'} size="sm" onClick={() => handleCompleteOnboardingTask(task.id)} disabled={actionLoading || task.completed}>
                        {task.completed ? 'Completed' : 'Complete'}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
