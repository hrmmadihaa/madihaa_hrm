import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import type { Payroll } from '../types';

const PAYROLL_COLLECTION = 'payroll';

// Payroll functions
export const getPayroll = async (month?: number, year?: number, employeeId?: string) => {
  try {
    let q = query(collection(db, PAYROLL_COLLECTION), orderBy('year', 'desc'), orderBy('month', 'desc'));
    
    if (month !== undefined && year !== undefined) {
      q = query(q, where('month', '==', month), where('year', '==', year));
    }
    
    if (employeeId) {
      q = query(q, where('employeeId', '==', employeeId));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      processedDate: doc.data().processedDate?.toDate(),
    })) as Payroll[];
  } catch (error) {
    console.error('Error fetching payroll:', error);
    throw error;
  }
};

export const getPayrollById = async (id: string) => {
  try {
    const docRef = doc(db, PAYROLL_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        processedDate: data.processedDate?.toDate(),
      } as Payroll;
    }
    return null;
  } catch (error) {
    console.error('Error fetching payroll:', error);
    throw error;
  }
};

export const createPayroll = async (payroll: Partial<Payroll>) => {
  try {
    const newPayroll = {
      ...payroll,
      status: 'draft',
      createdAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, PAYROLL_COLLECTION), newPayroll);
    return docRef.id;
  } catch (error) {
    console.error('Error creating payroll:', error);
    throw error;
  }
};

export const updatePayroll = async (id: string, data: Partial<Payroll>) => {
  try {
    const updateData: any = { ...data };
    
    if (updateData.processedDate && updateData.processedDate instanceof Date) {
      updateData.processedDate = Timestamp.fromDate(updateData.processedDate);
    }
    
    await updateDoc(doc(db, PAYROLL_COLLECTION, id), updateData);
  } catch (error) {
    console.error('Error updating payroll:', error);
    throw error;
  }
};

export const processPayroll = async (id: string, approvedBy: string) => {
  try {
    await updatePayroll(id, {
      status: 'processed',
      processedDate: new Date(),
      approvedBy,
    });
  } catch (error) {
    console.error('Error processing payroll:', error);
    throw error;
  }
};

export const approvePayroll = async (id: string, approvedBy: string) => {
  try {
    await updatePayroll(id, {
      status: 'approved',
      approvedBy,
    });
  } catch (error) {
    console.error('Error approving payroll:', error);
    throw error;
  }
};

export const markPayrollAsPaid = async (id: string) => {
  try {
    await updatePayroll(id, { status: 'paid' });
  } catch (error) {
    console.error('Error marking payroll as paid:', error);
    throw error;
  }
};

// Get payroll summary for a month
export const getPayrollSummary = async (month: number, year: number) => {
  try {
    const payrollData = await getPayroll(month, year);
    
    const summary = {
      totalEmployees: payrollData.length,
      totalGrossSalary: payrollData.reduce((sum, p) => sum + p.grossSalary, 0),
      totalNetSalary: payrollData.reduce((sum, p) => sum + p.netSalary, 0),
      totalAllowances: payrollData.reduce((sum, p) => 
        sum + p.allowances.reduce((aSum, a) => aSum + a.amount, 0), 0),
      totalDeductions: payrollData.reduce((sum, p) => 
        sum + p.deductions.reduce((dSum, d) => dSum + d.amount, 0), 0),
      totalBonuses: payrollData.reduce((sum, p) => 
        sum + p.bonuses.reduce((bSum, b) => bSum + b.amount, 0), 0),
      status: {
        draft: payrollData.filter(p => p.status === 'draft').length,
        processed: payrollData.filter(p => p.status === 'processed').length,
        approved: payrollData.filter(p => p.status === 'approved').length,
        paid: payrollData.filter(p => p.status === 'paid').length,
      },
    };
    
    return summary;
  } catch (error) {
    console.error('Error fetching payroll summary:', error);
    throw error;
  }
};

