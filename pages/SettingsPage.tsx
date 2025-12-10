
import React, { useState, useEffect } from 'react';
import { AppSettings, User } from '../types';
import { getStoredData, setStoredData, DEFAULT_SETTINGS } from '../services/dataService';
import { getUsers, saveUser, deleteUser } from '../services/authService';
import { Save, Building, FileText, Upload, Trash2, List, Shield, UserCog, Check, X, MessageCircle, Eye, EyeOff, Fingerprint, Image as ImageIcon, Plus, Edit, HelpCircle, Palette, Moon, Sun } from 'lucide-react';
import { Logo } from '../components/Logo';

interface Props {
    currentUser: User;
}

const SettingsPage: React.FC<Props> = ({ currentUser }) => {
  const isSuperAdmin = currentUser.role === 'superadmin';
  const isAdmin = currentUser.role === 'admin';
  const isDriver = currentUser.role === 'driver';
  const isPartner = currentUser.role === 'partner';

  // Default tab based on role
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'general' : 'help');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [users, setUsers] = useState<User[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Users Form
  const [editingUserId, setEditingUserId] = useState<string | null>(null); // New: Track editing state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('admin');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [enableFingerprint, setEnableFingerprint] = useState(false);
  
  // Master Data State
  const [newCategory, setNewCategory] = useState('');
  const [newPackage, setNewPackage] = useState('');

  useEffect(() => {
    setSettings(getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS));
    setUsers(getUsers());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredData('appSettings', settings);
    setIsSaved(true);
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleThemeColorChange = (color: string) => {
      setSettings(prev => ({ ...prev, themeColor: color }));
      setIsSaved(false);
  };

  const toggleDarkMode = () => {
      setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
      setIsSaved(false);
  };

  // User Management
  const handleUserImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { 
        alert("Ukuran gambar user maks 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setUserImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditUser = (u: User) => {
      setEditingUserId(u.id);
      setUsername(u.username);
      setPassword(u.password || ''); // Populate password for simple edit
      setFullName(u.name);
      setEmail(u.email || '');
      setPhone(u.phone || '');
      setRole(u.role);
      setUserImage(u.image || null);
      setEnableFingerprint(u.hasFingerprint || false);
      
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetUserForm = () => {
      setEditingUserId(null);
      setUsername(''); 
      setPassword(''); 
      setFullName(''); 
      setEmail(''); 
      setPhone(''); 
      setUserImage(null); 
      setEnableFingerprint(false);
      setRole('admin');
  };

  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!username || !password || !fullName) return;
      
      const userPayload: User = {
          id: editingUserId || `u-${Date.now()}`,
          username,
          password,
          name: fullName,
          email,
          phone,
          role: role as any,
          image: userImage,
          hasFingerprint: enableFingerprint
      };

      saveUser(userPayload);
      setUsers(getUsers());
      resetUserForm();
  };

  const handleDeleteUser = (id: string) => {
      if (id === currentUser.id) return alert("Tidak bisa menghapus akun sendiri!");
      if (confirm("Hapus user ini?")) {
          deleteUser(id);
          setUsers(getUsers());
          if (editingUserId === id) resetUserForm();
      }
  };

  // Master Data Management
  const addCategory = () => {
      if(newCategory && !settings.carCategories.includes(newCategory)) {
          setSettings(prev => ({...prev, carCategories: [...prev.carCategories, newCategory]}));
          setNewCategory('');
      }
  };
  const removeCategory = (cat: string) => {
      setSettings(prev => ({...prev, carCategories: prev.carCategories.filter(c => c !== cat)}));
  };

  const addPackage = () => {
      if(newPackage && !settings.rentalPackages.includes(newPackage)) {
          setSettings(prev => ({...prev, rentalPackages: [...prev.rentalPackages, newPackage]}));
          setNewPackage('');
      }
  };
  const removePackage = (pkg: string) => {
      setSettings(prev => ({...prev, rentalPackages: prev.rentalPackages.filter(p => p !== pkg)}));
  };

  const THEME_OPTIONS = [
      { id: 'red', name: 'Merah (Default)', bg: 'bg-red-600' },
      { id: 'blue', name: 'Biru', bg: 'bg-blue-600' },
      { id: 'green', name: 'Hijau', bg: 'bg-green-600' },
      { id: 'purple', name: 'Ungu', bg: 'bg-purple-600' },
      { id: 'orange', name: 'Orange', bg: 'bg-orange-600' },
      { id: 'black', name: 'Hitam', bg: 'bg-slate-800' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Pengaturan & Bantuan</h2>
          <p className="text-slate-500 dark:text-slate-400">Konfigurasi sistem dan panduan penggunaan aplikasi.</p>
        </div>
        {isSaved && <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium animate-pulse">Tersimpan! Refreshing...</span>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
          {isSuperAdmin && (
              <>
                <button onClick={() => setActiveTab('general')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'general' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600'}`}>Umum & Invoice</button>
                <button onClick={() => setActiveTab('appearance')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'appearance' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600'}`}>Tampilan</button>
                <button onClick={() => setActiveTab('master')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'master' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600'}`}>Kategori & Paket</button>
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600'}`}>Manajemen User</button>
              </>
          )}
          <button onClick={() => setActiveTab('help')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'help' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600'}`}>Bantuan</button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          
          {/* HELP TAB (Visible to ALL roles) */}
          {activeTab === 'help' && (
              <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b dark:border-slate-700 pb-4">
                      <HelpCircle size={32} className="text-indigo-600" />
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Panduan Penggunaan</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Berikut adalah panduan fitur yang tersedia untuk Role: <span className="font-bold uppercase text-indigo-700 dark:text-indigo-400">{currentUser.role}</span></p>
                      </div>
                  </div>

                  {/* CONTENT FOR DRIVER */}
                  {isDriver && (
                      <div className="space-y-4">
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">1. Menu Tugas Saya</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Melihat daftar perjalanan yang ditugaskan kepada Anda. Klik tombol "List" atau "Map" untuk melihat detail tugas dan lokasi.</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">2. Menu Reimbursement</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Digunakan untuk mengajukan klaim biaya operasional seperti BBM, Tol, Parkir, atau Makan. Upload foto nota sebagai bukti.</p>
                          </div>
                      </div>
                  )}

                  {/* CONTENT FOR PARTNER */}
                  {isPartner && (
                      <div className="space-y-4">
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">1. Menu Pendapatan Saya</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Melihat ringkasan total unit mobil Anda, estimasi pendapatan bagi hasil, dan riwayat transaksi sewa.</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">2. Menu Unit Saya</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Melihat daftar mobil yang Anda titipkan. Anda bisa melihat status ketersediaan mobil.</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">3. Menu Riwayat Setoran</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Memantau status setoran bagi hasil yang dikirim oleh Admin. Status bisa berupa "Pending" (Belum cair) atau "Paid" (Sudah cair).</p>
                          </div>
                      </div>
                  )}

                  {/* CONTENT FOR ADMIN & SUPERADMIN */}
                  {(isAdmin || isSuperAdmin) && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">1. Dashboard</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Ringkasan unit ready, pendapatan harian, unit sedang jalan, dan kalender booking.</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">2. Booking & Jadwal</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Membuat reservasi baru, mengecek ketersediaan mobil/driver, melakukan checklist kendaraan, dan mencetak Invoice/Kontrak.</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">3. Tracking</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Memantau lokasi unit yang sedang jalan secara real-time (Simulasi) dan melihat detail driver yang bertugas.</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">4. Keuangan & Statistik</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300">Mencatat pengeluaran operasional, gaji, setoran mitra, dan melihat grafik analisis bisnis bulanan.</p>
                          </div>
                          {isSuperAdmin && (
                              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/50 col-span-full">
                                  <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2">5. Fitur Super Admin</h4>
                                  <p className="text-sm text-indigo-700 dark:text-indigo-200">
                                      - <strong>Pengaturan Umum:</strong> Ubah Logo, Nama Perusahaan, Footer Invoice.<br/>
                                      - <strong>Master Data:</strong> Tambah Kategori Mobil dan Paket Sewa.<br/>
                                      - <strong>Manajemen User:</strong> Tambah/Edit/Hapus akun untuk Staff, Driver, dan Mitra.<br/>
                                      - <strong>Hapus Data:</strong> Akses penuh untuk menghapus data booking, armada, dll.
                                  </p>
                              </div>
                          )}
                       </div>
                  )}
                  
                  <div className="mt-8 pt-6 border-t dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
                      <p>Butuh bantuan teknis lebih lanjut?</p>
                      <p className="font-medium text-slate-700 dark:text-slate-300">Hubungi IT Support: support@leodigitalsolution.com</p>
                  </div>
              </div>
          )}

          {activeTab === 'appearance' && isSuperAdmin && (
              <div className="space-y-8">
                  <div className="flex items-center gap-3 border-b dark:border-slate-700 pb-4">
                      <Palette size={32} className="text-indigo-600" />
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Tampilan Aplikasi</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Sesuaikan warna tema dan mode tampilan.</p>
                      </div>
                  </div>
                  
                  {/* Color Picker */}
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Warna Tema Utama</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                          {THEME_OPTIONS.map(option => (
                              <button 
                                  key={option.id}
                                  onClick={() => handleThemeColorChange(option.id)}
                                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.themeColor === option.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 scale-105 shadow-md' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                              >
                                  <div className={`w-8 h-8 rounded-full ${option.bg} shadow-sm`}></div>
                                  <span className={`text-sm font-medium ${settings.themeColor === option.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                      {option.name}
                                  </span>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Dark Mode Toggle */}
                  <div className="pt-6 border-t dark:border-slate-700">
                       <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Mode Tampilan</h4>
                       <div className="flex items-center gap-4">
                            <button
                                onClick={() => !settings.darkMode && toggleDarkMode()}
                                className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${!settings.darkMode ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >
                                <Sun size={24} /> Mode Terang (Light)
                            </button>
                            <button
                                onClick={() => settings.darkMode && toggleDarkMode()}
                                className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${settings.darkMode ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >
                                <Moon size={24} /> Mode Gelap (Dark)
                            </button>
                       </div>
                  </div>

                  <div className="pt-6 border-t dark:border-slate-700">
                     <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold w-full">Simpan Pengaturan Tampilan</button>
                  </div>
              </div>
          )}

          {activeTab === 'general' && isSuperAdmin && (
             <form onSubmit={handleSave} className="space-y-6">
                 {/* Only SuperAdmin can change Company Logo/Details? Assuming Yes for safety */}
                 <div className="flex items-center gap-6 pb-6 border-b dark:border-slate-700">
                     <div className="w-20 h-20 border rounded-lg p-2 flex items-center justify-center bg-white">
                         <Logo src={settings.logoUrl} />
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-2 dark:text-slate-200">Ganti Logo (Maks 500KB)</label>
                         <input disabled={!isSuperAdmin} type="file" accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                                 if (file.size > 500000) {
                                     alert("Ukuran file terlalu besar! Maksimal 500KB agar aplikasi berjalan lancar.");
                                     return;
                                 }
                                 const reader = new FileReader();
                                 reader.onloadend = () => setSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
                                 reader.readAsDataURL(file);
                             }
                         }} />
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Nama Perusahaan</label>
                         <input disabled={!isSuperAdmin} name="companyName" value={settings.companyName} onChange={handleChange} className="w-full border rounded p-2" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Tagline</label>
                         <input disabled={!isSuperAdmin} name="tagline" value={settings.tagline} onChange={handleChange} className="w-full border rounded p-2" />
                     </div>
                     <div className="md:col-span-2">
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Alamat</label>
                         <input disabled={!isSuperAdmin} name="address" value={settings.address} onChange={handleChange} className="w-full border rounded p-2" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Telepon</label>
                         <input disabled={!isSuperAdmin} name="phone" value={settings.phone} onChange={handleChange} className="w-full border rounded p-2" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Email</label>
                         <input disabled={!isSuperAdmin} name="email" value={settings.email} onChange={handleChange} className="w-full border rounded p-2" />
                     </div>
                     
                     {/* INVOICE TEXT SETTINGS */}
                     <div className="md:col-span-2 pt-4 border-t mt-2 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2"><FileText size={18}/> Konten Invoice PDF</h3>
                     </div>

                     <div className="md:col-span-2">
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Ketentuan Pembayaran (Muncul di Invoice)</label>
                         <textarea disabled={!isSuperAdmin} name="paymentTerms" value={settings.paymentTerms} onChange={handleChange} className="w-full border rounded p-2 text-sm" rows={3} placeholder="Masukkan nomor rekening dan ketentuan pembayaran..." />
                     </div>
                     
                     <div className="md:col-span-2">
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Syarat & Ketentuan Sewa (Muncul di Invoice)</label>
                         <textarea disabled={!isSuperAdmin} name="termsAndConditions" value={settings.termsAndConditions} onChange={handleChange} className="w-full border rounded p-2 text-sm" rows={4} placeholder="Poin-poin syarat sewa..." />
                     </div>

                     <div className="md:col-span-2">
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Footer (Paling Bawah)</label>
                         <textarea disabled={!isSuperAdmin} name="invoiceFooter" value={settings.invoiceFooter} onChange={handleChange} className="w-full border rounded p-2" rows={1} />
                     </div>

                     {/* WHATSAPP TEMPLATE */}
                     <div className="md:col-span-2 pt-4 border-t mt-2 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2"><MessageCircle size={18}/> Format Chat WhatsApp</h3>
                        <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-3 mb-2 text-xs text-slate-600 dark:text-slate-300">
                             <strong>Variabel Tersedia:</strong> <br/>
                             {`{invoiceNo}, {name}, {unit}, {startDate}, {endDate}, {total}, {paid}, {remaining}, {status}, {footer}`}
                        </div>
                        <textarea 
                             disabled={!isSuperAdmin} 
                             name="whatsappTemplate" 
                             value={settings.whatsappTemplate} 
                             onChange={handleChange} 
                             className="w-full border rounded p-2 text-sm font-mono" 
                             rows={10} 
                        />
                     </div>
                 </div>
                 {isSuperAdmin && <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">Simpan Pengaturan</button>}
             </form>
          )}

          {activeTab === 'master' && isSuperAdmin && (
              <div className="space-y-8">
                  {/* Car Categories */}
                  <div>
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200"><List size={20}/> Kategori Mobil</h3>
                      <div className="flex gap-2 mb-4">
                          <input 
                            className="border rounded p-2 flex-1" 
                            placeholder="Tambah Kategori (e.g. SUV, MPV)" 
                            value={newCategory} 
                            onChange={e => setNewCategory(e.target.value)}
                          />
                          <button onClick={addCategory} className="bg-indigo-600 text-white px-4 rounded font-bold hover:bg-indigo-700">Tambah</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {settings.carCategories.map(cat => (
                              <span key={cat} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-slate-200 dark:border-slate-600">
                                  {cat}
                                  <button onClick={() => removeCategory(cat)} className="text-slate-400 hover:text-red-600"><X size={14}/></button>
                              </span>
                          ))}
                      </div>
                  </div>

                  <div className="border-t pt-6 dark:border-slate-700">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200"><List size={20}/> Paket Sewa</h3>
                      <div className="flex gap-2 mb-4">
                          <input 
                            className="border rounded p-2 flex-1" 
                            placeholder="Tambah Paket (e.g. 12 Jam Dalam Kota)" 
                            value={newPackage} 
                            onChange={e => setNewPackage(e.target.value)}
                          />
                          <button onClick={addPackage} className="bg-indigo-600 text-white px-4 rounded font-bold hover:bg-indigo-700">Tambah</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {settings.rentalPackages.map(pkg => (
                              <span key={pkg} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-slate-200 dark:border-slate-600">
                                  {pkg}
                                  <button onClick={() => removePackage(pkg)} className="text-slate-400 hover:text-red-600"><X size={14}/></button>
                              </span>
                          ))}
                      </div>
                  </div>
                  
                  <div className="pt-6 border-t dark:border-slate-700">
                     <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold w-full">Simpan Master Data</button>
                  </div>
              </div>
          )}

          {activeTab === 'users' && isSuperAdmin && (
              <div className="space-y-8">
                  <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg border border-slate-100 dark:border-slate-600">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{editingUserId ? 'Edit User' : 'Tambah User Baru'}</h3>
                          {editingUserId && (
                              <button onClick={resetUserForm} className="text-sm text-red-600 hover:underline flex items-center gap-1">
                                  <X size={14}/> Batal Edit
                              </button>
                          )}
                      </div>
                      
                      <form onSubmit={handleSaveUser} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Nama Lengkap</label>
                                <input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border rounded p-2" placeholder="Nama Karyawan" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Role</label>
                                <select value={role} onChange={e => setRole(e.target.value)} className="w-full border rounded p-2">
                                    <option value="admin">Admin / Staff</option>
                                    <option value="driver">Driver</option>
                                    <option value="partner">Mitra</option>
                                    <option value="superadmin">Super Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Username</label>
                                <input required value={username} onChange={e => setUsername(e.target.value)} className="w-full border rounded p-2" placeholder="Username Login" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Password</label>
                                <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded p-2" placeholder="Password Login" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded p-2" placeholder="user@email.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Nomor Telepon</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded p-2" placeholder="0812..." />
                            </div>
                          </div>
                          
                          {/* Photo and Biometric */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                             <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Foto Profil</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-500">
                                        {userImage ? (
                                            <img src={userImage} className="w-full h-full object-cover" />
                                        ) : <ImageIcon className="text-slate-400" size={20} />}
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleUserImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                                </div>
                             </div>
                             
                             <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800 border p-3 rounded-lg w-full hover:bg-slate-50 dark:hover:bg-slate-700 dark:border-slate-600">
                                    <input type="checkbox" checked={enableFingerprint} onChange={e => setEnableFingerprint(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1"><Fingerprint size={16}/> Aktifkan Login Fingerprint</span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">User bisa login tanpa password</span>
                                    </div>
                                </label>
                             </div>
                          </div>

                          <div className="flex gap-2 mt-2">
                              {editingUserId && (
                                  <button type="button" onClick={resetUserForm} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded font-bold hover:bg-slate-300">
                                      Batal
                                  </button>
                              )}
                              <button type="submit" className={`flex-1 ${editingUserId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'} text-white py-2 rounded font-bold flex items-center justify-center gap-2`}>
                                    {editingUserId ? <Save size={18} /> : <Plus size={18}/>}
                                    {editingUserId ? 'Simpan Perubahan' : 'Tambah User'}
                              </button>
                          </div>
                      </form>
                  </div>

                  <div>
                      <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200">Daftar User Sistem</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 border dark:border-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Profil</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Akun</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Kontak</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Role</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Fitur Login</th>
                                    <th className="px-4 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-700">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-4 py-2 text-sm">
                                            <div className="flex items-center gap-3">
                                                <img src={u.image || `https://ui-avatars.com/api/?name=${u.name}&background=random`} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                                                <div className="font-medium text-slate-900 dark:text-slate-200">{u.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{u.username}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Pwd: {u.password}</div>
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <div className="text-slate-800 dark:text-slate-200">{u.phone || '-'}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                                        </td>
                                        <td className="px-4 py-2 capitalize">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {u.role === 'admin' ? 'User' : u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {u.hasFingerprint ? (
                                                <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold w-fit">
                                                    <Fingerprint size={12}/> Biometrik Aktif
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">Password Only</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleEditUser(u)} className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 dark:bg-indigo-900/30 rounded"><Edit size={16}/></button>
                                                {u.id !== currentUser.id && (
                                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 dark:bg-red-900/30 rounded"><Trash2 size={16}/></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default SettingsPage;
