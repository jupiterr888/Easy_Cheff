import { auth, db } from '../backend/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc,
  Timestamp,
  arrayUnion 
} from 'firebase/firestore';

export interface AdminRequest {
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}

export interface UserInfo {
  uid: string;
  displayName: string;
  email?: string;
  isAdmin?: boolean;
}

export interface RecipeForApproval {
  id: string;
  title: string;
  authorId: string;
  authorName?: string;
  createdAt: Timestamp;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Timestamp;
}

// Creează o cerere de admin
export const createAdminRequest = async (userId: string, userName: string, userEmail: string) => {
  try {
    const adminRequestRef = doc(db, 'adminRequests', userId);
    
    await setDoc(adminRequestRef, {
      userId,
      userName,
      userEmail,
      status: 'pending',
      requestedAt: Timestamp.now()
    });

    console.log('[AdminService] Admin request created for user:', userId);
    return true;
  } catch (error) {
    console.error('[AdminService] Error creating admin request:', error);
    throw error;
  }
};

// Obține toate cererile de admin în așteptare
export const getPendingAdminRequests = async () => {
  try {
    const requestsRef = collection(db, 'adminRequests');
    const q = query(requestsRef, where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    const requests: AdminRequest[] = [];
    querySnapshot.forEach((doc) => {
      requests.push(doc.data() as AdminRequest);
    });

    console.log('[AdminService] Retrieved pending admin requests:', requests.length);
    return requests;
  } catch (error) {
    console.error('[AdminService] Error fetching pending requests:', error);
    throw error;
  }
};

// Obține toate cererile de admin (toate statusurile)
export const getAllAdminRequests = async () => {
  try {
    const requestsRef = collection(db, 'adminRequests');
    const querySnapshot = await getDocs(requestsRef);
    
    const requests: AdminRequest[] = [];
    querySnapshot.forEach((doc) => {
      requests.push(doc.data() as AdminRequest);
    });

    return requests;
  } catch (error) {
    console.error('[AdminService] Error fetching all requests:', error);
    throw error;
  }
};

// Aprobă o cerere de admin
export const approveAdminRequest = async (userId: string, adminId: string) => {
  try {
    // Actualizează cererea
    const adminRequestRef = doc(db, 'adminRequests', userId);
    await updateDoc(adminRequestRef, {
      status: 'approved',
      reviewedAt: Timestamp.now(),
      reviewedBy: adminId
    });

    // Actualizează userul - marcheaza ca admin
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isAdmin: true,
      adminApprovedAt: Timestamp.now(),
      adminApprovedBy: adminId
    });

    console.log('[AdminService] Admin request approved for user:', userId);
    return true;
  } catch (error) {
    console.error('[AdminService] Error approving admin request:', error);
    throw error;
  }
};

// Respinge o cerere de admin
export const rejectAdminRequest = async (userId: string, adminId: string, reason?: string) => {
  try {
    const adminRequestRef = doc(db, 'adminRequests', userId);
    await updateDoc(adminRequestRef, {
      status: 'rejected',
      reviewedAt: Timestamp.now(),
      reviewedBy: adminId,
      rejectionReason: reason || ''
    });

    console.log('[AdminService] Admin request rejected for user:', userId);
    return true;
  } catch (error) {
    console.error('[AdminService] Error rejecting admin request:', error);
    throw error;
  }
};

// Verifică dacă utilizatorul este admin
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.isAdmin === true;
    }

    return false;
  } catch (error) {
    console.error('[AdminService] Error checking admin status:', error);
    return false;
  }
};

// Obține statusul actual al cererii de admin pentru un utilizator
export const getAdminRequestStatus = async (userId: string) => {
  try {
    const adminRequestRef = doc(db, 'adminRequests', userId);
    const adminRequestDoc = await getDoc(adminRequestRef);

    if (adminRequestDoc.exists()) {
      return adminRequestDoc.data() as AdminRequest;
    }

    return null;
  } catch (error) {
    console.error('[AdminService] Error fetching admin request status:', error);
    return null;
  }
};

// Creează contul de admin de inițiere (doar pentru setup)
export const createFirstAdmin = async (userId: string, userName: string, userEmail: string) => {
  try {
    // Actualizează userul ca admin
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isAdmin: true,
      adminApprovedAt: Timestamp.now(),
      adminApprovedBy: 'system'
    });

    // Creează o intrare în adminRequests marcat ca auto-approved
    const adminRequestRef = doc(db, 'adminRequests', userId);
    await setDoc(adminRequestRef, {
      userId,
      userName,
      userEmail,
      status: 'approved',
      requestedAt: Timestamp.now(),
      reviewedAt: Timestamp.now(),
      reviewedBy: 'system'
    });

    console.log('[AdminService] First admin account created:', userId);
    return true;
  } catch (error) {
    console.error('[AdminService] Error creating first admin:', error);
    throw error;
  }
};

