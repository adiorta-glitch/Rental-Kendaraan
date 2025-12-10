
import { jsPDF } from "jspdf";
import { Booking, Car, AppSettings, Transaction, Partner, Driver } from "../types";
import { getStoredData, DEFAULT_SETTINGS } from "./dataService";

const drawLogo = (doc: jsPDF, x: number, y: number, scale: number = 1.0) => {
    // Helper to scale coordinates
    const s = (val: number) => val * scale;
    
    // Draw "B" - Black
    doc.setFillColor(0, 0, 0); // Black
    doc.path([
        { op: 'm', c: [s(x + 5), s(y + 5)] },
        { op: 'l', c: [s(x + 35), s(y + 5)] },
        { op: 'c', c: [s(x + 50), s(y + 5), s(x + 50), s(y + 22), s(x + 35), s(y + 22)] },
        { op: 'c', c: [s(x + 50), s(y + 22), s(x + 50), s(y + 38), s(x + 35), s(y + 38)] },
        { op: 'l', c: [s(x + 15), s(y + 38)] },
        { op: 'l', c: [s(x + 15), s(y + 50)] },
        { op: 'l', c: [s(x + 5), s(y + 50)] },
        { op: 'l', c: [s(x + 5), s(y + 5)] },
        { op: 'h' }
    ]);
    doc.fill();

    // B Hole Top
    doc.setFillColor(255, 255, 255);
    doc.path([
        { op: 'm', c: [s(x + 15), s(y + 15)] },
        { op: 'l', c: [s(x + 15), s(y + 30)] },
        { op: 'l', c: [s(x + 30), s(y + 30)] },
        { op: 'c', c: [s(x + 38), s(y + 30), s(x + 38), s(y + 22), s(x + 30), s(y + 15)] },
        { op: 'l', c: [s(x + 15), s(y + 15)] },
        { op: 'h' }
    ]);
    doc.fill();

    // Draw "R" - Black
    doc.setFillColor(0, 0, 0);
    doc.path([
        { op: 'm', c: [s(x + 40), s(y + 5)] },
        { op: 'l', c: [s(x + 65), s(y + 5)] },
        { op: 'c', c: [s(x + 80), s(y + 5), s(x + 80), s(y + 22), s(x + 65), s(y + 22)] },
        { op: 'l', c: [s(x + 70), s(y + 36)] },
        { op: 'l', c: [s(x + 85), s(y + 50)] },
        { op: 'l', c: [s(x + 70), s(y + 50)] },
        { op: 'l', c: [s(x + 58), s(y + 38)] },
        { op: 'l', c: [s(x + 50), s(y + 38)] },
        { op: 'l', c: [s(x + 50), s(y + 50)] },
        { op: 'l', c: [s(x + 40), s(y + 50)] },
        { op: 'l', c: [s(x + 40), s(y + 5)] },
        { op: 'h' }
    ]);
    doc.fill();

    // R Hole
    doc.setFillColor(255, 255, 255);
    doc.path([
        { op: 'm', c: [s(x + 50), s(y + 15)] },
        { op: 'l', c: [s(x + 50), s(y + 30)] },
        { op: 'l', c: [s(x + 60), s(y + 30)] },
        { op: 'c', c: [s(x + 68), s(y + 30), s(x + 68), s(y + 22), s(x + 60), s(y + 15)] },
        { op: 'l', c: [s(x + 50), s(y + 15)] },
        { op: 'h' }
    ]);
    doc.fill();

    // Draw "C" / Steering Wheel Arc - Black Stroke
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(s(10));
    const cx = x + 90;
    const cy = y + 27.5;
    const r = 22.5;
    doc.circle(s(cx), s(cy), s(r), 'S');

    // Red Dot Center
    doc.setFillColor(220, 38, 38); // #DC2626
    doc.circle(s(cx), s(cy), s(5), 'F');
};

