// User & Authentication Types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  department?: string;
  employeeId?: string;
  photoURL?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export type UserRole = 'super_admin' | 'hr_manager' | 'department_manager' | 'supervisor' | 'employee';

export interface Permission {
  module: string;
  actions: string[];
}

// Employee Types
export interface Employee {
  id: string;
  employeeId: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  photo?: string;
  department: string;
  designation: string;
  status: EmployeeStatus;
  joinDate: Date;
  contractEndDate?: Date;
  emergencyContact: EmergencyContact;
  employmentHistory: EmploymentRecord[];
  education: Education[];
  medicalInfo: MedicalInfo;
  documents: EmployeeDocument[];
  assets: Asset[];
  contractDetails?: ContractDetails;
  probationDetails?: ProbationDetails;
  accommodation?: EmployeeAccommodation;
  salaryAllowances?: SalaryAllowances;
  staffEquipment?: StaffEquipment;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields from master_employees.json
  country?: string;
  dob?: Date;
  wpNo?: string;
  wpExpDate?: Date;
  wpFeePaidDate?: Date;
  ppIdNumber?: string;
  ppIdExpDate?: Date;
  medExpDate?: Date;
  medProvider?: string;
  medPolicyNo?: string;
  insuranceNumber?: string;
  insuranceExpDate?: Date;
  insuranceProvider?: string;
  workSite?: string;
  workLocation?: string;
  jobLevel?: string;
  salary?: string;
  slot?: string;
  qtaPaid?: string;
  sn?: string;
  visaExpiryDate?: Date;
  biometricFingerprintUpdated?: Date;
  bankAccountNumber?: string;
  sortOrder?: Record<string, number>; // For custom ordering within each filter group
  visaCancellation?: {
    submittedDate?: Date;
    requestNumber?: string;
    egovLink?: string;
    cancelledAt?: Date;
  };
}

export interface EmployeeAccommodation {
  accommodationId?: string;
  accommodationName?: string;
  floorId?: string;
  floorName?: string;
  roomId?: string;
  roomNumber?: string;
  bedId?: string;
  bedNumber?: string;
  bedPosition?: 'top' | 'bottom';
  assignedDate?: Date;
  // Accommodation items
  accommodationItems?: {
    bed?: { quantity?: string; lastIssuedDate?: Date };
    mattress?: { quantity?: string; lastIssuedDate?: Date };
    bedsheet?: { quantity?: string; lastIssuedDate?: Date };
    pillow?: { quantity?: string; lastIssuedDate?: Date };
    pillowCover?: { quantity?: string; lastIssuedDate?: Date };
  };
}

export interface SalaryAllowances {
  basicSalary?: string | number;
  otAllowances?: string | number;
  otAllowance?: string | number;
  otherAllowances?: string | number;
  attendanceAllowance?: string | number;
  livingAllowance?: string | number;
  foodAllowance?: string | number;
  fridayAllowance?: string | number;
}

export interface EquipmentItem {
  name: string;
  size?: string;
  quantity?: string;
  lastIssuedDate?: Date;
}

export interface StaffEquipment {
  uniform?: EquipmentItem;
  rainCoat?: EquipmentItem;
  keys?: EquipmentItem;
  mobile?: EquipmentItem;
  simCard?: EquipmentItem;
  otherItems?: EquipmentItem[];
}

export type EmployeeStatus = 'active' | 'resigned' | 'terminated' | 'on_leave';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface EmploymentRecord {
  id: string;
  type: 'promotion' | 'demotion' | 'salary_change' | 'contract_renewal';
  description: string;
  effectiveDate: Date;
  previousValue?: string;
  newValue?: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  field: string;
  startDate: Date;
  endDate: Date;
  certificateUrl?: string;
}

