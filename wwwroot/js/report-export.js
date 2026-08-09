// STOREPILOT - REPORT EXPORT ENGINE
// Excel (.xlsx) export via SheetJS | PDF export via jsPDF + autoTable

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Get currently visible / filtered report data from the DOM
// ─────────────────────────────────────────────────────────────────────────────
function _getReportFilterLabel() {
    const period   = document.getElementById('report-filter-summary-badge')?.textContent  || 'All Time';
    const payMode  = document.getElementById('rpt-pay-mode-select')?.value || 'All';
    const fromDate = document.getElementById('rpt-from-date')?.value || '';
    const toDate   = document.getElementById('rpt-to-date')?.value   || '';
    return { period, payMode, fromDate, toDate };
}

function _readSummaryValues() {
    return {
        totalSales:     document.getElementById('rpt-total-sales')?.textContent      || '₹0.00',
        totalExpenses:  document.getElementById('rpt-total-expenses')?.textContent   || '₹0.00',
        totalPurchases: document.getElementById('rpt-total-purchases')?.textContent  || '₹0.00',
        netProfit:      document.getElementById('rpt-net-profit')?.textContent       || '₹0.00',
        cashTotal:      document.getElementById('rpt-pay-cash')?.textContent         || '₹0.00',
        upiTotal:       document.getElementById('rpt-pay-upi')?.textContent          || '₹0.00',
        cardTotal:      document.getElementById('rpt-pay-card')?.textContent         || '₹0.00',
        debitTotal:     document.getElementById('rpt-pay-debit')?.textContent        || '₹0.00',
        creditTotal:    document.getElementById('rpt-pay-credit')?.textContent       || '₹0.00',
    };
}

