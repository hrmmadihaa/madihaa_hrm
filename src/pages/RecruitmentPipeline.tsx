import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Plus, Search } from 'lucide-react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Candidate {
  id: string;
  Name: string;
  'EMP ID': string;
  POSITION: string;
  stage: string;
  status: string;
  salary?: string;
  Nationality?: string;
  'Date of Birth'?: string;
  Gender?: string;
  'Passport No.'?: string;
  'Issue Date'?: string;
  'Expiry Date'?: string;
  email?: string;
  phone?: string;
  address?: string;
  'Emergency Contact Name'?: string;
  'Emergency Contact Phone'?: string;
  'D.O.J'?: string;
  work_permit_number?: string;
  work_permit_expiry?: string;
  created_date?: string;
  last_updated?: string;
  screening_result?: string;
  interview_result?: string;
  approval_status?: string;
  onboarding_date?: string;
  directory_added?: boolean;
  loa_status?: 'pending' | 'completed' | null;
}

const STAGES = [
  { key: 'cv_received', name: '📄 CV Received', color: '#e74c3c' },
  { key: 'shortlisted', name: '📋 Shortlisted', color: '#f39c12' },
  { key: 'interview_scheduled', name: '📅 Interview Scheduled', color: '#3498db' },
  { key: 'interview_completed', name: '✅ Interview Completed', color: '#2ecc71' },
  { key: 'offer_sent', name: '📝 Offer Letter Sent', color: '#9b59b6' },
  { key: 'offer_signed', name: '✍️ Offer Signed', color: '#1abc9c' },
  { key: 'work_permit_applied', name: '🛂 Work Permit Applied', color: '#e67e22' },
  { key: 'payment_pending', name: '💰 Payment Pending', color: '#f1c40f' },
  { key: 'payment_completed', name: '💳 Payment Completed', color: '#27ae60' },
  { key: 'entry_pass_pending', name: '🎫 Entry Pass Pending', color: '#8e44ad' },
  { key: 'entry_pass_received', name: '🎫 Entry Pass Received', color: '#16a085' },
  { key: 'ticket_purchased', name: '✈️ Ticket Purchased', color: '#d35400' },
  { key: 'ticket_approved', name: '✅ Ticket Approved', color: '#c0392b' },
  { key: 'departed', name: '🚀 Departed', color: '#7f8c8d' },
  { key: 'van_arranged', name: '🚐 Van Arranged', color: '#2c3e50' },
  { key: 'airport_pickup', name: '🛬 Airport Pickup', color: '#34495e' },
  { key: 'arrived', name: '🏢 Arrived', color: '#e74c3c' },
  { key: 'onboarded', name: '👥 Added to Directory', color: '#27ae60' }
];

