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
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { db } from './firebase';
import type { Task, TaskAttachment, TaskLink, TaskComment, TaskNotification, TaskTemplate } from '../types';

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
  const notifications = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date()
    } as TaskNotification;
  });

  // Filter notifications to only show tasks due today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const filteredNotifications: TaskNotification[] = [];

  for (const notification of notifications) {
    if (!notification.taskId) {
      // Keep notifications without taskId (e.g., system notifications)
      filteredNotifications.push(notification);
      continue;
    }

    try {
      // Get the task to check its due date
      const task = await getTask(notification.taskId);
      if (task && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        // Only show if task is due today
        if (dueDate.getTime() === today.getTime()) {
          filteredNotifications.push(notification);
        }
      } else {
        // If no due date, skip the notification
        continue;
      }
    } catch (error) {
      // If task doesn't exist, skip the notification
      console.log('Task not found for notification:', notification.taskId);
    }
  }

  return filteredNotifications;
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

// Cleanup function to remove recurrence fields from all tasks
export const cleanupRecurrenceData = async (): Promise<void> => {
  const tasksRef = collection(db, 'tasks');
  const querySnapshot = await getDocs(tasksRef);
  
  const batch = querySnapshot.docs.map(doc => {
    const data = doc.data();
    if (data.recurrenceType || data.recurrenceDays) {
      return updateDoc(doc.ref, {
        recurrenceType: deleteField(),
        recurrenceDays: deleteField()
      });
    }
    return Promise.resolve();
  });
  
  await Promise.all(batch);
  console.log(`Cleaned up recurrence data from ${batch.length} tasks`);
};

// Cleanup function to delete duplicate tasks (keep most recent for each title)
export const cleanupDuplicateTasks = async (): Promise<void> => {
  const tasksRef = collection(db, 'tasks');
  const querySnapshot = await getDocs(tasksRef);
  
  const tasks = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Task));
  
  // Group by title and assignee
  const taskGroups = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = `${task.title}_${task.assignedTo}`;
    if (!taskGroups.has(key)) {
      taskGroups.set(key, []);
    }
    taskGroups.get(key)!.push(task);
  }
  
  // For each group, keep only the most recent task and delete the rest
  let deletedCount = 0;
  for (const group of taskGroups.values()) {
    if (group.length <= 1) continue;
    
    // Sort by createdAt descending (most recent first)
    group.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Keep the first (most recent), delete the rest
    const toDelete = group.slice(1);
    for (const task of toDelete) {
      await deleteDoc(doc(db, 'tasks', task.id));
      deletedCount++;
    }
  }
  
  console.log(`Deleted ${deletedCount} duplicate tasks`);
};

// Task Template CRUD Operations
export const createTaskTemplate = async (template: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const templateData = {
    ...template,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, 'task_templates'), templateData);
  return docRef.id;
};

export const getTaskTemplates = async (): Promise<TaskTemplate[]> => {
  const q = query(collection(db, 'task_templates'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as TaskTemplate));
};

export const getTaskTemplate = async (id: string): Promise<TaskTemplate | null> => {
  const docRef = doc(db, 'task_templates', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as TaskTemplate;
  }
  return null;
};

export const updateTaskTemplate = async (id: string, data: Partial<Omit<TaskTemplate, 'id' | 'createdAt'>>): Promise<void> => {
  const docRef = doc(db, 'task_templates', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteTaskTemplate = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'task_templates', id));
};

// Generate tasks from template for a date range
export const generateTasksFromTemplate = async (
  templateId: string,
  startDate: Date,
  endDate: Date,
  createdBy: string,
  createdByName: string,
  createdByEmail: string
): Promise<{ created: number; skipped: number }> => {
  const template = await getTaskTemplate(templateId);
  if (!template || !template.isActive) {
    return { created: 0, skipped: 0 };
  }

  let created = 0;
  let skipped = 0;

  // Get all existing tasks for the assigned users
  const existingTasks: Task[] = [];
  for (const assignedUserId of template.assignedTo) {
    const userTasks = await getTasksByAssignee(assignedUserId);
    existingTasks.push(...userTasks);
  }

  // Generate dates based on recurrence type
  const dates: Date[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    if (template.recurrenceType === 'daily') {
      dates.push(new Date(current));
    } else if (template.recurrenceType === 'weekly' && template.recurrenceDays) {
      if (template.recurrenceDays.includes(current.getDay())) {
        dates.push(new Date(current));
      }
    }
    current.setDate(current.getDate() + 1);
  }

  // Create tasks for each date and each assigned user
  for (const assignedUserId of template.assignedTo) {
    for (const date of dates) {
      // Check if task already exists
      const exists = existingTasks.some(t =>
        t.title === template.title &&
        t.assignedTo === assignedUserId &&
        t.dueDate &&
        new Date(t.dueDate).toDateString() === date.toDateString()
      );

      if (exists) {
        skipped++;
        continue;
      }

      // Get user details
      const userTasks = await getTasksByAssignee(assignedUserId);
      const userTask = userTasks[0]; // Get any task to get user details
      
      try {
        const taskId = await createTask({
          title: template.title,
          description: template.description,
          type: template.type,
          status: 'pending',
          priority: template.priority,
          assignedTo: assignedUserId,
          assignedToName: userTask?.assignedToName || 'Unknown',
          assignedToEmail: userTask?.assignedToEmail || '',
          assignedBy: createdBy,
          assignedByName: createdByName,
          assignedByEmail: createdByEmail,
          dueDate: date,
          ...(template.dueTime && { dueTime: template.dueTime })
        });

        // Create notification
        await createTaskNotification({
          userId: assignedUserId,
          taskId: taskId,
          taskTitle: template.title,
          type: 'task_assigned',
          message: `You have been assigned a new task: ${template.title}`
        });

        created++;
      } catch (error: any) {
        // If task already exists, skip it
        if (error.code === 'already-exists' || error.message?.includes('already exists')) {
          skipped++;
          console.log('Task already exists, skipping');
        } else {
          console.error('Error creating task:', error);
          throw error;
        }
      }
    }
  }

  return { created, skipped };
};
