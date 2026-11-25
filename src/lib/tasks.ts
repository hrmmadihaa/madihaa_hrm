import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Task, TaskAttachment, TaskLink, TaskComment, TaskNotification } from '../types';

// Task CRUD Operations
export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const taskData = {
    ...task,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, 'tasks'), taskData);
  return docRef.id;
};

export const getTask = async (taskId: string): Promise<Task | null> => {
  const docRef = doc(db, 'tasks', taskId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    dueDate: data.dueDate?.toDate(),
    completedAt: data.completedAt?.toDate()
  } as Task;
};

export const getTasksByAssignee = async (userId: string): Promise<Task[]> => {
  // Try querying by employeeId first
  try {
    const q = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate(),
        completedAt: data.completedAt?.toDate()
      } as Task;
    });
  } catch (error) {
    // If index error, try without orderBy
    const q = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const tasks = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate(),
        completedAt: data.completedAt?.toDate()
      } as Task;
    });
    // Sort manually
    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
};

export const getTasksByAssigner = async (userId: string): Promise<Task[]> => {
  // Try querying by employeeId first
  try {
    const q = query(
      collection(db, 'tasks'),
      where('assignedBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate(),
        completedAt: data.completedAt?.toDate()
      } as Task;
    });
  } catch (error) {
    // If index error, try without orderBy
    const q = query(
      collection(db, 'tasks'),
      where('assignedBy', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const tasks = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate(),
        completedAt: data.completedAt?.toDate()
      } as Task;
    });
    // Sort manually
    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
};

export const getAllTasks = async (): Promise<Task[]> => {
  const q = query(
    collection(db, 'tasks'),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      dueDate: data.dueDate?.toDate(),
      completedAt: data.completedAt?.toDate()
    } as Task;
  });
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  const taskRef = doc(db, 'tasks', taskId);
  const updateData = {
    ...updates,
    updatedAt: serverTimestamp()
  };
  await updateDoc(taskRef, updateData);
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await deleteDoc(doc(db, 'tasks', taskId));
};

// Task Attachments
export const addTaskAttachment = async (taskId: string, attachment: Omit<TaskAttachment, 'id'>): Promise<string> => {
  const attachmentData = {
    ...attachment,
    uploadedAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, `tasks/${taskId}/attachments`), attachmentData);
  return docRef.id;
};

export const getTaskAttachments = async (taskId: string): Promise<TaskAttachment[]> => {
  const q = query(collection(db, `tasks/${taskId}/attachments`), orderBy('uploadedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      uploadedAt: data.uploadedAt?.toDate() || new Date()
    } as TaskAttachment;
  });
};

export const deleteTaskAttachment = async (taskId: string, attachmentId: string): Promise<void> => {
  await deleteDoc(doc(db, `tasks/${taskId}/attachments`, attachmentId));
};

// Task Links
export const addTaskLink = async (taskId: string, link: Omit<TaskLink, 'id'>): Promise<string> => {
  const linkData = {
    ...link,
    addedAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, `tasks/${taskId}/links`), linkData);
  return docRef.id;
};

export const getTaskLinks = async (taskId: string): Promise<TaskLink[]> => {
  const q = query(collection(db, `tasks/${taskId}/links`), orderBy('addedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      addedAt: data.addedAt?.toDate() || new Date()
    } as TaskLink;
  });
};

export const deleteTaskLink = async (taskId: string, linkId: string): Promise<void> => {
  await deleteDoc(doc(db, `tasks/${taskId}/links`, linkId));
};

// Task Comments
export const addTaskComment = async (taskId: string, comment: Omit<TaskComment, 'id'>): Promise<string> => {
  const commentData = {
    ...comment,
    createdAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, `tasks/${taskId}/comments`), commentData);
  return docRef.id;
};

export const getTaskComments = async (taskId: string): Promise<TaskComment[]> => {
  const q = query(collection(db, `tasks/${taskId}/comments`), orderBy('createdAt', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date()
    } as TaskComment;
  });
};

export const deleteTaskComment = async (taskId: string, commentId: string): Promise<void> => {
  await deleteDoc(doc(db, `tasks/${taskId}/comments`, commentId));
};

// Task Notifications
export const createTaskNotification = async (notification: Omit<TaskNotification, 'id' | 'createdAt' | 'read' | 'dismissed'>): Promise<string> => {
  const notificationData = {
    ...notification,
    read: false,
    dismissed: false,
    createdAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, 'task_notifications'), notificationData);
  return docRef.id;
};

export const getTaskNotifications = async (userId: string): Promise<TaskNotification[]> => {
  const q = query(
    collection(db, 'task_notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date()
    } as TaskNotification;
  });
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await updateDoc(doc(db, 'task_notifications', notificationId), { read: true });
};

export const dismissNotification = async (notificationId: string): Promise<void> => {
  await updateDoc(doc(db, 'task_notifications', notificationId), { dismissed: true });
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const q = query(
    collection(db, 'task_notifications'),
    where('userId', '==', userId),
    where('read', '==', false),
    where('dismissed', '==', false)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, 'task_notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  
  const querySnapshot = await getDocs(q);
  const batch = querySnapshot.docs.map(doc => updateDoc(doc.ref, { read: true }));
  await Promise.all(batch);
};
