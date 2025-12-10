// --- IMPORT TYPES YANG ADA ---
import { Car, Booking, Partner, Transaction, Driver, HighSeason, AppSettings, Customer, User } from '../types';

// --- TAMBAHAN IMPORT FIREBASE ---
import { db } from './firebaseService'; // Import koneksi database
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'; 
// setDoc dan doc diimpor untuk fungsi setStoredData (menyimpan)

// --- DEKLARASI MOCK DATA DIGANTI DENGAN FUNGSI ASYNC FIREBASE ---

// Fungsi umum untuk mengambil semua dokumen dari sebuah koleksi
export async function getAllData<T extends { id: string }>(collectionName: string): Promise<T[]> {
    try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as T
        }));
    } catch (error) {
        console.error(`Gagal memuat data dari koleksi ${collectionName}:`, error);
        // Penting: Anda perlu menentukan data fallback jika koneksi gagal
        // Untuk saat ini, kita kembalikan array kosong, tapi Anda bisa ganti dengan data mock lama
        return []; 
    }
}

// Fungsi pengganti getStoredData untuk mengambil data dari database
export const getStoredData = async <T extends { id: string }>(key: string, initial: T[]): Promise<T[]> => {
    // KECUALI untuk AppSettings yang mungkin hanya satu dokumen
    if (key === 'appSettings') {
        const settingsRef = doc(db, key, 'current'); // Asumsi AppSettings disimpan sebagai dokumen 'current'
        const settingsSnap = await getDocs(collection(db, key)); // Ambil semua dokumen dari 'appSettings'
        const settingsDoc = settingsSnap.docs[0]; // Ambil dokumen pertama

        if (settingsDoc) {
            return settingsDoc.data() as T[]; // Mengembalikan data settings
        }
    }
    
    // Untuk koleksi data seperti cars, partners, dll.
    const stored = await getAllData<T>(key);
    return stored.length > 0 ? stored : initial;
};


// Fungsi pengganti setStoredData untuk menyimpan data ke database
export const setStoredData = async <T extends { id: string }>(key: string, data: T[] | T) => {
    if (Array.isArray(data)) {
        // Jika data adalah array (seperti mobil/partner), simpan satu per satu
        for (const item of data) {
            const docRef = doc(db, key, item.id);
            await setDoc(docRef, item, { merge: true });
        }
    } else {
        // Jika data adalah objek tunggal (seperti AppSettings)
        const docRef = doc(db, key, 'current'); 
        await setDoc(docRef, data as T);
    }
};

// --- DEFINISI SETTINGS DAN MOCK DATA LAINNYA DIHAPUS, TAPI DEFAULT_SETTINGS DIPERTAHANKAN ---

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


// Fungsi ini sekarang tidak lagi menggunakan localStorage, tapi menginisialisasi database
export const initializeData = async () => {
    // Cek apakah data sudah ada di Firestore. Jika belum, set data default.
    // Catatan: Ini harus dilakukan HANYA SEKALI, mungkin lebih baik dijalankan manual di Firebase Console.
    
    // Contoh: Jika koleksi 'partners' kosong, set data mock (optional)
    // const partners = await getAllData<Partner>('partners');
    // if (partners.length === 0) {
    //     await setStoredData('partners', INITIAL_PARTNERS_MOCK); // Jika Anda mau menyimpan mock awal
    // }

    // Kita hanya perlu memastikan AppSettings ada
    const settingsRef = doc(db, 'appSettings', 'current');
    const settingsSnap = await getDocs(collection(db, 'appSettings')); 

    if (settingsSnap.empty) {
        await setDoc(settingsRef, DEFAULT_SETTINGS);
    }

    // Untuk semua data lain, kita asumsikan sudah ada koleksinya di Firestore
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
    // ... (KODE CHECK AVAILABILITY SAMA) ...
    // [KODE CHECK AVAILABILITY LAMA ANDA]
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
    // ... (KODE CALCULATE PRICING SAMA) ...
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));    
    const duration = diffDays > 0 ? diffDays : 1;

    let basePrice = 0;
    
    // Dynamic Pricing Logic
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

// --- GENERIC EXPORT / IMPORT HELPERS SAMA ---

export const exportToCSV = (data: any[], filename: string) => {
    // ... (KODE EXPORT TO CSV SAMA) ...
    if (!data || data.length === 0) {
        alert("Tidak ada data untuk diexport.");
        return;
    }
    // [KODE EXPORT TO CSV LAMA ANDA]
};

export const processCSVImport = (file: File, callback: (data: any[]) => void) => {
    // ... (KODE PROCESS CSV IMPORT SAMA) ...
    // [KODE PROCESS CSV IMPORT LAMA ANDA]
};

export const mergeData = <T extends { id: string }>(existingData: T[], incomingData: T[]): T[] => {
    // ... (KODE MERGE DATA SAMA) ...
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
