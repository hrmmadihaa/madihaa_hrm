import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Plus, Search, FileText } from 'lucide-react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../lib/activityLog';
import { formatDate } from '../lib/dateUtils';

interface Candidate {
  id: string;
  Name: string;
  'EMP ID': string;
  POSITION: string;
  stage: string;
  status: string;
  salary?: string;
  Nationality?: string;
  date_of_birth?: string;
  Gender?: string;
  passport_no?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  email?: string;
  phone?: string;
  address?: string;
  permanent_address?: string;
  national_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  date_of_joining?: string;
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
  // LOA optional fields
  business_activity?: string;
  salary_currency?: string;
  exchange_rate?: string;
  food_accommodation?: string;
  salary_payment?: string;
  job_description?: string;
  contract_duration?: string;
  // Work Permit Applied fields
  expat_reference_number?: string;
  new_work_permit?: string;
  submitted_date?: string;
  egov_link?: string;
  slot_number?: string;
  // Flight details
  flight_number?: string;
  flight_date?: string;
  flight_time?: string;
  arrival_date?: string;
  arrival_time?: string;
  departure_airport?: string;
  arrival_airport?: string;
  arrival_notification_sent?: boolean;
}

const STAGES = [
  { key: 'all', name: '📊 All Candidates', color: '#2c3e50' },
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
  const [selectedStage, setSelectedStage] = useState('all');
  const [showWorkPermitModal, setShowWorkPermitModal] = useState(false);
  const [showFlightDetailsModal, setShowFlightDetailsModal] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState<{ candidate: Candidate; newStage: string } | null>(null);

  const [formData, setFormData] = useState({
    Name: '',
    'EMP ID': '',
    POSITION: '',
    salary: '',
    Nationality: '',
    date_of_birth: '',
    Gender: '',
    passport_no: '',
    passport_issue_date: '',
    passport_expiry_date: '',
    email: '',
    phone: '',
    address: '',
    permanent_address: '',
    national_id: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    date_of_joining: '',
    department: '',
    employment_type: '',
    working_hours: '',
    work_location: '',
    reporting_to: '',
    // LOA optional fields
    business_activity: '',
    salary_currency: '',
    exchange_rate: '',
    food_accommodation: '',
    salary_payment: '',
    job_description: '',
    contract_duration: '',
    // Work Permit Applied fields
    expat_reference_number: '',
    new_work_permit: '',
    submitted_date: '',
    egov_link: '',
    slot_number: '',
    // Flight details
    flight_number: '',
    flight_date: '',
    flight_time: '',
    arrival_date: '',
    arrival_time: '',
    departure_airport: '',
    arrival_airport: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Auto-move candidates to departed when arrival time is reached
  useEffect(() => {
    const checkFlightTimes = async () => {
      try {
        const now = new Date();
        
        // Get candidates in ticket_approved stage with flight details from Firestore
        const candidatesQuery = query(collection(db, 'recruitment_candidates'), where('stage', '==', 'ticket_approved'));
        const candidatesSnapshot = await getDocs(candidatesQuery);
        const candidatesToCheck = candidatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Candidate)).filter(c => c.arrival_date && c.arrival_time);

        let hasChanges = false;

        for (const candidate of candidatesToCheck) {
          if (!candidate.arrival_date || !candidate.arrival_time) continue;

          const arrivalDateTime = new Date(`${candidate.arrival_date}T${candidate.arrival_time}`);
          const thirtyMinutesBefore = new Date(arrivalDateTime.getTime() - 30 * 60 * 1000);
          
          // Check if we're 30 minutes before arrival and notification not sent yet
          if (now >= thirtyMinutesBefore && now < arrivalDateTime && !candidate.arrival_notification_sent) {
            await logActivity(
              'updated',
              'recruitment_candidate',
              candidate.id,
              `Flight ${candidate.flight_number} arriving in 30 minutes - ${candidate.Name} landing at ${candidate.arrival_airport || 'Maldives'} at ${candidate.arrival_time}`
            );
            await updateDoc(doc(db, 'recruitment_candidates', candidate.id), {
              arrival_notification_sent: true,
              last_updated: new Date().toISOString()
            });
            console.log(`Sent 30-minute arrival notification for ${candidate.Name}`);
            hasChanges = true;
          }
          
          // If arrival time has passed, move to departed
          if (now >= arrivalDateTime) {
            await updateDoc(doc(db, 'recruitment_candidates', candidate.id), {
              stage: 'departed',
              last_updated: new Date().toISOString()
            });
            await logActivity(
              'updated',
              'recruitment_candidate',
              candidate.id,
              `Auto-moved ${candidate.Name} to departed stage (arrival time reached)`
            );
            console.log(`Auto-moved ${candidate.Name} to departed stage`);
            hasChanges = true;
          }
        }

        // Reload data only if changes were made
        if (hasChanges) {
          loadData();
        }
      } catch (error) {
        console.error('Error checking flight times:', error);
      }
    };

    // Check immediately on load
    checkFlightTimes();

    // Check every minute
    const interval = setInterval(checkFlightTimes, 60000);

    return () => clearInterval(interval);
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
        await logActivity(
          'updated',
          'recruitment_candidate',
          editingCandidate.id,
          `Updated candidate ${formData.Name} for ${formData.POSITION}`
        );
      } else {
        // Create new - let Firebase generate the ID
        const docRef = await addDoc(collection(db, 'recruitment_candidates'), {
          ...formData,
          stage: 'cv_received',
          status: 'Pending',
          created_date: new Date().toISOString(),
          last_updated: new Date().toISOString()
        });
        await logActivity(
          'created',
          'recruitment_candidate',
          docRef.id,
          `Added new candidate ${formData.Name} for ${formData.POSITION}`
        );
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
      const candidate = candidates.find(c => c.id === candidateId);
      await deleteDoc(doc(db, 'recruitment_candidates', candidateId));
      await logActivity(
        'deleted',
        'recruitment_candidate',
        candidateId,
        `Deleted candidate ${candidate?.Name} for ${candidate?.POSITION}`
      );
      loadData();
    } catch (error) {
      console.error('Error deleting candidate:', error);
      alert('Failed to delete candidate');
    }
  };

  const handleQuickStageChange = async (candidate: Candidate, newStage: string) => {
    // If changing to work_permit_applied, show modal to collect work permit details
    if (newStage === 'work_permit_applied') {
      setPendingStageChange({ candidate, newStage });
      setShowWorkPermitModal(true);
      return;
    }

    // If changing to ticket_approved, show modal to collect flight details
    if (newStage === 'ticket_approved') {
      setPendingStageChange({ candidate, newStage });
      setShowFlightDetailsModal(true);
      return;
    }

    try {
      const docRef = doc(db, 'recruitment_candidates', candidate.id);
      await updateDoc(docRef, {
        stage: newStage,
        last_updated: new Date().toISOString()
      });
      await logActivity(
        'updated',
        'recruitment_candidate',
        candidate.id,
        `Changed stage for ${candidate.Name} to ${newStage}`
      );
      loadData();
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Failed to update stage');
    }
  };

  const handleWorkPermitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingStageChange) return;

    const { candidate, newStage } = pendingStageChange;

    // Validate required fields
    if (!formData.expat_reference_number || !formData.submitted_date || !formData.slot_number) {
      alert('Please fill in all required fields: Expat Reference Number, Submitted Date, and Slot Number');
      return;
    }

    try {
      const docRef = doc(db, 'recruitment_candidates', candidate.id);
      const updateData: any = {
        stage: newStage,
        expat_reference_number: formData.expat_reference_number,
        new_work_permit: formData.new_work_permit,
        submitted_date: formData.submitted_date,
        egov_link: formData.egov_link,
        slot_number: formData.slot_number,
        last_updated: new Date().toISOString()
      };

      // If LOA status was not completed, set it to completed
      if (candidate.loa_status !== 'completed') {
        updateData.loa_status = 'completed';
      }

      await updateDoc(docRef, updateData);
      setShowWorkPermitModal(false);
      setPendingStageChange(null);
      // Reset work permit fields
      setFormData({
        ...formData,
        expat_reference_number: '',
        new_work_permit: '',
        submitted_date: '',
        egov_link: '',
        slot_number: ''
      });
      loadData();
    } catch (error) {
      console.error('Error updating stage with work permit details:', error);
      alert('Failed to update stage');
    }
  };

  const handleFlightDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingStageChange) return;

    const { candidate, newStage } = pendingStageChange;

    // Validate required fields
    if (!formData.flight_number || !formData.flight_date || !formData.flight_time || !formData.arrival_date || !formData.arrival_time) {
      alert('Please fill in all required fields: Flight Number, Flight Date, Flight Time, Arrival Date, and Arrival Time');
      return;
    }

    try {
      const docRef = doc(db, 'recruitment_candidates', candidate.id);
      const updateData: any = {
        stage: newStage,
        flight_number: formData.flight_number,
        flight_date: formData.flight_date,
        flight_time: formData.flight_time,
        arrival_date: formData.arrival_date,
        arrival_time: formData.arrival_time,
        departure_airport: formData.departure_airport,
        arrival_airport: formData.arrival_airport,
        last_updated: new Date().toISOString()
      };

      await updateDoc(docRef, updateData);
      setShowFlightDetailsModal(false);
      setPendingStageChange(null);
      // Reset flight details fields
      setFormData({
        ...formData,
        flight_number: '',
        flight_date: '',
        flight_time: '',
        arrival_date: '',
        arrival_time: '',
        departure_airport: '',
        arrival_airport: ''
      });
      loadData();
    } catch (error) {
      console.error('Error updating stage with flight details:', error);
      alert('Failed to update stage');
    }
  };

  const handleLOAStatusChange = async (candidate: Candidate, loaStatus: 'pending' | 'completed' | null) => {
    // If LOA is completed, show modal to collect work permit details before moving to Work Permit Applied stage
    if (loaStatus === 'completed') {
      setPendingStageChange({ candidate, newStage: 'work_permit_applied' });
      setShowWorkPermitModal(true);
      return;
    }

    try {
      const docRef = doc(db, 'recruitment_candidates', candidate.id);
      const updateData: any = {
        loa_status: loaStatus,
        last_updated: new Date().toISOString()
      };
      
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
      date_of_birth: candidate.date_of_birth || '',
      Gender: candidate.Gender || '',
      passport_no: candidate.passport_no || '',
      passport_issue_date: candidate.passport_issue_date || '',
      passport_expiry_date: candidate.passport_expiry_date || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
      address: candidate.address || '',
      permanent_address: candidate.permanent_address || '',
      national_id: candidate.national_id || '',
      emergency_contact_name: candidate.emergency_contact_name || '',
      emergency_contact_phone: candidate.emergency_contact_phone || '',
      date_of_joining: candidate.date_of_joining || '',
      department: candidate.department || '',
      employment_type: candidate.employment_type || '',
      working_hours: candidate.working_hours || '',
      work_location: candidate.work_location || '',
      reporting_to: candidate.reporting_to || '',
      business_activity: candidate.business_activity || '',
      salary_currency: candidate.salary_currency || '',
      exchange_rate: candidate.exchange_rate || '',
      food_accommodation: candidate.food_accommodation || '',
      salary_payment: candidate.salary_payment || '',
      job_description: candidate.job_description || '',
      contract_duration: candidate.contract_duration || '',
      expat_reference_number: candidate.expat_reference_number || '',
      new_work_permit: candidate.new_work_permit || '',
      submitted_date: candidate.submitted_date || '',
      egov_link: candidate.egov_link || '',
      slot_number: candidate.slot_number || '',
      flight_number: candidate.flight_number || '',
      flight_date: candidate.flight_date || '',
      flight_time: candidate.flight_time || '',
      arrival_date: candidate.arrival_date || '',
      arrival_time: candidate.arrival_time || '',
      departure_airport: candidate.departure_airport || '',
      arrival_airport: candidate.arrival_airport || ''
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
      date_of_birth: '',
      Gender: '',
      passport_no: '',
      passport_issue_date: '',
      passport_expiry_date: '',
      email: '',
      phone: '',
      address: '',
      permanent_address: '',
      national_id: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      date_of_joining: '',
      department: '',
      employment_type: '',
      working_hours: '',
      work_location: '',
      reporting_to: '',
      business_activity: '',
      salary_currency: '',
      exchange_rate: '',
      food_accommodation: '',
      salary_payment: '',
      job_description: '',
      contract_duration: '',
      expat_reference_number: '',
      new_work_permit: '',
      submitted_date: '',
      egov_link: '',
      slot_number: '',
      flight_number: '',
      flight_date: '',
      flight_time: '',
      arrival_date: '',
      arrival_time: '',
      departure_airport: '',
      arrival_airport: ''
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
        joinDate: candidate.date_of_joining ? new Date(candidate.date_of_joining) : currentDate,
        nationality: candidate.Nationality,
        dob: candidate.date_of_birth ? new Date(candidate.date_of_birth) : null,
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
      // Replace logo path with full URL to ensure it loads in the new window
      const updatedHtml = candidate.offer_letter_html.replace(
        /src="[^/]*Madihaa 2026 \(1\)\.png"/g,
        `src="${window.location.origin}/Madihaa 2026 (1).png"`
      );
      printWindow.document.write(updatedHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const saveOfferLetterToFirestore = async (candidate: Candidate) => {
    const today = new Date();
    const formattedDate = formatDate(today);

    const isMaldivian = candidate.Nationality?.toLowerCase().includes('maldives') ||
                        candidate.Nationality?.toLowerCase().includes('maldivian');

    const startDate = candidate.date_of_joining ? formatDate(new Date(candidate.date_of_joining)) : 'TBD';

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
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6;
      max-width: 210mm;
      margin: 0 auto;
      padding: 12mm 17mm 13mm;
      background: white;
      font-size: 9.5pt;
    }
    .letterhead {
      min-height: 30mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5mm;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .company-logo {
      width: 100px;
      height: 100px;
      object-fit: contain;
    }
    .brand h1 {
      margin: 0;
      font-size: 18px;
      letter-spacing: 1.5px;
      color: #172b4d;
    }
    .brand p {
      margin: 3px 0 0;
      font-size: 9px;
      letter-spacing: 3px;
      color: #555;
    }
    .company-contact {
      text-align: right;
      font-size: 8.5pt;
      line-height: 1.5;
      color: #444;
    }
    .company-contact p {
      margin: 0;
    }
    .header-line {
      height: 2px;
      background: #172b4d;
      margin: 5mm 0 10mm;
    }
    .letter-date {
      text-align: right;
      font-size: 9.5pt;
      margin-bottom: 10mm;
    }
    .recipient {
      font-size: 9.5pt;
      line-height: 1.4;
      margin-bottom: 5mm;
    }
    .recipient p {
      margin: 1px 0;
    }
    .subject {
      font-size: 10pt;
      margin: 0 0 5mm;
      text-decoration: underline;
    }
    .letter-body {
      font-size: 9.5pt;
      line-height: 1.32;
    }
    .letter-body p {
      margin: 0 0 3.5mm;
    }
    .employment-details {
      margin: 2mm 0 4mm 4mm;
    }
    .employment-details p {
      margin: 0 0 1.5mm;
    }
    .signature {
      margin-top: 3mm;
      line-height: 1.3;
    }
    .signature p {
      margin: 0 0 1mm;
    }
    .signature-space {
      height: 11mm;
    }
    .acceptance {
      border-top: 1px solid #888;
      margin-top: auto;
      padding-top: 4mm;
      font-size: 9pt;
      line-height: 1.3;
    }
    .acceptance-title {
      text-align: center;
      font-size: 10pt;
      font-weight: bold;
      letter-spacing: 1px;
      margin-bottom: 3mm;
    }
    .acceptance > p {
      margin: 0 0 5mm;
    }
    .acceptance-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20mm;
    }
    .acceptance-signatures > div {
      display: flex;
      align-items: flex-end;
      gap: 5px;
    }
    .write-line {
      border-bottom: 1px solid #222;
      flex: 1;
      height: 8mm;
    }
    .letter-footer {
      border-top: 1px solid #172b4d;
      margin-top: 7mm;
      padding-top: 2mm;
      text-align: center;
      font-size: 7pt;
      letter-spacing: 1.5px;
      color: #555;
    }
    @media print {
      @page {
        size: A4 portrait;
        margin: 0;
      }
      html, body {
        width: 210mm !important;
        height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <header class="letterhead">
    <div class="brand">
      <img src="${window.location.origin}/Madihaa 2026 (1).png" alt="Madihaa Company Logo" class="company-logo" />
      <div>
        <h1>MADIHAA COMPANY</h1>
        <p>PRIVATE LIMITED</p>
      </div>
    </div>
    <div class="company-contact">
      <p>M. Madihaa, Lainoofaru Magu</p>
      <p>Malé, Republic of Maldives</p>
      <p>admin@madihaa.mv</p>
      <p>www.madihaa.mv</p>
    </div>
  </header>
  <div class="header-line" />
  <div class="letter-date">${formattedDate}</div>
  <div class="recipient">
    <strong>To:</strong>
    <p>${candidate.Name}</p>
    ${isMaldivian
      ? `<p>National ID: ${candidate.national_id || candidate['EMP ID']}</p>`
      : `<p>Passport No: ${candidate.passport_no || candidate['EMP ID']}</p>`
    }
  </div>
  <h3 class="subject">Subject: Offer of Employment</h3>
  <main class="letter-body">
    <p>Dear ${candidate.Name},</p>
    <p>We are pleased to offer you the position of <strong>${candidate.POSITION}</strong> at Madihaa Company Pvt Ltd.</p>
    <p>The terms and conditions of your employment are as follows:</p>
    <div class="employment-details">
      <p><strong>Position:</strong> ${candidate.POSITION}</p>
      <p><strong>Department:</strong> ${candidate.department || 'General'}</p>
      <p><strong>Employment Type:</strong> ${candidate.employment_type || 'Probation'}</p>
      <p><strong>Start Date:</strong> ${startDate}</p>
      <p><strong>Salary:</strong> ${salary}</p>
      <p><strong>Working Hours:</strong> ${candidate.working_hours || '9:00 to 17:30'}</p>
      <p><strong>Work Location:</strong> ${candidate.work_location || 'Head Office'}</p>
      <p><strong>Reporting To:</strong> ${candidate.reporting_to || 'Head of Accounts'}</p>
    </div>
    <p>Your employment will be subject to the company's policies, procedures, and applicable employment laws.</p>
    <p>Please confirm your acceptance of this offer by signing and returning a copy of this letter.</p>
    <p>We look forward to welcoming you to our team and wish you success in your new role.</p>
    <div class="signature">
      <p>Sincerely,</p>
      <div class="signature-space" />
      <strong>Moosa Ahmed</strong>
      <p>Chairman</p>
      <p>Madihaa Company Pvt Ltd</p>
    </div>
  </main>
  <section class="acceptance">
    <div class="acceptance-title">ACCEPTANCE OF OFFER</div>
    <p>I, <strong>${candidate.Name}</strong>, accept the employment offer and agree to the terms and conditions stated above.</p>
    <div class="acceptance-signatures">
      <div>
        <span>Signature:</span>
        <div class="write-line" />
      </div>
      <div>
        <span>Date:</span>
        <div class="write-line" />
      </div>
    </div>
  </section>
  <footer class="letter-footer">MADIHAA COMPANY PVT LTD</footer>
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

    // Filter out candidates who have been added to the employee directory
    if (candidate.directory_added) {
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
            const stageCandidates = selectedStage === 'all' ? filteredCandidates : filteredCandidates.filter(c => c.stage === selectedStage);

            if (!currentStage) return null;

            return (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">{currentStage.name}</h3>

                {stageCandidates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No candidates in this stage
                  </div>
                ) : selectedStage === 'all' ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LOA Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stageCandidates.map(candidate => (
                          <tr key={candidate.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{candidate.Name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{candidate['EMP ID']}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{candidate.POSITION}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              <select
                                value={candidate.stage}
                                onChange={(e) => handleQuickStageChange(candidate, e.target.value)}
                                className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              >
                                {STAGES.filter(s => s.key !== 'all').map(s => (
                                  <option key={s.key} value={s.key}>{s.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              <select
                                value={candidate.loa_status || ''}
                                onChange={(e) => handleLOAStatusChange(candidate, (e.target.value || null) as 'pending' | 'completed' | null)}
                                className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Not Started</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditCandidate(candidate)}
                                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCandidate(candidate.id)}
                                  className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                            {STAGES.filter(s => s.key !== 'all').map(s => (
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

                        {/* Flight Details Display for ticket_approved stage */}
                        {selectedStage === 'ticket_approved' && candidate.flight_number && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <div className="font-medium text-blue-800 mb-1">Flight Details</div>
                            <div className="text-blue-700">
                              <div>Flight: {candidate.flight_number}</div>
                              <div>Departure: {candidate.flight_date} at {candidate.flight_time}</div>
                              {candidate.arrival_date && candidate.arrival_time && (
                                <div>Arrival: {candidate.arrival_date} at {candidate.arrival_time} (Maldives)</div>
                              )}
                              {candidate.departure_airport && <div>From: {candidate.departure_airport}</div>}
                              {candidate.arrival_airport && <div>To: {candidate.arrival_airport}</div>}
                            </div>
                          </div>
                        )}

                        {/* Generate LOA Button */}
                        {['interview_completed', 'offer_sent', 'offer_signed', 'work_permit_applied', 'payment_pending', 'payment_completed', 'entry_pass_pending', 'entry_pass_received', 'ticket_purchased', 'ticket_approved', 'departed', 'van_arranged', 'airport_pickup', 'arrived'].includes(selectedStage) && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => navigate(`/letter-of-appointment?candidateId=${candidate.id}`)}
                              className="flex-1 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              Generate LOA
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
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                  <input
                    type="date"
                    value={formData.date_of_joining}
                    onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                  <input
                    type="text"
                    value={formData.passport_no}
                    onChange={(e) => setFormData({ ...formData, passport_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passport Issue Date</label>
                  <input
                    type="date"
                    value={formData.passport_issue_date}
                    onChange={(e) => setFormData({ ...formData, passport_issue_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passport Expiry Date</label>
                  <input
                    type="date"
                    value={formData.passport_expiry_date}
                    onChange={(e) => setFormData({ ...formData, passport_expiry_date: e.target.value })}
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
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
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

                {/* LOA Optional Fields */}
                <div className="col-span-2 mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">LOA Optional Fields</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                  <input
                    type="text"
                    value={formData.permanent_address}
                    onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                  <input
                    type="text"
                    value={formData.national_id}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Activity</label>
                  <input
                    type="text"
                    value={formData.business_activity}
                    onChange={(e) => setFormData({ ...formData, business_activity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Wholesale & Retail"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Currency</label>
                  <select
                    value={formData.salary_currency}
                    onChange={(e) => setFormData({ ...formData, salary_currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="USD">USD</option>
                    <option value="MVR">MVR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exchange Rate</label>
                  <input
                    type="text"
                    value={formData.exchange_rate}
                    onChange={(e) => setFormData({ ...formData, exchange_rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 15.42"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Food & Accommodation</label>
                  <input
                    type="text"
                    value={formData.food_accommodation}
                    onChange={(e) => setFormData({ ...formData, food_accommodation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Provided"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Payment Date</label>
                  <input
                    type="text"
                    value={formData.salary_payment}
                    onChange={(e) => setFormData({ ...formData, salary_payment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Before 15th of every month"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                  <textarea
                    value={formData.job_description}
                    onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                    placeholder="e.g., Carry out loading and unloading works"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Duration</label>
                  <input
                    type="text"
                    value={formData.contract_duration}
                    onChange={(e) => setFormData({ ...formData, contract_duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 2 years from date of joining"
                  />
                </div>
              </div>

              {/* Work Permit Applied Fields - Show when stage is work_permit_applied or later */}
              {editingCandidate && ['work_permit_applied', 'payment_pending', 'payment_completed', 'entry_pass_pending', 'entry_pass_received', 'ticket_purchased', 'ticket_approved', 'departed', 'van_arranged', 'airport_pickup', 'arrived', 'onboarded'].includes(editingCandidate.stage) && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-800 mb-4">Work Permit Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expat Reference Number *</label>
                      <input
                        type="text"
                        value={formData.expat_reference_number}
                        onChange={(e) => setFormData({ ...formData, expat_reference_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., WR1/2026/122334"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Work Permit</label>
                      <input
                        type="text"
                        value={formData.new_work_permit}
                        onChange={(e) => setFormData({ ...formData, new_work_permit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., New Work Permit"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Submitted Date *</label>
                      <input
                        type="date"
                        value={formData.submitted_date}
                        onChange={(e) => setFormData({ ...formData, submitted_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-Gov Link</label>
                      <input
                        type="url"
                        value={formData.egov_link}
                        onChange={(e) => setFormData({ ...formData, egov_link: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="https://xpat.egov.mv/EmploymentApproval/EmploymentApproval/ViewDetails?id=..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Slot Number *</label>
                      <input
                        type="text"
                        value={formData.slot_number}
                        onChange={(e) => setFormData({ ...formData, slot_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., QS00482680"
                      />
                    </div>
                  </div>
                </div>
              )}

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

      {/* Work Permit Details Modal */}
      {showWorkPermitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Work Permit Details</h2>
              <button onClick={() => { setShowWorkPermitModal(false); setPendingStageChange(null); }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleWorkPermitSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expat Reference Number *</label>
                  <input
                    type="text"
                    value={formData.expat_reference_number}
                    onChange={(e) => setFormData({ ...formData, expat_reference_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., WR1/2026/122334"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Work Permit</label>
                  <input
                    type="text"
                    value={formData.new_work_permit}
                    onChange={(e) => setFormData({ ...formData, new_work_permit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., New Work Permit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted Date *</label>
                  <input
                    type="date"
                    value={formData.submitted_date}
                    onChange={(e) => setFormData({ ...formData, submitted_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-Gov Link</label>
                  <input
                    type="url"
                    value={formData.egov_link}
                    onChange={(e) => setFormData({ ...formData, egov_link: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://xpat.egov.mv/EmploymentApproval/EmploymentApproval/ViewDetails?id=..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slot Number *</label>
                  <input
                    type="text"
                    value={formData.slot_number}
                    onChange={(e) => setFormData({ ...formData, slot_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., QS00482680"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => { setShowWorkPermitModal(false); setPendingStageChange(null); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save & Change Stage
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flight Details Modal */}
      {showFlightDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Flight Details</h2>
              <button onClick={() => { setShowFlightDetailsModal(false); setPendingStageChange(null); }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleFlightDetailsSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flight Number *</label>
                  <input
                    type="text"
                    value={formData.flight_number}
                    onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., FZ1234"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flight Date *</label>
                  <input
                    type="date"
                    value={formData.flight_date}
                    onChange={(e) => setFormData({ ...formData, flight_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flight Time *</label>
                  <input
                    type="time"
                    value={formData.flight_time}
                    onChange={(e) => setFormData({ ...formData, flight_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Date (Maldives) *</label>
                  <input
                    type="date"
                    value={formData.arrival_date}
                    onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time (Maldives) *</label>
                  <input
                    type="time"
                    value={formData.arrival_time}
                    onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Airport</label>
                  <input
                    type="text"
                    value={formData.departure_airport}
                    onChange={(e) => setFormData({ ...formData, departure_airport: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Dubai International (DXB)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Airport</label>
                  <input
                    type="text"
                    value={formData.arrival_airport}
                    onChange={(e) => setFormData({ ...formData, arrival_airport: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Velana International (MLE)"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => { setShowFlightDetailsModal(false); setPendingStageChange(null); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save & Change Stage
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