export const RecruitmentPipeline: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState(STAGES[0].key);

  const [formData, setFormData] = useState({
    Name: '',
    'EMP ID': '',
    POSITION: '',
    salary: '',
    Nationality: '',
    'Date of Birth': '',
    Gender: '',
    'Passport No.': '',
    'Issue Date': '',
    'Expiry Date': '',
    email: '',
    phone: '',
    address: '',
    'Emergency Contact Name': '',
    'Emergency Contact Phone': '',
    'D.O.J': ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const candidatesQuery = query(collection(db, 'recruitment_candidates'), orderBy('created_date', 'desc'));
      const candidatesSnapshot = await getDocs(candidatesQuery);
      const candidatesData = candidatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Candidate));
      setCandidates(candidatesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCandidate) {
        // Update existing
        const docRef = doc(db, 'recruitment_candidates', editingCandidate.id);
        await updateDoc(docRef, {
          ...formData,
          last_updated: new Date().toISOString()
        });
      } else {
        // Create new - let Firebase generate the ID
        await addDoc(collection(db, 'recruitment_candidates'), {
          ...formData,
          stage: 'cv_received',
          status: 'Pending',
          created_date: new Date().toISOString(),
          last_updated: new Date().toISOString()
        });
      }
      setShowModal(false);
      setEditingCandidate(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving candidate:', error);
      alert('Failed to save candidate');
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    try {
      await deleteDoc(doc(db, 'recruitment_candidates', candidateId));
      loadData();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      alert('Failed to delete candidate');
    }
  };

  const handleQuickStageChange = async (candidate: Candidate, newStage: string) => {
    try {
      const docRef = doc(db, 'recruitment_candidates', candidate.id);
      await updateDoc(docRef, {
        stage: newStage,
        last_updated: new Date().toISOString()
      });
      loadData();
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Failed to update stage');
    }
  };

  const handleLOAStatusChange = async (candidate: Candidate, loaStatus: 'pending' | 'completed' | null) => {
    try {
      const docRef = doc(db, 'recruitment_candidates', candidate.id);
      const updateData: any = {
        loa_status: loaStatus,
        last_updated: new Date().toISOString()
      };
      
      // If LOA is completed, move to Work Permit Applied stage
      if (loaStatus === 'completed') {
        updateData.stage = 'work_permit_applied';
      }
      
      await updateDoc(docRef, updateData);
      loadData();
    } catch (error) {
      console.error('Error updating LOA status:', error);
      alert('Failed to update LOA status');
    }
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      Name: candidate.Name || '',
      'EMP ID': candidate['EMP ID'] || '',
      POSITION: candidate.POSITION || '',
      salary: candidate.salary || '',
      Nationality: candidate.Nationality || '',
      'Date of Birth': candidate['Date of Birth'] || '',
      Gender: candidate.Gender || '',
      'Passport No.': candidate['Passport No.'] || '',
      'Issue Date': candidate['Issue Date'] || '',
      'Expiry Date': candidate['Expiry Date'] || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
      address: candidate.address || '',
      'Emergency Contact Name': candidate['Emergency Contact Name'] || '',
      'Emergency Contact Phone': candidate['Emergency Contact Phone'] || '',
      'D.O.J': candidate['D.O.J'] || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      Name: '',
      'EMP ID': '',
      POSITION: '',
      salary: '',
      Nationality: '',
      'Date of Birth': '',
      Gender: '',
      'Passport No.': '',
      'Issue Date': '',
      'Expiry Date': '',
      email: '',
      phone: '',
      address: '',
      'Emergency Contact Name': '',
      'Emergency Contact Phone': '',
      'D.O.J': ''
    });
  };

  const handleAddToDirectory = async (candidate: Candidate) => {
    if (!candidate['EMP ID']) {
      alert('EMP ID is required before adding to directory');
      return;
    }

    const currentDate = new Date();
    const currentDateStr = currentDate.toISOString().split('T')[0];
    
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    try {
      await addDoc(collection(db, 'employees'), {
        employeeId: candidate['EMP ID'],
        fullName: candidate.Name,
        designation: candidate.POSITION,
        salary: candidate.salary ? parseFloat(candidate.salary) : 350,
        department: 'General',
        status: 'active',
        joinDate: candidate['D.O.J'] ? new Date(candidate['D.O.J']) : currentDate,
        nationality: candidate.Nationality,
        dob: candidate['Date of Birth'] ? new Date(candidate['Date of Birth']) : null,
        phone: candidate.phone,
        email: candidate.email,
        wpNo: candidate.work_permit_number || '',
        wpExpDate: candidate.work_permit_expiry ? new Date(candidate.work_permit_expiry) : oneYearFromNow,
        createdAt: currentDate,
        updatedAt: currentDate
      });

      // Update candidate status
      await updateDoc(doc(db, 'recruitment_candidates', candidate.id), {
        stage: 'onboarded',
        status: 'Onboarded',
        onboarding_date: currentDateStr,
        directory_added: true,
        last_updated: new Date().toISOString()
      });

      alert(`Successfully added ${candidate.Name} to employee directory!`);
      loadData();
    } catch (error) {
      console.error('Error adding to directory:', error);
      alert('Failed to add to directory');
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    // Filter out candidates with locally-generated IDs (they don't exist in Firestore)
    if (candidate.id && candidate.id.startsWith('c_')) {
      return false;
    }
    
    const matchesSearch = !searchTerm || 
      candidate.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate['EMP ID']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.POSITION?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPosition = !filterPosition || candidate.POSITION === filterPosition;
    
    return matchesSearch && matchesPosition;
  });

  const uniquePositions = Array.from(new Set(candidates.map(c => c.POSITION).filter(Boolean))).sort();

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Recruitment Pipeline</h1>
        <p className="text-gray-600 mt-2">Manage candidate recruitment from CV to onboarding</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <Button onClick={() => { resetForm(); setEditingCandidate(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Positions</option>
            {uniquePositions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pipeline Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Headers */}
        <div className="flex overflow-x-auto border-b border-gray-200">
          {STAGES.map(stage => {
            const stageCount = filteredCandidates.filter(c => c.stage === stage.key).length;
            return (
              <button
                key={stage.key}
                onClick={() => setSelectedStage(stage.key)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedStage === stage.key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {stage.name}
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  selectedStage === stage.key ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stageCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {(() => {
            const currentStage = STAGES.find(s => s.key === selectedStage);
            const stageCandidates = filteredCandidates.filter(c => c.stage === selectedStage);
            
            if (!currentStage) return null;

            return (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">{currentStage.name}</h3>
                
                {stageCandidates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No candidates in this stage
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {stageCandidates.map(candidate => (
                      <div
                        key={candidate.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="font-medium text-sm text-gray-900">{candidate.Name}</div>
                        <div className="text-xs text-gray-500 mt-1">{candidate.POSITION}</div>
                        <div className="text-xs text-gray-400 mt-1">ID: {candidate['EMP ID']}</div>
                        
                        {/* LOA Status */}
                        <div className="mt-3">
                          <label className="text-xs font-medium text-gray-600 mb-1 block">LOA Status</label>
                          <select
                            value={candidate.loa_status || ''}
                            onChange={(e) => handleLOAStatusChange(candidate, (e.target.value || null) as 'pending' | 'completed' | null)}
                            className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Not Started</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>

                        {/* Quick Stage Change */}
                        <div className="mt-3">
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Stage</label>
                          <select
                            value={candidate.stage}
                            onChange={(e) => handleQuickStageChange(candidate, e.target.value)}
                            className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {STAGES.map(s => (
                              <option key={s.key} value={s.key}>{s.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleEditCandidate(candidate)}
                            className="flex-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            className="flex-1 text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>

                        {/* Special Action for Onboarded */}
                        {selectedStage === 'onboarded' && (
                          <button
                            onClick={() => handleAddToDirectory(candidate)}
                            className="w-full mt-2 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded hover:bg-green-100 transition-colors"
                          >
                            Add to Directory
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingCandidate ? 'Edit Candidate' : 'Add Candidate'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingCandidate(null); resetForm(); }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCandidate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.Name}
                    onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={formData['EMP ID']}
                    onChange={(e) => setFormData({ ...formData, 'EMP ID': e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    required
                    value={formData.POSITION}
                    onChange={(e) => setFormData({ ...formData, POSITION: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary (USD)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={formData.Nationality}
                    onChange={(e) => setFormData({ ...formData, Nationality: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.Gender}
                    onChange={(e) => setFormData({ ...formData, Gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData['Date of Birth']}
                    onChange={(e) => setFormData({ ...formData, 'Date of Birth': e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                  <input
                    type="date"
                    value={formData['D.O.J']}
                    onChange={(e) => setFormData({ ...formData, 'D.O.J': e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                  <input
                    type="text"
                    value={formData['Passport No.']}
                    onChange={(e) => setFormData({ ...formData, 'Passport No.': e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passport Issue Date</label>
                  <input
                    type="date"
                    value={formData['Issue Date']}
                    onChange={(e) => setFormData({ ...formData, 'Issue Date': e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passport Expiry Date</label>
                  <input
                    type="date"
                    value={formData['Expiry Date']}
                    onChange={(e) => setFormData({ ...formData, 'Expiry Date': e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData['Emergency Contact Name']}
                    onChange={(e) => setFormData({ ...formData, 'Emergency Contact Name': e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={formData['Emergency Contact Phone']}
                    onChange={(e) => setFormData({ ...formData, 'Emergency Contact Phone': e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditingCandidate(null); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCandidate ? 'Update' : 'Add'} Candidate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
