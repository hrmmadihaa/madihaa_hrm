import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Award, ClipboardList, CalendarCheck, Layers, Star, RefreshCcw, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import {
  getPerformanceCycles,
  getAppraisalTemplates,
  getPerformanceReviews,
  getAppraisalAssignments,
  getReviewWorkflows,
  getReviewRatings,
  getPerformanceReportSummary,
  submitPerformanceReview,
  updatePerformanceReviewStatus,
} from '../lib/performance';
import type {
  PerformanceCycle,
  AppraisalTemplate,
  PerformanceReview,
  AppraisalAssignment,
  ReviewWorkflow,
  ReviewRating,
  PerformanceReportSummary,
} from '../types';
import { logActivity } from '../lib/activityLog';
import { formatDate } from '../lib/dateUtils';

export const Performance = () => {
  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
  const [templates, setTemplates] = useState<AppraisalTemplate[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [assignments, setAssignments] = useState<AppraisalAssignment[]>([]);
  const [workflows, setWorkflows] = useState<ReviewWorkflow[]>([]);
  const [ratings, setRatings] = useState<ReviewRating[]>([]);
  const [summary, setSummary] = useState<PerformanceReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cycleData, templateData, reviewData, assignmentData, workflowData, ratingData, reportData] = await Promise.all([
        getPerformanceCycles(),
        getAppraisalTemplates(),
        getPerformanceReviews(),
        getAppraisalAssignments(),
        getReviewWorkflows(),
        getReviewRatings(),
        getPerformanceReportSummary(),
      ]);
      setCycles(cycleData);
      setTemplates(templateData);
      setReviews(reviewData);
      setAssignments(assignmentData);
      setWorkflows(workflowData);
      setRatings(ratingData);
      setSummary(reportData);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitSampleReview = async () => {
    setActionLoading(true);
    try {
      const result = await submitPerformanceReview({
        employeeId: '',
        reviewerId: '',
        period: '',
        kpis: [],
        overallRating: 0,
        comments: '',
        status: 'submitted',
        createdAt: new Date(),
      });
      await logActivity(
        'created',
        'performance_review',
        result,
        `Submitted performance review`
      );
      await loadData();
    } catch (error) {
      console.error('Unable to submit performance review:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReviewed = async (reviewId: string) => {
    setActionLoading(true);
    try {
      await updatePerformanceReviewStatus(reviewId, 'reviewed');
      await logActivity(
        'updated',
        'performance_review',
        reviewId,
        `Marked performance review as reviewed`
      );
      await loadData();
    } catch (error) {
      console.error('Unable to update review status:', error);
    } finally {
      setActionLoading(false);
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
          <h1 className="text-3xl font-bold text-secondary-900">Performance Management</h1>
          <p className="text-secondary-600 mt-1">Manage appraisal cycles, reviews, assignments, and ratings.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Button variant="secondary" className="text-xs sm:text-sm">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Appraisals
          </Button>
          <Button variant="secondary" className="text-xs sm:text-sm">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Cycles
          </Button>
          <Button variant="secondary" className="text-xs sm:text-sm">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Reviews
          </Button>
          <Button variant="secondary" className="text-xs sm:text-sm">
            <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Workflows
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {summary ? (
          <>
            {renderSummaryCard('Review Cycles', summary.cycleCount, <CalendarCheck className="w-6 h-6 text-primary-600" />)}
            {renderSummaryCard('Templates', summary.templateCount, <Layers className="w-6 h-6 text-green-600" />)}
            {renderSummaryCard('Reviews', summary.reviewCount, <ClipboardList className="w-6 h-6 text-blue-600" />)}
            {renderSummaryCard('Assignments', summary.assignmentCount, <Award className="w-6 h-6 text-yellow-600" />)}
            {renderSummaryCard('Workflows', summary.workflowCount, <Star className="w-6 h-6 text-secondary-600" />)}
            {renderSummaryCard('Ratings', summary.ratingCount, <RefreshCcw className="w-6 h-6 text-secondary-600" />)}
          </>
        ) : (
          <div className="col-span-full text-sm text-secondary-500">Loading performance summary...</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Assignments Loaded</p>
                <p className="text-2xl font-bold text-secondary-900">{assignments.length}</p>
              </div>
              <Award className="w-6 h-6 text-secondary-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Workflow Rules</p>
                <p className="text-2xl font-bold text-secondary-900">{workflows.length}</p>
              </div>
              <Layers className="w-6 h-6 text-secondary-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Rating Scales</p>
                <p className="text-2xl font-bold text-secondary-900">{ratings.length}</p>
              </div>
              <Star className="w-6 h-6 text-secondary-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-secondary-900">Review Summary</h2>
            <Button onClick={handleSubmitSampleReview} loading={actionLoading}>
              <Plus className="w-5 h-5 mr-2" />
              Submit Sample Review
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-sm text-secondary-500">No performance reviews available yet.</div>
            ) : (
              reviews.map((review) => (
                <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow p-4 border border-secondary-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-secondary-900 text-sm">{review.employeeId}</div>
                      <div className="text-xs text-secondary-500">{review.period}</div>
                    </div>
                    <span className="text-xs uppercase tracking-wider text-secondary-700 capitalize">{review.status}</span>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Rating:</span>
                      <span className="font-bold text-secondary-900">{review.overallRating}</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    {review.status !== 'reviewed' ? (
                      <Button size="sm" onClick={() => handleMarkReviewed(review.id)} loading={actionLoading}>
                        Mark Reviewed
                      </Button>
                    ) : (
                      <span className="text-xs uppercase tracking-wider text-green-600">Reviewed</span>
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
                  <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Period</th>
                  <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Rating</th>
                  <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-secondary-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-secondary-500">No performance reviews available yet.</td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <motion.tr key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="hover:bg-secondary-50">
                      <td className="px-4 py-4 text-sm text-secondary-900">{review.employeeId}</td>
                      <td className="px-4 py-4 text-sm text-secondary-600">{review.period}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-secondary-900">{review.overallRating}</td>
                      <td className="px-4 py-4 text-sm text-secondary-700 capitalize">{review.status}</td>
                      <td className="px-4 py-4 text-sm text-secondary-700">
                        {review.status !== 'reviewed' ? (
                          <Button size="sm" onClick={() => handleMarkReviewed(review.id)} loading={actionLoading}>
                            Mark Reviewed
                          </Button>
                        ) : (
                          <span className="text-xs uppercase tracking-wider text-green-600">Reviewed</span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary-900">Active Review Cycles</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cycles.length === 0 ? (
                <p className="text-sm text-secondary-500">No active performance cycles yet.</p>
              ) : (
                cycles.map((cycle) => (
                  <div key={cycle.id} className="p-4 border border-secondary-200 rounded-lg bg-secondary-50">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-secondary-900">{cycle.name}</p>
                      <span className="text-xs text-secondary-600">{cycle.status}</span>
                    </div>
                    <p className="text-sm text-secondary-600 mt-2">{cycle.description}</p>
                    <p className="text-sm text-secondary-500 mt-2">{formatDate(new Date(cycle.startDate))} - {formatDate(new Date(cycle.endDate))}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary-900">Appraisal Template Library</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {templates.length === 0 ? (
                <p className="text-sm text-secondary-500">No appraisal templates available.</p>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className="p-4 border border-secondary-200 rounded-lg bg-secondary-50">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-secondary-900">{template.name}</p>
                      <span className="text-xs text-secondary-600">{template.status}</span>
                    </div>
                    <p className="text-sm text-secondary-600 mt-2">{template.description}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
