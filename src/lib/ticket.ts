import type { TicketRequest } from '../types';
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

// Re-export TicketRequest type for use in other modules
export type { TicketRequest };

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
  const parsed = new Date(timestamp);
  if (!isNaN(parsed.getTime())) return parsed;
  return undefined;
};

// Convert Firestore document to TicketRequest
const firestoreToTicketRequest = (doc: any): TicketRequest => {
  const data = doc.data();
  return {
    id: doc.id,
    employeeId: data.employeeId,
    leaveId: data.leaveId,
    departureCity: data.departureCity,
    destinationCity: data.destinationCity,
    departureDate: timestampToDate(data.departureDate) || new Date(),
    returnDate: timestampToDate(data.returnDate) || new Date(),
    departureTime: data.departureTime,
    arrivalTime: data.arrivalTime,
    ticketType: data.ticketType || 'round_trip',
    passengers: data.passengers || 1,
    specialRequests: data.specialRequests,
    status: data.status || 'price_requested',
    bookedDate: timestampToDate(data.bookedDate) || new Date(),
    updatedAt: timestampToDate(data.updatedAt),
    ticketPrice: data.ticketPrice,
    vanArrangedTime: timestampToDate(data.vanArrangedTime),
    arrangedBy: data.arrangedBy,
    arrangedByName: data.arrangedByName,
    settlementAmount: data.settlementAmount,
    settlementDate: timestampToDate(data.settlementDate),
    settlementHandedTo: data.settlementHandedTo,
    passportCollectedBy: data.passportCollectedBy,
    passportCollectedDate: timestampToDate(data.passportCollectedDate),
    passportHandedTo: data.passportHandedTo,
    passportHandedDate: timestampToDate(data.passportHandedDate),
    vehicleDriver: data.vehicleDriver,
    vehicleNumber: data.vehicleNumber,
    isLeaveExtended: data.isLeaveExtended,
    originalReturnDate: timestampToDate(data.originalReturnDate),
    isTicketChanged: data.isTicketChanged,
    changeReason: data.changeReason,
    returnFlightReminderSent: data.returnFlightReminderSent,
    staffPickedUp: data.staffPickedUp,
    staffPickupTime: timestampToDate(data.staffPickupTime),
  };
};

// Create ticket request
export const createTicketRequest = async (data: Omit<TicketRequest, 'id' | 'bookedDate' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, 'ticketRequests'), {
    ...data,
    bookedDate: new Date(),
    updatedAt: new Date()
  });
  return docRef.id;
};

// Get ticket request by ID
export const getTicketRequest = async (id: string) => {
  const docRef = doc(db, 'ticketRequests', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return firestoreToTicketRequest(docSnap);
  }
  return null;
};

// Get all ticket requests
export const getAllTicketRequests = async () => {
  const q = query(collection(db, 'ticketRequests'), orderBy('bookedDate', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(firestoreToTicketRequest);
};

// Get ticket requests by employee
export const getTicketRequestsByEmployee = async (employeeId: string) => {
  const q = query(
    collection(db, 'ticketRequests'),
    where('employeeId', '==', employeeId),
    orderBy('bookedDate', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(firestoreToTicketRequest);
};

// Get ticket requests by leave
export const getTicketRequestsByLeave = async (leaveId: string) => {
  const q = query(
    collection(db, 'ticketRequests'),
    where('leaveId', '==', leaveId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(firestoreToTicketRequest);
};

// Update ticket request
export const updateTicketRequest = async (id: string, data: Partial<TicketRequest>) => {
  const docRef = doc(db, 'ticketRequests', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date()
  });
};

// Update ticket status
export const updateTicketStatus = async (id: string, status: TicketRequest['status']) => {
  await updateTicketRequest(id, { status });
};

// Delete ticket request
export const deleteTicketRequest = async (id: string) => {
  const docRef = doc(db, 'ticketRequests', id);
  await deleteDoc(docRef);
};
