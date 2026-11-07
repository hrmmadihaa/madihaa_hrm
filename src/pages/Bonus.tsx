import { useState, useEffect } from 'react';
import { Save, Calendar, Edit, Check, X, Printer, Download, History, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { getEmployees } from '../lib/employees';
import { getAllWorkLocations } from '../lib/workLocation';
import { addDoc, collection, Timestamp, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Bonus = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [workLocations, setWorkLocations] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusDate, setBonusDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [adjustmentMode, setAdjustmentMode] = useState(false);
  const [adjustedAmounts, setAdjustedAmounts] = useState<{ [key: string]: number }>({});
  const [reducedEmployees, setReducedEmployees] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'create' | 'history'>('create');
  const [bonusHistory, setBonusHistory] = useState<any[]>([]);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [bulkSelectedEmployees, setBulkSelectedEmployees] = useState<Set<string>>(new Set());
  const [bulkAmount, setBulkAmount] = useState('');
  const [customAmountMode, setCustomAmountMode] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<{ [key: string]: string }>({});
  const [dontRedistribute, setDontRedistribute] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadWorkLocations();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const empData = await getEmployees();
      setEmployees(empData.filter(emp => emp.status === 'active'));
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkLocations = async () => {
    try {
      const locations = await getAllWorkLocations();
      setWorkLocations(locations);
    } catch (error) {
      console.error('Error loading work locations:', error);
    }
  };

  const loadBonusHistory = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'bonuses'), where('date', '>=', Timestamp.fromDate(new Date(new Date().getFullYear(), 0, 1))));
      const querySnapshot = await getDocs(q);
      const history: any[] = [];
      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });
      setBonusHistory(history);
    } catch (error) {
      console.error('Error loading bonus history:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllBonuses = async () => {
    if (!confirm('Are you sure you want to delete ALL bonus records? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const q = query(collection(db, 'bonuses'));
      const querySnapshot = await getDocs(q);
      
      let deleteCount = 0;
      for (const docSnapshot of querySnapshot.docs) {
        await deleteDoc(doc(db, 'bonuses', docSnapshot.id));
        deleteCount++;
      }
      
      alert(`Successfully deleted ${deleteCount} bonus records`);
      loadBonusHistory();
    } catch (error) {
      console.error('Error deleting bonuses:', error);
      alert('Error deleting bonuses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'history') {
      loadBonusHistory();
    }
  }, [viewMode]);

  const toggleEmployeeSelection = (empId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(empId) 
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const toggleLocationSelection = (locationEmployees: any[]) => {
    const allSelected = locationEmployees.every(emp => selectedEmployees.includes(emp.id));
    if (allSelected) {
      setSelectedEmployees(prev => 
        prev.filter(id => !locationEmployees.map(e => e.id).includes(id))
      );
    } else {
      setSelectedEmployees(prev => [
        ...prev,
        ...locationEmployees.filter(emp => !prev.includes(emp.id)).map(emp => emp.id)
      ]);
    }
  };

  const toggleLocationExpansion = (locationId: string) => {
    setExpandedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  const deselectAll = () => {
    setSelectedEmployees([]);
  };

  const getEmployeesByLocation = () => {
    const grouped: { [key: string]: { locationName: string; employees: any[] } } = {};
    
    workLocations.forEach(location => {
      const assignedEmployees = employees.filter(emp => 
        location.assignedStaff?.includes(emp.id)
      );
      if (assignedEmployees.length > 0) {
        grouped[location.id] = {
          locationName: location.name,
          employees: assignedEmployees
        };
      }
    });

    // Add unassigned employees
    const assignedEmployeeIds = new Set();
    workLocations.forEach(loc => {
      loc.assignedStaff?.forEach((id: string) => assignedEmployeeIds.add(id));
    });
    
    const unassignedEmployees = employees.filter(emp => !assignedEmployeeIds.has(emp.id));
    if (unassignedEmployees.length > 0) {
      grouped['unassigned'] = {
        locationName: 'Unassigned',
        employees: unassignedEmployees
      };
    }

    return grouped;
  };

  const calculatePreview = () => {
    if (selectedEmployees.length === 0) {
      setPreviewData([]);
      return;
    }

    if (customAmountMode) {
      // Custom amount mode - use individual amounts
      const preview = selectedEmployees.map(empId => {
        const emp = employees.find(e => e.id === empId);
        const amount = parseFloat(customAmounts[empId] || '0');
        return {
          employeeId: emp?.employeeId,
          name: emp?.fullName,
          id: empId,
          amount: amount.toFixed(2),
          isAdjusted: true
        };
      });
      setPreviewData(preview);
    } else if (Object.keys(adjustedAmounts).length > 0) {
      // If adjustedAmounts exist (edit mode or after adjustments), use them directly
      const preview = selectedEmployees.map(empId => {
        const emp = employees.find(e => e.id === empId);
        const amount = adjustedAmounts[empId] !== undefined ? adjustedAmounts[empId] : 0;
        return {
          employeeId: emp?.employeeId,
          name: emp?.fullName,
          id: empId,
          amount: amount.toFixed(2),
          isAdjusted: adjustedAmounts[empId] !== undefined
        };
      });
      setPreviewData(preview);
    } else {
      // Equal distribution mode
      if (!bonusAmount) {
        setPreviewData([]);
        return;
      }
      const totalAmount = parseFloat(bonusAmount);
      const uniqueSelectedEmployees = [...new Set(selectedEmployees)];
      const perEmployeeAmount = totalAmount / uniqueSelectedEmployees.length;

      const preview = uniqueSelectedEmployees.map(empId => {
        const emp = employees.find(e => e.id === empId);
        const adjustedAmount = adjustedAmounts[empId];
        return {
          employeeId: emp?.employeeId,
          name: emp?.fullName,
          id: empId,
          amount: adjustedAmount !== undefined ? adjustedAmount.toFixed(2) : perEmployeeAmount.toFixed(2),
          isAdjusted: adjustedAmount !== undefined
        };
      });

      setPreviewData(preview);
    }
  };

  useEffect(() => {
    console.log('State changed:', { 
      bonusAmount, 
      selectedEmployeesLength: selectedEmployees.length, 
      adjustmentMode, 
      customAmountMode, 
      adjustedAmountsKeys: Object.keys(adjustedAmounts).length,
      previewDataLength: previewData.length 
    });
    calculatePreview();
  }, [bonusAmount, selectedEmployees, adjustmentMode, customAmountMode, customAmounts, adjustedAmounts]);

  const startAdjustment = () => {
    setAdjustmentMode(true);
    setAdjustedAmounts({});
    setReducedEmployees(new Set());
    setDontRedistribute(true); // Default to not redistributing in adjustment mode
  };

  const handleAmountChange = (empId: string, newAmount: number) => {
    console.log('handleAmountChange called:', { empId, newAmount, dontRedistribute });
    
    const totalAmount = parseFloat(bonusAmount);
    const perEmployeeAmount = totalAmount / selectedEmployees.length;
    
    const oldAmount = adjustedAmounts[empId] !== undefined ? adjustedAmounts[empId] : perEmployeeAmount;
    const difference = newAmount - oldAmount;
    
    console.log('Amount change details:', { oldAmount, newAmount, difference });
    
    // If reducing, mark this employee as reduced
    if (newAmount < perEmployeeAmount) {
      setReducedEmployees(prev => new Set(prev).add(empId));
    } else if (newAmount === perEmployeeAmount) {
      setReducedEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(empId);
        return newSet;
      });
    }

    setAdjustedAmounts(prev => {
      const newAmounts = { ...prev, [empId]: newAmount };
      console.log('Updated adjustedAmounts:', newAmounts);
      return newAmounts;
    });

    // Redistribute the difference to non-reduced employees (only if not in dontRedistribute mode)
    if (!dontRedistribute) {
      console.log('Redistributing difference:', difference);
      redistributeDifference(empId, difference);
    } else {
      console.log('Skipping redistribution (dontRedistribute is true)');
    }
  };

  const redistributeDifference = (changedEmpId: string, difference: number) => {
    if (difference === 0) return;

    const totalAmount = parseFloat(bonusAmount);
    const perEmployeeAmount = totalAmount / selectedEmployees.length;
    
    // Get employees who can receive redistribution (not reduced and not the changed one)
    const eligibleEmployees = selectedEmployees.filter(
      id => id !== changedEmpId && !reducedEmployees.has(id)
    );

    if (eligibleEmployees.length === 0) return;

    const amountPerEligible = difference / eligibleEmployees.length;

    setAdjustedAmounts(prev => {
      const newAmounts = { ...prev };
      eligibleEmployees.forEach(empId => {
        const currentAmount = prev[empId] !== undefined ? prev[empId] : perEmployeeAmount;
        newAmounts[empId] = currentAmount + amountPerEligible;
      });
      return newAmounts;
    });
  };

  const cancelAdjustment = () => {
    setAdjustmentMode(false);
    setAdjustedAmounts({});
    setReducedEmployees(new Set());
  };

  const resetAdjustments = () => {
    setAdjustedAmounts({});
    setReducedEmployees(new Set());
    setBulkSelectedEmployees(new Set());
    setBulkAmount('');
    setTimeout(() => calculatePreview(), 0);
  };

  const handleEditBatch = async (bonus: any) => {
    try {
      setLoading(true);
      console.log('handleEditBatch called with bonus:', bonus);
      
      // Load all bonuses from the same batch using batchId if available
      let q;
      if (bonus.batchId) {
        console.log('Using batchId for query:', bonus.batchId);
        q = query(
          collection(db, 'bonuses'),
          where('batchId', '==', bonus.batchId)
        );
      } else {
        console.log('No batchId, loading all matching and will deduplicate');
        // Load all bonuses with matching date/amount/description
        q = query(
          collection(db, 'bonuses'),
          where('date', '==', bonus.date),
          where('totalBonusAmount', '==', bonus.totalBonusAmount),
          where('description', '==', bonus.description)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const allBonuses: any[] = [];
      querySnapshot.forEach((docSnapshot) => {
        allBonuses.push({ id: docSnapshot.id, ...(docSnapshot.data() as any) });
      });
      console.log('Loaded allBonuses:', allBonuses.length);

      // Group by distributedAmong to identify different batches
      const groupedByDistributedAmong: { [key: number]: any[] } = {};
      allBonuses.forEach(b => {
        const key = b.distributedAmong;
        if (!groupedByDistributedAmong[key]) {
          groupedByDistributedAmong[key] = [];
        }
        groupedByDistributedAmong[key].push(b);
      });

      // Select the group with the most records (should be the correct batch)
      let batchBonuses: any[] = [];
      let maxCount = 0;
      Object.entries(groupedByDistributedAmong).forEach(([key, bonuses]) => {
        console.log(`Group distributedAmong=${key}: ${bonuses.length} records`);
        if (bonuses.length > maxCount) {
          maxCount = bonuses.length;
          batchBonuses = bonuses;
        }
      });
      console.log('Selected batchBonuses:', batchBonuses.length);

      // Set up edit mode with existing data
      setEditingBatch({
        date: bonus.date?.toDate?.() ? new Date(bonus.date.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: bonus.description,
        totalAmount: bonus.totalBonusAmount,
        bonuses: batchBonuses
      });

      // Set selected employees from the batch (remove duplicates)
      const uniqueEmployeeIds = [...new Set(batchBonuses.map(b => b.employeeId))];
      console.log('uniqueEmployeeIds:', uniqueEmployeeIds.length);
      setSelectedEmployees(uniqueEmployeeIds);
      setBonusAmount(bonus.totalBonusAmount.toString());
      setBonusDate(bonus.date?.toDate?.() ? new Date(bonus.date.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setDescription(bonus.description);

      // Load adjusted amounts from database to preserve last saved values
      const amounts: { [key: string]: number } = {};
      batchBonuses.forEach(b => {
        if (!amounts[b.employeeId]) {
          amounts[b.employeeId] = b.amount;
        }
      });
      console.log('Loaded adjustedAmounts from database:', amounts);
      console.log('Batch bonuses details:');
      batchBonuses.forEach(b => {
        console.log(`  ${b.staffId} (${b.employeeId}): ${b.amount}`);
      });
      setAdjustedAmounts(amounts);

      setViewMode('create');
      setAdjustmentMode(true);
      setDontRedistribute(true); // Default to not redistributing when editing batch
      
      console.log('About to generate immediate preview');
      
      try {
        // Immediately generate preview data from loaded amounts
        console.log('Generating immediate preview:', { 
          uniqueEmployeeIdsLength: uniqueEmployeeIds.length,
          employeesLength: employees.length,
          firstEmployeeId: uniqueEmployeeIds[0],
          firstEmployee: employees.find(e => e.id === uniqueEmployeeIds[0])
        });
        
        const immediatePreview = uniqueEmployeeIds.map(empId => {
          const emp = employees.find(e => e.id === empId);
          const amount = amounts[empId] !== undefined ? amounts[empId] : 0;
          return {
            employeeId: emp?.employeeId,
            name: emp?.fullName,
            id: empId,
            amount: amount.toFixed(2),
            isAdjusted: true
          };
        });
        setPreviewData(immediatePreview);
        console.log('Immediate preview set:', immediatePreview.length);
      } catch (error) {
        console.error('Error generating immediate preview:', error);
      }
    } catch (error) {
      console.error('Error loading batch:', error);
      alert('Error loading bonus batch');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBatch = async () => {
    if (!editingBatch) return;

    setSaving(true);
    try {
      console.log('handleUpdateBatch called');
      const totalAmount = parseFloat(bonusAmount);
      const uniqueSelectedEmployees = [...new Set(selectedEmployees)];
      const perEmployeeAmount = totalAmount / uniqueSelectedEmployees.length;

      // Use the existing batchId from the first record, or generate new one if not exists
      let existingBatchId = editingBatch.bonuses[0]?.batchId;
      if (!existingBatchId) {
        existingBatchId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('Generated new batchId:', existingBatchId);
      } else {
        console.log('Using existing batchId:', existingBatchId);
      }

      // Delete ALL bonus records using batchId to ensure complete cleanup
      const deleteQuery = query(
        collection(db, 'bonuses'),
        where('batchId', '==', existingBatchId)
      );
      const deleteSnapshot = await getDocs(deleteQuery);
      console.log('Found', deleteSnapshot.size, 'records with batchId to delete');
      if (deleteSnapshot.size === 0) {
        console.log('WARNING: No records found to delete! This will cause duplicates.');
        console.log('BatchId being used:', existingBatchId);
        console.log('Current bonuses in editingBatch:', editingBatch.bonuses.map((b: any) => ({ id: b.id, batchId: b.batchId, amount: b.amount })));
      }
      
      let deleteCount = 0;
      let deleteErrors = 0;
      for (const docSnapshot of deleteSnapshot.docs) {
        try {
          console.log('Deleting bonus:', docSnapshot.id);
          await deleteDoc(doc(db, 'bonuses', docSnapshot.id));
          deleteCount++;
        } catch (error) {
          console.error('Error deleting bonus:', docSnapshot.id, error);
          deleteErrors++;
        }
      }
      console.log(`Deleted ${deleteCount} records, ${deleteErrors} errors`);

      // Create new single records for each selected employee
      console.log('Creating new records with adjustedAmounts:', adjustedAmounts);
      for (const empId of uniqueSelectedEmployees) {
        const emp = employees.find(e => e.id === empId);
        const newAmount = adjustedAmounts[empId] !== undefined 
          ? adjustedAmounts[empId] 
          : perEmployeeAmount;
        
        console.log(`Creating record for ${emp?.staffId} (${empId}): amount=${newAmount}, wasAdjusted=${adjustedAmounts[empId] !== undefined}`);
        
        await addDoc(collection(db, 'bonuses'), {
          employeeId: empId,
          employeeName: emp?.fullName,
          staffId: emp?.employeeId,
          amount: newAmount,
          description: description || editingBatch.description,
          date: Timestamp.fromDate(new Date(bonusDate)),
          createdAt: Timestamp.now(),
          totalBonusAmount: totalAmount,
          distributedAmong: uniqueSelectedEmployees.length,
          wasAdjusted: adjustedAmounts[empId] !== undefined,
          batchId: existingBatchId
        });
      }
      console.log('Finished creating all records');

      alert('Bonus batch updated successfully');
      setEditingBatch(null);
      setSelectedEmployees([]);
      setBonusAmount('');
      setDescription('');
      setPreviewData([]);
      setAdjustmentMode(false);
      setAdjustedAmounts({});
      setReducedEmployees(new Set());
      setViewMode('history');
      loadBonusHistory();
    } catch (error) {
      console.error('Error updating batch:', error);
      alert('Error updating bonus batch');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingBatch(null);
    setSelectedEmployees([]);
    setBonusAmount('');
    setDescription('');
    setPreviewData([]);
    setAdjustmentMode(false);
    setAdjustedAmounts({});
    setReducedEmployees(new Set());
    setViewMode('history');
  };

  const handleRemoveEmployee = (empId: string) => {
    setSelectedEmployees(prev => prev.filter(id => id !== empId));
    setAdjustedAmounts(prev => {
      const newAmounts = { ...prev };
      delete newAmounts[empId];
      return newAmounts;
    });
    setReducedEmployees(prev => {
      const newSet = new Set(prev);
      newSet.delete(empId);
      return newSet;
    });
    setBulkSelectedEmployees(prev => {
      const newSet = new Set(prev);
      newSet.delete(empId);
      return newSet;
    });
  };

  const applyBulkAmount = () => {
    if (!bulkAmount || bulkSelectedEmployees.size === 0) return;
    
    const amount = parseFloat(bulkAmount);
    const totalAmount = parseFloat(bonusAmount);
    
    // Calculate total for selected employees
    const selectedTotal = amount * bulkSelectedEmployees.size;
    
    // Check if selected total exceeds total amount (only if redistributing)
    if (!dontRedistribute && selectedTotal > totalAmount) {
      alert(`Selected total (MVR ${selectedTotal.toFixed(2)}) exceeds total bonus amount (MVR ${totalAmount.toFixed(2)}). Please reduce the bulk amount.`);
      return;
    }
    
    if (dontRedistribute) {
      // Only apply to selected employees, don't redistribute
      setAdjustedAmounts(prev => {
        const newAmounts = { ...prev };
        bulkSelectedEmployees.forEach(empId => {
          newAmounts[empId] = amount;
        });
        return newAmounts;
      });
    } else {
      // Calculate remaining amount for non-selected employees
      const remainingAmount = totalAmount - selectedTotal;
      const nonSelectedEmployees = selectedEmployees.filter(id => !bulkSelectedEmployees.has(id));
      const amountPerNonSelected = nonSelectedEmployees.length > 0 ? remainingAmount / nonSelectedEmployees.length : 0;
      
      setAdjustedAmounts(prev => {
        const newAmounts = { ...prev };
        
        // Apply bulk amount to selected employees
        bulkSelectedEmployees.forEach(empId => {
          newAmounts[empId] = amount;
        });
        
        // Apply calculated amount to non-selected employees
        nonSelectedEmployees.forEach(empId => {
          newAmounts[empId] = amountPerNonSelected;
        });
        
        return newAmounts;
      });
    }
    
    setBulkAmount('');
    calculatePreview();
  };

  const recalculateRemaining = () => {
    if (bulkSelectedEmployees.size === 0 || !bonusAmount) return;

    const totalAmount = parseFloat(bonusAmount);
    const uniqueSelectedEmployees = [...new Set(selectedEmployees)];
    const perEmployeeBase = totalAmount / uniqueSelectedEmployees.length;
    
    const bulkTotal = Array.from(bulkSelectedEmployees).reduce((sum, empId) => {
      const amount = adjustedAmounts[empId] !== undefined ? adjustedAmounts[empId] : perEmployeeBase;
      return sum + amount;
    }, 0);
    
    const remainingAmount = totalAmount - bulkTotal;
    const remainingCount = uniqueSelectedEmployees.length - bulkSelectedEmployees.size;
    
    if (remainingCount <= 0) return;

    const perEmployeeAmount = remainingAmount / remainingCount;
    
    setAdjustedAmounts(prev => {
      const newAmounts = { ...prev };
      uniqueSelectedEmployees.forEach(empId => {
        if (!bulkSelectedEmployees.has(empId)) {
          newAmounts[empId] = perEmployeeAmount;
        }
      });
      return newAmounts;
    });
    setTimeout(() => calculatePreview(), 0);
  };

  const handleDeleteBatch = async (bonus: any) => {
    if (!confirm(`Are you sure you want to delete this bonus batch from ${bonus.date?.toDate?.() ? new Date(bonus.date.toDate()).toLocaleDateString() : 'N/A'}? This will delete all ${bonus.distributedAmong} bonus records.`)) {
      return;
    }

    try {
      setLoading(true);
      // Load all bonuses from the same batch
      const q = query(
        collection(db, 'bonuses'),
        where('date', '==', bonus.date),
        where('totalBonusAmount', '==', bonus.totalBonusAmount)
      );
      const querySnapshot = await getDocs(q);

      // Delete all bonuses in the batch
      const deletePromises = querySnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'bonuses', docSnapshot.id))
      );
      await Promise.all(deletePromises);

      alert('Bonus batch deleted successfully');
      loadBonusHistory();
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Error deleting bonus batch');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIndividual = async (bonus: any) => {
    if (!confirm(`Are you sure you want to delete ${bonus.employeeName}'s bonus of MVR ${bonus.amount.toFixed(2)}?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'bonuses', bonus.id));
      alert('Bonus record deleted successfully');
      loadBonusHistory();
    } catch (error) {
      console.error('Error deleting individual bonus:', error);
      alert('Error deleting bonus record');
    } finally {
      setLoading(false);
    }
  };

  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  const toggleBatchExpansion = (batchKey: string) => {
    setExpandedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchKey)) {
        newSet.delete(batchKey);
      } else {
        newSet.add(batchKey);
      }
      return newSet;
    });
  };

  const getBatchEmployees = (bonus: any) => {
    console.log('getBatchEmployees called with bonus:', bonus);
    if (bonus.batchId) {
      console.log('Using batchId for filtering:', bonus.batchId);
      return bonusHistory.filter(b => b.batchId === bonus.batchId);
    }
    console.log('No batchId, using date/amount/description/distributedAmong');
    const bonusTime = bonus.date?.toDate?.() ? bonus.date.toDate().getTime() : 0;
    return bonusHistory.filter(b => {
      const bTime = b.date?.toDate?.() ? b.date.toDate().getTime() : 0;
      return bTime === bonusTime && 
             b.totalBonusAmount === bonus.totalBonusAmount && 
             b.description === bonus.description &&
             b.distributedAmong === bonus.distributedAmong;
    });
  };

  const getUniqueBatches = () => {
    const batches: any[] = [];
    const seen = new Set();
    
    bonusHistory.forEach(bonus => {
      const key = `${bonus.date?.toDate?.() ? bonus.date.toDate().getTime() : 0}_${bonus.totalBonusAmount}_${bonus.description}`;
      if (!seen.has(key)) {
        seen.add(key);
        batches.push(bonus);
      }
    });
    
    return batches;
  };

  const handlePrintReport = () => {
    const dataToUse = previewData.length > 0 ? previewData : (
      Object.keys(adjustedAmounts).length > 0 ? selectedEmployees.map(empId => {
        const emp = employees.find(e => e.id === empId);
        const amount = adjustedAmounts[empId] !== undefined ? adjustedAmounts[empId] : 0;
        return {
          employeeId: emp?.employeeId,
          name: emp?.fullName,
          id: empId,
          amount: amount.toFixed(2),
          isAdjusted: adjustedAmounts[empId] !== undefined
        };
      }) : []
    );

    const groupedByLocation: { [key: string]: { locationName: string; employees: any[] } } = {};
    
    dataToUse.forEach((item: any) => {
      const emp = employees.find(e => e.id === item.id);
      const assignedLocation = workLocations.find(loc => 
        loc.assignedStaff?.includes(emp?.id)
      );
      const locationName = assignedLocation?.name || 'Unassigned';
      
      if (!groupedByLocation[locationName]) {
        groupedByLocation[locationName] = {
          locationName,
          employees: []
        };
      }
      groupedByLocation[locationName].employees.push({ ...item, locationName });
    });

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Bonus Report', 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${bonusDate || 'N/A'}`, 14, 30);
    doc.text(`Description: ${description || 'N/A'}`, 14, 38);
    doc.text(`Total Amount: MVR ${bonusAmount || '0.00'}`, 14, 46);
    doc.text(`Total Employees: ${dataToUse.length}`, 14, 54);

    let yPos = 65;
    
    Object.entries(groupedByLocation).forEach(([, locationData]) => {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Location: ${locationData.locationName} (${locationData.employees.length} employees)`, 14, yPos);
      yPos += 10;
      
      const tableData = locationData.employees.map((emp: any) => [
        emp.employeeId || emp.id,
        emp.name,
        emp.locationName,
        `MVR ${emp.amount}`
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Employee ID', 'Name', 'Work Location', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const handlePrintBatch = (bonus: any) => {
    const batchEmployees = getBatchEmployees(bonus);

    const groupedByLocation: { [key: string]: { locationName: string; employees: any[] } } = {};
    
    batchEmployees.forEach((empBonus: any) => {
      const emp = employees.find(e => e.id === empBonus.employeeId);
      const assignedLocation = workLocations.find(loc => 
        loc.assignedStaff?.includes(emp?.id)
      );
      const locationName = assignedLocation?.name || 'Unassigned';
      
      if (!groupedByLocation[locationName]) {
        groupedByLocation[locationName] = {
          locationName,
          employees: []
        };
      }
      groupedByLocation[locationName].employees.push({ ...empBonus, locationName });
    });

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Bonus Report', 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${bonus.date?.toDate?.() ? new Date(bonus.date.toDate()).toLocaleDateString() : 'N/A'}`, 14, 30);
    doc.text(`Description: ${bonus.description || 'N/A'}`, 14, 38);
    doc.text(`Total Amount: MVR ${bonus.totalBonusAmount.toFixed(2)}`, 14, 46);
    doc.text(`Total Employees: ${batchEmployees.length}`, 14, 54);

    let yPos = 65;
    
    Object.entries(groupedByLocation).forEach(([, locationData]) => {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Location: ${locationData.locationName} (${locationData.employees.length} employees)`, 14, yPos);
      yPos += 10;
      
      const tableData = locationData.employees.map((emp: any) => [
        emp.staffId || emp.employeeId,
        emp.employeeName,
        emp.locationName,
        `MVR ${emp.amount.toFixed(2)}`
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Employee ID', 'Name', 'Work Location', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Group by work location
    const groupedByLocation: { [key: string]: any[] } = {};
    previewData.forEach((item) => {
      const emp = employees.find(e => e.id === item.id);
      const assignedLocation = workLocations.find(loc => 
        loc.assignedStaff?.includes(emp?.id)
      );
      const locationName = assignedLocation?.name || 'Unassigned';
      
      if (!groupedByLocation[locationName]) {
        groupedByLocation[locationName] = [];
      }
      groupedByLocation[locationName].push({ ...item, locationName });
    });

    // Title
    doc.setFontSize(18);
    doc.text('Bonus Distribution Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Date: ${bonusDate}`, 14, 30);
    doc.text(`Description: ${description || 'N/A'}`, 14, 37);
    doc.text(`Total Amount: MVR ${parseFloat(bonusAmount).toFixed(2)}`, 14, 44);
    doc.text(`Total Employees: ${previewData.length}`, 14, 51);

    let yPos = 60;
    
    Object.entries(groupedByLocation).forEach(([location, employees]) => {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Location: ${location} (${employees.length} employees)`, 14, yPos);
      yPos += 10;
      
      const tableData = employees.map((item) => [
        item.employeeId,
        item.name,
        item.locationName,
        `MVR ${item.amount}`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Employee ID', 'Name', 'Work Location', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`bonus-report-${bonusDate}.pdf`);
  };

  const handleSave = async () => {
    if (selectedEmployees.length === 0) {
      alert('Please select at least one employee');
      return;
    }

    if (customAmountMode) {
      // Validate custom amounts
      const hasInvalidAmount = selectedEmployees.some(empId => {
        const amount = parseFloat(customAmounts[empId] || '0');
        return isNaN(amount) || amount <= 0;
      });
      if (hasInvalidAmount) {
        alert('Please enter valid amounts for all selected employees');
        return;
      }
    } else {
      if (!bonusAmount) {
        alert('Please enter a bonus amount');
        return;
      }
    }

    setSaving(true);
    try {
      const totalAmount = customAmountMode 
        ? selectedEmployees.reduce((sum, empId) => sum + parseFloat(customAmounts[empId] || '0'), 0)
        : parseFloat(bonusAmount);
      
      // Generate unique batch ID
      const batchId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save bonus record for each employee
      for (const empId of selectedEmployees) {
        const emp = employees.find(e => e.id === empId);
        const finalAmount = customAmountMode 
          ? parseFloat(customAmounts[empId] || '0')
          : (adjustedAmounts[empId] !== undefined ? adjustedAmounts[empId] : totalAmount / selectedEmployees.length);
        
        await addDoc(collection(db, 'bonuses'), {
          employeeId: empId,
          employeeName: emp?.fullName,
          staffId: emp?.employeeId,
          amount: finalAmount,
          description: description || 'Bonus payment',
          date: Timestamp.fromDate(new Date(bonusDate)),
          createdAt: Timestamp.now(),
          totalBonusAmount: totalAmount,
          distributedAmong: selectedEmployees.length,
          wasAdjusted: customAmountMode || adjustedAmounts[empId] !== undefined,
          batchId
        });
      }

      alert(`Bonus distributed successfully to ${selectedEmployees.length} employees`);
      setSelectedEmployees([]);
      setBonusAmount('');
      setDescription('');
      setPreviewData([]);
      setAdjustmentMode(false);
      setAdjustedAmounts({});
      setReducedEmployees(new Set());
      setCustomAmountMode(false);
      setCustomAmounts({});
    } catch (error) {
      console.error('Error saving bonus:', error);
      alert('Error saving bonus. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-secondary-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Bonus Distribution</h1>
          <p className="text-secondary-600 mt-1">Distribute bonus equally among selected employees with optional adjustments</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'create' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('create')}
          >
            <Save className="w-4 h-4 mr-2" />
            Create Bonus
          </Button>
          <Button
            variant={viewMode === 'history' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('history')}
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        </div>
      </div>

      {viewMode === 'history' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-secondary-900">Bonus History</h2>
              <Button
                variant="danger"
                onClick={deleteAllBonuses}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              {getUniqueBatches().map((bonus) => {
                const batchKey = `${bonus.date?.toDate?.() ? bonus.date.toDate().getTime() : 0}_${bonus.totalBonusAmount}_${bonus.description}`;
                const isExpanded = expandedBatches.has(batchKey);
                const batchEmployees = getBatchEmployees(bonus);

                return (
                  <div key={batchKey} className="mb-3 border border-secondary-200 rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-3 bg-secondary-50 cursor-pointer hover:bg-secondary-100"
                      onClick={() => toggleBatchExpansion(batchKey)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-secondary-400">{isExpanded ? '▼' : '▶'}</span>
                        <div>
                          <p className="text-sm font-medium text-secondary-900">
                            {bonus.date?.toDate?.() ? new Date(bonus.date.toDate()).toLocaleDateString() : 'N/A'}
                          </p>
                          <p className="text-xs text-secondary-600">{bonus.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-secondary-900">MVR {bonus.totalBonusAmount.toFixed(2)}</p>
                          <p className="text-xs text-secondary-600">{bonus.distributedAmong} employees</p>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePrintBatch(bonus)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditBatch(bonus)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDeleteBatch(bonus)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-secondary-200 bg-white">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-secondary-200">
                              <th className="text-left py-2 px-4 text-xs font-medium text-secondary-700">Employee</th>
                              <th className="text-right py-2 px-4 text-xs font-medium text-secondary-700">Amount</th>
                              <th className="text-right py-2 px-4 text-xs font-medium text-secondary-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batchEmployees.map((empBonus) => (
                              <tr key={empBonus.id} className="border-b border-secondary-100">
                                <td className="py-2 px-4 text-sm text-secondary-900">{empBonus.employeeName}</td>
                                <td className="py-2 px-4 text-sm text-secondary-900 text-right font-medium">MVR {empBonus.amount.toFixed(2)}</td>
                                <td className="py-2 px-4 text-sm text-right">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleDeleteIndividual(empBonus)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
              {getUniqueBatches().length === 0 && (
                <p className="text-center text-secondary-600 py-8">No bonus records found</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'create' && (

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Work Location Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-secondary-900">Select by Work Location</h2>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="secondary" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {Object.entries(getEmployeesByLocation()).map(([locationId, locationData]) => {
                const locationEmployees = locationData.employees.filter(emp => {
                  const searchLower = searchTerm.toLowerCase();
                  return (
                    emp.fullName?.toLowerCase().includes(searchLower) ||
                    emp.employeeId?.toLowerCase().includes(searchLower)
                  );
                });

                if (locationEmployees.length === 0) return null;

                const allSelected = locationEmployees.every(emp => selectedEmployees.includes(emp.id));
                const isExpanded = expandedLocations.has(locationId);

                return (
                  <div key={locationId} className="border border-secondary-200 rounded-lg overflow-hidden">
                    <div
                      className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                        allSelected ? 'bg-primary-50' : 'bg-secondary-50 hover:bg-secondary-100'
                      }`}
                      onClick={() => toggleLocationExpansion(locationId)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleLocationSelection(locationEmployees);
                          }}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{locationData.locationName}</p>
                          <p className="text-xs text-secondary-600">
                            {locationEmployees.length} employees
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-secondary-200 text-secondary-700 px-2 py-1 rounded">
                          {selectedEmployees.filter(id => locationEmployees.map(e => e.id).includes(id)).length} selected
                        </span>
                        <span className="text-secondary-400">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-secondary-200 p-2 space-y-1 bg-white">
                        {locationEmployees.map((employee) => (
                          <label
                            key={employee.id}
                            className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                              selectedEmployees.includes(employee.id)
                                ? 'bg-primary-50'
                                : 'hover:bg-secondary-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(employee.id)}
                              onChange={() => toggleEmployeeSelection(employee.id)}
                              className="w-4 h-4 text-primary-600 rounded"
                            />
                            <div className="flex-1">
                              <p className="text-sm text-secondary-900">{employee.fullName}</p>
                              <p className="text-xs text-secondary-600">{employee.employeeId}</p>
                            </div>
                            {employee.designation && (
                              <span className="text-xs bg-secondary-200 text-secondary-700 px-2 py-1 rounded">
                                {employee.designation}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {Object.values(getEmployeesByLocation()).every(loc => 
                loc.employees.filter(emp => {
                  const searchLower = searchTerm.toLowerCase();
                  return (
                    emp.fullName?.toLowerCase().includes(searchLower) ||
                    emp.employeeId?.toLowerCase().includes(searchLower)
                  );
                }).length === 0
              ) && (
                <p className="text-center text-secondary-600 py-8">
                  No employees found
                </p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <p className="text-sm font-medium text-secondary-900">
                Selected: {selectedEmployees.length} employees
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Bonus Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-secondary-900">Bonus Details</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Distribution Mode
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={!customAmountMode ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setCustomAmountMode(false)}
                    className="flex-1"
                  >
                    Equal Distribution
                  </Button>
                  <Button
                    variant={customAmountMode ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setCustomAmountMode(true)}
                    className="flex-1"
                  >
                    Custom Amounts
                  </Button>
                </div>
              </div>

              {!customAmountMode && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Total Bonus Amount (MVR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-secondary-400">MVR</span>
                    <input
                      type="number"
                      value={bonusAmount}
                      onChange={(e) => setBonusAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter total amount"
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Bonus Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input
                    type="date"
                    value={bonusDate}
                    onChange={(e) => setBonusDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Enter bonus description (optional)"
                />
              </div>

              {selectedEmployees.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-secondary-900 mb-2">
                    Distribution Summary:
                  </p>
                  <div className="space-y-1 text-sm text-secondary-700">
                    {!customAmountMode && bonusAmount ? (
                      <>
                        <p>Total Amount: MVR {parseFloat(bonusAmount).toFixed(2)}</p>
                        <p>Employees: {selectedEmployees.length}</p>
                        <p className="font-semibold text-primary-700">
                          Amount per Employee: MVR {(parseFloat(bonusAmount) / selectedEmployees.length).toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p>Employees: {selectedEmployees.length}</p>
                        <p className="font-semibold text-primary-700">
                          Total Amount: MVR {selectedEmployees.reduce((sum, empId) => sum + parseFloat(customAmounts[empId] || '0'), 0).toFixed(2)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {editingBatch && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-900 mb-1">
                    Editing Existing Bonus Batch
                  </p>
                  <p className="text-xs text-yellow-700">
                    You can adjust amounts, add/remove employees, or change the description.
                    Changes will update all records in this batch.
                  </p>
                </div>
              )}

              {!adjustmentMode && (
                <Button
                  onClick={editingBatch ? handleUpdateBatch : handleSave}
                  disabled={saving || (!customAmountMode && (!bonusAmount || selectedEmployees.length === 0)) || (customAmountMode && selectedEmployees.length === 0)}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      {editingBatch ? 'Update Bonus Batch' : 'Distribute Bonus'}
                    </>
                  )}
                </Button>
              )}

              {editingBatch && (
                <Button
                  variant="secondary"
                  onClick={handleCancelEdit}
                  className="w-full"
                >
                  Cancel Edit
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          {(previewData.length > 0 || editingBatch) && (
            <Card>
              <CardHeader>
                  <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-secondary-900">Preview</h2>
                  <div className="flex gap-2">
                    {!adjustmentMode && (
                      <Button variant="secondary" size="sm" onClick={startAdjustment}>
                        <Edit className="w-4 h-4 mr-2" />
                        Adjust Amounts
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={handlePrintReport}>
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleDownloadPDF}>
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    {adjustmentMode && (
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={resetAdjustments}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset
                        </Button>
                        <Button variant="secondary" size="sm" onClick={cancelAdjustment}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving}>
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  {(() => {
                    console.log('Preview rendering:', { 
                      previewDataLength: previewData.length, 
                      adjustmentMode, 
                      customAmountMode,
                      firstPreviewItem: previewData[0],
                      selectedEmployeesLength: selectedEmployees.length,
                      adjustedAmountsKeys: Object.keys(adjustedAmounts).length
                    });
                    
                    // Use previewData if available, otherwise generate from selectedEmployees and adjustedAmounts
                    const dataToRender = previewData.length > 0 ? previewData : (
                      Object.keys(adjustedAmounts).length > 0 ? selectedEmployees.map(empId => {
                        const emp = employees.find(e => e.id === empId);
                        const amount = adjustedAmounts[empId] !== undefined ? adjustedAmounts[empId] : 0;
                        return {
                          employeeId: emp?.employeeId,
                          name: emp?.fullName,
                          id: empId,
                          amount: amount.toFixed(2),
                          isAdjusted: adjustedAmounts[empId] !== undefined
                        };
                      }) : []
                    );
                    
                    console.log('Data to render:', dataToRender.length);
                    
                    // Group preview data by work location
                    const groupedByLocation: { [key: string]: { locationName: string; employees: any[] } } = {};
                    
                    dataToRender.forEach((item) => {
                      const emp = employees.find(e => e.id === item.id);
                      const assignedLocation = workLocations.find(loc => 
                        loc.assignedStaff?.includes(emp?.id)
                      );
                      const locationName = assignedLocation?.name || 'Unassigned';
                      
                      if (!groupedByLocation[locationName]) {
                        groupedByLocation[locationName] = {
                          locationName,
                          employees: []
                        };
                      }
                      groupedByLocation[locationName].employees.push(item);
                    });

                    return Object.entries(groupedByLocation).map(([locationKey, locationData]) => (
                      <div key={locationKey} className="mb-4">
                        <div className="bg-secondary-100 px-3 py-2 rounded-t-lg">
                          <p className="text-sm font-semibold text-secondary-900">{locationData.locationName}</p>
                          <p className="text-xs text-secondary-600">{locationData.employees.length} employees</p>
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-secondary-200">
                              <th className="text-left py-2 px-3 text-sm font-medium text-secondary-700">Employee ID</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-secondary-700">Name</th>
                              <th className="text-right py-2 px-3 text-sm font-medium text-secondary-700">Amount</th>
                              {editingBatch && (
                                <th className="text-right py-2 px-3 text-sm font-medium text-secondary-700">Actions</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {locationData.employees.map((item) => (
                              <tr key={item.id} className="border-b border-secondary-100">
                                <td className="py-2 px-3 text-sm text-secondary-600">{item.employeeId}</td>
                                <td className="py-2 px-3 text-sm text-secondary-900">{item.name}</td>
                                <td className="py-2 px-3 text-sm text-secondary-900 text-right">
                                  {(() => {
                                    console.log('Render check:', { 
                                      customAmountMode, 
                                      adjustmentMode, 
                                      empId: item.id, 
                                      adjustedAmount: adjustedAmounts[item.id],
                                      itemAmount: item.amount 
                                    });
                                    
                                    if (customAmountMode) {
                                      return (
                                        <input
                                          type="number"
                                          value={customAmounts[item.id] || ''}
                                          onChange={(e) => setCustomAmounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                          step="0.01"
                                          min="0"
                                          className="w-24 text-right px-2 py-1 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                                          placeholder="0.00"
                                        />
                                      );
                                    } else if (adjustmentMode) {
                                      return (
                                        <input
                                          type="number"
                                          value={adjustedAmounts[item.id] !== undefined ? adjustedAmounts[item.id] : item.amount}
                                          onChange={(e) => handleAmountChange(item.id, parseFloat(e.target.value) || 0)}
                                          step="0.01"
                                          className={`w-24 text-right px-2 py-1 border rounded ${
                                            adjustedAmounts[item.id] !== undefined
                                              ? 'border-primary-500 bg-primary-50' 
                                              : 'border-secondary-300'
                                          }`}
                                        />
                                      );
                                    } else {
                                      return (
                                        <span className={`font-medium ${item.isAdjusted ? 'text-primary-700' : ''}`}>
                                          MVR {item.amount}
                                        </span>
                                      );
                                    }
                                  })()}
                                </td>
                                {editingBatch && (
                                  <td className="py-2 px-3 text-sm text-right">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleRemoveEmployee(item.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ));
                  })()}
                </div>
                {adjustmentMode && (
                    <>
                      <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-sm font-medium text-purple-900 mb-3">
                          Bulk Adjustment ({bulkSelectedEmployees.size} selected)
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            id="dontRedistribute"
                            checked={dontRedistribute}
                            onChange={(e) => setDontRedistribute(e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                          <label htmlFor="dontRedistribute" className="text-sm text-purple-800">
                            Don't redistribute remaining amount to other employees
                          </label>
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-secondary-400">MVR</span>
                            <input
                              type="number"
                              value={bulkAmount}
                              onChange={(e) => setBulkAmount(e.target.value)}
                              className="w-full pl-12 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter amount"
                              step="0.01"
                            />
                          </div>
                          <Button
                            variant="secondary"
                            onClick={applyBulkAmount}
                            disabled={!bulkAmount || bulkSelectedEmployees.size === 0}
                            className="whitespace-nowrap"
                          >
                            Apply to Selected
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={recalculateRemaining}
                            disabled={bulkSelectedEmployees.size === 0}
                            className="whitespace-nowrap"
                          >
                            Recalculate Remaining
                          </Button>
                        </div>
                        {bulkSelectedEmployees.size > 0 && (
                          <div className="mt-2 text-sm text-purple-700 space-y-1">
                            {bulkAmount && (
                              <p>New total for selected: MVR {(parseFloat(bulkAmount) * bulkSelectedEmployees.size).toFixed(2)}</p>
                            )}
                            <p>Total for all employees: MVR {previewData.length > 0 ? Number(previewData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)).toFixed(2) : '0.00'}</p>
                          </div>
                        )}
                        <p className="text-xs text-purple-700 mt-2">
                          Select employees using checkboxes, then enter a bulk amount or recalculate remaining amount equally.
                        </p>
                      </div>
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          Adjust individual amounts above. The total will be maintained automatically.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