// ==================== RECIPE APPROVAL FUNCTIONS ====================

// Obține rețetele neaprobate
export const getUnapprovedRecipes = async () => {
  try {
    const recipesRef = collection(db, 'recipes');
    const q = query(recipesRef, where('approved', '==', false));
    const querySnapshot = await getDocs(q);

    const recipes: RecipeForApproval[] = [];
    querySnapshot.forEach((doc) => {
      recipes.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || Timestamp.now()
      } as RecipeForApproval);
    });

    console.log('[AdminService] Retrieved unapproved recipes:', recipes.length);
    return recipes;
  } catch (error) {
    console.error('[AdminService] Error fetching unapproved recipes:', error);
    throw error;
  }
};

// Aprobă o rețetă
export const approveRecipe = async (recipeId: string, adminId: string) => {
  try {
    const recipeRef = doc(db, 'recipes', recipeId);
    await updateDoc(recipeRef, {
      approved: true,
      approvedBy: adminId,
      approvedAt: Timestamp.now()
    });

    console.log('[AdminService] Recipe approved:', recipeId);
    return true;
  } catch (error) {
    console.error('[AdminService] Error approving recipe:', error);
    throw error;
  }
};

// Respinge o rețetă
export const rejectRecipe = async (recipeId: string, adminId: string) => {
  try {
    const recipeRef = doc(db, 'recipes', recipeId);
    await updateDoc(recipeRef, {
      approved: false,
      rejectedBy: adminId,
      rejectedAt: Timestamp.now()
    });

    console.log('[AdminService] Recipe rejected:', recipeId);
    return true;
  } catch (error) {
    console.error('[AdminService] Error rejecting recipe:', error);
    throw error;
  }
};

// ==================== USERS MANAGEMENT FUNCTIONS ====================

// Obține lista tuturor utilizatorilor
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);

    const users: UserInfo[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        displayName: data.displayName || 'Unknown',
        email: data.email,
        isAdmin: data.isAdmin || false
      });
    });

    console.log('[AdminService] Retrieved all users:', users.length);
    return users;
  } catch (error) {
    console.error('[AdminService] Error fetching all users:', error);
    throw error;
  }
};

// Obține lista tuturor adminilor
export const getAllAdmins = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isAdmin', '==', true));
    const querySnapshot = await getDocs(q);

    const admins: UserInfo[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      admins.push({
        uid: doc.id,
        displayName: data.displayName || 'Unknown',
        email: data.email,
        isAdmin: true
      });
    });

    console.log('[AdminService] Retrieved all admins:', admins.length);
    return admins;
  } catch (error) {
    console.error('[AdminService] Error fetching all admins:', error);
    throw error;
  }
};

// ==================== USER STATISTICS FUNCTIONS ====================

// Obține statistici pentru un utilizator
export const getUserStatistics = async (userId: string) => {
  try {
    const recipesRef = collection(db, 'recipes');
    const q = query(recipesRef, where('authorId', '==', userId));
    const querySnapshot = await getDocs(q);

    let totalRecipes = 0;
    let approvedRecipes = 0;
    let pendingRecipes = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalRecipes++;
      if (data.approved === true) {
        approvedRecipes++;
      } else if (data.approved === false) {
        pendingRecipes++;
      }
    });

    console.log('[AdminService] Retrieved user statistics for:', userId);
    return {
      totalRecipes,
      approvedRecipes,
      pendingRecipes
    };
  } catch (error) {
    console.error('[AdminService] Error fetching user statistics:', error);
    throw error;
  }
};

// Obține statistici pentru toți utilizatorii (mai lent, dar util pentru overview)
export const getAllUsersStatistics = async () => {
  try {
    const users = await getAllUsers();
    const stats: { [key: string]: { name: string; email?: string; totalRecipes: number; approvedRecipes: number; pendingRecipes: number } } = {};

    for (const user of users) {
      const userStats = await getUserStatistics(user.uid);
      stats[user.uid] = {
        name: user.displayName,
        email: user.email,
        ...userStats
      };
    }

    console.log('[AdminService] Retrieved statistics for all users');
    return stats;
  } catch (error) {
    console.error('[AdminService] Error fetching all users statistics:', error);
    throw error;
  }
};
