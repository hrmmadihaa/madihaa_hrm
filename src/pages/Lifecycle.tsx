import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { ArrowRight, FileText, UserCheck, ShieldCheck, ClipboardList, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import {
  getExitInterviews,
  getOffboardingTasks,
  createOffboardingTask,
  completeOffboardingTask,
  getLifecycleReportSummary,
} from '../lib/lifecycle';
import type {
  ExitInterview,
  OffboardingTask,
} from '../types';

export const Lifecycle = () => {
  const [exitInterviews, setExitInterviews] = useState<ExitInterview[]>([]);
  const [offboardingTasks, setOffboardingTasks] = useState<OffboardingTask[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [interviewData, taskData, reportData] = await Promise.all([
        getExitInterviews(),
        getOffboardingTasks(),
        getLifecycleReportSummary(),
      ]);
      setExitInterviews(interviewData);
      setOffboardingTasks(taskData);
      setSummary(reportData);
    } catch (error) {
      console.error('Error loading lifecycle data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTask = async () => {
    if (!newTaskDescription || !newTaskAssignee) return;
    setActionLoading(true);
    try {
      await createOffboardingTask({
        employeeId: '',
        description: newTaskDescription,
        assignedTo: newTaskAssignee,
        dueDate: new Date(),
        completed: false,
      });
      setNewTaskDescription('');
      setNewTaskAssignee('');
      await loadData();
    } catch (error) {
      console.error('Unable to create offboarding task:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    setActionLoading(true);
    try {
      await completeOffboardingTask(taskId);
      await loadData();
    } catch (error) {
      console.error('Unable to complete offboarding task:', error);
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
          <h1 className="text-3xl font-bold text-secondary-900">Employee Lifecycle</h1>
          <p className="text-secondary-600 mt-1">Manage offboarding, exit interviews, and lifecycle transitions.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Button variant="secondary" className="text-xs sm:text-sm">
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Offboarding
          </Button>
          <Button variant="secondary" className="text-xs sm:text-sm">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Separation
          </Button>
          <Button variant="secondary" className="text-xs sm:text-sm">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Interviews
          </Button>
          <Button variant="secondary" className="text-xs sm:text-sm">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Tasks
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary ? (
          <>
            {renderSummaryCard('Exit Interviews', summary.exitInterviewCount, <FileText className="w-6 h-6 text-primary-600" />)}
            {renderSummaryCard('Offboarding Tasks', summary.offboardingTaskCount, <ClipboardList className="w-6 h-6 text-green-600" />)}
            {renderSummaryCard('Completed Tasks', summary.completedTaskCount, <ShieldCheck className="w-6 h-6 text-blue-600" />)}
            {renderSummaryCard('Lifecycle Events', summary.lifecycleEventCount, <ArrowRight className="w-6 h-6 text-yellow-600" />)}
          </>
        ) : (
          <div className="col-span-full text-sm text-secondary-500">Loading lifecycle summary...</div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Create Offboarding Task</h2>
            <Button onClick={handleCreateTask} loading={actionLoading}>
              <Plus className="w-5 h-5 mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Task Description</label>
              <input
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Assigned To</label>
              <input
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary-900">Offboarding Tasks</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {offboardingTasks.length === 0 ? (
                <p className="text-sm text-secondary-500">No offboarding tasks created yet.</p>
              ) : (
                offboardingTasks.map((task) => (
                  <div key={task.id} className="p-4 border border-secondary-200 rounded-lg bg-secondary-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-secondary-900">{task.description}</p>
                        <p className="text-sm text-secondary-600">Assigned to {task.assignedTo}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.completed ? 'bg-green-100 text-green-700' : 'bg-secondary-100 text-secondary-700'}`}>
                        {task.completed ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm text-secondary-500">Due {new Date(task.dueDate).toLocaleDateString()}</p>
                      {!task.completed && (
                        <Button size="sm" onClick={() => handleCompleteTask(task.id)} loading={actionLoading}>
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-secondary-900">Exit Interviews</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exitInterviews.length === 0 ? (
                <p className="text-sm text-secondary-500">No exit interviews recorded yet.</p>
              ) : (
                exitInterviews.map((interview) => (
                  <div key={interview.id} className="p-4 border border-secondary-200 rounded-lg bg-secondary-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-secondary-900">{interview.employeeName}</p>
                        <p className="text-sm text-secondary-600">{interview.reason}</p>
                      </div>
                      <span className="text-xs uppercase tracking-wider text-secondary-500">{new Date(interview.interviewDate).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-2 text-sm text-secondary-700">{interview.feedback}</p>
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
