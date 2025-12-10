import React, { useState, useEffect } from 'react';
import { Booking, Driver, Car } from '../types';
import { getStoredData } from '../services/dataService';
import { MapPin, Phone, Calendar, Clock, Car as CarIcon, User, List, Map as MapIcon, Navigation, Battery } from 'lucide-react';

interface Props {
    isDriverView?: boolean;
    driverId?: string;
}

// Mock Interface for Live Location
interface LiveLocation {
    bookingId: string;
    lat: number;
    lng: number;
    speed: number;
    battery: number;
    lastUpdate: number;
}

const DriverTrackingPage: React.FC<Props> = ({ isDriverView = false, driverId }) => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([]);

  useEffect(() => {
    setBookings(getStoredData<Booking[]>('bookings', []));
    setDrivers(getStoredData<Driver[]>('drivers', []));
    setCars(getStoredData<Car[]>('cars', []));

    // Simulate Live Data on Mount
    const timer = setInterval(() => {
        setLiveLocations(prev => prev.map(loc => ({
            ...loc,
            lat: loc.lat + (Math.random() - 0.5) * 0.001, // Simulate small movement
            lng: loc.lng + (Math.random() - 0.5) * 0.001,
            speed: Math.floor(Math.random() * 60) + 20,
            lastUpdate: Date.now()
        })));
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const isBookingActiveToday = (b: Booking) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const isToday = b.startDate.startsWith(todayStr) || b.endDate.startsWith(todayStr);
      const isActiveNow = now >= start && now <= end;
      return (isActiveNow || isToday) && b.status !== 'Cancelled';
  };

  const activeBookings = bookings.filter(b => {
      if (isDriverView) {
          const end = new Date(b.endDate);
          return b.driverId === driverId && end >= now && b.status !== 'Cancelled';
      } else {
          return b.driverId && isBookingActiveToday(b);
      }
  });

  // Init Mock Location Data for Active Bookings
  useEffect(() => {
      if (activeBookings.length > 0 && liveLocations.length === 0) {
          const mocks: LiveLocation[] = activeBookings.map(b => ({
              bookingId: b.id,
              lat: 20 + Math.random() * 60, // Mock positioning % for CSS
              lng: 20 + Math.random() * 60, // Mock positioning % for CSS
              speed: 40,
              battery: 85 + Math.floor(Math.random() * 15),
              lastUpdate: Date.now()
          }));
          setLiveLocations(mocks);
      }
  }, [activeBookings.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">{isDriverView ? 'Tugas Saya' : 'Tracking Unit'}</h2>
          <p className="text-slate-500">{isDriverView ? 'Jadwal perjalanan Anda & Lokasi Live.' : 'Monitor lokasi armada secara real-time.'}</p>
        </div>
        
        {!isDriverView && (
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                <button 
                    onClick={() => setViewMode('list')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <List size={18} /> List
                </button>
                <button 
                    onClick={() => setViewMode('map')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'map' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <MapIcon size={18} /> Live Map
                </button>
            </div>
        )}
      </div>

      {viewMode === 'map' && !isDriverView ? (
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 h-[600px] relative">
            {/* Mock Map Background (Dark Mode Style) */}
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
                backgroundSize: '30px 30px'
            }}></div>
            
            {/* Grid Lines */}
            <div className="absolute inset-0 border-t border-l border-slate-800 opacity-30 grid grid-cols-4 grid-rows-4">
                 {[...Array(16)].map((_, i) => <div key={i} className="border-r border-b border-slate-800"></div>)}
            </div>

            {/* Map Legend/UI */}
            <div className="absolute top-4 left-4 z-10 bg-slate-800/90 backdrop-blur text-white p-3 rounded-lg border border-slate-600 shadow-lg">
                <h4 className="font-bold text-sm flex items-center gap-2"><Navigation size={16} className="text-green-400" /> Unit Aktif: {activeBookings.length}</h4>
            </div>

            {/* Render Pins */}
            {activeBookings.map(booking => {
                const driver = drivers.find(d => d.id === booking.driverId);
                const car = cars.find(c => c.id === booking.carId);
                const loc = liveLocations.find(l => l.bookingId === booking.id) || { lat: 50, lng: 50, speed: 0, battery: 0 };
                
                return (
                    <div 
                        key={booking.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all duration-1000 ease-linear"
                        style={{ top: `${loc.lat}%`, left: `${loc.lng}%` }}
                    >
                        {/* Ping Animation */}
                        <div className="absolute -inset-4 bg-green-500 rounded-full opacity-30 animate-ping"></div>
                        
                        {/* Marker Icon */}
                        <div className="relative bg-white p-1 rounded-full border-2 border-indigo-600 shadow-lg z-20">
                            <img src={driver?.image} className="w-8 h-8 rounded-full object-cover" alt="Driver" />
                        </div>

                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 p-3 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                            <div className="text-xs font-bold text-slate-800 mb-1">{car?.name}</div>
                            <div className="text-[10px] text-slate-500 mb-2">{car?.plate}</div>
                            
                            <div className="flex justify-between items-center text-[10px] text-slate-600 border-t pt-2">
                                <span className="flex items-center gap-1"><Navigation size={10} /> {loc.speed} km/h</span>
                                <span className="flex items-center gap-1"><Battery size={10} className="text-green-600"/> {loc.battery}%</span>
                            </div>
                            <div className="mt-1 text-[10px] text-indigo-600 font-medium">Driver: {driver?.name}</div>
                        </div>
                    </div>
                );
            })}
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBookings.length === 0 && (
                <div className="col-span-full text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500">Tidak ada jadwal {isDriverView ? 'tugas' : 'unit aktif'} saat ini.</p>
                </div>
            )}

            {activeBookings.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(booking => {
                const driver = drivers.find(d => d.id === booking.driverId);
                const car = cars.find(c => c.id === booking.carId);
                const isNow = new Date(booking.startDate) <= now && new Date(booking.endDate) >= now;
                const loc = liveLocations.find(l => l.bookingId === booking.id) || { speed: 0 };

                return (
                    <div key={booking.id} className={`rounded-xl shadow-sm border p-5 relative overflow-hidden ${isNow ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                        {isNow && <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg animate-pulse flex items-center gap-1"><Navigation size={10}/> LIVE</div>}
                        
                        {!isDriverView && driver && (
                            <div className="flex items-center gap-3 mb-4">
                                <img src={driver.image} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"/>
                                <div>
                                    <h3 className="font-bold text-slate-800">{driver.name}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1"><Phone size={10}/> {driver.phone}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-slate-100">
                                <CarIcon size={18} className="text-indigo-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-sm text-slate-800">{car?.name}</p>
                                    <p className="text-xs text-slate-500">{car?.plate}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border border-slate-100">
                                <MapPin size={18} className="text-red-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-sm text-slate-800">{booking.destination || 'Dalam Kota'}</p>
                                    <p className="text-xs text-slate-500">Durasi: {booking.packageType}</p>
                                </div>
                            </div>

                            {/* Live Data Mock in List View */}
                            {isNow && (
                                <div className="flex items-center justify-between text-xs font-mono bg-slate-900 text-green-400 p-2 rounded">
                                    <span>SPEED: {loc.speed} km/h</span>
                                    <span>GPS: AKURAT</span>
                                </div>
                            )}

                            <div className="pt-2 border-t border-slate-200/50 flex justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                    <Calendar size={12}/> {new Date(booking.startDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={12}/> {new Date(booking.startDate).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
};

export default DriverTrackingPage;