export const generateInvoicePDF = (booking: Booking, car: Car) => {
  const settings = getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS);
  const doc = new jsPDF();

  if (settings.logoUrl) {
    try {
        doc.addImage(settings.logoUrl, 'PNG', 20, 10, 40, 20, undefined, 'FAST');
    } catch (e) {
        console.error("Failed to render custom logo", e);
        drawLogo(doc, 20, 10, 0.3);
    }
  } else {
    drawLogo(doc, 20, 10, 0.3);
  }

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(settings.companyName.toUpperCase(), 60, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(220, 38, 38);
  doc.text("MANAGEMENT SYSTEM", 60, 28);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(settings.address, 20, 35);
  doc.text(`${settings.phone} | ${settings.email}`, 20, 40);

  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1);
  doc.line(20, 45, 190, 45);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("INVOICE", 150, 25);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`ID: #${booking.id.slice(0, 8)}`, 150, 31);
  doc.text(`Tgl: ${new Date(booking.createdAt).toLocaleDateString('id-ID')}`, 150, 37);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Penyewa:", 20, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nama: ${booking.customerName}`, 25, 66);
  doc.text(`No. HP: ${booking.customerPhone}`, 25, 72);
  if (booking.destination) {
      doc.text(`Tujuan: ${booking.destination}`, 25, 78);
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Kendaraan:", 110, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${car.name} (${car.type})`, 115, 66);
  doc.text(`Plat: ${car.plate}`, 115, 72);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detail Transaksi:", 20, 95);
  
  const start = new Date(booking.startDate).toLocaleString('id-ID');
  const end = new Date(booking.endDate).toLocaleString('id-ID');
  
  let y = 105;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Periode: ${start} s/d ${end}`, 25, y); y+=6;
  doc.text(`Paket: ${booking.packageType}`, 25, y); y+=10;

  doc.setFillColor(245, 245, 245);
  doc.rect(20, y, 170, 8, 'F');
  doc.setFont("helvetica", "bold");
  doc.text("Deskripsi", 25, y+6);
  doc.text("Jumlah", 160, y+6);
  doc.setFont("helvetica", "normal");
  y += 14;

  const addRow = (label: string, value: number) => {
    if (value > 0 || label === 'Sewa Unit Mobil') {
        doc.text(label, 25, y);
        doc.text(`Rp ${value.toLocaleString('id-ID')}`, 160, y);
        y += 8;
    }
  };

  const basePrice = booking.basePrice || booking.totalPrice; 
  
  addRow("Sewa Unit Mobil", basePrice);
  if(booking.driverFee) addRow("Jasa Driver", booking.driverFee);
  if(booking.highSeasonFee) addRow("Surcharge High Season", booking.highSeasonFee);
  if(booking.deliveryFee) addRow("Biaya Antar/Ambil", booking.deliveryFee);
  if(booking.overtimeFee) addRow("Denda Overtime", booking.overtimeFee);

  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 10;
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Total Tagihan:", 110, y);
  doc.setTextColor(220, 38, 38); 
  doc.text(`Rp ${booking.totalPrice.toLocaleString('id-ID')}`, 160, y);
  y += 8;

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Sudah Dibayar:", 110, y);
  doc.text(`Rp ${booking.amountPaid.toLocaleString('id-ID')}`, 160, y);
  y += 10;

  const due = booking.totalPrice - booking.amountPaid;
  doc.setFontSize(14);
  doc.setTextColor(due > 0 ? 220 : 0, due > 0 ? 38 : 0, due > 0 ? 38 : 0); 
  doc.setFont("helvetica", "bold");
  doc.text("Sisa Tagihan:", 110, y);
  doc.text(`Rp ${due.toLocaleString('id-ID')}`, 160, y);

  y += 20;
  
  if (y > 230) {
      doc.addPage();
      y = 20;
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  if (settings.paymentTerms) {
      doc.setFont("helvetica", "bold");
      doc.text("Ketentuan Pembayaran:", 20, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const splitPayment = doc.splitTextToSize(settings.paymentTerms, 170);
      doc.text(splitPayment, 20, y);
      y += (splitPayment.length * 4) + 6;
  }

  if (settings.termsAndConditions) {
      if (y > 250) { doc.addPage(); y = 20; }
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Syarat & Ketentuan Sewa:", 20, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const splitTerms = doc.splitTextToSize(settings.termsAndConditions, 170);
      doc.text(splitTerms, 20, y);
      y += (splitTerms.length * 4) + 10;
  }

  const footerY = 280;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  
  const splitFooter = doc.splitTextToSize(settings.invoiceFooter, 170);
  doc.text(splitFooter, 20, footerY - 10);
  
  doc.setFontSize(8);
  doc.text(`${settings.companyName} - Generated via ERP System`, 20, footerY);

  doc.save(`Invoice_${booking.customerName}_${booking.id.slice(0,6)}.pdf`);
};

export const generateWhatsAppLink = (booking: Booking, car: Car) => {
  const settings = getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS);
  
  const due = booking.totalPrice - booking.amountPaid;
  const start = new Date(booking.startDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
  const end = new Date(booking.endDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
  
  let unitInfo = car.name;
  if (booking.driverFee > 0) unitInfo += " (+ Driver)";
  
  const totalPrice = `Rp ${booking.totalPrice.toLocaleString('id-ID')}`;
  const amountPaid = `Rp ${booking.amountPaid.toLocaleString('id-ID')}`;
  const remaining = `Rp ${due.toLocaleString('id-ID')}`;
  
  let text = settings.whatsappTemplate || `*NOTA*\nNo. Inv: {invoiceNo}\n\nHalo {name},\nDetail Sewa:\nUnit: {unit}\nTgl: {startDate} s/d {endDate}\n\nTotal: {total}\nSisa: {remaining}\n\n{footer}`;

  text = text.replace(/{invoiceNo}/g, booking.id.slice(0,6));
  text = text.replace(/{name}/g, booking.customerName);
  text = text.replace(/{unit}/g, unitInfo);
  text = text.replace(/{startDate}/g, start);
  text = text.replace(/{endDate}/g, end);
  text = text.replace(/{total}/g, totalPrice);
  text = text.replace(/{paid}/g, amountPaid);
  text = text.replace(/{remaining}/g, remaining);
  text = text.replace(/{status}/g, booking.paymentStatus);
  text = text.replace(/{footer}/g, settings.invoiceFooter);
  text = text.replace(/{paymentTerms}/g, settings.paymentTerms || "");

  return `https://wa.me/${booking.customerPhone.replace(/^0/, '62').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
};

