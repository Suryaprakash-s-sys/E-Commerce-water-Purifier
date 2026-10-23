import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, DealerProfile, Address } from '../types';

export const authService = {
  /**
   * Register a new customer
   */
  async registerCustomer(
    email: string,
    password: string,
    displayName: string,
    phone: string
  ): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });

    const userDoc: Omit<User, 'addresses'> & { addresses: Address[] } = {
      uid: credential.user.uid,
      email,
      displayName,
      phone,
      role: 'customer',
      addresses: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', credential.user.uid), {
      ...userDoc,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return userDoc;
  },

  /**
   * Register a new dealer (pending approval)
   */
  async registerDealer(
    email: string,
    password: string,
    displayName: string,
    phone: string,
    businessName: string,
    gstNumber: string,
    businessAddress: Address
  ): Promise<DealerProfile> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });

    const dealerDoc: Omit<DealerProfile, 'addresses'> & { addresses: Address[] } = {
      uid: credential.user.uid,
      email,
      displayName,
      phone,
      role: 'dealer',
      dealerStatus: 'pending',
      businessName,
      gstNumber,
      businessAddress,
      addresses: [businessAddress],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', credential.user.uid), {
      ...dealerDoc,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create dealer application record
    await setDoc(doc(db, 'dealerApplications', credential.user.uid), {
      uid: credential.user.uid,
      email,
      displayName,
      businessName,
      gstNumber,
      phone,
      status: 'pending',
      appliedAt: serverTimestamp(),
    });

    return dealerDoc;
  },

  /**
   * Sign in user and fetch role
   */
  async signIn(email: string, password: string): Promise<{ user: FirebaseUser; role: string }> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const userSnap = await getDoc(doc(db, 'users', credential.user.uid));
    
    if (!userSnap.exists()) {
      throw new Error('User profile not found. Please contact support.');
    }

    const userData = userSnap.data();
    
    // Check if dealer is approved
    if (userData.role === 'dealer' && userData.dealerStatus === 'rejected') {
      await signOut(auth);
      throw new Error('Your dealer application has been rejected. Please contact support.');
    }

    if (!userData.isActive) {
      await signOut(auth);
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    return { user: credential.user, role: userData.role };
  },

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    await signOut(auth);
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  /**
   * Get user profile from Firestore
   */
  async getUserProfile(uid: string): Promise<User | DealerProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate() ?? new Date(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
    } as User | DealerProfile;
  },

  /**
   * Update user profile
   */
  async updateProfile(uid: string, updates: Partial<User>): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Add or update address
   */
  async saveAddress(uid: string, address: Address, allAddresses: Address[]): Promise<void> {
    const idx = allAddresses.findIndex((a) => a.id === address.id);
    let updated: Address[];
    if (idx >= 0) {
      updated = allAddresses.map((a) => (a.id === address.id ? address : a));
    } else {
      updated = [...allAddresses, address];
    }
    // Enforce single default
    if (address.isDefault) {
      updated = updated.map((a) => ({ ...a, isDefault: a.id === address.id }));
    }
    await updateDoc(doc(db, 'users', uid), {
      addresses: updated,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Update FCM token
   */
  async updateFCMToken(uid: string, token: string): Promise<void> {
    await updateDoc(doc(db, 'users', uid), { fcmToken: token });
  },
};
