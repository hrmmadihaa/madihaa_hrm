import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Clock, AlertCircle, FileText, Link, 
  MessageSquare, X, Calendar, User,
  Search, ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { getTasksByAssignee, updateTask, addTaskAttachment, addTaskLink, addTaskComment, getTaskAttachments, getTaskLinks, getTaskComments } from '../lib/tasks';
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
  
  // Task update states
  const [newStatus, setNewStatus] = useState<TaskStatus>('pending');
  const [newComment, setNewComment] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Sub-collection data
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);

  useEffect(() => {
    loadTasks();
  }, [user?.employeeId, user?.id]);

  const loadTasks = async () => {
    // Use employeeId if available, otherwise use user ID
    const userId = user?.employeeId || user?.id;
    if (!userId) return;
    try {
      setLoading(true);
      const data = await getTasksByAssignee(userId);
      setTasks(data);
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
        completedAt: newStatus === 'completed' ? new Date() : undefined
      });
      await loadTasks();
      await loadTaskDetails(selectedTask);
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error updating task status');
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim() || !user?.employeeId) return;
    try {
      await addTaskComment(selectedTask.id, {
        text: newComment,
        authorId: user.employeeId,
        authorName: user.displayName || user.email || 'Unknown',
        createdAt: new Date()
      });
      setNewComment('');
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

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesType = filterType === 'all' || task.type === filterType;
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
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
                          Due: {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[task.status]}`}>
                      {statusLabels[task.status]}
                    </span>
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
                <Button
                  onClick={() => setShowTaskDetail(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
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
                    <Button onClick={handleStatusUpdate} className="w-full">
                      Update Status
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                  <p className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                    {selectedTask.description}
                  </p>
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
                          <span className="text-sm font-medium text-secondary-900">{comment.authorName}</span>
                          <span className="text-xs text-secondary-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-secondary-600">{comment.text}</p>
                      </div>
                    ))}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