// --- CHART DRAWING HELPERS FOR PDF ---

const drawHistogram = (doc: jsPDF, x: number, y: number, width: number, height: number, data: {label: string, value: number}[]) => {
    // Background
    doc.setFillColor(250, 250, 250);
    doc.rect(x, y, width, height, 'F');
    
    // Axis
    doc.setDrawColor(200, 200, 200);
    doc.line(x, y + height, x + width, y + height); // X Axis
    
    if (data.length === 0) {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Tidak ada data", x + width/2, y + height/2, {align: 'center'});
        return;
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = (width / data.length) * 0.7;
    const spacing = (width / data.length) * 0.3;
    
    let currentX = x + (spacing / 2);
    
    data.forEach((d) => {
        const barHeight = maxValue > 0 ? (d.value / maxValue) * (height - 10) : 0;
        
        // Bar
        doc.setFillColor(34, 197, 94); // Green
        doc.rect(currentX, y + height - barHeight, barWidth, barHeight, 'F');
        
        // Label
        if (data.length <= 15 || parseInt(d.label) % 2 !== 0) { // Skip labels if too crowded
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text(d.label, currentX + barWidth/2, y + height + 4, { align: 'center' });
        }

        currentX += barWidth + spacing;
    });
};

const drawPieChart = (doc: jsPDF, cx: number, cy: number, radius: number, data: {label: string, value: number, color: number[]}[]) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) {
        doc.setDrawColor(200,200,200);
        doc.circle(cx, cy, radius, 'S');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("No Data", cx, cy, { align: 'center' });
        return;
    }

    let startAngle = 0;
    
    data.forEach(item => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;
        
        // Draw Sector
        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        
        // Approximate a sector using a polygon (simplest robust way without complex Bezier math in raw jsPDF)
        // Center -> Point 1 -> Point 2 -> Center
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);

        // For better look, add a mid point for the arc
        const midAngle = startAngle + (sliceAngle/2);
        const xm = cx + radius * Math.cos(midAngle);
        const ym = cy + radius * Math.sin(midAngle);
        
        doc.lines([
            [x1-cx, y1-cy],
            [xm-x1, ym-y1],
            [x2-xm, y2-ym],
            [cx-x2, cy-y2]
        ], cx, cy, [1,1], 'F');

        startAngle = endAngle;
    });

    // Legend
    let ly = cy + radius + 10;
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    data.forEach(item => {
        const percent = ((item.value / total) * 100).toFixed(0);
        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        doc.circle(cx - 20, ly, 2, 'F');
        doc.text(`${item.label} (${percent}%)`, cx - 15, ly + 1);
        ly += 5;
    });
};

