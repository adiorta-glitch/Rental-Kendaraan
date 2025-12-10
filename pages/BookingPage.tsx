
import React, { useState, useEffect, useRef } from 'react';
import { getStoredData, setStoredData, checkAvailability, calculatePricing, DEFAULT_SETTINGS } from '../services/dataService';
import { Car, Booking, BookingStatus, PaymentStatus, Transaction, Driver, HighSeason, AppSettings, Customer, User, VehicleChecklist } from '../types';
import { generateInvoicePDF, generateWhatsAppLink } from '../services/pdfService';
import { Search, Plus, Trash2, MessageCircle, AlertTriangle, Calendar, User as UserIcon, Zap, CheckCircle, MapPin, Shield, Image as ImageIcon, X, FileText, ClipboardCheck, Fuel, Gauge, Car as CarIcon, Edit, Edit2, FileSpreadsheet, ChevronDown, Filter, Info } from 'lucide-react';

interface Props {
    currentUser: User;
}

const BookingPage: React.FC<Props> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // Data State
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [highSeasons, setHighSeasons] = useState<HighSeason[]>([]);

  // Filtered Data State (Available Units)
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  
  // Filter State (List & Export)
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Form State (Create/Edit Booking)
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);

  const [selectedCarId, setSelectedCarId] = useState<string>('');
  const [isCarDropdownOpen, setIsCarDropdownOpen] = useState(false); // New state for custom dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [useDriver, setUseDriver] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('08:00');
  
  // Overtime / Return
  const [actualReturnDate, setActualReturnDate] = useState('');
  const [actualReturnTime, setActualReturnTime] = useState('');
  const [overtimeFee, setOvertimeFee] = useState<number>(0);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [packageType, setPackageType] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  
  // New Fields
  const [destination, setDestination] = useState<'Dalam Kota' | 'Luar Kota'>('Dalam Kota');
  
  // Deposit
  const [securityDepositType, setSecurityDepositType] = useState<'Uang' | 'Barang'>('Uang');
  const [securityDepositValue, setSecurityDepositValue] = useState<number>(0);
  const [securityDepositDescription, setSecurityDepositDescription] = useState('');
  const [depositImage, setDepositImage] = useState<string | null>(null);

  const [status, setStatus] = useState<BookingStatus>(BookingStatus.BOOKED);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.UNPAID);
  const [amountPaid, setAmountPaid] = useState<string>('0');
  const [notes, setNotes] = useState('');
  
  // Checklist Modal State
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistBooking, setChecklistBooking] = useState<Booking | null>(null);
  
  // Checklist Form State
  const [checkOdometer, setCheckOdometer] = useState<string>('');
  const [checkFuel, setCheckFuel] = useState<string>('');
  const [checkSpeedometerImg, setCheckSpeedometerImg] = useState<string | null>(null);
  const [checkFrontImg, setCheckFrontImg] = useState<string | null>(null);
  const [checkBackImg, setCheckBackImg] = useState<string | null>(null);
  const [checkLeftImg, setCheckLeftImg] = useState<string | null>(null);
  const [checkRightImg, setCheckRightImg] = useState<string | null>(null);
  const [checkNotes, setCheckNotes] = useState('');

  // Logic State
  const [carError, setCarError] = useState('');
  const [driverError, setDriverError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pricing, setPricing] = useState({
    basePrice: 0,
    driverFee: 0,
    highSeasonFee: 0,
    deliveryFee: 0,
    overtimeFee: 0,
    totalPrice: 0
  });

  const isSuperAdmin = currentUser.role === 'superadmin';

  useEffect(() => {
    setCars(getStoredData<Car[]>('cars', []));
    setBookings(getStoredData<Booking[]>('bookings', []));
    setDrivers(getStoredData<Driver[]>('drivers', []));
    setHighSeasons(getStoredData<HighSeason[]>('highSeasons', []));
    setCustomers(getStoredData<Customer[]>('customers', []));
    const loadedSettings = getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS);
    setSettings(loadedSettings);
    if(loadedSettings.rentalPackages.length > 0) {
        setPackageType(loadedSettings.rentalPackages[0]);
    }

    // Click outside handler for dropdown
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsCarDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Customer Selection
  useEffect(() => {
      if (selectedCustomerId) {
          const cust = customers.find(c => c.id === selectedCustomerId);
          if (cust) {
              setCustomerName(cust.name);
              setCustomerPhone(cust.phone);
          }
      }
  }, [selectedCustomerId, customers]);

  // Handle Deposit Image
  const handleDepositImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1000000) { 
        alert("Ukuran gambar terlalu besar (Maks 1MB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDepositImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Checklist Images
  const handleChecklistImageUpload = (field: 'speedometer' | 'front' | 'back' | 'left' | 'right', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 1000000) { 
            alert("Ukuran gambar terlalu besar (Maks 1MB).");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const res = reader.result as string;
            if (field === 'speedometer') setCheckSpeedometerImg(res);
            if (field === 'front') setCheckFrontImg(res);
            if (field === 'back') setCheckBackImg(res);
            if (field === 'left') setCheckLeftImg(res);
            if (field === 'right') setCheckRightImg(res);
        };
        reader.readAsDataURL(file);
    }
  };

  // Logic: Filter Available Cars & Drivers
  useEffect(() => {
      if (!startDate || !endDate) {
          // If no dates selected, show all (or logic could be to show none)
          setAvailableCars(cars);
          setAvailableDrivers(drivers);
          return;
      }

      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);

      if (end <= start) {
          setAvailableCars(cars);
          setAvailableDrivers(drivers);
          return;
      }

      // Filter Cars
      const filteredCars = cars.filter(car => {
          return checkAvailability(bookings, car.id, start, end, 'car', editingBookingId || undefined);
      });

      // Filter Drivers
      const filteredDrivers = drivers.filter(driver => {
          return checkAvailability(bookings, driver.id, start, end, 'driver', editingBookingId || undefined);
      });

      setAvailableCars(filteredCars);
      setAvailableDrivers(filteredDrivers);

  }, [startDate, startTime, endDate, endTime, cars, drivers, bookings, editingBookingId]);


  // Logic: Pricing & Validation
  useEffect(() => {
    if (!startDate || !endDate) return;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    
    // Check Availability (skip if editing same booking)
    if (selectedCarId) {
      const isCarAvailable = checkAvailability(bookings, selectedCarId, start, end, 'car', editingBookingId || undefined);
      setCarError(isCarAvailable ? '' : 'Mobil ini sudah dibooking pada tanggal tersebut (Bentrok).');
    } else {
        setCarError('');
    }

    if (useDriver && selectedDriverId) {
        const isDriverAvailable = checkAvailability(bookings, selectedDriverId, start, end, 'driver', editingBookingId || undefined);
        setDriverError(isDriverAvailable ? '' : 'Driver sedang bertugas di jadwal ini!');
    } else {
        setDriverError('');
    }

    // Pricing
    if (selectedCarId && start < end) {
        const car = cars.find(c => c.id === selectedCarId);
        const driver = useDriver ? drivers.find(d => d.id === selectedDriverId) : undefined;
        
        if (car) {
            const calculated = calculatePricing(car, driver, start, end, packageType, highSeasons, deliveryFee);
            // Add Overtime Fee
            const totalWithOvertime = calculated.totalPrice + (overtimeFee || 0);
            
            setPricing({
                ...calculated,
                overtimeFee: overtimeFee || 0,
                totalPrice: totalWithOvertime
            });
        }
    }
  }, [selectedCarId, selectedDriverId, useDriver, startDate, startTime, endDate, endTime, packageType, deliveryFee, bookings, cars, drivers, highSeasons, editingBookingId, overtimeFee]);

  // Auto-Update Amount Paid if Payment Status is Lunas
  useEffect(() => {
      if (paymentStatus === PaymentStatus.PAID) {
          setAmountPaid(pricing.totalPrice.toString());
      }
  }, [paymentStatus, pricing.totalPrice]);

  const handleEdit = (booking: Booking) => {
      setEditingBookingId(booking.id);
      setActiveTab('create');
      
      // Populate Data
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0,5));
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0,5));
      
      setSelectedCarId(booking.carId);
      setUseDriver(!!booking.driverId);
      setSelectedDriverId(booking.driverId || '');
      setSelectedCustomerId(booking.customerId || '');
      setCustomerName(booking.customerName);
      setCustomerPhone(booking.customerPhone);
      setDestination(booking.destination);
      setPackageType(booking.packageType);
      setDeliveryFee(booking.deliveryFee);
      
      setSecurityDepositType(booking.securityDepositType);
      setSecurityDepositValue(booking.securityDepositValue);
      setSecurityDepositDescription(booking.securityDepositDescription);
      setDepositImage(booking.securityDepositImage || null);
      
      setStatus(booking.status);
      setPaymentStatus(booking.paymentStatus);
      setAmountPaid(booking.amountPaid.toString());
      setNotes(booking.notes);

      setOvertimeFee(booking.overtimeFee || 0);
      if (booking.actualReturnDate) {
          const act = new Date(booking.actualReturnDate);
          setActualReturnDate(act.toISOString().split('T')[0]);
          setActualReturnTime(act.toTimeString().slice(0,5));
      } else {
          setActualReturnDate('');
          setActualReturnTime('');
      }
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (carError || driverError) return;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    
    if (end <= start) {
      alert('Waktu selesai harus setelah waktu mulai');
      return;
    }

    let actReturnIso = undefined;
    if (actualReturnDate && actualReturnTime) {
        actReturnIso = new Date(`${actualReturnDate}T${actualReturnTime}`).toISOString();
    }

    // Auto status COMPLETED if actual return date is set
    let finalStatus = status;
    if (actReturnIso) {
        finalStatus = BookingStatus.COMPLETED;
    }

    const newBooking: Booking = {
      id: editingBookingId || Date.now().toString(),
      carId: selectedCarId,
      driverId: useDriver ? selectedDriverId : undefined,
      customerId: selectedCustomerId || undefined,
      customerName,
      customerPhone,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      actualReturnDate: actReturnIso,
      
      packageType,
      destination,
      securityDepositType,
      securityDepositValue,
      securityDepositDescription,
      securityDepositImage: depositImage || undefined,

      // Financials
      basePrice: pricing.basePrice,
      driverFee: pricing.driverFee,
      highSeasonFee: pricing.highSeasonFee,
      deliveryFee: pricing.deliveryFee,
      overtimeFee: overtimeFee,
      totalPrice: pricing.totalPrice,
      
      amountPaid: parseInt(amountPaid) || 0,
      status: finalStatus,
      paymentStatus,
      notes,
      // Preserve checklist if editing
      checklist: editingBookingId ? bookings.find(b => b.id === editingBookingId)?.checklist : undefined,
      createdAt: editingBookingId ? (bookings.find(b => b.id === editingBookingId)?.createdAt || Date.now()) : Date.now()
    };

    // Transaction Log Logic (Simplified)
    if (newBooking.amountPaid > 0) {
        if (!editingBookingId) {
            const transaction: Transaction = {
                id: `tx-${Date.now()}`,
                date: new Date().toISOString(),
                amount: newBooking.amountPaid,
                type: 'Income',
                category: 'Rental Payment',
                description: `Pembayaran ${newBooking.customerName} - ${cars.find(c => c.id === selectedCarId)?.name}`,
                bookingId: newBooking.id
            };
            const currentTx = getStoredData<Transaction[]>('transactions', []);
            setStoredData('transactions', [transaction, ...currentTx]);
        }
    }

    let updatedBookings;
    if (editingBookingId) {
        updatedBookings = bookings.map(b => b.id === editingBookingId ? newBooking : b);
    } else {
        updatedBookings = [newBooking, ...bookings];
    }

    setBookings(updatedBookings);
    setStoredData('bookings', updatedBookings);
    
    setSuccessMessage(editingBookingId ? 'Booking diperbarui (Status: ' + finalStatus + ')' : 'Booking berhasil disimpan!');
    setTimeout(() => setSuccessMessage(''), 3000);
    setActiveTab('list');
    resetForm();
  };

  const resetForm = () => {
    setEditingBookingId(null);
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCarId('');
    setSelectedDriverId('');
    setUseDriver(false);
    setStartDate('');
    setEndDate('');
    setAmountPaid('0');
    setDeliveryFee(0);
    setSecurityDepositValue(0);
    setSecurityDepositDescription('');
    setDepositImage(null);
    setNotes('');
    setCarError('');
    setDriverError('');
    setOvertimeFee(0);
    setActualReturnDate('');
    setActualReturnTime('');
    setPricing({ basePrice:0, driverFee:0, highSeasonFee:0, deliveryFee:0, overtimeFee: 0, totalPrice:0 });
  };

  const handleDelete = (id: string) => {
      if(confirm('Hapus booking ini?')) {
          const updated = bookings.filter(b => b.id !== id);
          setBookings(updated);
          setStoredData('bookings', updated);
      }
  };

  // --- EXPORT CSV LOGIC ---
  const handleExportCSV = () => {
      // 1. Apply Filter Logic (Same as List View)
      let dataToExport = bookings;
      if (filterStartDate || filterEndDate) {
          dataToExport = bookings.filter(b => {
             const bDate = b.startDate.split('T')[0];
             const start = filterStartDate || '0000-00-00';
             const end = filterEndDate || '9999-12-31';
             return bDate >= start && bDate <= end;
          });
      }

      if (dataToExport.length === 0) {
          alert("Tidak ada data booking yang cocok dengan filter tanggal untuk diexport.");
          return;
      }

      const headers = [
          "ID Booking", 
          "Nama Pelanggan", 
          "No HP", 
          "Mobil", 
          "Plat Nomor", 
          "Driver", 
          "Tgl Mulai", 
          "Tgl Selesai", 
          "Tujuan",
          "Paket",
          "Total Biaya", 
          "Status Bayar", 
          "Status Booking"
      ];

      const rows = dataToExport.map(b => {
          const car = cars.find(c => c.id === b.carId);
          const driver = drivers.find(d => d.id === b.driverId);
          
          return [
              b.id.slice(0, 8),
              b.customerName,
              b.customerPhone,
              car?.name || '-',
              car?.plate || '-',
              driver ? driver.name : 'Tanpa Driver',
              new Date(b.startDate).toLocaleString('id-ID'),
              new Date(b.endDate).toLocaleString('id-ID'),
              b.destination,
              b.packageType,
              b.totalPrice,
              b.paymentStatus,
              b.status
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const dateSuffix = filterStartDate ? `_${filterStartDate}_to_${filterEndDate || 'now'}` : '_All';
      link.setAttribute("download", `Data_Booking_BRC${dateSuffix}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- CHECKLIST LOGIC ---
  const openChecklistModal = (booking: Booking) => {
      setChecklistBooking(booking);
      if (booking.checklist) {
          setCheckOdometer(booking.checklist.odometer.toString());
          setCheckFuel(booking.checklist.fuelLevel);
          setCheckSpeedometerImg(booking.checklist.speedometerImage);
          setCheckFrontImg(booking.checklist.physicalImages.front || null);
          setCheckBackImg(booking.checklist.physicalImages.back || null);
          setCheckLeftImg(booking.checklist.physicalImages.left || null);
          setCheckRightImg(booking.checklist.physicalImages.right || null);
          setCheckNotes(booking.checklist.notes || '');
      } else {
          setCheckOdometer('');
          setCheckFuel('Full');
          setCheckSpeedometerImg(null);
          setCheckFrontImg(null);
          setCheckBackImg(null);
          setCheckLeftImg(null);
          setCheckRightImg(null);
          setCheckNotes('');
      }
      setIsChecklistModalOpen(true);
  };

  const saveChecklist = (e: React.FormEvent) => {
      e.preventDefault();
      if (!checklistBooking || !checkSpeedometerImg) {
          alert("Foto Speedometer Wajib Diisi!");
          return;
      }

      const updatedChecklist: VehicleChecklist = {
          odometer: Number(checkOdometer),
          fuelLevel: checkFuel,
          speedometerImage: checkSpeedometerImg,
          physicalImages: {
              front: checkFrontImg || undefined,
              back: checkBackImg || undefined,
              left: checkLeftImg || undefined,
              right: checkRightImg || undefined,
          },
          notes: checkNotes,
          checkedAt: Date.now(),
          checkedBy: currentUser.name
      };

      const updatedBookings = bookings.map(b => {
          if (b.id === checklistBooking.id) {
              const newStatus = b.status === BookingStatus.BOOKED ? BookingStatus.ACTIVE : b.status;
              return { ...b, checklist: updatedChecklist, status: newStatus };
          }
          return b;
      });

      setBookings(updatedBookings);
      setStoredData('bookings', updatedBookings);
      setIsChecklistModalOpen(false);
      setSuccessMessage("Checklist berhasil disimpan & Status Aktif!");
      setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getFilteredBookings = () => {
      if (!filterStartDate && !filterEndDate) return bookings;
      return bookings.filter(b => {
         const bDate = b.startDate.split('T')[0];
         const start = filterStartDate || '0000-00-00';
         const end = filterEndDate || '9999-12-31';
         return bDate >= start && bDate <= end;
      });
  };

  const selectedCarData = cars.find(c => c.id === selectedCarId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Booking & Jadwal</h2>
          <p className="text-slate-500">Reservasi unit, jaminan, dan jadwal perjalanan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           {activeTab === 'list' && (
              <button onClick={handleExportCSV} className="px-4 py-2 rounded-md text-sm font-medium transition-colors text-green-700 bg-green-100 hover:bg-green-200 border border-green-200 flex items-center gap-2">
                 <FileSpreadsheet size={18} /> Export CSV
              </button>
           )}
           <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
             <button onClick={() => { setActiveTab('list'); resetForm(); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Daftar Booking</button>
             <button onClick={() => { setActiveTab('create'); resetForm(); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'create' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Buat Baru</button>
           </div>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle size={20} />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
             <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">{editingBookingId ? 'Edit Data Booking' : 'Input Booking Baru'}</h3>
                 {editingBookingId && (
                     <button onClick={resetForm} className="text-xs text-red-600 hover:underline">Batal Edit</button>
                 )}
             </div>
             <form onSubmit={handleCreateBooking} className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Schedule & Car */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Schedule */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                         <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Calendar size={18} /> Jadwal Sewa</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase">Mulai</label>
                                <div className="flex gap-2 mt-1">
                                    <input required type="date" className="block w-full border p-2 rounded-md text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                    <input type="time" className="block w-24 border p-2 rounded-md text-sm" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase">Selesai (Jadwal)</label>
                                <div className="flex gap-2 mt-1">
                                    <input required type="date" className="block w-full border p-2 rounded-md text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                    <input type="time" className="block w-24 border p-2 rounded-md text-sm" value={endTime} onChange={e => setEndTime(e.target.value)} />
                                </div>
                            </div>
                         </div>
                    </div>

                    {/* Car Selection (CUSTOM DROPDOWN) */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-slate-700">Pilih Unit Mobil <span className="text-slate-400 font-normal text-xs">(Hanya unit ready)</span></label>
                            {packageType && <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">Harga: {packageType}</span>}
                        </div>
                        {carError && <div className="mb-2 text-red-600 text-sm bg-red-50 p-2 rounded border border-red-100 flex items-center gap-2"><AlertTriangle size={14}/> {carError}</div>}
                        
                        <div className="relative" ref={dropdownRef}>
                            <div 
                                onClick={() => setIsCarDropdownOpen(!isCarDropdownOpen)}
                                className={`w-full border rounded-lg p-3 cursor-pointer flex items-center justify-between bg-white transition-all ${isCarDropdownOpen ? 'ring-2 ring-indigo-200 border-indigo-500' : 'hover:border-indigo-300'}`}
                            >
                                {selectedCarData ? (
                                    <div className="flex items-center gap-3">
                                        <img src={selectedCarData.image} alt={selectedCarData.name} className="w-12 h-8 object-cover rounded bg-slate-100" />
                                        <div>
                                            <p className="font-semibold text-sm text-slate-800">{selectedCarData.name}</p>
                                            <p className="text-xs text-slate-500">{selectedCarData.plate}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-slate-500 text-sm">
                                        {availableCars.length > 0 ? '-- Pilih Mobil --' : '-- Tidak ada unit tersedia di tanggal ini --'}
                                    </span>
                                )}
                                <ChevronDown size={18} className="text-slate-400" />
                            </div>

                            {isCarDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                                    {availableCars.length === 0 ? (
                                        <div className="p-4 text-center text-slate-500 text-sm">
                                            Tidak ada mobil tersedia pada tanggal yang dipilih.
                                        </div>
                                    ) : (
                                        availableCars.map(car => {
                                            const price = car.pricing && car.pricing[packageType] 
                                                ? car.pricing[packageType] 
                                                : (car.price24h || 0);
                                            const isSelected = selectedCarId === car.id;

                                            return (
                                                <div 
                                                    key={car.id} 
                                                    onClick={() => {
                                                        setSelectedCarId(car.id);
                                                        setIsCarDropdownOpen(false);
                                                    }}
                                                    className={`p-3 flex items-center gap-3 cursor-pointer border-b last:border-0 border-slate-50 transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                                                >
                                                    <img src={car.image} alt={car.name} className="w-12 h-8 object-cover rounded bg-slate-100" />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center">
                                                            <p className={`font-semibold text-sm ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>{car.name}</p>
                                                            <span className="text-xs font-bold text-indigo-600">
                                                                {price > 0 ? `Rp ${price/1000}k` : '-'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500">{car.plate}</p>
                                                    </div>
                                                    {isSelected && <CheckCircle size={16} className="text-indigo-600" />}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Driver Selection */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2"><UserIcon size={18} /> Layanan Supir</h4>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" checked={useDriver} onChange={e => setUseDriver(e.target.checked)} />
                                <span className="text-sm font-medium text-slate-700">Butuh Driver?</span>
                            </label>
                        </div>
                        
                        {useDriver && (
                            <>
                                {driverError && <div className="mb-2 text-red-600 text-sm bg-red-50 p-2 rounded border border-red-100 flex items-center gap-2"><AlertTriangle size={14}/> {driverError}</div>}
                                <select 
                                    className="w-full border p-2 rounded-md text-sm" 
                                    value={selectedDriverId} 
                                    onChange={e => setSelectedDriverId(e.target.value)}
                                    required={useDriver}
                                >
                                    <option value="">-- Pilih Driver (Ready) --</option>
                                    {availableDrivers.map(d => (
                                         <option key={d.id} value={d.id}>{d.name} - Rp {d.dailyRate.toLocaleString('id-ID')}/hari</option>
                                    ))}
                                </select>
                                {availableDrivers.length === 0 && (
                                    <p className="text-xs text-red-500 mt-1 italic">Tidak ada driver tersedia di tanggal ini.</p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Security Deposit (Jaminan) */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                         <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Shield size={18} /> Jaminan & Keamanan</h4>
                         <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Tipe Jaminan</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-slate-200">
                                        <input type="radio" name="depositType" value="Uang" checked={securityDepositType === 'Uang'} onChange={() => setSecurityDepositType('Uang')} className="text-indigo-600" />
                                        <span className="text-sm">Uang Tunai / Transfer</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded border border-slate-200">
                                        <input type="radio" name="depositType" value="Barang" checked={securityDepositType === 'Barang'} onChange={() => setSecurityDepositType('Barang')} className="text-indigo-600" />
                                        <span className="text-sm">Dokumen / Barang</span>
                                    </label>
                                </div>
                            </div>

                            {securityDepositType === 'Uang' ? (
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 uppercase">Nominal Jaminan (Cash/Transfer)</label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-2.5 text-slate-500 text-sm">Rp</span>
                                        <input type="number" className="w-full border border-slate-300 rounded-lg p-2 pl-10 text-sm" value={securityDepositValue} onChange={e => setSecurityDepositValue(Number(e.target.value))} />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 uppercase">Keterangan Jaminan (Wajib)</label>
                                        <input type="text" placeholder="Contoh: KTP Asli + Motor Honda Beat" className="w-full border border-slate-300 rounded-lg p-2 text-sm mt-1" value={securityDepositDescription} onChange={e => setSecurityDepositDescription(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 uppercase">Estimasi Nilai Barang (Opsional)</label>
                                        <div className="relative mt-1">
                                            <span className="absolute left-3 top-2.5 text-slate-500 text-sm">Rp</span>
                                            <input type="number" className="w-full border border-slate-300 rounded-lg p-2 pl-10 text-sm" value={securityDepositValue} onChange={e => setSecurityDepositValue(Number(e.target.value))} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Foto Jaminan / Barang</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden border border-slate-300">
                                        {depositImage ? (
                                            <img src={depositImage} className="w-full h-full object-cover" alt="Deposit" />
                                        ) : <ImageIcon className="text-slate-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <input type="file" accept="image/*" onChange={handleDepositImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                                        <p className="text-xs text-slate-400 mt-1">Foto KTP / SIM / Fisik Barang Jaminan</p>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>

                {/* Right Column: Details & Pricing */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900 border-b pb-2">Data Penyewa & Tujuan</h4>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase">Pilih Pelanggan (Opsional)</label>
                            <select className="mt-1 block w-full border p-2 rounded-md text-sm" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                                <option value="">-- Input Manual --</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase">Nama Penyewa</label>
                            <input required type="text" className="mt-1 block w-full rounded-md border p-2 text-sm" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase">No. WhatsApp</label>
                            <input required type="tel" className="mt-1 block w-full rounded-md border p-2 text-sm" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase">Tujuan</label>
                                <select className="mt-1 block w-full border p-2 rounded-md text-sm" value={destination} onChange={(e:any) => setDestination(e.target.value)}>
                                    <option value="Dalam Kota">Dalam Kota</option>
                                    <option value="Luar Kota">Luar Kota</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase">Antar/Ambil</label>
                                <input type="number" className="mt-1 block w-full rounded-md border p-2 text-sm" value={deliveryFee} onChange={e => setDeliveryFee(Number(e.target.value))} placeholder="Biaya (Rp)" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase">Paket Sewa</label>
                            <select className="mt-1 block w-full border p-2 rounded-md text-sm" value={packageType} onChange={(e:any) => setPackageType(e.target.value)}>
                                {settings.rentalPackages.map(pkg => (
                                    <option key={pkg} value={pkg}>{pkg}</option>
                                ))}
                            </select>
                        </div>

                        {/* Overtime & Return */}
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mt-4">
                            <h5 className="font-semibold text-sm text-orange-800 mb-2">Pengembalian & Overtime</h5>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="block text-[10px] text-orange-700 uppercase">Tgl Kembali (Aktual)</label>
                                    <input type="date" className="w-full text-xs border rounded p-1" value={actualReturnDate} onChange={e => setActualReturnDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-orange-700 uppercase">Jam</label>
                                    <input type="time" className="w-full text-xs border rounded p-1" value={actualReturnTime} onChange={e => setActualReturnTime(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-orange-700 uppercase">Denda Overtime (Rp)</label>
                                <input type="number" className="w-full text-sm border rounded p-1" value={overtimeFee} onChange={e => setOvertimeFee(Number(e.target.value))} placeholder="0" />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Breakdown Card */}
                    <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                        <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2"><Zap size={18} fill="currentColor" /> Rincian Biaya</h4>
                        <div className="space-y-2 text-sm text-indigo-800">
                            <div className="flex justify-between">
                                <span>Sewa Mobil</span>
                                <span>Rp {pricing.basePrice.toLocaleString('id-ID')}</span>
                            </div>
                            {pricing.driverFee > 0 && (
                                <div className="flex justify-between">
                                    <span>Jasa Driver</span>
                                    <span>Rp {pricing.driverFee.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            {pricing.highSeasonFee > 0 && (
                                <div className="flex justify-between text-orange-600 font-medium">
                                    <span>High Season</span>
                                    <span>Rp {pricing.highSeasonFee.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            {pricing.deliveryFee > 0 && (
                                <div className="flex justify-between">
                                    <span>Antar/Ambil</span>
                                    <span>Rp {pricing.deliveryFee.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            {(pricing.overtimeFee || 0) > 0 && (
                                <div className="flex justify-between text-red-600 font-bold">
                                    <span>Overtime / Denda</span>
                                    <span>Rp {(pricing.overtimeFee || 0).toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            <div className="border-t border-indigo-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>Rp {pricing.totalPrice.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase">Status</label>
                                <select className="w-full border p-2 rounded-md text-sm" value={status} onChange={(e:any) => setStatus(e.target.value)}>
                                    {Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 uppercase">Pembayaran</label>
                                <select className="w-full border p-2 rounded-md text-sm" value={paymentStatus} onChange={(e:any) => setPaymentStatus(e.target.value)}>
                                    {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 uppercase">Jumlah Dibayar</label>
                            <input type="number" className="w-full border p-2 rounded-md text-sm" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
                            {paymentStatus === PaymentStatus.PAID && (
                                <p className="text-[10px] text-green-600 mt-1">*Otomatis diset Lunas sesuai total tagihan</p>
                            )}
                        </div>
                        <button type="submit" disabled={!!carError || !!driverError || !selectedCarId} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200">
                            {editingBookingId ? 'Simpan Perubahan' : 'Simpan Booking'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Table Filters */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Filter size={16}/> Filter Tanggal Ambil:</span>
                <input 
                    type="date" 
                    className="border rounded px-2 py-1 text-sm text-slate-600" 
                    value={filterStartDate} 
                    onChange={e => setFilterStartDate(e.target.value)} 
                />
                <span className="text-slate-400">-</span>
                <input 
                    type="date" 
                    className="border rounded px-2 py-1 text-sm text-slate-600" 
                    value={filterEndDate} 
                    onChange={e => setFilterEndDate(e.target.value)} 
                />
                {(filterStartDate || filterEndDate) && (
                    <button 
                        onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }} 
                        className="text-xs text-red-600 hover:underline"
                    >
                        Reset
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Unit & Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Penyewa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Jadwal & Tujuan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Keuangan</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {getFilteredBookings().sort((a,b) => b.createdAt - a.createdAt).map(booking => {
                            const car = cars.find(c => c.id === booking.carId);
                            const driver = drivers.find(d => d.id === booking.driverId);
                            const due = booking.totalPrice - booking.amountPaid;
                            return (
                                <tr key={booking.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{car?.name || 'Unknown'}</div>
                                        <div className="text-xs text-slate-500">{car?.plate}</div>
                                        {driver && (
                                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-50 text-orange-700 text-xs font-medium">
                                                <UserIcon size={10} /> {driver.name}
                                            </div>
                                        )}
                                        {booking.status === BookingStatus.ACTIVE && (
                                            <div className="mt-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded w-fit">Active</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900">{booking.customerName}</div>
                                        <div className="text-xs text-slate-500">{booking.customerPhone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900">{new Date(booking.startDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</div>
                                        <div className="text-xs text-slate-500 mb-1">s/d {new Date(booking.endDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${booking.destination === 'Luar Kota' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {booking.destination}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                         <div className="text-sm text-slate-900 font-bold">Rp {booking.totalPrice.toLocaleString('id-ID')}</div>
                                         <div className="text-xs">
                                            {due > 0 ? (
                                                <span className="text-red-600">Kurang: {due.toLocaleString('id-ID')}</span>
                                            ) : (
                                                <span className="text-green-600 font-medium">Lunas</span>
                                            )}
                                         </div>
                                         {booking.overtimeFee && booking.overtimeFee > 0 ? (
                                             <div className="text-[10px] text-red-500 mt-1 font-bold">+ Denda: {booking.overtimeFee.toLocaleString('id-ID')}</div>
                                         ) : null}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                        {car && (
                                            <>
                                                {/* Edit Button */}
                                                <button 
                                                    onClick={() => handleEdit(booking)} 
                                                    title="Edit Booking"
                                                    className="p-1 border rounded text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                                                >
                                                    <Edit2 size={16} />
                                                </button>

                                                {/* Checklist Button */}
                                                <button 
                                                    onClick={() => openChecklistModal(booking)} 
                                                    title="Checklist Serah Terima"
                                                    className={`p-1 border rounded transition-colors ${booking.checklist ? 'bg-green-100 text-green-700 border-green-200' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'}`}
                                                >
                                                    <ClipboardCheck size={16} />
                                                </button>
                                                <button onClick={() => window.open(generateWhatsAppLink(booking, car), '_blank')} className="text-green-600 hover:text-green-900 p-1 border rounded hover:bg-green-50"><MessageCircle size={16} /></button>
                                                <button onClick={() => generateInvoicePDF(booking, car)} className="text-blue-600 hover:text-blue-900 p-1 border rounded hover:bg-blue-50"><Zap size={16} /></button>
                                            </>
                                        )}
                                        {isSuperAdmin && (
                                            <button onClick={() => handleDelete(booking.id)} className="text-red-600 hover:text-red-900 p-1 border rounded hover:bg-red-50"><Trash2 size={16} /></button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* CHECKLIST MODAL */}
      {isChecklistModalOpen && checklistBooking && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-xl w-full max-w-4xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                 <div className="flex justify-between items-center mb-6 pb-4 border-b">
                     <div>
                        <h3 className="text-xl font-bold text-slate-800">Checklist Serah Terima Unit</h3>
                        <p className="text-sm text-slate-500">ID: {checklistBooking.id.slice(0,8)} - {checklistBooking.customerName}</p>
                     </div>
                     <button onClick={() => setIsChecklistModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                         <X size={24} />
                     </button>
                 </div>

                 <form onSubmit={saveChecklist} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Section 1: Indicators */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2"><Gauge size={18} /> Indikator Kendaraan</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">KM (Odometer)</label>
                                    <input required type="number" className="w-full border rounded p-2 mt-1" placeholder="Ex: 54000" value={checkOdometer} onChange={e => setCheckOdometer(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">BBM (Fuel)</label>
                                    <select className="w-full border rounded p-2 mt-1" value={checkFuel} onChange={e => setCheckFuel(e.target.value)}>
                                        <option value="Full">Full</option>
                                        <option value="3/4">3/4</option>
                                        <option value="1/2">1/2</option>
                                        <option value="1/4">1/4</option>
                                        <option value="Empty">Empty / Res</option>
                                    </select>
                                </div>
                            </div>

                            {/* Speedometer Image (Required) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Foto Speedometer (Wajib)</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 relative h-40 flex flex-col items-center justify-center">
                                    {checkSpeedometerImg ? (
                                        <img src={checkSpeedometerImg} className="absolute inset-0 w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="text-slate-400">
                                            <Gauge className="mx-auto mb-2" />
                                            <span className="text-xs">Upload Foto Speedometer</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleChecklistImageUpload('speedometer', e)} />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Physical Photos */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2"><CarIcon size={18} /> Foto Fisik (Opsional)</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Depan', val: checkFrontImg, key: 'front' },
                                    { label: 'Belakang', val: checkBackImg, key: 'back' },
                                    { label: 'Kiri', val: checkLeftImg, key: 'left' },
                                    { label: 'Kanan', val: checkRightImg, key: 'right' }
                                ].map((item) => (
                                    <div key={item.key} className="border rounded-lg h-24 relative bg-slate-50 flex items-center justify-center overflow-hidden">
                                        {item.val ? (
                                            <img src={item.val} className="w-full h-full object-cover" />
                                        ) : <span className="text-xs text-slate-400">{item.label}</span>}
                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleChecklistImageUpload(item.key as any, e)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <label className="block text-sm font-medium text-slate-700">Catatan Kondisi (Baret/Penyok dll)</label>
                        <textarea className="w-full border rounded p-2 mt-1" rows={3} value={checkNotes} onChange={e => setCheckNotes(e.target.value)} placeholder="Tuliskan catatan kerusakan yang sudah ada sebelumnya..." />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsChecklistModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Batal</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Simpan Checklist</button>
                    </div>
                 </form>
             </div>
          </div>
      )}
    </div>
  );
};

export default BookingPage;
