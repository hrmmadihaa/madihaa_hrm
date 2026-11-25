import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User as UserIcon, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { CardHeader, CardContent } from './ui/Card';
import { createTask, createTaskNotification, addTaskComment } from '../lib/tasks';
import { listUsers } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import type { TaskType } from '../types';
import type { User } from '../types';

interface TaskAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
  defaultType?: TaskType;
}

const typeOptions = [
  { value: 'medical' as TaskType, label: 'Medical', icon: <FileText className="w-4 h-4" /> },
  { value: 'document' as TaskType, label: 'Document', icon: <FileText className="w-4 h-4" /> },
  { value: 'training' as TaskType, label: 'Training', icon: <CheckCircle className="w-4 h-4" /> },
  { value: 'meeting' as TaskType, label: 'Meeting', icon: <UserIcon className="w-4 h-4" /> },
  { value: 'report' as TaskType, label: 'Report', icon: <FileText className="w-4 h-4" /> },
  { value: 'other' as TaskType, label: 'Other', icon: <AlertCircle className="w-4 h-4" /> }
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

export const TaskAssignment = ({ isOpen, onClose, onTaskCreated, defaultType = 'other' }: TaskAssignmentProps) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assignSearchTerm, setAssignSearchTerm] = useState('');
  const [referenceSearchTerm, setReferenceSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: defaultType,
    priority: 'medium',
    assignedTo: [] as string[],
    referencedUsers: [] as string[],
    dueDate: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setFormData(prev => ({ ...prev, type: defaultType }));
    }
  }, [isOpen, defaultType]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await listUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || formData.assignedTo.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    const assignedUsers = users.filter(u => formData.assignedTo.includes(u.id));
    if (assignedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    try {
      setSubmitting(true);
      
      // Create a task for each assigned user
      for (const assignedUser of assignedUsers) {
        const taskId = await createTask({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          status: 'pending',
          priority: formData.priority as any,
          assignedTo: assignedUser.employeeId || assignedUser.id,
          assignedToName: assignedUser.displayName || assignedUser.email || 'Unknown',
          assignedToEmail: assignedUser.email,
          assignedBy: user?.employeeId || user?.id || '',
          assignedByName: user?.displayName || user?.email || 'Unknown',
          assignedByEmail: user?.email || '',
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
        });

        // Create notification for the assigned user
        await createTaskNotification({
          userId: assignedUser.employeeId || assignedUser.id,
          taskId,
          taskTitle: formData.title,
          type: 'task_assigned',
          message: `You have been assigned a new task: ${formData.title}`
        });

        // Add a comment mentioning the referenced staff
        if (formData.referencedUsers.length > 0) {
          const referencedNames = users
            .filter(u => formData.referencedUsers.includes(u.id))
            .map(u => u.displayName || u.email)
            .join(', ');
          
          await addTaskComment(taskId, {
            text: `Referenced staff: ${referencedNames}`,
            authorId: user?.id || '',
            authorName: user?.displayName || user?.email || 'System',
            createdAt: new Date()
          });
        }
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: defaultType,
        priority: 'medium',
        assignedTo: [] as string[],
        referencedUsers: [] as string[],
        dueDate: ''
      });

      onClose();
      if (onTaskCreated) onTaskCreated();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader className="border-b border-secondary-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary-900">Assign New Task</h2>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter task description. You can mention staff members in the description (e.g., 'Check @Nabina health condition')"
                  rows={3}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Referenced Staff (mentioned in description) */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Referenced Staff (mentioned in task)
                </label>
                <p className="text-xs text-secondary-500 mb-2">Select staff members mentioned in the task description (e.g., Nabina)</p>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={referenceSearchTerm}
                  onChange={(e) => setReferenceSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                />
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                ) : users.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      No users found.
                    </p>
                  </div>
                ) : (
                  <div className="border border-secondary-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {users
                      .filter(u => 
                        (u.displayName?.toLowerCase().includes(referenceSearchTerm.toLowerCase()) || 
                         u.email?.toLowerCase().includes(referenceSearchTerm.toLowerCase()))
                      )
                      .map((u) => (
                      <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-secondary-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.referencedUsers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, referencedUsers: [...formData.referencedUsers, u.id] });
                            } else {
                              setFormData({ ...formData, referencedUsers: formData.referencedUsers.filter(id => id !== u.id) });
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-secondary-900">
                          {u.displayName || u.email} ({u.role.toUpperCase()})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {formData.referencedUsers.length > 0 && (
                  <p className="text-xs text-secondary-600 mt-1">
                    {formData.referencedUsers.length} referenced staff member(s)
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Task Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {typeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: option.value })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                        formData.type === option.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-secondary-300 hover:border-secondary-400'
                      }`}
                    >
                      {option.icon}
                      <span className="text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: option.value })}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        formData.priority === option.value
                          ? option.color + ' ring-2 ring-offset-2 ring-current'
                          : option.color + ' opacity-60 hover:opacity-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign To */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Assign To <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={assignSearchTerm}
                  onChange={(e) => setAssignSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                />
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                ) : users.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      No users found. Tasks can be assigned to any system user.
                    </p>
                  </div>
                ) : (
                  <div className="border border-secondary-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {users
                      .filter(u => 
                        (u.displayName?.toLowerCase().includes(assignSearchTerm.toLowerCase()) || 
                         u.email?.toLowerCase().includes(assignSearchTerm.toLowerCase()))
                      )
                      .map((u) => (
                      <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-secondary-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.assignedTo.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, assignedTo: [...formData.assignedTo, u.id] });
                            } else {
                              setFormData({ ...formData, assignedTo: formData.assignedTo.filter(id => id !== u.id) });
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-secondary-900">
                          {u.displayName || u.email} ({u.role.toUpperCase()}) - {u.department || 'N/A'}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {formData.assignedTo.length > 0 && (
                  <p className="text-xs text-secondary-600 mt-1">
                    {formData.assignedTo.length} user(s) selected
                  </p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Creating...' : 'Assign Task'}
                </Button>
              </div>
            </form>
          </CardContent>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