// NEW: Monthly Report Generator for Partner/Driver
export const generateMonthlyReportPDF = (
    role: 'Partner' | 'Driver',
    entity: Partner | Driver,
    month: string, // YYYY-MM format
    transactions: Transaction[],
    bookings: Booking[]
) => {
    const settings = getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS);
    const cars = getStoredData<Car[]>('cars', []); // Fetch cars to resolve names
    const doc = new jsPDF();
    const [year, monthNum] = month.split('-');
    const dateObj = new Date(parseInt(year), parseInt(monthNum)-1);
    const periodName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    // HEADER
    if (settings.logoUrl) {
        try {
            doc.addImage(settings.logoUrl, 'PNG', 14, 10, 30, 15, undefined, 'FAST');
        } catch(e) {}
    } else {
        doc.setFontSize(16);
        doc.setTextColor(220, 38, 38);
        doc.text(settings.companyName.toUpperCase(), 14, 20);
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`LAPORAN BULANAN ${role.toUpperCase()}`, 190, 20, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Periode: ${periodName}`, 190, 26, { align: 'right' });
    doc.text(`Nama: ${entity.name}`, 190, 32, { align: 'right' });
    
    doc.line(14, 38, 196, 38);

    // FINANCIAL SUMMARY
    let y = 50;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Ringkasan Keuangan", 14, y);
    y+=8;

    doc.setFontSize(10);
    
    if (role === 'Partner') {
        const depositTxs = transactions.filter(t => t.category === 'Setor Mitra' || t.type === 'Income');
        const paidAmount = depositTxs.filter(t => t.status === 'Paid').reduce((s,t) => s + t.amount, 0);
        const pendingAmount = depositTxs.filter(t => t.status !== 'Paid').reduce((s,t) => s + t.amount, 0);
        
        doc.text(`Total Setoran (Sudah Dibayar): Rp ${paidAmount.toLocaleString('id-ID')}`, 14, y); y+=6;
        doc.setTextColor(220, 38, 38); // Red color for pending
        doc.text(`Total Setoran (Belum Dibayarkan): Rp ${pendingAmount.toLocaleString('id-ID')}`, 14, y); y+=6;
        doc.setTextColor(0, 0, 0); // Reset color
        doc.text(`Total Booking Unit: ${bookings.length} Transaksi`, 14, y); y+=6;
    } else {
        // Driver Logic
        const allDriverTxs = transactions.filter(t => t.category === 'Reimbursement' || t.category === 'BBM' || t.category === 'Tol/Parkir' || t.category === 'Gaji');
        const paidAmount = allDriverTxs.filter(t => t.status === 'Paid').reduce((s,t) => s + t.amount, 0);
        const pendingAmount = allDriverTxs.filter(t => t.status !== 'Paid').reduce((s,t) => s + t.amount, 0);

        doc.text(`Total Gaji & Reimburse (Sudah Dibayar): Rp ${paidAmount.toLocaleString('id-ID')}`, 14, y); y+=6;
        doc.setTextColor(220, 38, 38);
        doc.text(`Total Gaji & Reimburse (Belum Dibayarkan): Rp ${pendingAmount.toLocaleString('id-ID')}`, 14, y); y+=6;
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Perjalanan: ${bookings.length} Trip`, 14, y); y+=6;
    }

    y+=10;
    
    // BOOKING LIST
    doc.setFontSize(12);
    doc.text("Riwayat Aktivitas", 14, y);
    y+=8;

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y-6, 182, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Tanggal", 16, y);
    doc.text("Keterangan", 50, y);
    doc.text("Status", 130, y);
    doc.text("Nominal (Rp)", 190, y, { align: 'right' });
    doc.setFont("helvetica", "normal");
    y+=8;

    // Merge Bookings and Transactions for a chronological list
    const combinedData = [
        ...bookings.map(b => ({
            date: b.startDate,
            desc: `Booking: ${b.customerName} (${b.destination || '-'})`,
            status: b.status,
            amount: 0, // HIDE AMOUNT
            isBooking: true
        })),
        ...transactions.map(t => ({
            date: t.date,
            desc: `${t.category}: ${t.description}`,
            status: t.status === 'Paid' ? 'LUNAS' : 'BELUM DIBAYAR',
            amount: t.amount,
            isBooking: false
        }))
    ];

    const sortedData = combinedData.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedData.forEach(item => {
        if (y > 270) { doc.addPage(); y = 20; }
        const date = new Date(item.date).toLocaleDateString('id-ID');
        const desc = item.desc.length > 50 ? item.desc.substring(0,47)+'...' : item.desc;
        
        doc.text(date, 16, y);
        doc.text(desc, 50, y);
        
        // Color code status text
        if (item.status === 'BELUM DIBAYAR') doc.setTextColor(220, 38, 38);
        else if (item.status === 'LUNAS') doc.setTextColor(22, 163, 74);
        
        doc.text(item.status || '-', 130, y);
        doc.setTextColor(0,0,0); // Reset
        
        if (!item.isBooking) {
            const amountStr = item.amount.toLocaleString('id-ID');
            doc.text(amountStr, 190, y, { align: 'right' });
        } else {
             doc.text("-", 190, y, { align: 'right' });
        }
        y+=6;
    });

    if (sortedData.length === 0) {
        doc.text("- Tidak ada data aktivitas -", 105, y+5, { align: 'center' });
        y+=10;
    }

    // --- PARTNER STATISTICS PAGE (PAGE 2) ---
    if (role === 'Partner') {
        doc.addPage();
        
        doc.setFontSize(14);
        doc.text("ANALISIS STATISTIK", 14, 20);
        doc.setLineWidth(0.5);
        doc.line(14, 25, 196, 25);

        // 1. HISTOGRAM PENDAPATAN (Income based on Date)
        // Aggregate Data
        const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
        const dailyIncome = Array.from({length: daysInMonth}, (_, i) => ({
            label: (i + 1).toString(),
            value: 0
        }));

        transactions.forEach(t => {
            if ((t.category === 'Setor Mitra' || t.type === 'Income') && t.date.startsWith(month)) {
                const day = new Date(t.date).getDate();
                if (dailyIncome[day-1]) dailyIncome[day-1].value += t.amount;
            }
        });

        doc.setFontSize(12);
        doc.text("Grafik Pendapatan Harian", 14, 40);
        drawHistogram(doc, 14, 50, 180, 60, dailyIncome);

        // 2. PIE CHART 1: PAKET SEWA
        const packageCounts: {[key: string]: number} = {};
        bookings.forEach(b => {
             const pkg = b.packageType || 'Lainnya';
             packageCounts[pkg] = (packageCounts[pkg] || 0) + 1;
        });
        const packageData = Object.entries(packageCounts).map(([label, value], idx) => ({
            label, value, color: [[59, 130, 246], [16, 185, 129], [245, 158, 11], [239, 68, 68]][idx % 4]
        }));

        doc.text("Proporsi Paket Sewa", 14, 130);
        drawPieChart(doc, 60, 160, 25, packageData);

        // 3. PIE CHART 2: UNIT TERLARIS
        const carCounts: {[key: string]: number} = {};
        bookings.forEach(b => {
            const carName = cars.find(c => c.id === b.carId)?.name || 'Unknown';
            carCounts[carName] = (carCounts[carName] || 0) + 1;
        });
        const carData = Object.entries(carCounts).map(([label, value], idx) => ({
            label, value, color: [[139, 92, 246], [236, 72, 153], [14, 165, 233], [249, 115, 22]][idx % 4]
        }));

        doc.text("Statistik Unit Mobil", 110, 130);
        drawPieChart(doc, 150, 160, 25, carData);
        
        y = 220; // Footer position for page 2
    }

    y = 280;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, y);
    doc.text("System Generated by BRC Management", 190, y, { align: 'right' });

    doc.save(`Laporan_${role}_${entity.name}_${month}.pdf`);
};
