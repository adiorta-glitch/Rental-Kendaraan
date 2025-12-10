
import React, { useState, useEffect } from 'react';
import { Transaction, Booking, Car, Customer } from '../types';
import { getStoredData } from '../services/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownLeft, Wallet, Calendar, MapPin, Package } from 'lucide-react';
import { getCurrentUser } from '../services/authService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const StatisticsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const currentUser = getCurrentUser();
  const isPartner = currentUser?.role === 'partner';

  useEffect(() => {
    setTransactions(getStoredData<Transaction[]>('transactions', []));
    setBookings(getStoredData<Booking[]>('bookings', []));
    setCars(getStoredData<Car[]>('cars', []));
    setCustomers(getStoredData<Customer[]>('customers', []));

    // Default to current month
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Filter Data
  const filterDateRange = (dateStr: string) => {
      if(!startDate || !endDate) return true;
      return dateStr >= startDate && dateStr <= endDate;
  };

  let filteredTransactions = transactions.filter(t => filterDateRange(t.date));
  let filteredBookings = bookings.filter(b => filterDateRange(b.startDate.split('T')[0]));

  // PARTNER SPECIFIC LOGIC
  if (isPartner && currentUser.linkedPartnerId) {
      // 1. Filter Transactions: Only 'Setor Mitra' related to this partner
      filteredTransactions = filteredTransactions.filter(t => 
          t.category === 'Setor Mitra' && t.relatedId === currentUser.linkedPartnerId
      );

      // 2. Filter Bookings: Only cars owned by this partner
      const partnerCarIds = cars.filter(c => c.partnerId === currentUser.linkedPartnerId).map(c => c.id);
      filteredBookings = filteredBookings.filter(b => partnerCarIds.includes(b.carId));
  }

  // Calculate Financials
  // If Partner: Income = Setoran, Expense = 0 (or specific expenses if tracked)
  // If Admin: Income = Income Type, Expense = Expense Type
  const income = isPartner 
    ? filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0) // Partner receives money
    : filteredTransactions.filter(t => t.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);

  const expense = isPartner
    ? 0 // Usually partners don't track expense here unless system updated
    : filteredTransactions.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    
  const profit = income - expense;

  // Chart Data: Histogram Income vs Expense per day
  const getDailyHistogram = () => {
      const daysMap = new Map();
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dayStr = d.toISOString().split('T')[0];
          daysMap.set(dayStr, { name: new Date(dayStr).getDate(), Pemasukan: 0, Pengeluaran: 0, Bersih: 0 });
      }

      filteredTransactions.forEach(t => {
          const dayStr = t.date;
          if(daysMap.has(dayStr)) {
              const current = daysMap.get(dayStr);
              if (isPartner) {
                  // For Partner, transaction is income
                  current.Pemasukan += t.amount;
              } else {
                  if(t.type === 'Income') current.Pemasukan += t.amount;
                  else current.Pengeluaran += t.amount;
              }
          }
      });

      return Array.from(daysMap.values()).map(d => ({
          ...d,
          Bersih: d.Pemasukan - d.Pengeluaran
      }));
  };

  // Chart Data: Top Customers (By Booking Count)
  const getTopCustomers = () => {
      const counts: {[key: string]: number} = {};
      filteredBookings.forEach(b => {
          const name = b.customerName || 'Unknown';
          counts[name] = (counts[name] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 5);
  };

  // Chart Data: Top Fleet
  const getTopFleet = () => {
      const counts: {[key: string]: number} = {};
      filteredBookings.forEach(b => {
          const carName = cars.find(c => c.id === b.carId)?.name || 'Unknown';
          counts[carName] = (counts[carName] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 5);
  };

  const getDestinationStats = () => {
      const counts: {[key: string]: number} = {};
      filteredBookings.forEach(b => {
          const dest = b.destination || 'Dalam Kota';
          counts[dest] = (counts[dest] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);
  };

  const getPackageStats = () => {
      const counts: {[key: string]: number} = {};
      filteredBookings.forEach(b => {
          const pkg = b.packageType || 'Unknown';
          counts[pkg] = (counts[pkg] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">{isPartner ? 'Statistik Mitra' : 'Statistik Bisnis'}</h2>
          <p className="text-slate-500">Analisis pendapatan{isPartner ? ' unit saya' : ', pelanggan, dan armada'}.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <Calendar size={18} className="text-slate-500 ml-2" />
            <div className="flex items-center gap-2">
                <input type="date" className="border-none text-sm focus:ring-0 text-slate-600 w-full" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <span className="text-slate-400">-</span>
                <input type="date" className="border-none text-sm focus:ring-0 text-slate-600 w-full" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="p-1.5 md:p-2 bg-green-100 text-green-600 rounded-lg"><ArrowDownLeft size={16} className="md:w-5 md:h-5" /></div>
                  <span className="text-[10px] md:text-sm font-medium text-slate-500 leading-tight">Total Pemasukan (Gross)</span>
              </div>
              <p className="text-lg md:text-2xl font-bold text-slate-800 truncate">Rp {income.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="p-1.5 md:p-2 bg-red-100 text-red-600 rounded-lg"><ArrowUpRight size={16} className="md:w-5 md:h-5" /></div>
                  <span className="text-[10px] md:text-sm font-medium text-slate-500 leading-tight">Total Pengeluaran</span>
              </div>
              <p className="text-lg md:text-2xl font-bold text-slate-800 truncate">Rp {expense.toLocaleString('id-ID')}</p>
          </div>
          <div className={`bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1 ${isPartner ? 'hidden md:block' : ''}`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="p-1.5 md:p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Wallet size={16} className="md:w-5 md:h-5" /></div>
                  <span className="text-[10px] md:text-sm font-medium text-slate-500 leading-tight">Profit Bersih (Net)</span>
              </div>
              <p className={`text-lg md:text-2xl font-bold truncate ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Rp {profit.toLocaleString('id-ID')}</p>
          </div>
      </div>

      {/* Histogram */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-4 text-slate-800">Grafik {isPartner ? 'Setoran' : 'Pendapatan'} Harian</h3>
          <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDailyHistogram()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(val) => `${val/1000}k`} />
                      <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                      <Legend />
                      <Bar dataKey="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} name={isPartner ? "Setoran" : "Pemasukan"} />
                      {!isPartner && <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} name="Pengeluaran" />}
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Stats - Hide for Partner as they might not care about customer details as much, but we'll leave it for now or replace with car stats */}
          {!isPartner && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg mb-4 text-slate-800">Top 5 Pelanggan Teraktif</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getTopCustomers()} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} name="Jumlah Booking">
                                {getTopCustomers().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
          )}

          {/* Fleet Stats - Very relevant for Partner */}
          <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 ${isPartner ? 'col-span-full' : ''}`}>
              <h3 className="font-bold text-lg mb-4 text-slate-800">Top Unit Terlaris</h3>
              <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={getTopFleet()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                          >
                              {getTopFleet().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><MapPin size={20} /></div>
                  <h3 className="font-bold text-lg text-slate-800">Distribusi Tujuan</h3>
              </div>
              <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={getDestinationStats()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                          >
                              {getDestinationStats().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Package size={20} /></div>
                  <h3 className="font-bold text-lg text-slate-800">Paket Sewa</h3>
              </div>
              <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={getPackageStats()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#82ca9d"
                              dataKey="value"
                          >
                              {getPackageStats().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
