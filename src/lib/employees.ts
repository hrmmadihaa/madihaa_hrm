import type { Employee } from '../types';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

// Utility function to parse various date formats
export const parseDate = (dateStr: string | undefined): Date | undefined => {
  if (!dateStr) return undefined;
  
  // Try DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
      const year = parseInt(parts[2], 10);
      
      // Handle 2-digit years
      const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
      
      const date = new Date(fullYear, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  // Try DD-MMM-YYYY format
  const months: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  const dateMatch = dateStr.match(/(\d{2})-(\w{3})-(\d{4})/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = months[dateMatch[2]];
    const year = parseInt(dateMatch[3], 10);
    
    if (month !== undefined) {
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  // Try standard date parsing
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;
  
  return undefined;
};

// Utility function to calculate duration from join date to current date
export const calculateDuration = (joinDate: Date | undefined): string => {
  if (!joinDate) return '';
  
  const now = new Date();
  const diff = now.getTime() - joinDate.getTime();
  
  if (diff < 0) return '';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  const months = Math.floor(remainingDays / 30);
  const finalDays = remainingDays % 30;
  
  const parts: string[] = [];
  if (years > 0) parts.push(`${years}Years`);
  if (months > 0) parts.push(`${months}Months`);
  if (finalDays > 0 || parts.length === 0) parts.push(`${finalDays}Days`);
  
  return parts.join('');
};

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: any): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp._seconds) {
    return new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  }
  // Try parsing as ISO string
  const parsed = new Date(timestamp);
  if (!isNaN(parsed.getTime())) return parsed;
  return undefined;
};

// Convert Employee to Firestore format
const employeeToFirestore = (employee: Partial<Employee>) => {
  const data: any = { ...employee };
  // Remove undefined values
  Object.keys(data).forEach(key => {
    if (data[key] === undefined) {
      delete data[key];
    }
  });
  return data;
};

// Convert Firestore document to Employee
const firestoreToEmployee = (doc: any): Employee => {
  const data = doc.data();
  return {
    id: doc.id,
    employeeId: data.employeeId || '',
    registrationNumber: data.registrationNumber || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    fullName: data.fullName || '',
    email: data.email || '',
    phone: data.phone || '',
    photo: data.photo || '',
    department: data.department || '',
    designation: data.designation || '',
    status: data.status || 'active',
    joinDate: timestampToDate(data.joinDate) || new Date(),
    contractEndDate: timestampToDate(data.contractEndDate),
    emergencyContact: data.emergencyContact || { name: '', relationship: '', phone: '' },
    employmentHistory: data.employmentHistory || [],
    education: data.education || [],
    medicalInfo: data.medicalInfo || {},
    documents: data.documents || [],
    assets: data.assets || [],
    contractDetails: data.contractDetails,
    probationDetails: data.probationDetails,
    accommodation: data.accommodation,
    salaryAllowances: data.salaryAllowances,
    staffEquipment: data.staffEquipment,
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
    // Additional fields
    country: data.country,
    dob: timestampToDate(data.dob),
    wpNo: data.wpNo,
    wpExpDate: timestampToDate(data.wpExpDate),
    ppIdNumber: data.ppIdNumber,
    ppIdExpDate: timestampToDate(data.ppIdExpDate),
    visaExpiryDate: timestampToDate(data.visaExpiryDate),
    medExpDate: timestampToDate(data.medExpDate),
    insuranceNumber: data.insuranceNumber,
    insuranceExpDate: timestampToDate(data.insuranceExpDate),
    workSite: data.workSite,
    workLocation: data.workLocation,
    jobLevel: data.jobLevel,
    salary: data.salary,
    slot: data.slot,
    qtaPaid: data.qtaPaid,
    sn: data.sn,
    biometricFingerprintUpdated: timestampToDate(data.biometricFingerprintUpdated),
  };
};

// Get all employees with optional limit
export const getEmployees = async (limitCount?: number) => {
  try {
    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    let employees = querySnapshot.docs.map(firestoreToEmployee);
    
    if (limitCount) {
      employees = employees.slice(0, limitCount);
    }
    
    return employees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

// Get employee by ID
export const getEmployeeById = async (id: string) => {
  try {
    const docRef = doc(db, 'employees', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return firestoreToEmployee(docSnap);
    }
    return null;
  } catch (error) {
    console.error('Error fetching employee:', error);
    return null;
  }
};

// Get employee by name (slugified)
export const getEmployeeByName = async (name: string) => {
  try {
    const employees = await getEmployees();
    const employee = employees.find(emp => 
      emp.fullName.toLowerCase().replace(/\s+/g, '-') === name.toLowerCase()
    );
    return employee || null;
  } catch (error) {
    console.error('Error fetching employee by name:', error);
    return null;
  }
};

// Create employee
export const createEmployee = async (employee: Partial<Employee>) => {
  try {
    const data = employeeToFirestore({
      ...employee,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const docRef = await addDoc(collection(db, 'employees'), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

// Update employee
export const updateEmployee = async (id: string, data: Partial<Employee>) => {
  try {
    const docRef = doc(db, 'employees', id);
    const updateData = employeeToFirestore({
      ...data,
      updatedAt: new Date()
    });
    
    await updateDoc(docRef, updateData);
    
    // If status changed to resigned or terminated, remove from all work locations
    if (data.status === 'resigned' || data.status === 'terminated') {
      const { getAllWorkLocations, assignStaffToWorkLocation } = await import('./workLocation');
      const workLocations = await getAllWorkLocations();

      for (const location of workLocations) {
        if (location.assignedStaff?.includes(id)) {
          const updatedStaff = location.assignedStaff.filter((staffId: string) => staffId !== id);
          if (location.id) {
            await assignStaffToWorkLocation(location.id, updatedStaff);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

// Delete employee
export const deleteEmployee = async (id: string) => {
  try {
    const docRef = doc(db, 'employees', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

// Search employees
export const searchEmployees = async (searchTerm: string) => {
  try {
    const employees = await getEmployees();
    const term = searchTerm.toLowerCase();
    
    return employees.filter(employee =>
      employee.fullName.toLowerCase().includes(term) ||
      employee.employeeId.toLowerCase().includes(term) ||
      employee.email.toLowerCase().includes(term) ||
      employee.department.toLowerCase().includes(term) ||
      employee.designation.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Error searching employees:', error);
    throw error;
  }
};

// Get employees by department
export const getEmployeesByDepartment = async (department: string) => {
  try {
    const q = query(collection(db, 'employees'), where('department', '==', department));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToEmployee);
  } catch (error) {
    console.error('Error fetching employees by department:', error);
    return [];
  }
};

// Get employees by status
export const getEmployeesByStatus = async (status: string) => {
  try {
    const q = query(collection(db, 'employees'), where('status', '==', status));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(firestoreToEmployee);
  } catch (error) {
    console.error('Error fetching employees by status:', error);
    return [];
  }
};
