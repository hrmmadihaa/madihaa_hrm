import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { FileText, Mail, Plus, Trash, Edit, Download } from 'lucide-react';
import { HolidayStatusLetter } from './HolidayStatusLetter';

interface FormTemplate {
  id: string;
  name: string;
  type: 'form' | 'letter';
  content: string;
  createdAt: Date;
  isBuiltIn?: boolean;
}

export const FormsAndLetters: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forms' | 'letters'>('letters');
  const [showEditor, setShowEditor] = useState(false);
  const [showHolidayLetter, setShowHolidayLetter] = useState(false);
  const [templates, setTemplates] = useState<FormTemplate[]>([
    {
      id: 'holiday-status',
      name: 'Holiday Non-Return Notice',
      type: 'letter',
      content: 'Official notice for employees who failed to return from holiday with visa termination warnings.',
      createdAt: new Date(),
      isBuiltIn: true
    }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [editorContent, setEditorContent] = useState('');

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setEditorContent('');
    setShowEditor(true);
  };

  const handleEditTemplate = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setEditorContent(template.content);
    setShowEditor(true);
  };

  const handleSaveTemplate = () => {
    if (selectedTemplate) {
      setTemplates(templates.map(t => 
        t.id === selectedTemplate.id 
          ? { ...t, content: editorContent }
          : t
      ));
    } else {
      const newTemplate: FormTemplate = {
        id: Date.now().toString(),
        name: `New ${activeTab === 'forms' ? 'Form' : 'Letter'}`,
        type: activeTab === 'forms' ? 'form' : 'letter',
        content: editorContent,
        createdAt: new Date()
      };
      setTemplates([...templates, newTemplate]);
    }
    setShowEditor(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (templates.find(t => t.id === id)?.isBuiltIn) {
      return; // Don't delete built-in templates
    }
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handleUseTemplate = (template: FormTemplate) => {
    if (template.id === 'holiday-status') {
      setShowHolidayLetter(true);
    }
  };

  const filteredTemplates = templates.filter(t => 
    activeTab === 'forms' ? t.type === 'form' : t.type === 'letter'
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Forms & Letters</h1>
        <p className="text-gray-600 mt-2">Create and manage custom forms and letters with company letterhead</p>
        
        {/* Tabs */}
        <div className="flex gap-2 mt-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('forms')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'forms'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Forms
          </button>
          <button
            onClick={() => setActiveTab('letters')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'letters'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Letters
          </button>
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {selectedTemplate ? 'Edit Template' : `Create New ${activeTab === 'forms' ? 'Form' : 'Letter'}`}
              </h2>
              <Button variant="ghost" onClick={() => setShowEditor(false)}>✕</Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  defaultValue={selectedTemplate?.name || ''}
                  placeholder="Enter template name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {activeTab === 'letters' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Letterhead Preview</h3>
                  <div className="text-center mb-4 pb-4 border-b-2 border-blue-300">
                    <div className="flex items-center justify-center mb-2">
                      <img src="/madihaa (1).jpg" alt="Madihaa Logo" className="h-12 w-12 object-contain" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Madihaa Pvt Ltd</h1>
                    <p className="text-sm text-gray-600">Human Resource Management System</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder="Enter your content here..."
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setShowEditor(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate} className="flex-1">
                  Save Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {activeTab === 'forms' ? 'Form Templates' : 'Letter Templates'}
          </h3>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>

        <div className="p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No templates found</p>
              <p className="text-sm text-gray-400 mt-1">Create your first template to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {template.type === 'letter' ? (
                        <Mail className="w-5 h-5 text-blue-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-green-500" />
                      )}
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-3">
                    {template.content || 'No content'}
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Holiday Letter Modal */}
      {showHolidayLetter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 no-print">
              <h2 className="text-xl font-bold">Holiday Status Update Letter</h2>
              <Button variant="ghost" onClick={() => setShowHolidayLetter(false)}>✕</Button>
            </div>
            <HolidayStatusLetter />
          </div>
        </div>
      )}
    </div>
  );
};
