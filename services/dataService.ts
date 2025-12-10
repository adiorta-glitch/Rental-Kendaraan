// --- IMPORT TYPES YANG ADA ---
import { Car, Booking, Partner, Transaction, Driver, HighSeason, AppSettings, Customer, User } from '../types';

// --- TAMBAHAN IMPORT FIREBASE ---
import { db } from './firebaseService'; 
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'; 


// --- MOCK DATA DIKEMBALIKAN SEBAGAI FALLBACK (UNTUK KASUS FIREBASE GAGAL/KOSONG) ---

export const INITIAL_PARTNERS: Partner[] = [
  { id: 'p1', name: 'Budi Santoso', phone: '08123456789', splitPercentage: 70, image: 'https://i.pravatar.cc/150?u=p1' },
];

export const INITIAL_CARS: Car[] = [
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

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Pak Asep', phone: '08122334455', dailyRate: 150000, status: 'Active', image: 'https://i.pravatar.cc/150?u=d1' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust1', name: 'John Doe', phone: '08111222333', address: 'Jl. Sudirman No. 1, Jakarta' }
];

export const INITIAL_HIGH_SEASONS: HighSeason[] = [
  { id: 'hs1', name: 'Libur Lebaran', startDate: '2024-04-05', endDate: '2024-04-15', priceIncrease: 100000 },
];
// --- END OF MOCK DATA ---


// --- DEFAULT SETTINGS (DIPERLUKAN UNTUK FALLBACK DAN INISIALISASI) ---
export const DEFAULT_SETTINGS: AppSettings = {
  // ... (SEMUA DEFINISI DEFAULT_SETTINGS SAMA SEPERTI YANG ANDA BERIKAN) ...
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


// --- FUNGSI FIREBASE DENGAN LOGIKA FALLBACK ---

// Fungsi umum untuk mengambil semua dokumen dari sebuah koleksi
export async function getAllData<T extends { id: string }>(collectionName: string, fallbackData: T[] = []): Promise<T[]> {
    try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as T
        }));

        // Jika database kosong, kembalikan data fallback (mock)
        if (data.length === 0) {
             console.log(`[FIREBASE] Koleksi ${collectionName} kosong, menggunakan data mock.`);
             return fallbackData; 
        }
        
        return data;

    } catch (error) {
        console.error(`[FIREBASE ERROR] Gagal koneksi ke ${collectionName}, menggunakan data mock.`, error);
        // Jika ada error koneksi, kembalikan data fallback
        return fallbackData; 
    }
}


// Fungsi pengganti getStoredData untuk mengambil data dari database
export const getStoredData = async <T extends { id: string }>(key: string, initial: T[] | T): Promise<T[] | T> => {
    
    // Logika untuk AppSettings (dianggap dokumen tunggal 'current')
    if (key === 'appSettings') {
        try {
            const settingsRef = doc(db, key, 'current');
            const settingsSnap = await getDocs(collection(db, key)); // Ambil semua dokumen
            
            if (!settingsSnap.empty) {
                return settingsSnap.docs[0].data() as T; // Kembalikan data settings pertama
            } else {
                console.log("[FIREBASE] AppSettings kosong, menggunakan DEFAULT_SETTINGS.");
                return initial as T;
            }
        } catch (error) {
             console.error("[FIREBASE ERROR] Gagal memuat AppSettings, menggunakan DEFAULT_SETTINGS.", error);
             return initial as T;
        }
    }
    
    // Untuk koleksi data (cars, partners, dll.)
    const stored = await getAllData<T>(key, initial as T[]); // Meneruskan 'initial' sebagai fallback
    return stored;
};


