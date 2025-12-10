
import { Car, Booking, Partner, Transaction, Driver, HighSeason, AppSettings, Customer, User } from '../types';

// Mock Data Initialization
const INITIAL_PARTNERS: Partner[] = [
  { id: 'p1', name: 'Budi Santoso', phone: '08123456789', splitPercentage: 70, image: 'https://i.pravatar.cc/150?u=p1' },
];

const INITIAL_CARS: Car[] = [
  { 
    id: 'c1', 
    name: 'Toyota Avanza', 
    plate: 'B 1234 ABC', 
    type: 'MPV', 
    pricing: {
      '12 Jam (Dalam Kota)': 300000,
      '24 Jam (Dalam Kota)': 450000,
      'Full Day (Luar Kota)': 550000
    },
    status: 'Available', 
    image: 'https://picsum.photos/300/200?random=1' 
  },
  { 
    id: 'c2', 
    name: 'Honda Brio', 
    plate: 'B 5678 DEF', 
    type: 'City Car', 
    pricing: {
      '12 Jam (Dalam Kota)': 250000,
      '24 Jam (Dalam Kota)': 350000,
      'Full Day (Luar Kota)': 450000
    }, 
    status: 'Available', 
    image: 'https://picsum.photos/300/200?random=2' 
  },
];

const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Pak Asep', phone: '08122334455', dailyRate: 150000, status: 'Active', image: 'https://i.pravatar.cc/150?u=d1' },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust1', name: 'John Doe', phone: '08111222333', address: 'Jl. Sudirman No. 1, Jakarta' }
];

const INITIAL_HIGH_SEASONS: HighSeason[] = [
  { id: 'hs1', name: 'Libur Lebaran', startDate: '2024-04-05', endDate: '2024-04-15', priceIncrease: 100000 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Bersama Rent Car',
  tagline: 'Solusi Perjalanan Anda',
  address: 'Jl. Raya Utama No. 88, Jakarta',
  phone: '0812-3456-7890',
  email: 'admin@bersamarentcar.com',
  website: 'www.bersamarentcar.com',
  invoiceFooter: 'Terima kasih telah menyewa di Bersama Rent Car.',
  logoUrl: null,
  
  // Theme Defaults
  themeColor: 'red',
  darkMode: false,
  
  // Default Terms
  paymentTerms: '1. Pembayaran DP minimal 30% dimuka.\n2. Pelunasan wajib dilakukan saat serah terima unit.\n3. Pembayaran via Transfer Bank BCA: 1234567890 a/n BRC.',
  termsAndConditions: '1. Penyewa wajib memiliki SIM A yang berlaku.\n2. Dilarang merokok di dalam kendaraan.\n3. Segala bentuk pelanggaran lalu lintas menjadi tanggung jawab penyewa.\n4. Keterlambatan pengembalian dikenakan denda sesuai ketentuan.',

  whatsappTemplate: `*NOTA*
*BERSAMA RENT CAR*
No. Inv.: {invoiceNo}
--------------------------------
Halo {name}
Berikut rincian sewa Anda:

🚗 Unit: {unit}
📅 Tgl: {startDate} s/d {endDate}
--------------------------------
💰 Total Biaya : {total}
✅ Sudah Bayar : {paid}
--------------------------------
⚠️ SISA TAGIHAN: {remaining}
⚠️ STATUS: {status}
--------------------------------
Silakan melunasi pembayaran ke:
💳 BCA: 1234567890 (a.n Rental BRC)

Terima kasih telah menyewa di Bersama Rent Car.`,

  carCategories: ['MPV', 'SUV', 'City Car', 'Sedan', 'Luxury', 'Minibus'],
  rentalPackages: ['12 Jam (Dalam Kota)', '24 Jam (Dalam Kota)', 'Full Day (Luar Kota)']
};

export const getStoredData = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : initial;
};

export const setStoredData = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const initializeData = () => {
  if (!localStorage.getItem('partners')) setStoredData('partners', INITIAL_PARTNERS);
  if (!localStorage.getItem('cars')) setStoredData('cars', INITIAL_CARS);
  if (!localStorage.getItem('drivers')) setStoredData('drivers', INITIAL_DRIVERS);
  if (!localStorage.getItem('customers')) setStoredData('customers', INITIAL_CUSTOMERS);
  if (!localStorage.getItem('highSeasons')) setStoredData('highSeasons', INITIAL_HIGH_SEASONS);
  if (!localStorage.getItem('bookings')) setStoredData('bookings', []);
  if (!localStorage.getItem('transactions')) setStoredData('transactions', []);
  if (!localStorage.getItem('appSettings')) setStoredData('appSettings', DEFAULT_SETTINGS);
  
  // Users are handled in authService but stored in localStorage for persistence in this demo
  if (!localStorage.getItem('users')) {
     // Initial logic handled in authService mock, but we can init empty here if needed
  }
};

