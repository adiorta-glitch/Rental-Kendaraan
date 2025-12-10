
import React, { useState, useEffect, useRef } from 'react';
import { Customer, User } from '../types';
import { getStoredData, setStoredData, exportToCSV, processCSVImport, mergeData } from '../services/dataService';
import { Plus, Trash2, Edit2, Phone, MapPin, X, UserCircle, Upload, Download } from 'lucide-react';

interface Props {
    currentUser: User;
}

const CustomersPage: React.FC<Props> = ({ currentUser }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const isSuperAdmin = currentUser.role === 'superadmin';

  useEffect(() => {
    setCustomers(getStoredData<Customer[]>('customers', []));
  }, []);

  const openModal = (cust?: Customer) => {
    if (cust) {
        setEditingCustomer(cust);
        setName(cust.name);
        setPhone(cust.phone);
        setAddress(cust.address);
    } else {
        setEditingCustomer(null);
        setName('');
        setPhone('');
        setAddress('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newCust: Customer = {
        id: editingCustomer ? editingCustomer.id : Date.now().toString(),
        name,
        phone,
        address
    };

    let updated;
    if (editingCustomer) {
        updated = customers.map(c => c.id === editingCustomer.id ? newCust : c);
    } else {
        updated = [...customers, newCust];
    }

    setCustomers(updated);
    setStoredData('customers', updated);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
      if(confirm('Hapus data pelanggan ini?')) {
          const updated = customers.filter(c => c.id !== id);
          setCustomers(updated);
          setStoredData('customers', updated);
      }
  };

  const handleExport = () => exportToCSV(customers, 'Data_Pelanggan_BRC');
  const handleImportClick = () => fileInputRef.current?.click();
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
          processCSVImport(file, (data) => {
              const imported: Customer[] = data.map((d: any) => d as Customer);
              const merged = mergeData(customers, imported);
              
              setCustomers(merged);
              setStoredData('customers', merged);
              alert('Data pelanggan berhasil diproses (Update/Insert)!');
          });
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Data Pelanggan</h2>
          <p className="text-slate-500">Kelola database penyewa.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <div className="hidden md:flex gap-2 mr-2">
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportFile} />
                <button onClick={handleImportClick} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                    <Upload size={16} /> Import
                </button>
                <button onClick={handleExport} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                    <Download size={16} /> Export
                </button>
            </div>
            <button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus size={18} /> Tambah Pelanggan
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kontak</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Alamat</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Aksi</th>
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                  {customers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                              <div className="flex items-center gap-2">
                                  <Phone size={14} /> {c.phone}
                              </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                               <div className="flex items-center gap-2">
                                  <MapPin size={14} /> {c.address}
                              </div>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                              <button onClick={() => openModal(c)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded border hover:text-indigo-600"><Edit2 size={16} /></button>
                              {isSuperAdmin && (
                                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-500 hover:bg-red-50 rounded border hover:text-red-600"><Trash2 size={16} /></button>
                              )}
                          </td>
                      </tr>
                  ))}
                  {customers.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-8 text-slate-500">Belum ada data pelanggan.</td></tr>
                  )}
              </tbody>
          </table>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800">{editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
                  </div>
                  <form onSubmit={handleSave} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
                          <input required type="text" className="w-full border rounded-lg p-2.5 mt-1" value={name} onChange={e => setName(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700">No. Telepon</label>
                          <input required type="tel" className="w-full border rounded-lg p-2.5 mt-1" value={phone} onChange={e => setPhone(e.target.value)} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700">Alamat</label>
                          <textarea required className="w-full border rounded-lg p-2.5 mt-1" value={address} onChange={e => setAddress(e.target.value)} rows={3} />
                      </div>
                      <div className="flex gap-3 mt-6 pt-4 border-t">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium">Batal</button>
                          <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Simpan</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default CustomersPage;