// Fungsi pengganti setStoredData untuk menyimpan data ke database
export const setStoredData = async <T extends { id: string }>(key: string, data: T[] | T) => {
    try {
        if (Array.isArray(data)) {
            // Simpan array (cars, partners) satu per satu
            for (const item of data) {
                const docRef = doc(db, key, item.id);
                await setDoc(docRef, item as Record<string, any>, { merge: true });
            }
        } else {
            // Simpan objek tunggal (AppSettings)
            const docRef = doc(db, key, 'current'); 
            await setDoc(docRef, data as Record<string, any>);
        }
    } catch (error) {
        console.error(`Gagal menyimpan data ke Firestore koleksi ${key}:`, error);
        // Fallback: Jika gagal ke Firestore, simpan ke LocalStorage (seperti kode lama)
        localStorage.setItem(key, JSON.stringify(data));
    }
};


// Fungsi inisialisasi dimodifikasi untuk membuat data default di Firestore jika belum ada
export const initializeData = async () => {
    try {
        // 1. Cek AppSettings: Jika kosong, buat dokumen default
        const settingsSnap = await getDocs(collection(db, 'appSettings')); 
        if (settingsSnap.empty) {
            await setStoredData('appSettings', DEFAULT_SETTINGS);
            console.log("[FIREBASE] AppSettings diinisialisasi.");
        }

        // 2. Cek Cars: Jika kosong, masukkan data mock mobil
        const carsSnap = await getDocs(collection(db, 'cars'));
        if (carsSnap.empty) {
            await setStoredData('cars', INITIAL_CARS);
            console.log("[FIREBASE] Mobil diinisialisasi dari Mock Data.");
        }
        
        // Ulangi untuk koleksi lain (Partners, Drivers, dll.) jika Anda ingin mock data tersimpan permanen:
        // const partnersSnap = await getDocs(collection(db, 'partners'));
        // if (partnersSnap.empty) {
        //     await setStoredData('partners', INITIAL_PARTNERS);
        // }
        
        // Catatan: Fungsi initializeData() ini akan berjalan ASYNC.
        
    } catch (error) {
        console.error("[FIREBASE] Gagal menjalankan inisialisasi database.", error);
        // Jika Firebase gagal, fallback ke LocalStorage untuk demo
        if (!localStorage.getItem('partners')) localStorage.setItem('partners', JSON.stringify(INITIAL_PARTNERS));
        if (!localStorage.getItem('cars')) localStorage.setItem('cars', JSON.stringify(INITIAL_CARS));
        // ... dst
    }
};

// --- FUNGSI LAINNYA TETAP SAMA ---

export const checkAvailability = (
    bookings: Booking[], 
    resourceId: string, 
    start: Date, 
    end: Date, 
    resourceType: 'car' | 'driver',
    excludeBookingId?: string
): boolean => {
    // [KODE CHECK AVAILABILITY LAMA ANDA]
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
    // [KODE CALCULATE PRICING LAMA ANDA]
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));    
    const duration = diffDays > 0 ? diffDays : 1;

    let basePrice = 0;
    
    if (car.pricing && car.pricing[packageType]) {
        basePrice = car.pricing[packageType] * duration;
    } else {
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

export const exportToCSV = (data: any[], filename: string) => {
    // [KODE EXPORT TO CSV LAMA ANDA]
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
    // [KODE PROCESS CSV IMPORT LAMA ANDA]
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        const [headerLine, ...lines] = text.split('\n');
        const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        const result = lines.filter(line => line.trim()).map(line => {
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            
            const obj: any = {};
            headers.forEach((header, index) => {
                let val = values[index] ? values[index].trim().replace(/^"|"$/g, '') : '';
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

export const mergeData = <T extends { id: string }>(existingData: T[], incomingData: T[]): T[] => {
    // [KODE MERGE DATA LAMA ANDA]
    const dataMap = new Map(existingData.map(item => [item.id, item]));

    incomingData.forEach(newItem => {
        if (newItem.id && dataMap.has(newItem.id)) {
            dataMap.set(newItem.id, { ...dataMap.get(newItem.id), ...newItem });
        } else {
            const id = newItem.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
            dataMap.set(id, { ...newItem, id });
        }
    });

    return Array.from(dataMap.values());
};
