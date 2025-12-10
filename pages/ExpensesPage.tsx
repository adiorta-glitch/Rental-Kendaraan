
import React, { useState, useEffect } from 'react';
import { Transaction, Driver, User, Partner } from '../types';
import { getStoredData, setStoredData, exportToCSV } from '../services/dataService';
import { Plus, Image as ImageIcon, X, Upload, CheckCircle, Clock, User as UserIcon, Users, Download, Filter } from 'lucide-react';
import { getCurrentUser } from '../services/authService';

interface Props {
    isDriverView?: boolean;
    isPartnerView?: boolean;
}

const ExpensesPage: React.FC<Props> = ({ isDriverView = false, isPartnerView = false }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentUser = getCurrentUser();

  // Filter State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Form
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Operasional');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  useEffect(() => {
    const allTx = getStoredData<Transaction[]>('transactions', []);
    setTransactions(allTx.filter(t => t.type === 'Expense'));
    setDrivers(getStoredData<Driver[]>('drivers', []));
    setPartners(getStoredData<Partner[]>('partners', []));
    
    if (isDriverView) setCategory('Reimbursement');
    if (isPartnerView) setCategory('Setor Mitra');
  }, [isDriverView, isPartnerView]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1000000) { 
        alert("Ukuran gambar terlalu besar (Maks 1MB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isClaim = isDriverView || category === 'Reimbursement';
    const isPartnerDeposit = category === 'Setor Mitra';
    
    let relatedId = undefined;
    if (isDriverView && currentUser?.linkedDriverId) relatedId = currentUser.linkedDriverId;
    else if (isPartnerDeposit) relatedId = selectedPartnerId;
    
    const status = (isClaim || isPartnerDeposit) ? 'Pending' : 'Paid';

    const newTx: Transaction = {
        id: `exp-${Date.now()}`,
        date: date,
        amount: Number(amount),
        type: 'Expense',
        category: category,
        description: description,
        receiptImage: receiptImage || undefined,
        status: status,
        relatedId: relatedId
    };

    const allTx = getStoredData<Transaction[]>('transactions', []);
    const updated = [newTx, ...allTx];
    
    setStoredData('transactions', updated);
    setTransactions(updated.filter(t => t.type === 'Expense'));
    setIsModalOpen(false);
    resetForm();
  };

  const handleUpdateStatus = (id: string, newStatus: 'Paid') => {
      const confirmMsg = newStatus === 'Paid' ? 'Tandai transaksi ini sebagai sudah dibayar/disetor?' : 'Update status?';
      if(confirm(confirmMsg)) {
          const allTx = getStoredData<Transaction[]>('transactions', []);
          const updated = allTx.map(t => t.id === id ? { ...t, status: newStatus } : t);
          setStoredData('transactions', updated);
          setTransactions(updated.filter(t => t.type === 'Expense'));
      }
  };

  const resetForm = () => {
      setDescription('');
      setAmount('');
      setCategory(isDriverView ? 'Reimbursement' : isPartnerView ? 'Setor Mitra' : 'Operasional');
      setReceiptImage(null);
      setSelectedPartnerId('');
  };

  // Filter View
  let displayedTransactions = transactions;
  
  // Date Filtering
  if (filterStartDate || filterEndDate) {
      displayedTransactions = displayedTransactions.filter(t => {
          const start = filterStartDate || '0000-00-00';
          const end = filterEndDate || '9999-12-31';
          return t.date >= start && t.date <= end;
      });
  }
  
  if (isDriverView) {
      if (currentUser?.linkedDriverId) {
          displayedTransactions = displayedTransactions.filter(t => t.relatedId === currentUser.linkedDriverId);
      } else {
           displayedTransactions = displayedTransactions.filter(t => t.category === 'Reimbursement' || t.category === 'BBM' || t.category === 'Tol/Parkir');
      }
  } else if (isPartnerView) {
      if (currentUser?.linkedPartnerId) {
          displayedTransactions = displayedTransactions.filter(t => t.category === 'Setor Mitra' && t.relatedId === currentUser.linkedPartnerId);
      }
  }

  const getEntityName = (relatedId?: string) => {
      if (!relatedId) return null;
      const d = drivers.find(d => d.id === relatedId);
      if (d) return d.name;
      const p = partners.find(p => p.id === relatedId);
      if (p) return p.name;
      return null;
  }

  const handleExportCSV = () => {
      if (displayedTransactions.length === 0) {
          alert('Tidak ada data untuk diexport');
          return;
      }
      exportToCSV(displayedTransactions, 'Data_Pengeluaran_BRC');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
              {isDriverView ? 'Reimbursement Saya' : isPartnerView ? 'Riwayat Setoran' : 'Pengeluaran & Setoran'}
          </h2>
          <p className="text-slate-500">
              {isDriverView ? 'Ajukan klaim biaya perjalanan.' : isPartnerView ? 'Riwayat setoran bagi hasil dari rental.' : 'Kelola operasional, reimbursement, dan setoran mitra.'}
          </p>
        </div>
        
        {/* Actions & Filters */}
        <div className="flex flex-wrap gap-2 items-center">
            {/* Desktop Only Export Filter */}
            {!isDriverView && !isPartnerView && (
                <div className="hidden md:flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                    <span className="text-sm font-bold text-slate-700 px-2 flex items-center gap-1"><Filter size={14}/> Filter:</span>
                    <input type="date" className="border rounded px-2 py-1 text-sm text-slate-600" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                    <span className="text-slate-400">-</span>
                    <input type="date" className="border rounded px-2 py-1 text-sm text-slate-600" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                    <button onClick={handleExportCSV} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1">
                        <Download size={14} /> CSV
                    </button>
                    {(filterStartDate || filterEndDate) && (
                        <button onClick={() => {setFilterStartDate(''); setFilterEndDate('');}} className="text-red-500 hover:underline text-xs px-2">Reset</button>
                    )}
                </div>
            )}

            {!isPartnerView && (
                <button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus size={18} /> {isDriverView ? 'Ajukan Klaim' : 'Catat Pengeluaran'}
                </button>
            )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tanggal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kategori</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Keterangan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Jumlah</th>
                        {(!isDriverView && !isPartnerView) && <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Aksi</th>}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {displayedTransactions.length === 0 ? (
                         <tr><td colSpan={6} className="text-center py-8 text-slate-500 italic">Belum ada data.</td></tr>
                    ) : (
                        displayedTransactions.map(t => {
                            const entityName = getEntityName(t.relatedId);
                            return (
                                <tr key={t.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.category === 'Setor Mitra' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-800">
                                        <div>{t.description}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {entityName && (
                                                <span className="text-xs bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
                                                    {t.category === 'Setor Mitra' ? <Users size={10}/> : <UserIcon size={10} />} {entityName}
                                                </span>
                                            )}
                                            {t.receiptImage && (
                                                <a href={t.receiptImage} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 text-xs"><ImageIcon size={12}/> Nota</a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {t.status === 'Paid' ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                                                <CheckCircle size={12} /> {t.category === 'Setor Mitra' ? 'Disetor' : 'Dibayar'}
                                            </span>
                                        ) : t.status === 'Pending' ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full w-fit">
                                                <Clock size={12} /> Menunggu
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600">
                                        Rp {t.amount.toLocaleString('id-ID')}
                                    </td>
                                    {(!isDriverView && !isPartnerView) && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {t.status === 'Pending' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(t.id, 'Paid')}
                                                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
                                                >
                                                    {t.category === 'Setor Mitra' ? 'Setor' : 'Bayar'}
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
          </div>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800">{isDriverView ? 'Form Reimbursement' : 'Input Pengeluaran / Setoran'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleSave} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700">Tanggal</label>
                          <input required type="date" className="w-full border rounded-lg p-2.5 mt-1" value={date} onChange={e => setDate(e.target.value)} />
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-slate-700">Kategori</label>
                          <select className="w-full border rounded-lg p-2.5 mt-1" value={category} onChange={e => setCategory(e.target.value)}>
                              {isDriverView ? (
                                  <>
                                    <option value="BBM">BBM / Bensin</option>
                                    <option value="Tol/Parkir">Tol & Parkir</option>
                                    <option value="Reimbursement">Lainnya</option>
                                  </>
                              ) : (
                                  <>
                                    <option value="Operasional">Operasional Kantor</option>
                                    <option value="Setor Mitra">Setor ke Mitra</option>
                                    <option value="Gaji">Gaji Karyawan</option>
                                    <option value="Service">Service Mobil</option>
                                    <option value="Marketing">Marketing / Iklan</option>
                                    <option value="Reimbursement">Reimbursement Driver</option>
                                    <option value="Lainnya">Lainnya</option>
                                  </>
                              )}
                          </select>
                      </div>

                      {category === 'Setor Mitra' && (
                          <div>
                              <label className="block text-sm font-medium text-slate-700">Pilih Mitra</label>
                              <select required className="w-full border rounded-lg p-2.5 mt-1" value={selectedPartnerId} onChange={e => setSelectedPartnerId(e.target.value)}>
                                  <option value="">-- Pilih Mitra --</option>
                                  {partners.map(p => (
                                      <option key={p.id} value={p.id}>{p.name} (Split: {p.splitPercentage}%)</option>
                                  ))}
                              </select>
                          </div>
                      )}

                      <div>
                          <label className="block text-sm font-medium text-slate-700">Nominal (Rp)</label>
                          <input required type="number" className="w-full border rounded-lg p-2.5 mt-1" value={amount} onChange={e => setAmount(e.target.value)} />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700">Keterangan</label>
                          <textarea required className="w-full border rounded-lg p-2.5 mt-1" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Contoh: Setoran Bulan April / Isi bensin" />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Foto Nota / Bukti Transfer</label>
                          <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                                    {receiptImage ? (
                                        <img src={receiptImage} className="w-full h-full object-cover" />
                                    ) : <ImageIcon className="text-slate-400" />}
                                </div>
                                <div className="flex-1">
                                    <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 text-slate-700">
                                        <Upload size={16} /> Upload Bukti
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                          </div>
                      </div>

                      <div className="flex gap-3 mt-6 pt-4 border-t">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium">Batal</button>
                          <button type="submit" className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">Simpan</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default ExpensesPage;