export const getPayrollPeriod = (referenceDate: Date = new Date()) => {
  const cycleStartDay = 15;
  const cycleEndDay = 14;
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  let startDate: Date;
  let endDate: Date;

  if (referenceDate.getDate() >= cycleStartDay) {
    startDate = new Date(year, month, cycleStartDay);
    endDate = new Date(year, month + 1, cycleEndDay);
  } else {
    startDate = new Date(year, month - 1, cycleStartDay);
    endDate = new Date(year, month, cycleEndDay);
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

export const calculateProratedSalary = (
  monthlySalary: number,
  periodStart: Date,
  periodEnd: Date,
  workedStart: Date,
  workedEnd: Date
) => {
  const periodDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const workedDays = Math.ceil((workedEnd.getTime() - workedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const dailyRate = monthlySalary / periodDays;
  return Number((dailyRate * workedDays).toFixed(2));
};

export const calculateProratedSalaryForMidPeriod = (
  monthlySalary: number,
  employmentStart: Date,
  employmentEnd: Date | null,
  cycleStart: Date,
  cycleEnd: Date
) => {
  const start = employmentStart > cycleStart ? employmentStart : cycleStart;
  const end = employmentEnd && employmentEnd < cycleEnd ? employmentEnd : cycleEnd;
  if (end < start) return 0;
  return calculateProratedSalary(monthlySalary, cycleStart, cycleEnd, start, end);
};

export const calculateLoanEligibility = (
  basicSalary: number,
  incrementAllowance: number,
  months = 48
) => {
  return 0.4 * (basicSalary + incrementAllowance) * months;
};

export const calculateLoanServiceCharge = (loanAmount: number) => {
  return Number((loanAmount * 0.05).toFixed(2));
};

export const generateLoanAmortizationSchedule = (
  principal: number,
  months = 48,
  annualInterestRate = 0.05
) => {
  const monthlyInterestRate = annualInterestRate / 12;
  const payment = principal * (monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -months)));
  let balance = principal;
  const schedule: any[] = [];

  for (let monthIndex = 1; monthIndex <= months; monthIndex += 1) {
    const interest = Number((balance * monthlyInterestRate).toFixed(2));
    const principalPaid = Number((payment - interest).toFixed(2));
    balance = Number((balance - principalPaid).toFixed(2));
    schedule.push({
      month: `Month ${monthIndex}`,
      paymentAmount: Number(payment.toFixed(2)),
      principalAmount: principalPaid,
      interestAmount: interest,
      balanceRemaining: balance > 0 ? balance : 0,
    });
  }

  return schedule;
};

export const calculateMonthlyLoanInstallment = (
  principal: number,
  months = 48,
  annualServiceChargeRate = 0.05
) => {
  const serviceCharge = principal * annualServiceChargeRate;
  const totalPayable = principal + serviceCharge;
  return Number((totalPayable / months).toFixed(2));
};

export const deductLoanInstallmentFromPayroll = (netSalary: number, installment: number) => {
  return Math.max(0, Number((netSalary - installment).toFixed(2)));
};

export const triggerLoanRecall = async (loanId: string, userId: string) => {
  try {
    await updateDoc(doc(db, 'loans', loanId), { status: 'recalled', recalledAt: Timestamp.now(), recalledBy: userId });
  } catch (error) {
    console.error('Error recalling loan:', error);
    throw error;
  }
};

export const triggerLoanBalanceSettlement = async (loanId: string, userId: string) => {
  try {
    const loanRef = doc(db, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);
    if (!loanSnap.exists()) throw new Error('Loan not found');
    const loanData: any = loanSnap.data();
    await updateDoc(loanRef, {
      remainingAmount: 0,
      paidAmount: loanData.totalAmount,
      status: 'closed',
      settledAt: Timestamp.now(),
      settlementProcessedBy: userId,
    });
  } catch (error) {
    console.error('Error settling loan balance:', error);
    throw error;
  }
};

export const settleLoanOnTermination = async (loanId: string, userId: string, reason: string) => {
  try {
    await triggerLoanRecall(loanId, userId);
    await triggerLoanBalanceSettlement(loanId, userId);
    await addAuditLog(loanId, 'LOAN_SETTLEMENT_ON_TERMINATION', userId, { reason });
  } catch (error) {
    console.error('Error settling loan on termination:', error);
    throw error;
  }
};

// Generate payslip data
export const generatePayslipData = async (payrollId: string) => {
  try {
    const payroll = await getPayrollById(payrollId);
    if (!payroll) throw new Error('Payroll not found');
    
    return {
      employeeId: payroll.employeeId,
      month: payroll.month,
      year: payroll.year,
      basicSalary: payroll.basicSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      bonuses: payroll.bonuses,
      loans: payroll.loans,
      grossSalary: payroll.grossSalary,
      netSalary: payroll.netSalary,
      processedDate: payroll.processedDate,
    };
  } catch (error) {
    console.error('Error generating payslip data:', error);
    throw error;
  }
};

// Generate payroll from employee salary data
export const generatePayrollFromEmployees = async (month: number, year: number) => {
  try {
    const { getEmployees } = await import('./employees');
    const { getOvertimeRequests, calculateOvertimeRate } = await import('./overtime');
    const { getAttendanceStatsForPayroll } = await import('./attendance');
    const employees = await getEmployees();

    const activeEmployees = employees.filter(emp => emp.status === 'active');

    const payrollRecords = await Promise.all(activeEmployees.map(async (employee) => {
      const salary = employee.salaryAllowances || {};
      const basicSalary = Number(salary.basicSalary || 0);
      const otAllowance = Number(salary.otAllowances || 0);
      const otherAllowance = Number(salary.otherAllowances || 0);
      const attendanceAllowance = Number(salary.attendanceAllowance || 0);
      const livingAllowance = Number(salary.livingAllowance || 0);
      const foodAllowance = Number(salary.foodAllowance || 0);
      const fridayAllowance = Number(salary.fridayAllowance || 0);

      // Get attendance statistics for the month
      const attendanceStats = await getAttendanceStatsForPayroll(employee.id, month, year);

      // Calculate daily salary rate for deductions
      const daysInMonth = attendanceStats.totalDaysInMonth;
      const dailyRate = basicSalary / daysInMonth;

      // Calculate absent day deductions
      const absentDeduction = attendanceStats.absentDays * dailyRate;

      // Calculate friday allowance based on fridays worked
      const calculatedFridayAllowance = attendanceStats.fridaysWorked * fridayAllowance;

      // Get approved overtime for this employee
      const overtimeRequests = await getOvertimeRequests(employee.id);
      const approvedOvertime = overtimeRequests.filter(o =>
        o.status === 'approved' || o.status === 'completed'
      );

      // Calculate overtime pay
      const overtimePay = approvedOvertime.reduce((sum, ot) => {
        return sum + calculateOvertimeRate(basicSalary, ot.hours, ot.requestType);
      }, 0);

      const overtimeHours = approvedOvertime.reduce((sum, ot) => sum + ot.hours, 0);

      const allowances = [
        { id: '1', name: 'OT Allowance', amount: otAllowance, type: 'fixed' as const },
        { id: '2', name: 'Other Allowance', amount: otherAllowance, type: 'fixed' as const },
        { id: '3', name: 'Attendance Allowance', amount: attendanceAllowance, type: 'fixed' as const },
        { id: '4', name: 'Living Allowance', amount: livingAllowance, type: 'fixed' as const },
        { id: '5', name: 'Food Allowance', amount: foodAllowance, type: 'fixed' as const },
      ].filter(a => a.amount > 0);

      // Add friday allowance if there are fridays worked
      if (calculatedFridayAllowance > 0) {
        allowances.push({
          id: 'friday',
          name: `Friday Allowance (${attendanceStats.fridaysWorked} days)`,
          amount: calculatedFridayAllowance,
          type: 'fixed' as const
        });
      }

      // Add overtime as allowance if there is any
      if (overtimePay > 0) {
        allowances.push({
          id: 'ot',
          name: `Overtime (${overtimeHours.toFixed(1)} hrs)`,
          amount: overtimePay,
          type: 'fixed' as const
        });
      }

      const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
      const grossSalary = basicSalary + totalAllowances;

      // Calculate deductions
      const deductions: any[] = [];
      if (absentDeduction > 0) {
        deductions.push({
          id: 'absent',
          name: `Absent Days (${attendanceStats.absentDays} days)`,
          amount: absentDeduction,
          type: 'deduction' as const
        });
      }

      // Add pension deduction if applicable (e.g., 8% of basic salary)
      const pensionRate = 0.08;
      const pensionDeduction = basicSalary * pensionRate;
      deductions.push({
        id: 'pension',
        name: 'Pension (8%)',
        amount: pensionDeduction,
        type: 'deduction' as const
      });

      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      const netSalary = grossSalary - totalDeductions;

      return {
        employeeId: employee.id,
        month,
        year,
        basicSalary,
        allowances,
        deductions,
        bonuses: [],
        loans: [],
        grossSalary,
        netSalary,
        status: 'draft' as const,
        createdAt: new Date(),
        // Attendance-related fields
        daysWorked: attendanceStats.daysWorked,
        absentDays: attendanceStats.absentDays,
        fridays: attendanceStats.fridaysWorked,
        halfDays: attendanceStats.halfDays,
        leaveDays: attendanceStats.leaveDays,
      };
    }));

    // Batch create payroll records
    const batch = writeBatch(db);
    const payrollIds: string[] = [];

    payrollRecords.forEach(payroll => {
      const docRef = doc(collection(db, PAYROLL_COLLECTION));
      batch.set(docRef, {
        ...payroll,
        createdAt: Timestamp.now(),
      });
      payrollIds.push(docRef.id);
    });

    await batch.commit();

    return payrollIds;
  } catch (error) {
    console.error('Error generating payroll from employees:', error);
    throw error;
  }
};

// ADVANCED PAYROLL FEATURES

const PAYROLL_CONFIG_COLLECTION = 'payroll_config';
const AUDIT_LOG_COLLECTION = 'payroll_audit_logs';

// Payroll Configuration
export interface PayrollConfig {
  id: string;
  payrollCycleName: string;
  cycleStartDay: number;
  cycleEndDay: number;
  cutOffDate: number;
  approvalLevels: number;
  requiresApprovalAboveAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Payroll Approval
export interface PayrollApproval {
  level: number;
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionDate?: Date;
}

// Get payroll configuration
export const getPayrollConfig = async () => {
  try {
    const q = query(collection(db, PAYROLL_CONFIG_COLLECTION));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        id: 'default',
        payrollCycleName: 'Monthly',
        cycleStartDay: 15,
        cycleEndDay: 14,
        cutOffDate: 10,
        approvalLevels: 2
      };
    }
    
    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error('Error fetching payroll config:', error);
    throw error;
  }
};

// Update payroll configuration
export const updatePayrollConfig = async (config: Partial<PayrollConfig>) => {
  try {
    const q = query(collection(db, PAYROLL_CONFIG_COLLECTION));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      await addDoc(collection(db, PAYROLL_CONFIG_COLLECTION), {
        ...config,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } else {
      const docId = querySnapshot.docs[0].id;
      await updateDoc(doc(db, PAYROLL_CONFIG_COLLECTION, docId), {
        ...config,
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error updating payroll config:', error);
    throw error;
  }
};

// Lock payroll after approval
export const lockPayroll = async (payrollId: string, userId: string) => {
  try {
    await updatePayroll(payrollId, {
      status: 'locked',
      approvedBy: userId
    } as any);
    
    await addAuditLog(payrollId, 'PAYROLL_LOCKED', userId, { status: 'locked' });
  } catch (error) {
    console.error('Error locking payroll:', error);
    throw error;
  }
};

// Restrict modifications after approval
export const restrictPayrollModifications = async (payrollId: string) => {
  try {
    const payroll = await getPayrollById(payrollId);
    
    if (payroll && (payroll.status === 'approved' || payroll.status === 'paid')) {
      throw new Error('Cannot modify payroll that has been approved or paid');
    }
  } catch (error) {
    console.error('Error checking payroll restrictions:', error);
    throw error;
  }
};

// Process multiple payroll runs
export const processPayrollRun = async (payrollIds: string[], userId: string) => {
  try {
    const batch = writeBatch(db);
    
    payrollIds.forEach(payrollId => {
      const docRef = doc(db, PAYROLL_COLLECTION, payrollId);
      batch.update(docRef, {
        status: 'processed',
        processedDate: Timestamp.now(),
        approvedBy: userId
      });
    });
    
    await batch.commit();
    
    await addAuditLog('bulk', 'PAYROLL_RUN_PROCESSED', userId, {
      payrollCount: payrollIds.length
    });
  } catch (error) {
    console.error('Error processing payroll run:', error);
    throw error;
  }
};

// Re-open payroll for editing (with audit trail)
export const reopenPayroll = async (payrollId: string, userId: string, reason: string) => {
  try {
    await updatePayroll(payrollId, {
      status: 'draft'
    } as any);
    
    await addAuditLog(payrollId, 'PAYROLL_REOPENED', userId, { reason });
  } catch (error) {
    console.error('Error reopening payroll:', error);
    throw error;
  }
};

// Add audit log entry
export const addAuditLog = async (
  payrollId: string,
  action: string,
  userId: string,
  changes: Record<string, any>
) => {
  try {
    await addDoc(collection(db, AUDIT_LOG_COLLECTION), {
      payrollId,
      action,
      performedBy: userId,
      timestamp: Timestamp.now(),
      changes,
      notes: null
    });
  } catch (error) {
    console.error('Error adding audit log:', error);
    throw error;
  }
};

// Get audit logs for payroll
export const getPayrollAuditLogs = async (payrollId: string) => {
  try {
    const q = query(
      collection(db, AUDIT_LOG_COLLECTION),
      where('payrollId', '==', payrollId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

// Add wage type
export const addWageType = async (
  name: string,
  type: 'salary' | 'allowance' | 'bonus' | 'deduction',
  isFixed: boolean,
  taxable: boolean = true
) => {
  try {
    const docRef = await addDoc(collection(db, 'wage_types'), {
      name,
      type,
      isFixed,
      taxable,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding wage type:', error);
    throw error;
  }
};

// Delete wage type
export const deleteWageType = async (id: string) => {
  try {
    await updateDoc(doc(db, 'wage_types', id), {
      archived: true,
      archivedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting wage type:', error);
    throw error;
  }
};

// Add/manage wage types for payroll
export const definePayrollCutoffDates = async (cutoffDate: number) => {
  try {
    await updatePayrollConfig({ cutOffDate: cutoffDate } as any);
  } catch (error) {
    console.error('Error setting payroll cutoff dates:', error);
    throw error;
  }
};

// Calculate tax-related deductions
export const calculateTaxDeductions = async (grossSalary: number) => {
  try {
    // Placeholder for tax calculation logic
    // In a real system, this would use tax rules from payroll config
    const taxableAmount = grossSalary;
    const taxRate = 0.06; // 6% tax rate (configurable)
    return {
      taxableAmount,
      taxAmount: taxableAmount * taxRate
    };
  } catch (error) {
    console.error('Error calculating tax:', error);
    throw error;
  }
};

// Calculate pension-related deductions
export const calculatePensionDeductions = async (basicSalary: number) => {
  try {
    // Placeholder for pension calculation logic
    const pensionRate = 0.08; // 8% pension rate (configurable)
    return {
      pensionAmount: basicSalary * pensionRate
    };
  } catch (error) {
    console.error('Error calculating pension:', error);
    throw error;
  }
};
