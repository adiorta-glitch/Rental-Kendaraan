import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Booking, BookingStatus, Car, PaymentStatus } from '../types';
import { getStoredData } from '../services/dataService';
import { AlertCircle, CheckCircle, TrendingUp, Car as CarIcon, Clock, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const loadedBookings = getStoredData<Booking[]>('bookings', []);
    const loadedCars = getStoredData<Car[]>('cars', []);
    setBookings(loadedBookings);
    setCars(loadedCars);

    // Prepare chart data (Revenue last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const data = last7Days.map(date => {
      const revenue = loadedBookings
        .filter(b => b.startDate.startsWith(date) && b.status !== BookingStatus.CANCELLED)
        .reduce((sum, b) => sum + b.totalPrice, 0);
      return {
        name: new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }),
        revenue: revenue
      };
    });

    setChartData(data);
  }, []);

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const activeBookings = bookings.filter(b => b.status === BookingStatus.ACTIVE).length;
  const pendingPayments = bookings.filter(b => b.paymentStatus !== PaymentStatus.PAID && b.status !== BookingStatus.CANCELLED).length;
  const availableCars = cars.length - activeBookings; // Simple approx for dashboard
  const todayRevenue = bookings
    .filter(b => b.startDate.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((acc, curr) => acc + curr.totalPrice, 0);

  // Calendar Render Helpers
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500">Ringkasan aktivitas rental hari ini.</p>
        </div>
        <Link to="/booking" className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg shadow-sm font-medium transition-colors inline-flex items-center gap-2">
          <Clock size={18} /> Buat Booking Baru
        </Link>
      </div>

      {/* Stats Cards - Updated for Mobile 2 Cols (1 baris 2 kotak) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-lg"><CarIcon className="w-5 h-5 md:w-6 md:h-6" /></div>
            <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase text-right">Unit Ready</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-slate-800">{availableCars}/{cars.length}</p>
          <p className="text-[10px] md:text-sm text-slate-500 mt-1 truncate">Mobil tersedia hari ini</p>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-1.5 md:p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp className="w-5 h-5 md:w-6 md:h-6" /></div>
            <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase text-right">Pendapatan</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-slate-800">Rp {(todayRevenue / 1000).toFixed(0)}k</p>
          <p className="text-[10px] md:text-sm text-slate-500 mt-1 truncate">Booking dibuat hari ini</p>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-1.5 md:p-2 bg-purple-50 text-purple-600 rounded-lg"><CheckCircle className="w-5 h-5 md:w-6 md:h-6" /></div>
            <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase text-right">Sedang Jalan</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-slate-800">{activeBookings}</p>
          <p className="text-[10px] md:text-sm text-slate-500 mt-1 truncate">Unit sedang disewa</p>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-1.5 md:p-2 bg-red-50 text-red-600 rounded-lg"><AlertCircle className="w-5 h-5 md:w-6 md:h-6" /></div>
            <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase text-right">Belum Lunas</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-slate-800">{pendingPayments}</p>
          <p className="text-[10px] md:text-sm text-slate-500 mt-1 truncate">Menunggu pembayaran</p>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
           <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><CalendarIcon size={20} /> Kalender Booking</h3>
           <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-lg">
              <button onClick={prevMonth} className="p-1 hover:bg-slate-200 rounded"><ChevronLeft size={20} /></button>
              <span className="font-semibold text-sm min-w-[120px] text-center">{monthName}</span>
              <button onClick={nextMonth} className="p-1 hover:bg-slate-200 rounded"><ChevronRight size={20} /></button>
           </div>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                <div key={d} className="text-center text-xs font-bold text-slate-400 py-2 uppercase">{d}</div>
            ))}
            
            {emptyDays.map(d => <div key={`empty-${d}`} className="h-24 md:h-32 bg-slate-50/50 border border-slate-100 rounded-lg"></div>)}

            {daysArray.map(day => {
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                // Find bookings for this day
                const dayBookings = bookings.filter(b => {
                    const bStart = b.startDate.split('T')[0];
                    const bEnd = b.endDate.split('T')[0];
                    return dateStr >= bStart && dateStr <= bEnd && b.status !== 'Cancelled';
                });

                return (
                    <div key={day} className="h-24 md:h-32 bg-white border border-slate-200 rounded-lg p-1 md:p-2 overflow-hidden hover:border-indigo-300 transition-colors relative">
                        <span className={`text-sm font-semibold ${dayBookings.length > 0 ? 'text-indigo-600' : 'text-slate-700'}`}>{day}</span>
                        <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-24px)] custom-scrollbar">
                            {dayBookings.map(b => (
                                <div key={b.id} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 truncate" title={`${b.customerName} - ${cars.find(c=>c.id===b.carId)?.name}`}>
                                    {cars.find(c=>c.id===b.carId)?.name.split(' ')[0]}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-lg text-slate-800 mb-6">Pendapatan 7 Hari Terakhir</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `Rp${value/1000}k`} />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#DC2626" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;