export interface MedicalInfo {
  bloodType?: string;
  allergies?: string;
  medicalConditions?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

export interface EmployeeDocument {
  id: string;
  type: DocumentType;
  name: string;
  url: string;
  uploadedAt: Date;
  expiryDate?: Date;
}

export type DocumentType = 'id_card' | 'passport' | 'certificate' | 'contract' | 'training_certificate' | 'other';

export interface Asset {
  id: string;
  name: string;
  type: string;
  serialNumber?: string;
  assignedDate: Date;
  returnDate?: Date;
  condition: string;
}

// Contract Types
export interface ContractDetails {
  id: string;
  employeeId: string;
  contractType: 'permanent' | 'fixed_term' | 'probation' | 'temporary' | 'consultant';
  contractStartDate: Date;
  contractEndDate?: Date;
  salaryAmount: number;
  currency: string;
  paymentFrequency: 'monthly' | 'biweekly' | 'weekly' | 'daily';
  jobDescription: string;
  reportingManager: string;
  signingDate: Date;
  signedBy: string;
  status: 'active' | 'expired' | 'pending' | 'terminated';
  renewalDate?: Date;
  notes?: string;
}

// Probation Types
export interface ProbationDetails {
  id: string;
  employeeId: string;
  probationStartDate: Date;
  probationEndDate: Date;
  probationPeriodMonths: number;
  probationManager: string;
  status: 'ongoing' | 'completed' | 'extended' | 'failed' | 'terminated';
  probationReview?: ProbationReview[];
  notes?: string;
}

export interface ProbationReview {
  id: string;
  reviewDate: Date;
  reviewedBy: string;
  status: 'pending' | 'satisfactory' | 'unsatisfactory' | 'extended';
  comments: string;
  recommendations: string;
}

// Attendance Types
export interface Attendance {
  id: string;
  employeeId: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  checkInMethod: 'biometric' | 'web' | 'mobile';
  checkOutMethod?: 'biometric' | 'web' | 'mobile';
  status: AttendanceStatus;
  shiftId?: string;
  lateArrival?: boolean;
  earlyDeparture?: boolean;
  notes?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave';

export interface AttendanceAdjustmentRequest {
  id: string;
  employeeId: string;
  date: Date;
  requestedCheckIn?: Date;
  requestedCheckOut?: Date;
  reason: string;
  status: AttendanceAdjustmentStatus;
  requestedDate: Date;
  approverComments?: string;
  approverId?: string;
  approverName?: string;
}

export type AttendanceAdjustmentStatus = 'pending' | 'approved' | 'rejected';

export interface Shift {
  id: string;
  name: string;
  department?: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  daysOfWeek: number[];
}

// Leave Types
export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: LeaveStatus;
  attachments?: string[];
  approvals: LeaveApproval[];
  appliedDate: Date;
  amendedBy?: string;
  amendedDate?: Date;
  balanceAdjusted?: boolean;
  ticketRequired?: boolean;
  ticketUrl?: string;
}

export type LeaveType = 'annual' | 'medical' | 'emergency' | 'duty' | 'unpaid' | 'maternity' | 'paternity' | 'compassionate' | 'off_day';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveApproval {
  level: number;
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionDate?: Date;
}

export interface LeaveBalance {
  employeeId: string;
  annual: number;
  medical: number;
  emergency: number;
  duty: number;
  carryForward: number;
  year: number;
}

// Ticket Types
export type TicketStatus =
  | 'price_requested'
  | 'price_received'
  | 'approval_submitted'
  | 'approved'
  | 'waiting_payment'
  | 'payment_done'
  | 'ticket_received'
  | 'settlement_created'
  | 'settlement_submitted'
  | 'settlement_handed_over'
  | 'vehicle_arranged'
  | 'passport_collected'
  | 'passport_handed_over'
  | 'vehicle_left'
  | 'departed'
  | 'cancelled';

export interface TicketRequest {
  id: string;
  employeeId: string;
  leaveId: string;
  departureCity: string;
  destinationCity: string;
  departureDate: Date;
  returnDate: Date;
  departureTime?: string;
  arrivalTime?: string;
  flightNumber?: string;
  ticketType: 'one_way' | 'round_trip';
  passengers: number;
  specialRequests?: string;
  status: TicketStatus;
  bookedDate: Date;
  updatedAt?: Date;
  ticketPrice?: number;
  vanArrangedTime?: Date;
  arrangedBy?: string;
  arrangedByName?: string;
  settlementAmount?: number;
  settlementDate?: Date;
  settlementHandedTo?: string;
  passportCollectedBy?: string;
  passportCollectedDate?: Date;
  passportHandedTo?: string;
  passportHandedDate?: Date;
  vehicleDriver?: string;
  vehicleNumber?: string;
  isLeaveExtended?: boolean;
  originalReturnDate?: Date;
  isTicketChanged?: boolean;
  changeReason?: string;
  returnFlightReminderSent?: boolean;
  staffPickedUp?: boolean;
  staffPickupTime?: Date;
  ticketPdfUrl?: string;
}

export const TICKET_WORKFLOW_STEPS: TicketStatus[] = [
  'price_requested',
  'price_received',
  'approval_submitted',
  'approved',
  'waiting_payment',
  'payment_done',
  'ticket_received',
  'settlement_created',
  'settlement_submitted',
  'settlement_handed_over',
  'vehicle_arranged',
  'passport_collected',
  'passport_handed_over',
  'vehicle_left',
  'departed'
];

export const TICKET_WORKFLOW_LABELS: Record<TicketStatus, string> = {
  price_requested: 'Price Requested',
  price_received: 'Price Received',
  approval_submitted: 'Approval Submitted',
  approved: 'Approved',
  waiting_payment: 'Waiting Payment',
  payment_done: 'Payment Done',
  ticket_received: 'Ticket Received',
  settlement_created: 'Settlement Created',
  settlement_submitted: 'Settlement Submitted',
  settlement_handed_over: 'Settlement Handed Over',
  vehicle_arranged: 'Vehicle Arranged',
  passport_collected: 'Passport Collected',
  passport_handed_over: 'Passport Handed Over',
  vehicle_left: 'Vehicle Left',
  departed: 'Departed',
  cancelled: 'Cancelled'
};

// Payroll Types
export interface Payroll {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: Allowance[];
  deductions: Deduction[];
  bonuses: Bonus[];
  loans: Loan[];
  grossSalary: number;
  netSalary: number;
  status: PayrollStatus;
  processedDate?: Date;
  approvedBy?: string;
  // Attendance-related fields
  daysWorked?: number;
  absentDays?: number;
  fridays?: number;
  halfDays?: number;
  leaveDays?: number;
}

export type PayrollStatus = 'draft' | 'processed' | 'approved' | 'paid' | 'locked';

export interface PayrollCycle {
  id: string;
  name: string;
  cycleStartDay: number;
  cycleEndDay: number;
  cutOffDate: number;
}

export interface ProratedSalaryDetail {
  periodDays: number;
  workedDays: number;
  proratedSalary: number;
}

export interface Allowance {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
}

export interface Deduction {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'percentage';
}

export interface Bonus {
  id: string;
  name: string;
  amount: number;
  reason: string;
}

export interface Loan {
  id: string;
  name: string;
  totalAmount: number;
  installmentAmount: number;
  remainingAmount: number;
  paidAmount: number;
  status?: 'active' | 'closed' | 'recalled';
  startDate?: Date;
  endDate?: Date;
  amortizationSchedule?: LoanAmortizationEntry[];
}

export interface LoanAmortizationEntry {
  month: string;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  balanceRemaining: number;
}

export interface PayrollSummary {
  totalEmployees: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalBonuses: number;
  status: {
    draft: number;
    processed: number;
    approved: number;
    paid: number;
  };
}

// Overtime Types
export interface OvertimeRequest {
  id: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  requestType: 'planned' | 'emergency' | 'public_holiday';
  status: OvertimeStatus;
  preApproved?: boolean;
  requiresDivisionHeadApproval?: boolean;
  biometricVarianceMinutes?: number;
  approvals: OvertimeApproval[];
  requestedDate: Date;
}

export interface OvertimeSummary {
  totalRequests: number;
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  rejectedHours: number;
  completedHours: number;
  publicHolidayHours: number;
}

export type OvertimeStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface OvertimeApproval {
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionDate?: Date;
}

// Performance Types
export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  period: string;
  kpis: KPI[];
  overallRating: number;
  comments: string;
  status: 'draft' | 'submitted' | 'reviewed';
  createdAt: Date;
  reviewedAt?: Date;
}

