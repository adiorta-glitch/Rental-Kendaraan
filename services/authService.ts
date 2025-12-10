
import { User, Driver } from '../types';
import { getStoredData, setStoredData } from './dataService';

const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    username: 'super',
    password: '123',
    name: 'Super Admin',
    email: 'super@brc.com',
    phone: '081200000000',
    role: 'superadmin',
    image: 'https://i.pravatar.cc/150?u=super',
    hasFingerprint: true
  },
  {
    id: 'u2',
    username: 'admin',
    password: '123',
    name: 'Staff Operasional',
    email: 'admin@brc.com',
    phone: '081211111111',
    role: 'admin',
    image: 'https://i.pravatar.cc/150?u=admin',
    hasFingerprint: false
  },
  {
    id: 'u3',
    username: 'driver',
    password: '123',
    name: 'Pak Asep', // Matches Mock Driver Name
    email: 'asep@driver.com',
    phone: '08122334455',
    role: 'driver',
    linkedDriverId: 'd1', // Links to Driver ID d1
    image: 'https://i.pravatar.cc/150?u=d1',
    hasFingerprint: true
  },
  {
    id: 'u4',
    username: 'mitra',
    password: '123',
    name: 'Budi Santoso', // Matches Mock Partner Name
    email: 'budi@mitra.com',
    phone: '08123456789',
    role: 'partner',
    linkedPartnerId: 'p1', // Links to Partner ID p1
    image: 'https://i.pravatar.cc/150?u=p1'
  }
];

// Initialize users in local storage if not exist, OR update if roles are stale
const initAuth = () => {
    const storedUsers = localStorage.getItem('users');
    
    if (!storedUsers) {
        setStoredData('users', INITIAL_USERS);
    } else {
        // Fix for missing Settings menu: 
        // Check if the 'super' user has the correct 'superadmin' role in storage.
        // If not (due to old data), force update it.
        const users = JSON.parse(storedUsers) as User[];
        const superUser = users.find(u => u.username === 'super');
        
        if (!superUser || superUser.role !== 'superadmin') {
            // Merge initial users with stored users to ensure superadmin exists and is correct
            // We keep created users, but ensure default users are up to date
            const mergedUsers = [...INITIAL_USERS];
            users.forEach(u => {
                if (!mergedUsers.find(mu => mu.username === u.username)) {
                    mergedUsers.push(u);
                }
            });
            setStoredData('users', mergedUsers);
        }
    }
}

export const login = (identifier: string, password: string): User | null => {
  initAuth();
  const users = getStoredData<User[]>('users', INITIAL_USERS);
  
  // Allow login by Username, Email, or Phone
  const user = users.find(u => 
    (u.username === identifier || u.email === identifier || u.phone === identifier) && 
    u.password === password
  );
  
  if (user) {
    const { password, ...userWithoutPassword } = user;
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    return userWithoutPassword as User;
  }
  return null;
};

// Simulate Biometric Login
export const loginWithBiometric = (userId: string): User | null => {
  initAuth();
  const users = getStoredData<User[]>('users', INITIAL_USERS);
  const user = users.find(u => u.id === userId && u.hasFingerprint);
  
  if (user) {
    const { password, ...userWithoutPassword } = user;
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    return userWithoutPassword as User;
  }
  return null;
}

export const logout = () => {
  localStorage.removeItem('currentUser');
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem('currentUser');
  return stored ? JSON.parse(stored) : null;
};

export const getUsers = (): User[] => {
    initAuth();
    return getStoredData<User[]>('users', []);
}

// Get list of users who have enabled fingerprint (for Login screen selection)
export const getBiometricUsers = (): User[] => {
    initAuth();
    return getStoredData<User[]>('users', []).filter(u => u.hasFingerprint);
}

export const saveUser = (user: User) => {
    initAuth();
    const users = getStoredData<User[]>('users', []);
    const exists = users.find(u => u.id === user.id);
    let newUsers;
    if (exists) {
        newUsers = users.map(u => u.id === user.id ? user : u);
    } else {
        newUsers = [...users, user];
    }
    setStoredData('users', newUsers);
}

export const deleteUser = (id: string) => {
    initAuth();
    const users = getStoredData<User[]>('users', []);
    setStoredData('users', users.filter(u => u.id !== id));
}
