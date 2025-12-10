
import React, { useState, useEffect, useRef } from 'react';
import { Partner, Booking, Car, User, Transaction } from '../types';
import { getStoredData, setStoredData, exportToCSV, processCSVImport, mergeData } from '../services/dataService';
import { generateMonthlyReportPDF } from '../services/pdfService';
import { Plus, Trash2, Phone, Edit2, X, Image as ImageIcon, History, Calendar, CheckCircle, Clock, Wallet, Download, Upload, FileText } from 'lucide-react';

interface Props {
    currentUser: User;
}

const PartnersPage: React.FC<Props> = ({ currentUser }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [historyPartner, setHistoryPartner] = useState<Partner | null>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'bookings' | 'deposits'>('bookings');

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [split, setSplit] = useState(70);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = currentUser.role === 'superadmin';
  const isPartnerView = currentUser.role === 'partner';

  useEffect(() => {
    setPartners(getStoredData<Partner[]>('partners', []));
    setBookings(getStoredData<Booking[]>('bookings', []));
    setCars(getStoredData<Car[]>('cars', []));
    setTransactions(getStoredData<Transaction[]>('transactions', []));
  }, []);

  const openModal = (partner?: Partner) => {
    if (partner) {
        setEditingPartner(partner);
        setName(partner.name);
        setPhone(partner.phone);
        setSplit(partner.splitPercentage);
        setImagePreview(partner.image || null);
    } else {
        setEditingPartner(null);
        setName('');
        setPhone('');
        setSplit(70);
        setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const openHistoryModal = (partner: Partner) => {
      setHistoryPartner(partner);
      setActiveHistoryTab('bookings');
      setIsHistoryModalOpen(true);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1000000) { 
        alert("Ukuran gambar terlalu besar (Maks 1MB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => setImagePreview(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalImage = imagePreview || `https://i.pravatar.cc/150?u=${Date.now()}`;

    const newPartner: Partner = {
        id: editingPartner ? editingPartner.id : Date.now().toString(),
        name,
        phone,
        splitPercentage: Number(split),
        image: finalImage
    };

    let updatedPartners;
    if (editingPartner) {
        updatedPartners = partners.map(p => p.id === editingPartner.id ? newPartner : p);
    } else {
        updatedPartners = [...partners, newPartner];
    }

    setPartners(updatedPartners);
    setStoredData('partners', updatedPartners);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
      if(confirm('Hapus data mitra ini?')) {
          const updated = partners.filter(p => p.id !== id);
          setPartners(updated);
          setStoredData('partners', updated);
      }
  };

  const calculatePartnerIncome = (partnerId: string) => {
      const partnerCarIds = cars.filter(c => c.partnerId === partnerId).map(c => c.id);
      
      const totalRevenue = bookings
        .filter(b => partnerCarIds.includes(b.carId) && b.status !== 'Cancelled')
        .reduce((sum, b) => sum + b.totalPrice, 0);

      const partner = partners.find(p => p.id === partnerId);
      const split = partner ? partner.splitPercentage / 100 : 0;
      
      return totalRevenue * split;
  };

  const displayedPartners = isPartnerView 
    ? partners.filter(p => p.id === currentUser.linkedPartnerId) 
    : partners;

  const getPartnerBookings = () => {
      if(!historyPartner) return [];
      const partnerCarIds = cars.filter(c => c.partnerId === historyPartner.id).map(c => c.id);
      return bookings
        .filter(b => partnerCarIds.includes(b.carId))
        .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  };

  const getPartnerDeposits = () => {
      if(!historyPartner) return [];
      return transactions.filter(t => t.category === 'Setor Mitra' && t.relatedId === historyPartner.id)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleDownloadReport = () => {
      if (!historyPartner) return;
      const month = new Date().toISOString().slice(0, 7); // Current Month YYYY-MM
      generateMonthlyReportPDF(
          'Partner',
          historyPartner,
          month,
          getPartnerDeposits(),
          getPartnerBookings()
      );
  };

  const handleExport = () => exportToCSV(displayedPartners, 'Data_Mitra_BRC');
  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
          processCSVImport(file, (data) => {
              const imported: Partner[] = data.map((d: any) => d as Partner);
              const merged = mergeData(partners, imported);
              
              setPartners(merged);
              setStoredData('partners', merged);
              alert('Data mitra berhasil diproses (Update/Insert)!');
          });
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">{isPartnerView ? 'Profil & Pendapatan Saya' : 'Mitra & Rekanan'}</h2>
          <p className="text-slate-500">{isPartnerView ? 'Informasi unit, pendapatan sewa, dan riwayat setoran.' : 'Kelola pemilik mobil titipan, foto dan bagi hasil.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
            {!isPartnerView && (
                <div className="hidden md:flex gap-2 mr-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportFile} />
                    <button onClick={handleImportClick} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                        <Upload size={16} /> Import
                    </button>
                    <button onClick={handleExport} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                        <Download size={16} /> Export
                    </button>
                </div>
            )}
            {!isPartnerView && (
                <button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus size={18} /> Tambah Mitra
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedPartners.map(partner => {
              const income = calculatePartnerIncome(partner.id);
              const carCount = cars.filter(c => c.partnerId === partner.id).length;

              return (
                <div key={partner.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                            <img src={partner.image || `https://i.pravatar.cc/150?u=${partner.id}`} alt={partner.name} className="w-14 h-14 rounded-full bg-slate-100 object-cover border border-slate-200" />
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{partner.name}</h3>
                                <div className="flex items-center text-slate-500 text-sm mt-1 gap-1">
                                    <Phone size={14} /> {partner.phone}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                                Split: {partner.splitPercentage}%
                            </span>
                            {!isPartnerView && (
                                <div className="flex gap-1">
                                    <button onClick={() => openModal(partner)} className="p-1.5 text-slate-500 hover:bg-slate-50 rounded border hover:text-indigo-600"><Edit2 size={16} /></button>
                                    {isSuperAdmin && (
                                        <button onClick={() => handleDelete(partner.id)} className="p-1.5 text-slate-500 hover:bg-red-50 rounded border hover:text-red-600"><Trash2 size={16} /></button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Unit Mobil</p>
                            <p className="font-bold text-xl">{carCount}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Est. Pendapatan</p>
                            <p className="font-bold text-xl text-indigo-600">Rp {income.toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button onClick={() => openHistoryModal(partner)} className="w-full py-2 text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium">
                            <History size={16} /> Riwayat & Detail
                        </button>
                    </div>

                    <div className="text-sm text-slate-500 mt-4 pt-4 border-t border-slate-100">
                        <p className="mb-2 font-medium">Mobil Dimiliki:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            {cars.filter(c => c.partnerId === partner.id).map(c => (
                                <li key={c.id}>{c.name} ({c.plate})</li>
                            ))}
                            {carCount === 0 && <li>Belum ada unit.</li>}
                        </ul>
                    </div>
                </div>
              );
          })}
      </div>

       {/* Modal Create/Edit */}
       {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800">{editingPartner ? 'Edit Mitra' : 'Tambah Mitra Baru'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleSave} className="space-y-6">
                      <div className="flex flex-col items-center mb-4">
                          <div className="relative w-28 h-28 bg-slate-100 rounded-full border-4 border-slate-50 flex items-center justify-center overflow-hidden group">
                              {imagePreview ? (
                                  <>
                                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                      <button 
                                          type="button"
                                          onClick={handleRemoveImage}
                                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                          title="Hapus Foto"
                                      >
                                          <X size={20} />
                                      </button>
                                  </>
                              ) : (
                                  <div className="text-center text-slate-400">
                                      <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                                      <span className="text-[10px]">Foto</span>
                                  </div>
                              )}
                              <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={handleImageUpload}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700">Nama Mitra</label>
                          <input required type="text" className="w-full border rounded-lg p-2.5 mt-1" value={name} onChange={e => setName(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700">No. Telepon</label>
                          <input required type="tel" className="w-full border rounded-lg p-2.5 mt-1" value={phone} onChange={e => setPhone(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700">Persentase Bagi Hasil (Untuk Mitra)</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input required type="number" min="1" max="100" className="w-full border rounded-lg p-2.5" value={split} onChange={e => setSplit(Number(e.target.value))} />
                            <span className="text-slate-500 font-bold">%</span>
                          </div>
                      </div>

                      <div className="flex gap-3 mt-6 pt-4 border-t">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium">Batal</button>
                          <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200">Simpan</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryModalOpen && historyPartner && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-4">
                            <img src={historyPartner.image} alt={historyPartner.name} className="w-14 h-14 rounded-full bg-slate-200 object-cover border-2 border-slate-100" />
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">{historyPartner.name}</h3>
                                <p className="text-sm text-slate-500">Detail Riwayat & Setoran</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                             <button onClick={handleDownloadReport} className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-slate-900">
                                 <FileText size={16}/> Download Laporan Bulanan
                             </button>
                             <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                         </div>
                    </div>

                    <div className="flex gap-2 border-b border-slate-100 mb-4">
                        <button 
                            onClick={() => setActiveHistoryTab('bookings')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeHistoryTab === 'bookings' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Riwayat Sewa Unit
                        </button>
                        <button 
                            onClick={() => setActiveHistoryTab('deposits')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeHistoryTab === 'deposits' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Riwayat Setoran
                        </button>
                    </div>

                    <div className="min-h-[300px]">
                        {activeHistoryTab === 'bookings' && (
                            <div className="space-y-3">
                                {getPartnerBookings().length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 italic">Belum ada riwayat penyewaan unit mitra ini.</div>
                                ) : (
                                    getPartnerBookings().map(booking => {
                                        const car = cars.find(c => c.id === booking.carId);
                                        return (
                                            <div key={booking.id} className="p-3 border rounded-lg bg-slate-50 flex justify-between items-center">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold bg-white border px-1.5 py-0.5 rounded text-slate-700">{booking.id.slice(0,6)}</span>
                                                        <span className="text-sm font-bold text-slate-800">{booking.customerName}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-600 flex items-center gap-2">
                                                        <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(booking.startDate).toLocaleDateString('id-ID')}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1">Unit: {car?.name} ({car?.plate})</div>
                                                </div>
                                                <div className="text-right">
                                                    {/* HIDE PRICE FOR PARTNER */}
                                                    <div className="text-sm font-bold text-indigo-700 hidden">Rp {booking.totalPrice.toLocaleString('id-ID')}</div>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 inline-block ${booking.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}

                        {activeHistoryTab === 'deposits' && (
                            <div className="space-y-3">
                                {getPartnerDeposits().length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 italic">Belum ada riwayat setoran.</div>
                                ) : (
                                    getPartnerDeposits().map(tx => (
                                        <div key={tx.id} className="p-3 border rounded-lg bg-white flex justify-between items-center">
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{tx.description}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                    <span>{new Date(tx.date).toLocaleDateString('id-ID')}</span>
                                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded">{tx.category}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-green-600">Rp {tx.amount.toLocaleString('id-ID')}</div>
                                                <div className="mt-1">
                                                    {tx.status === 'Paid' ? (
                                                        <span className="flex items-center justify-end gap-1 text-[10px] text-green-600 font-bold">
                                                            <CheckCircle size={10}/> Sudah Dibayarkan
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center justify-end gap-1 text-[10px] text-orange-500 font-bold">
                                                            <Clock size={10}/> Setoran Ditahan
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
               </div>
          </div>
      )}
    </div>
  );
};

export default PartnersPage;
