import { collection, addDoc, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface ActivityLog {
  id?: string;
  userId: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  timestamp: Timestamp;
}

/**
 * Log an activity to Firestore
 */
export const logActivity = async (
  action: string,
  entity: string,
  entityId?: string,
  details?: string
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('Activity log: No authenticated user');
      return;
    }

    await addDoc(collection(db, 'activity_logs'), {
      userId: user.uid,
      userEmail: user.email || 'unknown',
      action,
      entity,
      entityId,
      details,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

/**
 * Get a real-time listener for recent activities
 */
export const subscribeToRecentActivities = (
  callback: (activities: ActivityLog[]) => void,
  limitCount: number = 20
) => {
  const q = query(
    collection(db, 'activity_logs'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActivityLog));
    callback(activities);
  }, (error) => {
    console.error('Error subscribing to activity logs:', error);
  });

  return unsubscribe;
};
