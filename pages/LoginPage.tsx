import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, loginWithBiometric, getBiometricUsers } from '../services/authService';
import { Lock, User, Fingerprint, X } from 'lucide-react';
import { Logo } from '../components/Logo';
import { getStoredData, DEFAULT_SETTINGS } from '../services/dataService';
import { AppSettings, User as UserType } from '../types';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // Biometric State
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [biometricUsers, setBiometricUsers] = useState<UserType[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
      const storedSettings = getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS);
      setSettings(storedSettings);
      setBiometricUsers(getBiometricUsers());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Login function now accepts username, email, or phone
    const user = login(username, password);
    if (user) {
      onLogin();
      navigate('/');
    } else {
      setError('Data login salah. Periksa username/email/no.hp dan password.');
    }
  };

  const handleBiometricClick = () => {
      if (biometricUsers.length === 0) {
          alert("Belum ada user yang mengaktifkan login fingerprint di Pengaturan.");
          return;
      }
      setIsBiometricModalOpen(true);
      setBiometricStatus('idle');
  };

  const scanFingerprint = (userId: string) => {
      setBiometricStatus('scanning');
      
      // Simulate scanning delay
      setTimeout(() => {
          const user = loginWithBiometric(userId);
          if (user) {
              setBiometricStatus('success');
              setTimeout(() => {
                  onLogin();
                  navigate('/');
              }, 800);
          } else {
              setBiometricStatus('failed');
          }
      }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        {/* Header - Black Background for BRC */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-full blur-3xl opacity-20 transform translate-x-10 -translate-y-10"></div>
            
            <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-xl p-3 flex items-center justify-center shadow-lg overflow-hidden">
                 <Logo className="w-full h-full" src={settings.logoUrl} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">{settings.companyName}</h2>
            <p className="text-red-400 text-sm font-medium tracking-widest mt-1 uppercase">{settings.tagline || 'MANAGEMENT SYSTEM'}</p>
        </div>
        
        <div className="p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Silahkan Login</h3>
            
            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username / Email / No. HP</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            required
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-colors"
                            placeholder="admin / user@mail.com / 0812..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="password"
                            required
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-colors"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                    Masuk Aplikasi
                </button>
            </form>

            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-slate-500">Atau login dengan</span>
                    </div>
                </div>

                <div className="mt-6 flex justify-center">
                    <button 
                        onClick={handleBiometricClick}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="p-4 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            <Fingerprint size={32} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 group-hover:text-indigo-600">Fingerprint</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Biometric Simulation Modal */}
        {isBiometricModalOpen && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <button 
                    onClick={() => setIsBiometricModalOpen(false)} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                    <X size={24} />
                </button>

                {biometricStatus === 'idle' && (
                    <div className="w-full max-w-xs space-y-4">
                        <h4 className="text-lg font-bold text-slate-800">Pilih Akun</h4>
                        <p className="text-sm text-slate-500">Sentuh sensor (klik akun) untuk login</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {biometricUsers.map(u => (
                                <button 
                                    key={u.id}
                                    onClick={() => scanFingerprint(u.id)}
                                    className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all text-left"
                                >
                                    <img src={u.image || `https://ui-avatars.com/api/?name=${u.name}`} className="w-10 h-10 rounded-full object-cover bg-slate-100" />
                                    <div>
                                        <p className="font-bold text-sm text-slate-800">{u.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{u.role}</p>
                                    </div>
                                    <Fingerprint size={20} className="ml-auto text-indigo-500 opacity-50" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {biometricStatus === 'scanning' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <Fingerprint size={64} className="text-slate-300" />
                            <div className="absolute inset-0 text-indigo-600 animate-pulse">
                                <Fingerprint size={64} />
                            </div>
                        </div>
                        <p className="font-bold text-slate-700">Memindai Sidik Jari...</p>
                    </div>
                )}

                {biometricStatus === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                         <div className="p-4 bg-green-100 text-green-600 rounded-full animate-bounce">
                             <Fingerprint size={40} />
                         </div>
                         <div>
                            <p className="font-bold text-lg text-green-700">Verifikasi Berhasil!</p>
                            <p className="text-sm text-slate-500">Mengarahkan ke dashboard...</p>
                         </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;