export const checkAvailability = (
  bookings: Booking[], 
  resourceId: string, 
  start: Date, 
  end: Date, 
  resourceType: 'car' | 'driver',
  excludeBookingId?: string
): boolean => {
  if (!resourceId) return true;

  return !bookings.some(b => {
    if (b.status === 'Cancelled' || b.status === 'Completed') return false;
    
    if (resourceType === 'car' && b.carId !== resourceId) return false;
    if (resourceType === 'driver' && b.driverId !== resourceId) return false;
    
    if (excludeBookingId && b.id === excludeBookingId) return false;

    const bStart = new Date(b.startDate);
    const bEnd = new Date(b.endDate);

    return start < bEnd && end > bStart;
  });
};

export const calculatePricing = (
  car: Car, 
  driver: Driver | undefined,
  start: Date, 
  end: Date, 
  packageType: string,
  highSeasons: HighSeason[],
  deliveryFee: number = 0
) => {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  const duration = diffDays > 0 ? diffDays : 1;

  let basePrice = 0;
  
  // Dynamic Pricing Logic
  if (car.pricing && car.pricing[packageType]) {
    basePrice = car.pricing[packageType] * duration;
  } else {
    // Fallback if price not found (Should ideally prompt user or default to 0)
    // Try to find reasonable default or legacy fields
    if (car.price24h) {
         basePrice = car.price24h * duration;
    }
  }

  let driverFee = 0;
  if (driver) {
    driverFee = driver.dailyRate * duration;
  }

  let highSeasonFee = 0;
  let currentDate = new Date(start);
  currentDate.setHours(0,0,0,0);
  
  for (let i = 0; i < duration; i++) {
    const time = currentDate.getTime();
    const activeSeason = highSeasons.find(hs => {
      const hsStart = new Date(hs.startDate).setHours(0,0,0,0);
      const hsEnd = new Date(hs.endDate).setHours(23,59,59,999);
      return time >= hsStart && time <= hsEnd;
    });

    if (activeSeason) {
      highSeasonFee += activeSeason.priceIncrease;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    basePrice,
    driverFee,
    highSeasonFee,
    deliveryFee,
    totalPrice: basePrice + driverFee + highSeasonFee + deliveryFee
  };
};

// --- GENERIC EXPORT / IMPORT HELPERS ---

export const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        alert("Tidak ada data untuk diexport.");
        return;
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(obj => 
        headers.map(header => {
            let val = obj[header];
            if (typeof val === 'object') val = JSON.stringify(val).replace(/"/g, '""');
            return `"${val}"`;
        }).join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const processCSVImport = (file: File, callback: (data: any[]) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        const [headerLine, ...lines] = text.split('\n');
        const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        const result = lines.filter(line => line.trim()).map(line => {
            // Simple regex to split by comma ignoring commas inside quotes
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            
            const obj: any = {};
            headers.forEach((header, index) => {
                let val = values[index] ? values[index].trim().replace(/^"|"$/g, '') : '';
                // Try to parse basic numbers
                if (!isNaN(Number(val)) && val !== '') {
                    obj[header] = Number(val);
                } else if (val === 'true') obj[header] = true;
                else if (val === 'false') obj[header] = false;
                else obj[header] = val;
            });
            return obj;
        });
        callback(result);
    };
    reader.readAsText(file);
};

// Helper to Merge New Import Data with Existing Data (Upsert)
export const mergeData = <T extends { id: string }>(existingData: T[], incomingData: T[]): T[] => {
    const dataMap = new Map(existingData.map(item => [item.id, item]));

    incomingData.forEach(newItem => {
        // If the incoming item has an ID and it exists in map, update it
        if (newItem.id && dataMap.has(newItem.id)) {
            dataMap.set(newItem.id, { ...dataMap.get(newItem.id), ...newItem });
        } else {
            // If ID is missing or new, add it. Ensure ID exists.
            const id = newItem.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
            dataMap.set(id, { ...newItem, id });
        }
    });

    return Array.from(dataMap.values());
};