export interface KPI {
  id: string;
  name: string;
  description: string;
  weight: number;
  target: number;
  actual: number;
  rating: number;
}

export interface PerformanceCycle {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'open' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface AppraisalTemplate {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  sections?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AppraisalAssignment {
  id: string;
  employeeId: string;
  reviewerId: string;
  cycleId: string;
  templateId: string;
  assignedAt: Date;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ReviewWorkflow {
  id: string;
  name: string;
  description: string;
  stages: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewRating {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceReportSummary {
  cycleCount: number;
  templateCount: number;
  reviewCount: number;
  assignmentCount: number;
  workflowCount: number;
  ratingCount: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export type NotificationType = 'leave_request' | 'overtime_request' | 'payroll' | 'attendance' | 'general';

// Report Types
export interface Report {
  id: string;
  name: string;
  type: ReportType;
  filters: ReportFilter[];
  generatedBy: string;
  generatedAt: Date;
  data: any;
}

export type ReportType = 'employee' | 'attendance' | 'payroll' | 'leave' | 'overtime' | 'performance' | 'recruitment' | 'training';

export interface JobRequisition {
  id: string;
  requisitionNumber?: string;
  title: string;
  department: string;
  grade?: string;
  positionType: 'replacement' | 'new_position' | 'temporary' | 'contract' | 'internship' | 'project';
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'on_hold' | 'closed';
  requestedBy?: string;
  requiredApprovals: string[];
  vacancyCount?: number;
  budgetCostCenter?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vacancy {
  id: string;
  requisitionId: string;
  title: string;
  location: string;
  status: 'draft' | 'published' | 'closed' | 'filled';
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary';
  owner?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CandidateApplication {
  id: string;
  candidateName: string;
  email: string;
  phone?: string;
  vacancyId: string;
  status: 'submitted' | 'reviewed' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected';
  submittedAt: Date;
  source?: string;
  applicationNumber?: string;
  resumeUrl?: string;
  documents?: string[];
}

export interface InterviewSchedule {
  id: string;
  applicationId: string;
  panel: string[];
  scheduledAt: Date;
  location?: string;
  mode: 'in_person' | 'video' | 'phone';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
}

export interface Offer {
  id: string;
  applicationId: string;
  vacancyId: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  offerDate: Date;
  expiryDate: Date;
  salary: number;
  currency: string;
  terms: string;
  approvalTrail?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingTask {
  id: string;
  candidateId: string;
  task: string;
  assignedTo: string;
  dueDate: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecruitmentAuditLog {
  id?: string;
  entityId: string;
  entityType: 'requisition' | 'vacancy' | 'application' | 'interview' | 'offer' | 'onboarding';
  action: string;
  details?: string;
  performedBy?: string;
  performedAt: Date;
}

export interface RecruitmentReportSummary {
  requisitions: number;
  vacancies: number;
  applications: number;
  interviews: number;
  offers: number;
  onboardingTasks: number;
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: any;
}

export interface TrainingNeedsAnalysis {
  id: string;
  title: string;
  department: string;
  impactArea: 'competency_gap' | 'performance_gap' | 'succession_planning' | 'regulatory_requirement';
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingCourse {
  id: string;
  title: string;
  category: string;
  deliveryMethod: 'classroom' | 'online' | 'blended' | 'webinar' | 'on_the_job';
  durationHours: number;
  status: 'draft' | 'published' | 'retired';
  mandatory: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingSession {
  id: string;
  courseTitle: string;
  sessionDate: Date;
  location: string;
  capacity: number;
  status: 'planned' | 'published' | 'completed' | 'cancelled';
  trainer?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingNomination {
  id: string;
  employeeId: string;
  employeeName: string;
  courseTitle: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingAttendance {
  id: string;
  sessionId: string;
  employeeId: string;
  status: 'attended' | 'absent' | 'cancelled' | 'rescheduled';
  sessionDate: Date;
  markedAt: Date;
}

export interface TrainingAssessment {
  id: string;
  sessionId: string;
  employeeId: string;
  score: number;
  maxScore: number;
  status: 'pending' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingEvaluation {
  id: string;
  sessionId: string;
  employeeId: string;
  overallRating: number;
  comments?: string;
  submittedAt: Date;
}

export interface TrainingCertificate {
  id: string;
  certificateNumber: string;
  employeeId: string;
  courseTitle: string;
  issuedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingBudgetEntry {
  id: string;
  department: string;
  year: number;
  budgetAmount: number;
  actualSpend?: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingVendor {
  id: string;
  name: string;
  vendorType: 'internal' | 'external';
  contactInfo?: string;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingNotification {
  id: string;
  title: string;
  message: string;
  type: 'approval' | 'reminder' | 'announcement' | 'evaluation';
  createdAt: Date;
  read: boolean;
}

export interface TrainingReportSummary {
  needsAnalysisCount: number;
  coursesCount: number;
  sessionsCount: number;
  nominationsCount: number;
  attendanceRecordsCount: number;
  assessmentsCount: number;
  evaluationsCount: number;
  certificatesCount: number;
  budgetEntriesCount: number;
  vendorsCount: number;
  notificationsCount: number;
}

export interface ExitInterview {
  id: string;
  employeeId: string;
  employeeName: string;
  interviewDate: Date;
  interviewer: string;
  reason: string;
  feedback: string;
  status: 'pending' | 'completed';
  createdAt: Date;
  updatedAt?: Date;
}

export interface OffboardingTask {
  id: string;
  employeeId: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

export interface LifecycleEvent {
  id: string;
  employeeId: string;
  eventType: 'promotion' | 'transfer' | 'termination' | 'onboarding' | 'probation_end';
  date: Date;
  notes?: string;
  createdAt: Date;
}

export interface LifecycleReportSummary {
  exitInterviewCount: number;
  offboardingTaskCount: number;
  completedTaskCount: number;
  lifecycleEventCount: number;
}

// Accommodation Types
export interface Accommodation {
  id: string;
  name: string;
  location: string;
  description?: string;
  status: 'active' | 'inactive' | 'maintenance';
  floors: Floor[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Floor {
  id: string;
  accommodationId: string;
  floorNumber: number;
  name: string;
  rooms: Room[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: string;
  floorId: string;
  roomNumber: string;
  roomType: 'single' | 'double' | 'dormitory' | 'suite';
  capacity: number;
  beds: Bed[];
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  createdAt: Date;
  updatedAt: Date;
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  position: 'top' | 'bottom';
  status: 'available' | 'occupied' | 'maintenance';
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  assignedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccommodationAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  bedId: string;
  roomId: string;
  floorId: string;
  accommodationId: string;
  assignedDate: Date;
  status: 'active' | 'inactive' | 'moved';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Work Location Types
export interface WorkLocation {
  id?: string;
  name: string;
  description?: string;
  address?: string;
  assignedStaff: string[];
  lateThresholdSundayToThursday?: string; // Format: "HH:mm" e.g., "09:00"
  lateThresholdFriday?: string; // Format: "HH:mm" e.g., "10:00"
  lateThresholdSaturday?: string; // Format: "HH:mm" e.g., "10:00"
  createdAt?: Date;
  updatedAt?: Date;
}

// Disciplinary Action Types
export interface DisciplinaryAction {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  employeeDesignation: string;
  type: DisciplinaryType;
  severity: DisciplinarySeverity;
  incidentDate: Date;
  reportedDate: Date;
  description: string;
  actionTaken: string;
  reportedBy: string;
  approvedBy?: string;
  preparedBy?: string;
  employeeSignature?: string;
  signatureDate?: Date;
  status: DisciplinaryStatus;
  warningLetterIssued: boolean;
  suspensionDays?: number;
  fineAmount?: number;
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type DisciplinaryType = 'verbal_warning' | 'written_warning_1' | 'written_warning_2' | 'written_warning_3' | 'final_warning' | 'termination';
export type DisciplinarySeverity = 'minor' | 'moderate' | 'serious' | 'severe';
export type DisciplinaryStatus = 'pending' | 'investigation' | 'confirmed' | 'appealed' | 'resolved';

// Petrol Request Types
export interface PetrolRequest {
  id: string;
  requestDate: Date;
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  driverEmployeeId?: string;
  kmStart: number;
  kmEnd: number;
  drivenKm: number;
  petrolAmount: number;
  receiptNumber?: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: Date;
  updatedAt?: Date;
}

export interface Vehicle {
  regNo: string;
  type: string;
  make?: string;
  model?: string;
  year?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  otAllowances: number;
  otherAllowances: number;
  attendanceAllowance: number;
  livingAllowance: number;
  foodAllowance: number;
  fridayAllowance: number;
  currency: string;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SalaryIncrement {
  id: string;
  employeeId: string;
  employeeName: string;
  previousSalary: number;
  newSalary: number;
  incrementAmount: number;
  incrementPercentage: number;
  reason: string;
  effectiveDate: Date;
  approvedBy?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: Date;
  updatedAt?: Date;
}

// Expat Staff Types
export type ExpatCompany = 'Madihaa' | 'Batuta' | 'Madigrand';
export type ExpatEmploymentStatus = 'active' | 'departed' | 'on_leave' | 'suspended';
export type ExpatDocumentStatus = 'valid' | 'expiring_soon' | 'expired' | 'missing';
export type ExpatRefundStatus = 'pending' | 'applied_for_refund' | 'refund_received' | 'refund_received_to_wallet' | 'reported_missing' | 'cancelled' | 'not_available';
export type MedicalStatus = 'scheduled' | 'pending' | 'completed' | 'failed' | 'rescheduled' | 'overdue';
export type MedicalApplicationStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';

export interface MedicalApplication {
  id: string;
  staffId: string;
  staffName: string;
  refNumber: string;
  createdDate: Date;
  lastSubmittedDate?: Date;
  stateChangeRemarks?: string;
  status: MedicalApplicationStatus;
  egovLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpatStaff {
  id: string;
  employeeId: string;
  internalId?: string;
  fullName: string;
  company: ExpatCompany;
  nationality: string;
  dateOfBirth?: Date;
  mobileNumber: string;
  occupation: string;
  workSite: string;
  employmentStatus: ExpatEmploymentStatus;
  joiningDate: Date;
  departureDate?: Date;
  departureReason?: string;
  personalDetails: ExpatPersonalDetails;
  passport: ExpatPassport;
  visa: ExpatVisa;
  workPermit: ExpatWorkPermit;
  medical: ExpatMedical;
  insurance: ExpatInsurance;
  quota: ExpatQuota;
  deposit: ExpatDeposit;
  documents: ExpatDocument[];
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface ExpatPersonalDetails {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  nationality: string;
  mobileNumber: string;
  email?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface ExpatPassport {
  passportNumber: string;
  issueDate?: Date;
  expiryDate: Date;
  remarks?: string;
  documentUrl?: string;
  status: ExpatDocumentStatus;
  daysRemaining?: number;
}

export interface ExpatVisa {
  visaNumber?: string;
  referenceNumber?: string;
  issueDate?: Date;
  expiryDate: Date;
  status: string;
  remarks?: string;
  documentUrl?: string;
  daysRemaining?: number;
  cancellation?: {
    submittedDate?: Date;
    requestNumber?: string;
    egovLink?: string;
    cancelledAt?: Date;
  };
}

export interface ExpatWorkPermit {
  workPermitNumber: string;
  issueDate?: Date;
  expiryDate: Date;
  fee?: number;
  status: string;
  receiptNumber?: string;
  remarks?: string;
  documentUrl?: string;
  daysRemaining?: number;
}

export interface ExpatMedical {
  medicalDate?: Date;
  nextDueDate: Date;
  status: MedicalStatus;
  remarks?: string;
  documentUrl?: string;
  daysRemaining?: number;
}

export interface ExpatInsurance {
  provider: string;
  policyNumber?: string;
  startDate?: Date;
  expiryDate: Date;
  amount?: number;
  status: string;
  remarks?: string;
  documentUrl?: string;
  daysRemaining?: number;
}

export interface ExpatQuota {
  quotaNumber?: string;
  slotFee?: number;
  paymentDate?: Date;
  receiptNumber?: string;
  status?: string;
  remarks?: string;
}

export interface ExpatDeposit {
  depositAmount: number;
  depositPaid: number;
  paymentDate?: Date;
  receipt?: string;
  depositStatus: string;
  refundAmount?: number;
  refundStatus: ExpatRefundStatus;
  refundDate?: Date;
  refundReference?: string;
  remarks?: string;
}

export interface ExpatDocument {
  id: string;
  type: 'passport' | 'visa' | 'work_permit' | 'medical' | 'insurance' | 'receipt' | 'other';
  name: string;
  url: string;
  uploadedAt: Date;
  expiryDate?: Date;
}

export interface ExpatMedicalAppointment {
  id: string;
  employeeId: string;
  employeeName: string;
  company: ExpatCompany;
  scheduledDate: Date;
  status: MedicalStatus;
  remarks?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ExpatActivityLog {
  id: string;
  employeeId: string;
  employeeName: string;
  eventType: 'record_created' | 'passport_updated' | 'visa_renewed' | 'work_permit_renewed' | 'medical_completed' | 'insurance_renewed' | 'deposit_paid' | 'refund_received' | 'employment_ended' | 'other';
  description: string;
  performedBy: string;
  performedAt: Date;
}

export interface ExpatDepositTransaction {
  id: string;
  employeeId: string;
  employeeName: string;
  company: ExpatCompany;
  transactionType: 'deposit' | 'refund';
  amount: number;
  paymentDate: Date;
  receipt?: string;
  reference?: string;
  status: string;
  remarks?: string;
  createdAt: Date;
}

export interface ExpatDashboardStats {
  totalExpatStaff: number;
  madihaaStaff: number;
  batutaStaff: number;
  madigrandStaff: number;
  activeStaff: number;
  departedStaff: number;
  workPermitsExpiring: number;
  passportsExpiring: number;
  visasExpiring: number;
  medicalExpiring: number;
  insuranceExpiring: number;
  pendingDeposits: number;
}

// Task Management Types
export type TaskType = 'medical' | 'document' | 'training' | 'meeting' | 'report' | 'other';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string; // Employee ID
  assignedToName: string;
  assignedToEmail: string;
  assignedBy: string; // Employee ID of assigner
  assignedByName: string;
  assignedByEmail: string;
  dueDate?: Date;
  completedAt?: Date;
  attachments?: TaskAttachment[];
  links?: TaskLink[];
  comments?: TaskComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface TaskLink {
  id: string;
  title: string;
  url: string;
  addedAt: Date;
  addedBy: string;
}

export interface TaskComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

export interface TaskNotification {
  id: string;
  userId: string; // Employee ID
  taskId: string;
  taskTitle: string;
  type: 'task_assigned' | 'task_updated' | 'task_completed' | 'task_cancelled';
  message: string;
  read: boolean;
  dismissed: boolean;
  createdAt: Date;
}
