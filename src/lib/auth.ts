import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User, UserRole } from '../types';

// Role permissions configuration
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: [
    'all',
    'manage_users',
    'manage_employees',
    'manage_departments',
    'manage_payroll',
    'manage_attendance',
    'manage_leaves',
    'manage_overtime',
    'manage_reports',
    'approve_all',
    'system_settings'
  ],
  hr_manager: [
    'view_dashboard',
    'manage_employees',
    'manage_attendance',
    'manage_leaves',
    'manage_overtime',
    'manage_payroll',
    'view_reports',
    'approve_leaves',
    'approve_overtime',
    'generate_documents'
  ],
  department_manager: [
    'view_dashboard',
    'view_department_employees',
    'manage_department_attendance',
    'approve_department_leaves',
    'approve_department_overtime',
    'view_department_reports'
  ],
  supervisor: [
    'view_dashboard',
    'view_team_employees',
    'approve_team_leaves',
    'approve_team_overtime',
    'view_team_attendance'
  ],
  employee: [
    'view_own_profile',
    'view_own_attendance',
    'apply_leave',
    'apply_overtime',
    'view_own_payslips',
    'view_own_documents'
  ]
};

export const hasPermission = (role: UserRole, permission: string): boolean => {
  return ROLE_PERMISSIONS[role].includes('all') || ROLE_PERMISSIONS[role].includes(permission);
};

// Authentication functions
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Try to get user data from Firestore, but don't fail if it doesn't exist
    let userData = null;
    try {
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        userData = userDoc.data() as User;
      } else {
        // Create default user document if it doesn't exist
        const defaultUserData: User = {
          id: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: userCredential.user.displayName || '',
          role: 'super_admin', // Default to super admin for first user
          department: 'Administration',
          employeeId: 'EMP001',
          photoURL: userCredential.user.photoURL || '',
          createdAt: new Date(),
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), defaultUserData);
        userData = defaultUserData;
      }
    } catch (firestoreError) {
      console.warn('Firestore not configured, using basic user data:', firestoreError);
      // Return basic user data if Firestore is not available
      userData = {
        id: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: userCredential.user.displayName || '',
        role: 'super_admin',
        department: 'Administration',
        employeeId: 'EMP001',
        photoURL: userCredential.user.photoURL || '',
        createdAt: new Date(),
      };
    }
    
    return { user: userCredential.user, userData };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signUp = async (email: string, password: string, userData: Partial<User>) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    const newUser: User = {
      id: userCredential.user.uid,
      email: userCredential.user.email!,
      displayName: userData.displayName || '',
      role: userData.role || 'employee',
      department: userData.department,
      employeeId: userData.employeeId,
      photoURL: userData.photoURL,
      createdAt: new Date(),
    };
    
    await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
    
    return { user: userCredential.user, userData: newUser };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const createUser = async (email: string, password: string, userData: Partial<User>) => {
  try {
    let userCredential;

    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // If user already exists in Firebase Auth, try to sign them in to get their UID
      if (error.code === 'auth/email-already-in-use') {
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (signInError) {
          // If sign in fails (wrong password), throw original error
          throw new Error('Email already exists with a different password. Please use a different email or contact the administrator.');
        }
      } else {
        throw error;
      }
    }

    const newUser: User = {
      id: userCredential.user.uid,
      email: userCredential.user.email!,
      displayName: userData.displayName || '',
      role: userData.role || 'employee',
      department: userData.department || '',
      employeeId: userData.employeeId || '',
      photoURL: userData.photoURL || userCredential.user.photoURL || '',
      createdAt: new Date(),
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), newUser, { merge: true });

    return newUser;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

export const listUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users: User[] = [];
    usersSnapshot.forEach((doc) => {
      users.push(doc.data() as User);
    });
    return users;
  } catch (error) {
    console.error('List users error:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, userData: Partial<User>) => {
  try {
    await updateDoc(doc(db, 'users', userId), userData);
    return true;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    return true;
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      unsubscribe();
      
      if (!firebaseUser) {
        resolve(null);
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          resolve(userDoc.data() as User);
        } else {
          resolve(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        resolve(null);
      }
    });
  });
};

export const onAuthChange =(callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        callback(userDoc.data() as User);
      } else {
        // Create default user document if it doesn't exist
        const defaultUserData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || '',
          role: 'super_admin',
          department: 'Administration',
          employeeId: 'EMP001',
          photoURL: firebaseUser.photoURL ?? undefined,
          createdAt: new Date(),
        };
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), defaultUserData);
          callback(defaultUserData);
        } catch (setDocError) {
          console.warn('Could not create user document, using basic data:', setDocError);
          callback(defaultUserData);
        }
      }
    } catch (error) {
      console.warn('Error in auth change listener, using basic user data:', error);
      // Return basic user data if Firestore is not available
      const basicUserData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || '',
        role: 'super_admin',
        department: 'Administration',
        employeeId: 'EMP001',
        photoURL: firebaseUser.photoURL ?? undefined,
        createdAt: new Date(),
      };
      callback(basicUserData);
    }
  });
};
