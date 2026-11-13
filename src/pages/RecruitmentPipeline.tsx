import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Plus, Search, FileText } from 'lucide-react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

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
  department?: string;
  employment_type?: string;
  working_hours?: string;
  work_location?: string;
  reporting_to?: string;
  offer_letter_html?: string;
  offer_letter_date?: string;
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
  const navigate = useNavigate();
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
    'D.O.J': '',
    department: '',
    employment_type: '',
    working_hours: '',
    work_location: '',
    reporting_to: ''
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
      'D.O.J': candidate['D.O.J'] || '',
      department: candidate.department || '',
      employment_type: candidate.employment_type || '',
      working_hours: candidate.working_hours || '',
      work_location: candidate.work_location || '',
      reporting_to: candidate.reporting_to || ''
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
      'D.O.J': '',
      department: '',
      employment_type: '',
      working_hours: '',
      work_location: '',
      reporting_to: ''
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
        department: candidate.department || 'General',
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

  const viewSavedOfferLetter = (candidate: Candidate) => {
    if (!candidate.offer_letter_html) {
      alert('No saved offer letter found for this candidate.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(candidate.offer_letter_html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const saveOfferLetterToFirestore = async (candidate: Candidate) => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    const startDate = candidate['D.O.J'] ? new Date(candidate['D.O.J']).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }) : 'TBD';

    const salary = candidate.salary ? parseFloat(candidate.salary).toLocaleString('en-MV', { 
      style: 'currency', 
      currency: 'MVR' 
    }) : 'MVR 0.00';

    const offerLetterHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.6;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
      font-size: 12pt;
    }
    .header {
      text-align: center;
      margin-bottom: 20mm;
    }
    .header h1 {
      font-size: 18pt;
      margin-bottom: 5mm;
      color: #333;
    }
    .content {
      margin-bottom: 15mm;
    }
    .content p {
      margin-bottom: 3mm;
      text-align: justify;
    }
    .terms {
      background: #f9f9f9;
      padding: 5mm;
      margin: 5mm 0;
      border-left: 2px solid #333;
    }
    .terms p {
      margin: 2mm 0;
    }
    .signature {
      margin-top: 30mm;
      text-align: right;
    }
    .signature p {
      margin: 2mm 0;
    }
    .acceptance {
      margin-top: 20mm;
      padding-top: 5mm;
      border-top: 2px solid #333;
    }
    .acceptance p {
      margin: 2mm 0;
    }
    .signature-line {
      margin-top: 10mm;
      border-bottom: 1px solid #000;
      width: 50mm;
      display: inline-block;
    }
    @media print {
      body { margin: 0; padding: 20mm; }
      @page { margin: 20mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Madihaa Company Pvt Ltd</h1>
  </div>
  
  <div class="content">
    <p><strong>Date:</strong> ${formattedDate}</p>
    <p><strong>To:</strong> ${candidate.Name}</p>
    <p><strong>[${candidate['EMP ID']}]</strong></p>
    
    <p><strong>Subject: Offer of Employment</strong></p>
    
    <p>Dear ${candidate.Name},</p>
    
    <p>We are pleased to offer you the position of <strong>${candidate.POSITION}</strong> at Madihaa Company Pvt Ltd.</p>
    
    <p>The terms and conditions of your employment are as follows:</p>
    
    <div class="terms">
      <p><strong>Position:</strong> ${candidate.POSITION}</p>
      <p><strong>Department:</strong> ${candidate.department || 'General'}</p>
      <p><strong>Employment Type:</strong> ${candidate.employment_type || 'Probation'}</p>
      <p><strong>Start Date:</strong> ${startDate}</p>
      <p><strong>Salary:</strong> ${salary}</p>
      <p><strong>Working Hours:</strong> ${candidate.working_hours || '9:00 to 17:30'}</p>
      <p><strong>Work Location:</strong> ${candidate.work_location || 'Head office'}</p>
      <p><strong>Reporting To:</strong> ${candidate.reporting_to || 'Head of Accounts'}</p>
    </div>
    
    <p>Your employment will be subject to the company's policies, procedures, and applicable employment laws.</p>
    
    <p>Please confirm your acceptance of this offer by signing and returning a copy of this letter.</p>
    
    <p>We look forward to welcoming you to our team and wish you success in your new role.</p>
    
    <p>Sincerely,</p>
  </div>
  
  <div class="signature">
    <p><strong>Moosa Ahmed</strong></p>
    <p>Chairman</p>
    <div class="signature-line"></div>
  </div>
  
  <div class="acceptance">
    <p><strong>ACCEPTANCE OF OFFER</strong></p>
    <p>I, ${candidate.Name}, accept the employment offer and agree to the terms and conditions stated above.</p>
    <p><strong>Signature:</strong> ____________________</p>
    <p><strong>Date:</strong> ____________________</p>
  </div>
</body>
</html>
    `;

    try {
      await updateDoc(doc(db, 'recruitment_candidates', candidate.id), {
        offer_letter_html: offerLetterHTML,
        offer_letter_date: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });
      alert('Offer letter saved to Firestore successfully!');
      loadData();
    } catch (error) {
      console.error('Error saving offer letter:', error);
      alert('Failed to save offer letter');
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

                        {/* Generate Offer Letter Button */}
                        {['interview_completed', 'offer_sent', 'offer_signed'].includes(selectedStage) && (
                          <div className="flex gap-2 mt-2">
                            {candidate.offer_letter_html ? (
                              <button
                                onClick={() => viewSavedOfferLetter(candidate)}
                                className="flex-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                View Saved
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/offer-letter?candidateId=${candidate.id}`)}
                                className="flex-1 text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                Generate
                              </button>
                            )}
                            <button
                              onClick={() => saveOfferLetterToFirestore(candidate)}
                              className="flex-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                            >
                              Save
                            </button>
                          </div>
                        )}

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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Finance Controller"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="Probation">Probation</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
                  <input
                    type="text"
                    value={formData.working_hours}
                    onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 9:00 to 17:30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                  <input
                    type="text"
                    value={formData.work_location}
                    onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Head office"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reporting To</label>
                  <input
                    type="text"
                    value={formData.reporting_to}
                    onChange={(e) => setFormData({ ...formData, reporting_to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Head of Accounts"
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
