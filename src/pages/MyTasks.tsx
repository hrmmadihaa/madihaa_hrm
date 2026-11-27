import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Clock, AlertCircle, FileText, Link, 
  MessageSquare, X, Calendar, User,
  Search, ExternalLink, Edit, Trash2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { getTasksByAssignee, getTasksByAssigner, updateTask, deleteTask, createTaskNotification, addTaskAttachment, addTaskLink, addTaskComment, getTaskAttachments, getTaskLinks, getTaskComments, cleanupRecurrenceData, cleanupDuplicateTasks, cleanupTasksByYear } from '../lib/tasks';
import type { Task, TaskStatus, TaskType, TaskAttachment, TaskLink, TaskComment } from '../types';
import { formatDate } from '../lib/dateUtils';

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300'
};

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const typeIcons: Record<TaskType, React.ReactNode> = {
  medical: <FileText className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
  training: <CheckCircle className="w-4 h-4" />,
  meeting: <User className="w-4 h-4" />,
  report: <FileText className="w-4 h-4" />,
  other: <AlertCircle className="w-4 h-4" />
};

export const MyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFilter, setTabFilter] = useState<'today' | 'overdue' | 'upcoming' | 'history'>('today');
  
  // Task update states
  const [newStatus, setNewStatus] = useState<TaskStatus>('pending');
  const [newComment, setNewComment] = useState('');
  const [newProgressStage, setNewProgressStage] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Sub-collection data
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('');

  useEffect(() => {
    loadTasks();
  }, [user?.employeeId, user?.id]);

  const handleCleanupRecurrence = async () => {
    if (!confirm('Are you sure you want to remove all recurrence data and delete duplicate tasks? This cannot be undone.')) return;
    try {
      await cleanupRecurrenceData();
      await cleanupDuplicateTasks();
      alert('Recurrence data cleaned up and duplicate tasks deleted successfully');
      loadTasks();
    } catch (error) {
      console.error('Error cleaning up recurrence data:', error);
      alert('Error cleaning up recurrence data');
    }
  };

  const handleCleanup2027Tasks = async () => {
    if (!confirm('Are you sure you want to delete ALL tasks with due dates in 2027? This cannot be undone.')) return;
    try {
      const deletedCount = await cleanupTasksByYear(2027);
      alert(`Deleted ${deletedCount} tasks with due dates in 2027`);
      loadTasks();
    } catch (error) {
      console.error('Error cleaning up 2027 tasks:', error);
      alert('Error cleaning up 2027 tasks');
    }
  };

  const loadTasks = async () => {
    // Try both employeeId and user ID
    const employeeId = user?.employeeId;
    const userId = user?.id;
    console.log('Loading tasks for employeeId:', employeeId, 'user.id:', userId);
    
    if (!employeeId && !userId) return;
    
    try {
      setLoading(true);
      
      // Try to load tasks for both employeeId and user.id (assigned to me)
      const tasksPromises = [];
      if (employeeId) {
        tasksPromises.push(getTasksByAssignee(employeeId));
      }
      if (userId && userId !== employeeId) {
        tasksPromises.push(getTasksByAssignee(userId));
      }
      
      // Also load tasks I created (assigned by me)
      if (employeeId) {
        tasksPromises.push(getTasksByAssigner(employeeId));
      }
      if (userId && userId !== employeeId) {
        tasksPromises.push(getTasksByAssigner(userId));
      }
      
      const results = await Promise.all(tasksPromises);
      const allTasks = results.flat();
      
      // Remove duplicates by task ID
      const uniqueTasks = allTasks.filter((task, index, self) =>
        index === self.findIndex(t => t.id === task.id)
      );
      
      console.log('Tasks loaded:', uniqueTasks.length, uniqueTasks);
      console.log('Recurring tasks:', uniqueTasks.filter(t => t.recurrenceType && t.recurrenceType !== 'none'));
      setTasks(uniqueTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskDetails = async (task: Task) => {
    setSelectedTask(task);
    try {
      const [attachmentsData, linksData, commentsData] = await Promise.all([
        getTaskAttachments(task.id),
        getTaskLinks(task.id),
        getTaskComments(task.id)
      ]);
      console.log('Loaded comments:', commentsData);
      setAttachments(attachmentsData);
      setLinks(linksData);
      setComments(commentsData);
      setNewStatus(task.status);
    } catch (error) {
      console.error('Error loading task details:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedTask) return;
    try {
      await updateTask(selectedTask.id, { 
        status: newStatus,
        ...(newStatus === 'completed' && { completedAt: new Date() })
      });
      
      await loadTasks();
      await loadTaskDetails(selectedTask);
      setShowTaskDetail(false);
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error updating task status');
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim() || !user?.employeeId && !user?.id) return;
    try {
      await addTaskComment(selectedTask.id, {
        text: newComment,
        authorId: user.employeeId || user.id,
        authorName: user.displayName || user.email || 'Unknown',
        progressStage: newProgressStage || undefined,
        createdAt: new Date()
      });
      setNewComment('');
      setNewProgressStage('');
      await loadTaskDetails(selectedTask);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment');
    }
  };

  const handleAddLink = async () => {
    if (!selectedTask || !newLinkTitle.trim() || !newLinkUrl.trim() || !user?.employeeId) return;
    try {
      await addTaskLink(selectedTask.id, {
        title: newLinkTitle,
        url: newLinkUrl,
        addedBy: user.employeeId,
        addedAt: new Date()
      });
      setNewLinkTitle('');
      setNewLinkUrl('');
      await loadTaskDetails(selectedTask);
    } catch (error) {
      console.error('Error adding link:', error);
      alert('Error adding link');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTask || !e.target.files || !user?.employeeId) return;
    
    const file = e.target.files[0];
    try {
      setUploadingFile(true);
      // For now, we'll use a placeholder. In production, upload to Cloudinary or Firebase Storage
      const attachment: Omit<TaskAttachment, 'id'> = {
        name: file.name,
        url: URL.createObjectURL(file), // Temporary local URL
        uploadedBy: user.employeeId,
        uploadedAt: new Date()
      };
      await addTaskAttachment(selectedTask.id, attachment);
      await loadTaskDetails(selectedTask);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await deleteTask(taskId);
      await loadTasks();
      setShowTaskDetail(false);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task');
    }
  };

  const handleEditTask = async () => {
    if (!selectedTask) return;
    
    try {
      await updateTask(selectedTask.id, {
        title: editTitle,
        description: editDescription,
        priority: editPriority as any
      });
      await loadTasks();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task');
    }
  };

  const startEditing = () => {
    if (!selectedTask) return;
    setEditTitle(selectedTask.title);
    setEditDescription(selectedTask.description);
    setEditPriority(selectedTask.priority);
    setIsEditing(true);
  };

  const handleResendNotification = async () => {
    if (!selectedTask) return;
    
    try {
      await createTaskNotification({
        userId: selectedTask.assignedTo,
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        type: 'task_assigned',
        message: `Reminder: You have been assigned a task: ${selectedTask.title}`
      });
      alert('Notification resent successfully');
    } catch (error) {
      console.error('Error resending notification:', error);
      alert('Error resending notification');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesType = filterType === 'all' || task.type === filterType;
    const matchesSearch = searchTerm === '' ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Tab filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let matchesTab = true;
    if (tabFilter === 'today') {
      const taskDate = task.dueDate ? new Date(task.dueDate) : null;
      matchesTab = !!taskDate && taskDate.toDateString() === today.toDateString();
    } else if (tabFilter === 'overdue') {
      const taskDate = task.dueDate ? new Date(task.dueDate) : null;
      matchesTab = !!taskDate && taskDate < today && task.status !== 'completed';
    } else if (tabFilter === 'upcoming') {
      const taskDate = task.dueDate ? new Date(task.dueDate) : null;
      matchesTab = !!taskDate && taskDate > today;
    } else if (tabFilter === 'history') {
      matchesTab = task.status === 'completed';
    }

    return matchesStatus && matchesType && matchesSearch && matchesTab;
  }).sort((a, b) => {
    // Sort by due date for upcoming tab (chronological order)
    if (tabFilter === 'upcoming') {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return dateA - dateB;
    }
    // Default sort: newest first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

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
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">My Tasks</h1>
          <p className="text-secondary-600 mt-1">View and manage your assigned tasks</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleCleanup2027Tasks}
            variant="secondary"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Delete 2027 Tasks
          </Button>
          <Button
            onClick={handleCleanupRecurrence}
            className="bg-red-600 hover:bg-red-700"
          >
            Clean Recurrence Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Pending</p>
                <p className="text-2xl font-bold text-secondary-900">{pendingTasks}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">In Progress</p>
                <p className="text-2xl font-bold text-secondary-900">{inProgressTasks}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">Completed</p>
                <p className="text-2xl font-bold text-secondary-900">{completedTasks}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-secondary-200 pb-4">
              <button
                onClick={() => setTabFilter('today')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  tabFilter === 'today'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTabFilter('overdue')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  tabFilter === 'overdue'
                    ? 'bg-red-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Overdue
              </button>
              <button
                onClick={() => setTabFilter('upcoming')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  tabFilter === 'upcoming'
                    ? 'bg-blue-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setTabFilter('history')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  tabFilter === 'history'
                    ? 'bg-green-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                History
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
                className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TaskType | 'all')}
                className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Types</option>
                <option value="medical">Medical</option>
                <option value="document">Document</option>
                <option value="training">Training</option>
                <option value="meeting">Meeting</option>
                <option value="report">Report</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">No tasks found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {typeIcons[task.type]}
                      <h3 className="text-lg font-semibold text-secondary-900">{task.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600 mb-2">{task.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-secondary-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Assigned by: {task.assignedByName}
                      </span>
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {formatDate(task.dueDate)}{task.dueTime && ` ${task.dueTime}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[task.status]}`}>
                      {statusLabels[task.status]}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          loadTaskDetails(task);
                          setShowTaskDetail(true);
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        View Details
                      </Button>
                      {(task.assignedBy === user?.employeeId || task.assignedBy === user?.id) && (
                        <>
                          <Button
                            onClick={() => {
                              loadTaskDetails(task);
                              startEditing();
                              setShowTaskDetail(true);
                            }}
                            variant="secondary"
                            size="sm"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteTask(task.id)}
                            variant="secondary"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {showTaskDetail && selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTaskDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-secondary-200 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-secondary-900">{selectedTask.title}</h2>
                <div className="flex items-center gap-2">
                  {(selectedTask.assignedBy === user?.employeeId || selectedTask.assignedBy === user?.id) && !isEditing && (
                    <Button
                      onClick={startEditing}
                      variant="secondary"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {(selectedTask.assignedBy === user?.employeeId || selectedTask.assignedBy === user?.id) && (
                    <Button
                      onClick={() => handleDeleteTask(selectedTask.id)}
                      variant="secondary"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setShowTaskDetail(false);
                      setIsEditing(false);
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Edit Mode */}
                {isEditing && selectedTask && (
                  <div className="space-y-4 p-4 bg-secondary-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-secondary-900">Edit Task</h3>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Priority</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleEditTask} className="flex-1">
                        Save Changes
                      </Button>
                      <Button onClick={() => setIsEditing(false)} variant="secondary" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Task Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleStatusUpdate} className="flex-1">
                      Update Status
                    </Button>
                    {(selectedTask.assignedBy === user?.employeeId || selectedTask.assignedBy === user?.id) && (
                      <Button onClick={handleResendNotification} variant="secondary" className="ml-2">
                        Resend Notification
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                  <p className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                    {selectedTask.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Assigned To</label>
                    <p className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                      {selectedTask.assignedToName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Assigned By</label>
                    <p className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                      {selectedTask.assignedByName}
                    </p>
                  </div>
                </div>

                {/* Attachments */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Attachments
                  </h3>
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                        <span className="text-sm text-secondary-900">{attachment.name}</span>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open
                        </a>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        className="flex-1 text-sm text-secondary-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      {uploadingFile && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                    <Link className="w-5 h-5" />
                    Links
                  </h3>
                  <div className="space-y-2">
                    {links.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{link.title}</p>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                          >
                            {link.url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Link title"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                      <Button onClick={handleAddLink} size="sm">
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comments
                  </h3>
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-secondary-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-secondary-900">{comment.authorName}</span>
                            {comment.progressStage && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                                {comment.progressStage}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-secondary-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-secondary-600">{comment.text}</p>
                      </div>
                    ))}
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Progress stage (e.g., Stage 1, Review, etc.)"
                        value={newProgressStage}
                        onChange={(e) => setNewProgressStage(e.target.value)}
                        className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                          className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        />
                        <Button onClick={handleAddComment} size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