function _extractTableRows(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return [];
    const rows = [];
    tbody.querySelectorAll('tr').forEach(tr => {
        const cells = [];
        tr.querySelectorAll('td').forEach(td => {
            // Grab only text (strip action buttons)
            const clone = td.cloneNode(true);
            clone.querySelectorAll('button, a').forEach(el => el.remove());
            cells.push(clone.textContent.trim().replace(/\s+/g, ' '));
        });
        if (cells.length > 0) rows.push(cells);
    });
    return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL EXPORT (SheetJS / xlsx)
// ─────────────────────────────────────────────────────────────────────────────
async function exportReportToExcel() {
    playSound('click');

    // Dynamically load SheetJS from CDN if not already loaded
    if (typeof XLSX === 'undefined') {
        await _loadScript('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js');
    }

    const { period, payMode, fromDate, toDate } = _getReportFilterLabel();
    const summary = _readSummaryValues();
    const now = new Date().toLocaleString();

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Summary ─────────────────────────────────────────────────────
    const summaryRows = [
        ['STOREPILOT - LITTLE STARS KIDS WEAR'],
        ['Business Performance Report'],
        ['Generated On:', now],
        ['Report Period:', period],
        ['Payment Mode Filter:', payMode],
        fromDate ? ['From Date:', fromDate] : null,
        toDate   ? ['To Date:',   toDate]   : null,
        [],
        ['── FINANCIAL SUMMARY ──'],
        ['Total Sales Revenue',   summary.totalSales],
        ['Total Expenses (Debit)',summary.totalExpenses],
        ['Total Supplier Purchases', summary.totalPurchases],
        ['Estimated Net Profit',  summary.netProfit],
        [],
        ['── PAYMENT MODE BREAKDOWN ──'],
        ['Cash Payments',         summary.cashTotal],
        ['UPI / GPay / QR Payments', summary.upiTotal],
        ['Card Payments',         summary.cardTotal],
        ['Debit / Bank Transfer', summary.debitTotal],
        ['Credit Customer Balance', summary.creditTotal],
    ].filter(Boolean);

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    // Merge title cell A1 across 2 columns
    wsSummary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    wsSummary['!cols'] = [{ wch: 38 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // ── Sheet 2: Transactions ─────────────────────────────────────────────────
    const txHeaders = ['Date & Time', 'Type', 'Ref / Invoice No', 'Party (Customer/Supplier)', 'Payment Mode', 'Amount (₹)', 'Status'];
    const txRows = _extractTableRows('report-transactions-tbody')
        .map(r => r.slice(0, 7));          // Drop the "Actions" column

    const txData = [txHeaders, ...txRows];
    const wsTx = XLSX.utils.aoa_to_sheet(txData);
    wsTx['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 28 }, { wch: 16 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsTx, 'Transaction Details');

    // ── Sheet 3: Period Breakdown ─────────────────────────────────────────────
    const bkHeaders = ['Period', 'Total Sales (₹)', 'Bills Count', 'Expenses (₹)', 'Purchases (₹)', 'Net Profit (₹)'];
    const bkRows = _extractTableRows('report-breakdown-tbody');
    const bkData = [bkHeaders, ...bkRows];
    const wsBk = XLSX.utils.aoa_to_sheet(bkData);
    wsBk['!cols'] = Array(6).fill({ wch: 20 });
    XLSX.utils.book_append_sheet(wb, wsBk, 'Period Breakdown');

    // ── Download ──────────────────────────────────────────────────────────────
    const safePeriod = period.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const filename = `StorePilot_Report_${safePeriod}_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, filename);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF EXPORT (jsPDF + jsPDF-AutoTable)
// ─────────────────────────────────────────────────────────────────────────────
async function printCleanPDFReport() {
    playSound('click');

    // Load jsPDF
    if (typeof window.jspdf === 'undefined') {
        await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    // Load AutoTable plugin
    if (typeof window.jspdf?.jsPDF?.prototype?.autoTable === 'undefined') {
        await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const { period, payMode, fromDate, toDate } = _getReportFilterLabel();
    const summary = _readSummaryValues();
    const now = new Date().toLocaleString();
    let y = 14;

    // ── Letterhead ────────────────────────────────────────────────────────────
    doc.setFillColor(15, 23, 42);            // Dark navy
    doc.rect(0, 0, 297, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('STOREPILOT — LITTLE STARS KIDS WEAR', 10, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('123 Main Road, Kids Fashion Hub, Chennai | +91 98765 43210 | GSTIN: 33AAAAA0000A1Z5', 10, 20);

    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${now}`, 297 - 10, 20, { align: 'right' });

    y = 34;

    // ── Filter Summary Banner ─────────────────────────────────────────────────
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(10, y, 277, 10, 2, 2, 'F');
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Period: ${period}   |   Payment Mode Filter: ${payMode}${fromDate ? '   |   From: ' + fromDate : ''}${toDate ? '   To: ' + toDate : ''}`, 14, y + 6.5);

    y += 16;

    // ── Financial Summary Row ────────────────────────────────────────────────
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL SUMMARY', 10, y);
    y += 5;

    const summaryTableData = [
        ['Total Sales Revenue', summary.totalSales, 'Cash Collections', summary.cashTotal],
        ['Total Expenses (Debit)', summary.totalExpenses, 'UPI / GPay Collections', summary.upiTotal],
        ['Supplier Purchases', summary.totalPurchases, 'Card Collections', summary.cardTotal],
        ['Estimated Net Profit', summary.netProfit, 'Credit Customer Balance', summary.creditTotal],
    ];

    doc.autoTable({
        startY: y,
        head: [['Description', 'Amount', 'Payment Mode', 'Amount']],
        body: summaryTableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 40, halign: 'right' },
            2: { fontStyle: 'bold', cellWidth: 60 },
            3: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: 10, right: 10 },
    });

    y = doc.lastAutoTable.finalY + 8;

    // ── Transaction Details Table ────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TRANSACTION DETAILS', 10, y);
    y += 2;

    const txHeaders = ['Date & Time', 'Type', 'Invoice / Ref No', 'Party Name', 'Payment Mode', 'Amount (₹)', 'Status'];
    const txRawRows = _extractTableRows('report-transactions-tbody');
    const txTableData = txRawRows.length > 0
        ? txRawRows.map(r => r.slice(0, 7))
        : [['No transactions match the selected filters.', '', '', '', '', '', '']];

    doc.autoTable({
        startY: y,
        head: [txHeaders],
        body: txTableData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        columnStyles: {
            0: { cellWidth: 34 },
            1: { cellWidth: 24 },
            2: { cellWidth: 28 },
            3: { cellWidth: 56 },
            4: { cellWidth: 24 },
            5: { cellWidth: 22, halign: 'right' },
            6: { cellWidth: 22 }
        },
        margin: { left: 10, right: 10 },
        didDrawPage: (data) => {
            // Footer on each page
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(
                `StorePilot Business Report  —  Page ${data.pageNumber} of ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 6,
                { align: 'center' }
            );
        }
    });

    // ── Period Breakdown Table (new page) ────────────────────────────────────
    doc.addPage('a4', 'landscape');

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PERIOD BREAKDOWN REPORT', 10, 9);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Period: ${period} | Group By: ${document.querySelector('#rpt-group-pills .pill-btn.active')?.textContent || 'Day-wise'}`, 297 - 10, 9, { align: 'right' });

    const bkHeaders = ['Period', 'Total Sales (₹)', 'Bills Count', 'Expenses (₹)', 'Purchases (₹)', 'Est. Net Profit (₹)'];
    const bkRawRows = _extractTableRows('report-breakdown-tbody');
    const bkTableData = bkRawRows.length > 0
        ? bkRawRows
        : [['No data for selected period.', '', '', '', '', '']];

    doc.autoTable({
        startY: 20,
        head: [bkHeaders],
        body: bkTableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        columnStyles: {
            0: { cellWidth: 55, fontStyle: 'bold' },
            1: { cellWidth: 40, halign: 'right' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 38, halign: 'right' },
            4: { cellWidth: 38, halign: 'right' },
            5: { cellWidth: 45, halign: 'right' }
        },
        margin: { left: 10, right: 10 },
        didDrawPage: (data) => {
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(
                `StorePilot Business Report  —  Page ${data.pageNumber} of ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 6,
                { align: 'center' }
            );
        }
    });

    // ── Save PDF ──────────────────────────────────────────────────────────────
    const safePeriod = period.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const filename = `StorePilot_Report_${safePeriod}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(filename);
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: Dynamic Script Loader
// ─────────────────────────────────────────────────────────────────────────────
function _loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}
