import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Calendar, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import {
  createTaskTemplate,
  getTaskTemplates,
  updateTaskTemplate,
  deleteTaskTemplate,
  generateTasksFromTemplate
} from '../lib/tasks';
import { listUsers } from '../lib/auth';
import type { TaskTemplate, TaskType } from '../types';

const typeOptions = [
  { value: 'medical' as TaskType, label: 'Medical' },
  { value: 'document' as TaskType, label: 'Document' },
  { value: 'training' as TaskType, label: 'Training' },
  { value: 'meeting' as TaskType, label: 'Meeting' },
  { value: 'report' as TaskType, label: 'Report' },
  { value: 'other' as TaskType, label: 'Other' }
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

export const RecurringTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'other' as TaskType,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    assignedTo: [] as string[],
    recurrenceType: 'daily' as 'daily' | 'weekly' | 'monthly',
    recurrenceDays: [] as number[],
    dayOfMonth: 15 as number,
    dueTime: '',
    isActive: true
  });

  const [generateForm, setGenerateForm] = useState({
    templateId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadTemplates();
      loadUsers();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getTaskTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.assignedTo.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingTemplate) {
        await updateTaskTemplate(editingTemplate.id, formData);
      } else {
        await createTaskTemplate({
          ...formData,
          createdBy: user?.employeeId || user?.id || '',
          createdByName: user?.displayName || user?.email || 'Unknown'
        });
      }
      setShowModal(false);
      setEditingTemplate(null);
      setFormData({
        title: '',
        description: '',
        type: 'other',
        priority: 'medium',
        assignedTo: [] as string[],
        recurrenceType: 'daily',
        recurrenceDays: [],
        dayOfMonth: 15,
        dueTime: '',
        isActive: true
      });
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await deleteTaskTemplate(id);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    }
  };

  const handleEdit = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      description: template.description,
      type: template.type,
      priority: template.priority,
      assignedTo: template.assignedTo,
      recurrenceType: template.recurrenceType === 'none' ? 'daily' : template.recurrenceType,
      recurrenceDays: template.recurrenceDays || [],
      dayOfMonth: template.dayOfMonth || 15,
      dueTime: template.dueTime || '',
      isActive: template.isActive
    });
    setShowModal(true);
  };

  const handleGenerateTasks = async () => {
    if (!generateForm.templateId || !generateForm.startDate || !generateForm.endDate) {
      alert('Please fill in all generation fields');
      return;
    }

    if (!confirm('This will generate tasks for the selected date range. Continue?')) return;

    try {
      setGenerating(generateForm.templateId);
      const result = await generateTasksFromTemplate(
        generateForm.templateId,
        new Date(generateForm.startDate),
        new Date(generateForm.endDate),
        user?.employeeId || user?.id || '',
        user?.displayName || user?.email || 'Unknown',
        user?.email || ''
      );
      alert(`Generated ${result.created} tasks. Skipped ${result.skipped} existing tasks.`);
      setGenerateForm({ templateId: '', startDate: '', endDate: '' });
    } catch (error) {
      console.error('Error generating tasks:', error);
      alert('Error generating tasks');
    } finally {
      setGenerating(null);
    }
  };

  const quickGenerate = (templateId: string, months: number) => {
    const start = new Date();
    const end = new Date();

    if (months === 12) {
      // For "Whole Year", generate for the remainder of the current year only
      end.setMonth(11); // December
      end.setDate(31); // Last day of December
    } else {
      // For other options, add the specified months
      end.setMonth(end.getMonth() + months);
    }

    setGenerateForm({
      templateId,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-secondary-600">Access denied. Super admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Recurring Task Templates</h1>
          <p className="text-secondary-600 mt-1">Manage and generate recurring tasks</p>
        </div>
        <Button onClick={() => { setEditingTemplate(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">No templates found. Create your first template.</p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className={!template.isActive ? 'opacity-60' : ''}>
              <CardHeader className="border-b border-secondary-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-secondary-900">{template.title}</h3>
                      {!template.isActive && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-secondary-600 mt-1">{template.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(template)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-secondary-600">Type:</span>
                    <span className="ml-2 font-medium capitalize">{template.type}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Priority:</span>
                    <span className="ml-2 font-medium capitalize">{template.priority}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Recurrence:</span>
                    <span className="ml-2 font-medium capitalize">{template.recurrenceType}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Assigned:</span>
                    <span className="ml-2 font-medium">{template.assignedTo.length} users</span>
                  </div>
                </div>

                {/* Quick Generate Buttons */}
                <div className="mt-4 pt-4 border-t border-secondary-200">
                  <p className="text-sm font-medium text-secondary-700 mb-2">Quick Generate:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => quickGenerate(template.id, 1)}
                    >
                      Current Month
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => quickGenerate(template.id, 3)}
                    >
                      Next 3 Months
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => quickGenerate(template.id, 12)}
                    >
                      Whole Year
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Generate Tasks Modal */}
      <AnimatePresence>
        {generateForm.templateId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setGenerateForm({ templateId: '', startDate: '', endDate: '' })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Generate Tasks</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={generateForm.startDate}
                    onChange={(e) => setGenerateForm({ ...generateForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={generateForm.endDate}
                    onChange={(e) => setGenerateForm({ ...generateForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateTasks}
                    disabled={generating === generateForm.templateId}
                    className="flex-1"
                  >
                    {generating === generateForm.templateId ? 'Generating...' : 'Generate'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setGenerateForm({ templateId: '', startDate: '', endDate: '' })}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => { setShowModal(false); setEditingTemplate(null); }}
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
                  <h2 className="text-xl font-bold">
                    {editingTemplate ? 'Edit Template' : 'New Template'}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => { setShowModal(false); setEditingTemplate(null); }}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                      >
                        {typeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                      >
                        {priorityOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Assign To <span className="text-red-500">*</span>
                    </label>
                    <div className="border border-secondary-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                      {users.map((u) => (
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
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{u.displayName || u.email}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Recurrence</label>
                      <select
                        value={formData.recurrenceType}
                        onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value as 'daily' | 'weekly' | 'monthly', recurrenceDays: [] })}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Due Time</label>
                      <input
                        type="time"
                        value={formData.dueTime}
                        onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {formData.recurrenceType === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Select Days</label>
                      <div className="flex flex-wrap gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (formData.recurrenceDays.includes(index)) {
                                setFormData({ ...formData, recurrenceDays: formData.recurrenceDays.filter(d => d !== index) });
                              } else {
                                setFormData({ ...formData, recurrenceDays: [...formData.recurrenceDays, index] });
                              }
                            }}
                            className={`px-3 py-2 rounded-lg text-sm ${
                              formData.recurrenceDays.includes(index)
                                ? 'bg-primary-500 text-white'
                                : 'bg-secondary-100 text-secondary-700'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.recurrenceType === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Day of Month</label>
                      <select
                        value={formData.dayOfMonth}
                        onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      <p className="text-xs text-secondary-500 mt-1">Task will be due on this day each month</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isActive" className="text-sm text-secondary-700">Active</label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingTemplate(null); }} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingTemplate ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
