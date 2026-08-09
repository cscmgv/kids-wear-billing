// STOREPILOT APP MAIN CONTROLLER WITH INSTANT AUTO-FILTERING TRANSACTION DETAILS REPORTS

let state = {
    currentUser: {
        role: 'Admin',
        name: 'System Admin'
    },
    dashboard: null,
    products: [],
    invoices: [],
    customers: [],
    suppliers: [],
    purchaseOrders: [],
    expenses: [],
    auditLogs: [],
    settings: {},
    activeView: 'view-dashboard',
    activePeriod: 'today',
    reportState: {
        period: 'today',
        groupBy: 'day',
        fromDate: '',
        toDate: '',
        paymentMode: 'All'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initThemeSelector();
    initDateDefaults();
    initFilterPillEvents();
    initReportFilters();

    document.getElementById('login-form')?.addEventListener('submit', handleLoginSubmit);

    // Initial Data Load
    loadDashboardData();
    loadProductsMaster();
    loadSalesHistory();
    loadCustomers();
    loadSuppliers();
    loadPurchaseOrders();
    loadExpenses();
    loadRecordBook();
    loadSettings();

    applyRolePermissions();

    document.getElementById('dash-refresh-btn')?.addEventListener('click', () => {
        playSound('click');
        loadDashboardData();
    });
    document.getElementById('dash-apply-btn')?.addEventListener('click', () => {
        playSound('click');
        loadDashboardData();
    });

    document.getElementById('btn-add-product')?.addEventListener('click', () => {
        playSound('click');
        openProductModal();
    });

    document.getElementById('btn-new-po')?.addEventListener('click', () => {
        playSound('click');
        openPOModal();
    });

    document.getElementById('btn-add-supplier')?.addEventListener('click', () => {
        playSound('click');
        openSupplierModal();
    });

    document.getElementById('product-form')?.addEventListener('submit', handleProductSubmit);
    document.getElementById('po-form')?.addEventListener('submit', handlePOSubmit);
    document.getElementById('supplier-form')?.addEventListener('submit', handleSupplierSubmit);
    document.getElementById('settings-form')?.addEventListener('submit', handleSettingsSubmit);
});

// INSTANT AUTO-FILTER CONTROL BAR LISTENERS (ANY CLICK/CHANGE TRIGGERS INSTANT FILTER)
function initReportFilters() {
    // Quick Period Pills
    const periodPills = document.querySelectorAll('#rpt-period-pills .pill-btn');
    periodPills.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            periodPills.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            state.reportState.period = btn.getAttribute('data-period');
            loadComprehensiveReport();
        });
    });

    // Group By Pills
    const groupPills = document.querySelectorAll('#rpt-group-pills .pill-btn');
    groupPills.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            groupPills.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            state.reportState.groupBy = btn.getAttribute('data-groupby');
            loadComprehensiveReport();
        });
    });

    // Payment Mode Select
    const payModeSelect = document.getElementById('rpt-pay-mode-select');
    payModeSelect?.addEventListener('change', (e) => {
        playSound('click');
        state.reportState.paymentMode = e.target.value;
        updateCardActiveState(e.target.value);
        loadComprehensiveReport();
    });

    // Date Inputs change -> Instant Auto Filter
    const fromInput = document.getElementById('rpt-from-date');
    const toInput = document.getElementById('rpt-to-date');

    fromInput?.addEventListener('change', () => {
        playSound('click');
        state.reportState.fromDate = fromInput.value;
        state.reportState.period = 'custom';
        loadComprehensiveReport();
    });

    toInput?.addEventListener('change', () => {
        playSound('click');
        state.reportState.toDate = toInput.value;
        state.reportState.period = 'custom';
        loadComprehensiveReport();
    });

    // Reset Filter Button
    document.getElementById('rpt-reset-btn')?.addEventListener('click', () => {
        playSound('click');
        state.reportState = {
            period: 'today',
            groupBy: 'day',
            fromDate: '',
            toDate: '',
            paymentMode: 'All'
        };

        const todayStr = new Date().toISOString().split('T')[0];
        if (fromInput) fromInput.value = todayStr;
        if (toInput) toInput.value = todayStr;
        if (payModeSelect) payModeSelect.value = 'All';

        periodPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-period') === 'today'));
        groupPills.forEach(g => g.classList.toggle('active', g.getAttribute('data-groupby') === 'day'));
        updateCardActiveState('All');

        loadComprehensiveReport();
    });
}

// CLICKABLE KPI CARDS INSTANT AUTO-FILTER FUNCTION
function autoFilterPaymentMode(mode) {
    playSound('click');
    state.reportState.paymentMode = mode;

    const select = document.getElementById('rpt-pay-mode-select');
    if (select) select.value = mode;

    updateCardActiveState(mode);
    loadComprehensiveReport();
}

function updateCardActiveState(mode) {
    document.getElementById('card-filter-cash')?.classList.toggle('active', mode === 'Cash');
    document.getElementById('card-filter-upi')?.classList.toggle('active', mode === 'UPI');
    document.getElementById('card-filter-card')?.classList.toggle('active', mode === 'Card');
    document.getElementById('card-filter-debit')?.classList.toggle('active', mode === 'Debit');
    document.getElementById('card-filter-credit')?.classList.toggle('active', mode === 'Credit');
}

function selectRole(role) {
    playSound('click');
    state.currentUser.role = role;

    document.getElementById('role-card-admin')?.classList.toggle('active', role === 'Admin');
    document.getElementById('role-card-cashier')?.classList.toggle('active', role === 'Cashier');

    const passInput = document.getElementById('login-pass');
    if (passInput) {
        passInput.value = '';
    }
}

function openLoginModal() {
    playSound('click');
    const passInput = document.getElementById('login-pass');
    if (passInput) passInput.value = '';
    document.getElementById('modal-login')?.classList.add('show');
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const pass = document.getElementById('login-pass').value;
    const selectedRole = state.currentUser.role || 'Admin';

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: selectedRole.toLowerCase(),
                password: pass,
                role: selectedRole
            })
        });

        if (res.ok) {
            const authData = await res.json();
            state.currentUser.role = authData.role;
            state.currentUser.name = authData.name;

            playSound('success');
            closeModal('modal-login');
            applyRolePermissions();

            if (authData.role === 'Cashier') {
                switchTab('view-billing');
            } else {
                switchTab('view-dashboard');
            }
        } else {
            const errData = await res.json().catch(() => ({}));
            showErrorModal('Incorrect Password', errData.message || 'Incorrect Password! Please enter valid PIN.');
        }
    } catch (err) {
        console.error('Login error:', err);
    }
}

function applyRolePermissions() {
    const isCashier = state.currentUser.role === 'Cashier';
    const isAdmin = state.currentUser.role === 'Admin';

    document.body.classList.toggle('role-cashier', isCashier);
    document.body.classList.toggle('role-admin', isAdmin);

    const nameEl = document.getElementById('logged-user-name');
    const roleEl = document.getElementById('logged-user-role');
    const topbarBadge = document.getElementById('topbar-role-badge');
    const avatarIcon = document.getElementById('user-role-avatar');

    if (nameEl) nameEl.textContent = state.currentUser.name;
    if (roleEl) {
        roleEl.innerHTML = `<span class="status-dot"></span> ${state.currentUser.role}`;
        roleEl.style.color = isCashier ? '#3b82f6' : '#10b981';
    }
    if (topbarBadge) {
        topbarBadge.textContent = `Role: ${state.currentUser.role}`;
        topbarBadge.className = isCashier ? 'badge-role' : 'badge-role text-emerald';
    }
    if (avatarIcon) {
        avatarIcon.className = isCashier ? 'fa-solid fa-cash-register' : 'fa-solid fa-user-shield';
    }

    renderRecentInvoices(state.dashboard?.recentInvoices || []);
    renderSalesHistory(state.invoices || []);
    renderCustomersTable(state.customers || []);
    renderSuppliersTable(state.suppliers || []);
}

function initNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            playSound('click');
            const targetId = item.getAttribute('data-target');
            if (targetId) {
                if (state.currentUser.role === 'Cashier' && (targetId === 'view-record-book' || targetId === 'view-settings')) {
                    showErrorModal('Access Denied', 'Record Book and Settings modules are restricted to Admin access only.');
                    return;
                }
                switchTab(targetId, item);
            }
        });
    });
}

function switchTab(viewId, clickedMenuItem = null) {
    state.activeView = viewId;

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(m => {
        if (clickedMenuItem && m === clickedMenuItem) {
            m.classList.add('active');
        } else if (!clickedMenuItem && m.getAttribute('data-target') === viewId) {
            m.classList.add('active');
        } else {
            m.classList.remove('active');
        }
    });

    const views = document.querySelectorAll('.app-view');
    views.forEach(v => {
        if (v.id === viewId) {
            v.classList.add('active');
        } else {
            v.classList.remove('active');
        }
    });

    const titleMap = {
        'view-dashboard': 'Dashboard',
        'view-billing': 'Billing (POS)',
        'view-sales-history': 'Sales History',
        'view-products': 'Products Master',
        'view-purchase': 'Stock Purchase & Supplier Orders',
        'view-stock': 'Stock & Inventory',
        'view-customers': 'Customer Directory',
        'view-suppliers': 'Supplier Directory',
        'view-payments': 'Payments & Ledger',
        'view-reports': 'Comprehensive Business Reports & Auto-Filter',
        'view-record-book': 'Record Book (Audit Logs)',
        'view-settings': 'Settings & WhatsApp'
    };
    const title = titleMap[viewId] || 'StorePilot';
    document.getElementById('page-title').textContent = title;

    if (viewId === 'view-dashboard') loadDashboardData();
    if (viewId === 'view-products') loadProductsMaster();
    if (viewId === 'view-sales-history') loadSalesHistory();
    if (viewId === 'view-purchase') loadPurchaseOrders();
    if (viewId === 'view-customers') loadCustomers();
    if (viewId === 'view-suppliers') loadSuppliers();
    if (viewId === 'view-stock') renderStockView();
    if (viewId === 'view-reports') loadComprehensiveReport();
    if (viewId === 'view-payments') renderPaymentsView();
    if (viewId === 'view-record-book') loadRecordBook();
}

function initThemeSelector() {
    const themeSelect = document.getElementById('theme-select');
    themeSelect?.addEventListener('change', (e) => {
        const theme = e.target.value;
        document.body.className = theme + (state.currentUser.role === 'Cashier' ? ' role-cashier' : ' role-admin');
        playSound('click');
    });

    const themeToggleBtn = document.getElementById('theme-toggle');
    themeToggleBtn?.addEventListener('click', () => {
        const isDark = document.body.classList.contains('theme-dark');
        document.body.className = (isDark ? 'theme-default' : 'theme-dark') + (state.currentUser.role === 'Cashier' ? ' role-cashier' : ' role-admin');
        if (themeSelect) themeSelect.value = isDark ? 'theme-default' : 'theme-dark';
        playSound('click');
    });
}

function initDateDefaults() {
    const todayStr = new Date().toISOString().split('T')[0];
    const fromInput = document.getElementById('dash-from-date');
    const toInput = document.getElementById('dash-to-date');
    if (fromInput) fromInput.value = todayStr;
    if (toInput) toInput.value = todayStr;

    const rptFrom = document.getElementById('rpt-from-date');
    const rptTo = document.getElementById('rpt-to-date');
    if (rptFrom) rptFrom.value = todayStr;
    if (rptTo) rptTo.value = todayStr;
}

function initFilterPillEvents() {
    const pillBtns = document.querySelectorAll('#dash-pill-group .pill-btn');
    pillBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            pillBtns.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            state.activePeriod = btn.getAttribute('data-period');

            const labelMap = {
                'today': "Today's Performance",
                'yesterday': "Yesterday's Performance",
                'week': "This Week's Performance",
                'month': "This Month's Performance"
            };
            document.getElementById('dash-period-label').textContent = labelMap[state.activePeriod] || 'Selected Performance';

            loadDashboardData();
        });
    });
}

async function loadDashboardData() {
    try {
        const fromDate = document.getElementById('dash-from-date')?.value || '';
        const toDate = document.getElementById('dash-to-date')?.value || '';
        const period = state.activePeriod || 'today';

        const res = await fetch(`/api/dashboard?period=${period}&from=${fromDate}&to=${toDate}`);
        if (!res.ok) return;

        const data = await res.json();
        state.dashboard = data;

        document.getElementById('kpi-today-sales').textContent = `₹${data.todaySales.toLocaleString()}`;
        document.getElementById('kpi-today-bills').textContent = `${data.todayBillsCount} Bills Completed`;

        document.getElementById('kpi-monthly-sales').textContent = `₹${data.monthlySales.toLocaleString()}`;
        document.getElementById('kpi-monthly-bills').textContent = `${data.monthlyBillsCount} Total Bills`;

        document.getElementById('kpi-active-products').textContent = data.activeProducts;
        document.getElementById('kpi-low-stock-count').textContent = `${data.lowStockCount} Low Stock Items`;

        document.getElementById('kpi-customers-count').textContent = data.registeredCustomers;
        document.getElementById('kpi-today-profit').textContent = `₹${data.todayNetProfit.toLocaleString()}`;
        document.getElementById('kpi-today-expenses').textContent = `₹${data.todayExpenses.toLocaleString()}`;
        document.getElementById('kpi-customer-outstanding').textContent = `₹${data.customerOutstanding.toLocaleString()}`;
        document.getElementById('kpi-supplier-outstanding').textContent = `₹${data.supplierOutstanding.toLocaleString()}`;

        renderSalesChart(data.salesTrend);
        renderRecentInvoices(data.recentInvoices);
        renderLowStockAlerts(data.lowStockAlerts);
    } catch (err) {
        console.error('Error loading dashboard:', err);
    }
}

function renderSalesChart(trendData) {
    const container = document.getElementById('sales-chart-bar');
    if (!container) return;

    if (!trendData || trendData.length === 0) {
        container.innerHTML = `<div style="text-align:center;width:100%;color:#94a3b8;padding:40px;">No recent sales trend data</div>`;
        return;
    }

    const maxVal = Math.max(...trendData.map(t => t.amount), 1000);

    let html = '';
    trendData.forEach(pt => {
        const heightPct = Math.max(10, (pt.amount / maxVal) * 100);
        html += `
            <div class="chart-bar-group">
                <div class="chart-val">₹${pt.amount}</div>
                <div class="chart-bar-fill" style="height: ${heightPct}%;"></div>
                <div class="chart-label">${pt.dayName}</div>
                <div class="chart-sublabel">${pt.dateStr}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderRecentInvoices(invoices) {
    const tbody = document.getElementById('recent-invoices-tbody');
    if (!tbody) return;

    if (!invoices || invoices.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#94a3b8;">No invoices recorded yet</td></tr>`;
        return;
    }

    const isAdmin = state.currentUser.role === 'Admin';

    tbody.innerHTML = invoices.map(inv => `
        <tr>
            <td><strong>${inv.invoiceNo}</strong></td>
            <td>${inv.customerName}</td>
            <td><strong>₹${inv.totalAmount.toLocaleString()}</strong></td>
            <td><span class="badge-sub">${inv.paymentMode}</span></td>
            <td class="col-admin-only">
                ${isAdmin ? `<button class="btn-delete-bill" onclick="deleteBill('${inv.id}')" title="Delete Bill & Restore Stock"><i class="fa-solid fa-trash-can"></i> Delete</button>` : '<span style="color:#94a3b8;">View Only</span>'}
            </td>
        </tr>
    `).join('');
}

function renderLowStockAlerts(items) {
    const tbody = document.getElementById('low-stock-tbody');
    const badge = document.getElementById('low-stock-alert-badge');
    if (!tbody) return;

    if (badge) badge.textContent = `${items ? items.length : 0} Items Low`;

    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#10b981;">All products are adequately stocked!</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(p => `
        <tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.sku} / ${p.size}</td>
            <td><span class="status-badge status-low">${p.stock}</span></td>
            <td>${p.minLevel}</td>
        </tr>
    `).join('');
}

// COMPREHENSIVE REPORTS LOADER WITH INSTANT AUTO-FILTERING TRANSACTION DETAILS
async function loadComprehensiveReport() {
    try {
        const { groupBy, period, fromDate, toDate, paymentMode } = state.reportState;
        const url = `/api/reports?groupBy=${groupBy}&period=${period}&from=${fromDate}&to=${toDate}&paymentMode=${paymentMode}`;

        const res = await fetch(url);
        if (!res.ok) return;

        const data = await res.json();

        // Update Filter Badge Summary Text
        const summaryBadge = document.getElementById('report-filter-summary-badge');
        if (summaryBadge) {
            summaryBadge.textContent = data.filterSummaryText || 'Filtered Performance';
        }

        // Payment Details Breakdown Cards
        const p = data.paymentBreakdown || {};
        document.getElementById('rpt-pay-cash').textContent = `₹${(p.cashTotal || 0).toLocaleString()}`;
        document.getElementById('rpt-pay-upi').textContent = `₹${(p.upiTotal || 0).toLocaleString()}`;
        document.getElementById('rpt-pay-card').textContent = `₹${(p.cardTotal || 0).toLocaleString()}`;
        document.getElementById('rpt-pay-debit').textContent = `₹${(p.debitTotal || 0).toLocaleString()}`;
        document.getElementById('rpt-pay-credit').textContent = `₹${(p.creditTotal || 0).toLocaleString()}`;

        // Summary Bar
        document.getElementById('rpt-total-sales').textContent = `₹${(data.totalSales || 0).toLocaleString()}`;
        document.getElementById('rpt-total-expenses').textContent = `₹${(data.totalExpenses || 0).toLocaleString()}`;
        document.getElementById('rpt-total-purchases').textContent = `₹${(data.totalPurchases || 0).toLocaleString()}`;
        document.getElementById('rpt-net-profit').textContent = `₹${(data.totalNetProfit || 0).toLocaleString()}`;

        // Render Combined Transaction Details Table (Instant Auto-Filtered!)
        renderTransactionDetailsTable(data);

        // Period Title & Breakdown Table
        const titleMap = {
            'day': 'Day-wise Sales, Expenses & Profit Breakdown',
            'month': 'Month-wise Sales, Expenses & Profit Breakdown',
            'year': 'Year-wise Sales, Expenses & Profit Breakdown'
        };
        document.getElementById('report-table-title').textContent = titleMap[groupBy] || 'Period Breakdown';

        const tbody = document.getElementById('report-breakdown-tbody');
        if (tbody) {
            if (!data.periodBreakdown || data.periodBreakdown.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:24px;">No period breakdown matching filter criteria</td></tr>`;
            } else {
                tbody.innerHTML = data.periodBreakdown.map(item => `
                    <tr>
                        <td><strong>${item.periodLabel}</strong></td>
                        <td><strong class="text-blue">₹${item.salesAmount.toLocaleString()}</strong></td>
                        <td><span class="badge-sub">${item.billsCount} Bills</span></td>
                        <td><strong class="text-rose">₹${item.expensesAmount.toLocaleString()}</strong></td>
                        <td><strong class="text-orange">₹${item.purchasesAmount.toLocaleString()}</strong></td>
                        <td><strong class="text-emerald">₹${item.profitAmount.toLocaleString()}</strong></td>
                    </tr>
                `).join('');
            }
        }
    } catch (err) {
        console.error('Error loading comprehensive report:', err);
    }
}

// RENDER AUTO-FILTERED TRANSACTION DETAILS TABLE
function renderTransactionDetailsTable(reportData) {
    const tbody = document.getElementById('report-transactions-tbody');
    const badge = document.getElementById('trans-count-badge');
    const titleEl = document.getElementById('report-trans-table-title');
    if (!tbody) return;

    let transactions = [];

    // 1. Sales Invoices
    (reportData.filteredInvoices || []).forEach(inv => {
        transactions.push({
            date: new Date(inv.date),
            type: 'Sales Invoice',
            badgeClass: 'badge-sales',
            refNo: inv.invoiceNo,
            party: inv.customerName || 'Walk-in Customer',
            payMode: inv.paymentMode,
            amount: inv.totalAmount,
            status: inv.status,
            id: inv.id,
            phone: inv.customerPhone
        });
    });

    // 2. Expenses (Debit Outgoings)
    (reportData.filteredExpenses || []).forEach(exp => {
        transactions.push({
            date: new Date(exp.date),
            type: 'Debit Expense',
            badgeClass: 'badge-expense',
            refNo: `EXP-${exp.id.substring(0, 6)}`,
            party: exp.title,
            payMode: 'Debit / Cash',
            amount: exp.amount,
            status: 'Recorded',
            id: exp.id
        });
    });

    // 3. Supplier Purchase Orders
    (reportData.filteredPurchaseOrders || []).forEach(po => {
        transactions.push({
            date: new Date(po.date),
            type: 'Supplier PO',
            badgeClass: 'badge-purchase',
            refNo: po.orderNo,
            party: po.supplierName,
            payMode: 'Payable Ledger',
            amount: po.totalAmount,
            status: po.status,
            id: po.id
        });
    });

    // Sort descending by date
    transactions.sort((a, b) => b.date - a.date);

    if (badge) badge.textContent = `${transactions.length} Transactions Found`;
    if (titleEl) {
        const mode = reportData.selectedPaymentMode || 'All';
        titleEl.textContent = mode === 'All' ? 'All Filtered Transactions' : `${mode} Filtered Transactions`;
    }

    if (transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:24px;">No transaction details matching selected filter criteria. Try clicking another Payment Mode or Period filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${t.date.toLocaleString()}</td>
            <td><span class="badge-trans-type ${t.badgeClass}">${t.type}</span></td>
            <td><strong>${t.refNo}</strong></td>
            <td>${t.party}</td>
            <td><span class="badge-sub">${t.payMode}</span></td>
            <td><strong class="${t.type === 'Sales Invoice' ? 'text-blue' : (t.type === 'Debit Expense' ? 'text-rose' : 'text-orange')}">₹${t.amount.toLocaleString()}</strong></td>
            <td><span class="status-badge ${t.status === 'Completed' || t.status === 'Received' || t.status === 'Recorded' ? 'status-completed' : 'status-pending'}">${t.status}</span></td>
            <td>
                ${t.type === 'Sales Invoice' ? `
                    <button class="win-btn" onclick="viewReceiptModal('${t.id}')" title="View Receipt"><i class="fa-solid fa-file-invoice"></i></button>
                    <button class="btn-whatsapp" style="padding:4px 8px;font-size:11px;" onclick="sendWhatsAppInvoiceDirect('${t.id}', '${t.phone}')"><i class="fa-brands fa-whatsapp"></i></button>
                ` : `<span style="color:#94a3b8;">Details</span>`}
            </td>
        </tr>
    `).join('');
}

async function loadExpenses() {
    try {
        const res = await fetch('/api/expenses');
        if (res.ok) {
            state.expenses = await res.json();
        }
    } catch (e) {}
}

async function loadPurchaseOrders() {
    try {
        const res = await fetch('/api/purchase-orders');
        if (!res.ok) return;
        state.purchaseOrders = await res.json();
        renderPurchaseOrdersTable(state.purchaseOrders);
    } catch (err) {
        console.error('Error loading POs:', err);
    }
}

function renderPurchaseOrdersTable(orders) {
    const tbody = document.getElementById('purchase-orders-tbody');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:24px;">No purchase orders placed yet. Click "Create Supplier Purchase Order" above to place stock orders.</td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(po => `
        <tr>
            <td>${new Date(po.date).toLocaleDateString()}</td>
            <td><strong>${po.orderNo}</strong></td>
            <td><strong>${po.supplierName}</strong></td>
            <td>
                ${(po.items || []).map(it => `${it.productName} (${it.size}) x${it.quantity}`).join('<br>') || 'Garments Stock Batch'}
            </td>
            <td><strong class="text-blue">₹${po.totalAmount.toLocaleString()}</strong></td>
            <td>
                <span class="status-badge ${po.status === 'Received' ? 'status-completed' : (po.status === 'Cancelled' ? 'status-low' : 'status-pending')}">
                    ${po.status}
                </span>
            </td>
            <td>
                ${po.status === 'Pending' ? `
                    <button class="btn-delete-bill" onclick="cancelPurchaseOrder('${po.id}')" title="Cancel Supplier Purchase Order">
                        <i class="fa-solid fa-ban"></i> Cancel Order
                    </button>
                    <button class="btn-whatsapp" style="padding:4px 8px;font-size:11px;" onclick="sendWhatsAppReorder('${po.supplierName}', '9443322110', '${po.items?.[0]?.productName || 'Kids Wear Batch'}')">
                        <i class="fa-brands fa-whatsapp"></i> WhatsApp PO
                    </button>
                ` : `<span style="color:#94a3b8;">${po.status}</span>`}
            </td>
        </tr>
    `).join('');
}

function openPOModal() {
    const supSelect = document.getElementById('po-supplier-select');
    const prodSelect = document.getElementById('po-product-select');

    if (supSelect) {
        supSelect.innerHTML = (state.suppliers || []).map(s => `<option value="${s.id}">${s.company} (${s.name})</option>`).join('');
    }
    if (prodSelect) {
        prodSelect.innerHTML = (state.products || []).map(p => `<option value="${p.id}" data-cost="${p.costPrice}">${p.name} - ${p.size} (Cost: ₹${p.costPrice})</option>`).join('');
    }

    document.getElementById('modal-po')?.classList.add('show');
}

async function handlePOSubmit(e) {
    e.preventDefault();
    const supplierId = document.getElementById('po-supplier-select').value;
    const productId = document.getElementById('po-product-select').value;
    const qty = parseInt(document.getElementById('po-qty').value) || 1;
    const costPrice = parseFloat(document.getElementById('po-cost').value) || 0;
    const status = document.getElementById('po-status').value;

    const supplier = state.suppliers.find(s => s.id === supplierId);
    const product = state.products.find(p => p.id === productId);

    const poPayload = {
        supplierId: supplierId,
        supplierName: supplier ? supplier.company : 'Supplier',
        status: status,
        totalAmount: qty * costPrice,
        items: [
            {
                productId: productId,
                productName: product ? product.name : 'Garments Batch',
                size: product ? product.size : 'M',
                price: costPrice,
                quantity: qty
            }
        ]
    };

    try {
        const res = await fetch('/api/purchase-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(poPayload)
        });

        if (res.ok) {
            playSound('success');
            closeModal('modal-po');
            loadPurchaseOrders();
            loadSuppliers();
            loadProductsMaster();
            loadDashboardData();
        }
    } catch (err) {
        console.error('PO Submit Error:', err);
    }
}

async function cancelPurchaseOrder(orderId) {
    const reason = prompt('Reason for cancelling supplier order:', 'Delivery Delayed / Cancelled with Supplier');
    if (reason === null) return;

    playSound('delete');

    try {
        const res = await fetch(`/api/purchase-orders/${orderId}?reason=${encodeURIComponent(reason)}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showErrorModal('Order Cancelled', 'Supplier purchase order marked as CANCELLED and logged to /record_book/delete/.');
            loadPurchaseOrders();
            loadRecordBook();
            loadDashboardData();
        } else {
            showErrorModal('Cancel Failed', 'Purchase Order not found.');
        }
    } catch (err) {
        console.error('Error cancelling order:', err);
    }
}

async function loadSuppliers() {
    try {
        const res = await fetch('/api/suppliers');
        if (res.ok) {
            state.suppliers = await res.json();
            renderSuppliersTable(state.suppliers);
        }
    } catch (e) {}
}

function renderSuppliersTable(suppliers) {
    const tbody = document.getElementById('suppliers-tbody');
    if (!tbody) return;

    const isAdmin = state.currentUser.role === 'Admin';

    tbody.innerHTML = suppliers.map(s => `
        <tr>
            <td><strong>${s.company}</strong></td>
            <td>${s.name}</td>
            <td>${s.phone}</td>
            <td>${s.address}</td>
            <td><strong class="text-orange">₹${s.outstandingPayable.toLocaleString()}</strong></td>
            <td>
                <button class="btn-whatsapp" style="padding:4px 8px;font-size:11px;" onclick="sendWhatsAppReorder('${s.company}', '${s.phone}')"><i class="fa-brands fa-whatsapp"></i> Order Stock</button>
                ${isAdmin ? `<button class="btn-delete-bill btn-admin-only" style="padding:4px 8px;font-size:11px;" onclick="deleteSupplier('${s.id}')"><i class="fa-solid fa-trash"></i> Delete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function openSupplierModal() {
    document.getElementById('sup-company').value = '';
    document.getElementById('sup-name').value = '';
    document.getElementById('sup-phone').value = '';
    document.getElementById('sup-address').value = '';

    document.getElementById('modal-supplier')?.classList.add('show');
}

async function handleSupplierSubmit(e) {
    e.preventDefault();
    const payload = {
        company: document.getElementById('sup-company').value,
        name: document.getElementById('sup-name').value,
        phone: document.getElementById('sup-phone').value,
        address: document.getElementById('sup-address').value,
        outstandingPayable: 0
    };

    const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        playSound('success');
        closeModal('modal-supplier');
        loadSuppliers();
    }
}

async function deleteSupplier(supplierId) {
    if (state.currentUser.role !== 'Admin') {
        showErrorModal('Permission Denied', 'Only Administrator can delete supplier records.');
        return;
    }

    if (!confirm('Are you sure you want to delete this supplier record?')) return;

    playSound('delete');

    try {
        const res = await fetch(`/api/suppliers/${supplierId}?reason=Admin+Deleted+Supplier`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showErrorModal('Supplier Deleted', 'Supplier record deleted and logged to /record_book/delete/ folder.');
            loadSuppliers();
            loadRecordBook();
        }
    } catch (err) {
        console.error('Error deleting supplier:', err);
    }
}

async function deleteBill(invoiceId) {
    if (state.currentUser.role !== 'Admin') {
        showErrorModal('Permission Denied', 'Cashiers cannot delete receipts or bills. Only Admin can delete receipts.');
        return;
    }

    const reason = prompt('Reason for deleting bill (e.g. Order Cancelled / Customer Return):', 'Customer Order Cancelled');
    if (reason === null) return;

    playSound('delete');

    try {
        const res = await fetch(`/api/invoices/${invoiceId}?reason=${encodeURIComponent(reason)}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showErrorModal('Bill Deleted Successfully', 'Stock inventory restored and logged to /record_book/delete/ folder.');
            loadDashboardData();
            loadSalesHistory();
            loadProductsMaster();
            loadRecordBook();
        } else {
            showErrorModal('Delete Failed', 'Invoice not found or already deleted.');
        }
    } catch (err) {
        console.error('Error deleting bill:', err);
    }
}

async function loadProductsMaster() {
    try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        state.products = await res.json();
        renderProductsTable(state.products);
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

function renderProductsTable(products) {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;">No products found</td></tr>`;
        return;
    }

    const isAdmin = state.currentUser.role === 'Admin';

    tbody.innerHTML = products.map(p => `
        <tr>
            <td>
                <img src="${p.imageUrl || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=100'}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">
            </td>
            <td><strong>${p.name}</strong></td>
            <td><code>${p.sku}</code></td>
            <td><span class="badge-sub">${p.category}</span></td>
            <td>${p.ageGroup}</td>
            <td><strong>${p.size}</strong></td>
            <td><strong class="text-blue">₹${p.price}</strong></td>
            <td>₹${p.mrp}</td>
            <td>
                <span class="status-badge ${p.stock <= p.minLevel ? 'status-low' : 'status-completed'}">
                    ${p.stock} units
                </span>
            </td>
            <td>${p.stock > 0 ? '<span class="text-emerald">In Stock</span>' : '<span class="text-red">Out of Stock</span>'}</td>
            <td>
                <button class="win-btn" onclick="editProduct('${p.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                ${isAdmin ? `<button class="win-btn win-close btn-admin-only" onclick="deleteProduct('${p.id}')" title="Delete Product"><i class="fa-solid fa-trash"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
}

function openProductModal(prod = null) {
    document.getElementById('prod-id').value = prod ? prod.id : '';
    document.getElementById('prod-name').value = prod ? prod.name : '';
    document.getElementById('prod-sku').value = prod ? prod.sku : '';
    document.getElementById('prod-cat').value = prod ? prod.category : 'Frocks';
    document.getElementById('prod-age').value = prod ? prod.ageGroup : '2-5Y';
    document.getElementById('prod-size').value = prod ? prod.size : '2-4Y';
    document.getElementById('prod-price').value = prod ? prod.price : '';
    document.getElementById('prod-mrp').value = prod ? prod.mrp : '';
    document.getElementById('prod-cost').value = prod ? prod.costPrice : '';
    document.getElementById('prod-stock').value = prod ? prod.stock : 10;
    document.getElementById('prod-min').value = prod ? prod.minLevel : 5;

    document.getElementById('modal-prod-title').textContent = prod ? 'Edit Kids Wear Product' : 'Add New Product';
    document.getElementById('modal-product').classList.add('show');
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const payload = {
        id: id || undefined,
        name: document.getElementById('prod-name').value,
        sku: document.getElementById('prod-sku').value,
        category: document.getElementById('prod-cat').value,
        ageGroup: document.getElementById('prod-age').value,
        size: document.getElementById('prod-size').value,
        price: parseFloat(document.getElementById('prod-price').value) || 0,
        mrp: parseFloat(document.getElementById('prod-mrp').value) || 0,
        costPrice: parseFloat(document.getElementById('prod-cost').value) || 0,
        stock: parseInt(document.getElementById('prod-stock').value) || 0,
        minLevel: parseInt(document.getElementById('prod-min').value) || 5,
        taxRate: 5,
        imageUrl: 'https://images.unsplash.com/photo-1621452773781-0f992fd1f5cb?w=300'
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/products/${id}` : '/api/products';

    const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        playSound('success');
        closeModal('modal-product');
        loadProductsMaster();
    }
}

async function editProduct(id) {
    const prod = state.products.find(p => p.id === id);
    if (prod) openProductModal(prod);
}

async function deleteProduct(id) {
    if (state.currentUser.role !== 'Admin') {
        showErrorModal('Permission Denied', 'Cashiers cannot delete products. Contact Administrator.');
        return;
    }
    if (!confirm('Are you sure you want to delete this product?')) return;
    playSound('delete');
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) loadProductsMaster();
}

async function loadSalesHistory() {
    try {
        const res = await fetch('/api/invoices');
        if (!res.ok) return;
        state.invoices = await res.json();
        renderSalesHistory(state.invoices);
    } catch (err) {
        console.error('Error loading sales history:', err);
    }
}

function renderSalesHistory(invoices) {
    const tbody = document.getElementById('sales-history-tbody');
    if (!tbody) return;

    if (invoices.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No sales recorded yet</td></tr>`;
        return;
    }

    const isAdmin = state.currentUser.role === 'Admin';

    tbody.innerHTML = invoices.map(inv => `
        <tr>
            <td>${new Date(inv.date).toLocaleString()}</td>
            <td><strong>${inv.invoiceNo}</strong></td>
            <td>${inv.customerName}</td>
            <td>${inv.customerPhone || 'N/A'}</td>
            <td><strong class="text-blue">₹${inv.totalAmount.toLocaleString()}</strong></td>
            <td><span class="badge-sub">${inv.paymentMode}</span></td>
            <td><span class="status-badge status-completed">${inv.status}</span></td>
            <td>
                <button class="win-btn" onclick="viewReceiptModal('${inv.id}')" title="View Receipt"><i class="fa-solid fa-file-invoice"></i></button>
                <button class="btn-whatsapp" style="padding:4px 8px;font-size:11px;" onclick="sendWhatsAppInvoiceDirect('${inv.id}', '${inv.customerPhone}')" title="Send WhatsApp Bill"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>
                ${isAdmin ? `<button class="btn-delete-bill" onclick="deleteBill('${inv.id}')" title="Delete Receipt & Bill"><i class="fa-solid fa-trash-can"></i> Delete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

async function loadCustomers() {
    try {
        const res = await fetch('/api/customers');
        if (res.ok) {
            state.customers = await res.json();
            renderCustomersTable(state.customers);
        }
    } catch (e) {}
}

function renderCustomersTable(customers) {
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;

    const isAdmin = state.currentUser.role === 'Admin';

    tbody.innerHTML = customers.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.phone}</td>
            <td>${c.address}</td>
            <td>₹${c.totalPurchases.toLocaleString()}</td>
            <td><strong class="${c.outstandingBalance > 0 ? 'text-red' : 'text-emerald'}">₹${c.outstandingBalance}</strong></td>
            <td><span class="badge-blue">${c.loyaltyPoints} pts</span></td>
            <td>
                ${c.outstandingBalance > 0 ? `<button class="btn-whatsapp" style="padding:4px 8px;font-size:11px;" onclick="sendWhatsAppReminder('${c.name}', '${c.phone}', ${c.outstandingBalance})"><i class="fa-brands fa-whatsapp"></i> Remind Due</button>` : ''}
                ${isAdmin ? `<button class="btn-delete-bill btn-admin-only" style="padding:4px 8px;font-size:11px;" onclick="deleteCustomer('${c.id}')"><i class="fa-solid fa-trash"></i> Delete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

async function deleteCustomer(customerId) {
    if (state.currentUser.role !== 'Admin') {
        showErrorModal('Permission Denied', 'Only Administrator can delete customer records.');
        return;
    }

    if (!confirm('Are you sure you want to delete this customer record?')) return;

    playSound('delete');

    try {
        const res = await fetch(`/api/customers/${customerId}?reason=Admin+Deleted+Customer`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showErrorModal('Customer Deleted', 'Customer record deleted and logged to /record_book/delete/ folder.');
            loadCustomers();
            loadRecordBook();
        } else {
            showErrorModal('Delete Failed', 'Customer not found.');
        }
    } catch (err) {
        console.error('Error deleting customer:', err);
    }
}

async function loadRecordBook() {
    try {
        const res = await fetch('/api/logs');
        if (!res.ok) return;
        state.auditLogs = await res.json();

        const tbody = document.getElementById('record-book-tbody');
        if (!tbody) return;

        if (state.auditLogs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:24px;">No deleted records yet. Deleted bills, deleted customers & cancelled supplier orders will be logged to /record_book/delete/ folder.</td></tr>`;
            return;
        }

        tbody.innerHTML = state.auditLogs.map(log => `
            <tr>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td><span class="badge-alert">${log.actionType}</span></td>
                <td><strong>${log.invoiceNo || 'Subject'}</strong></td>
                <td>${log.customerName}</td>
                <td><strong>₹${log.amount.toLocaleString()}</strong></td>
                <td>
                    <div>${log.details}</div>
                    <div style="font-size:11px;color:#94a3b8;">Log file: <code>${log.logFilePath}</code></div>
                </td>
            </tr>
        `).join('');
    } catch (e) {}
}

function renderStockView() {
    const tbody = document.getElementById('stock-tbody');
    if (!tbody || !state.products) return;

    tbody.innerHTML = state.products.map(p => `
        <tr>
            <td><strong>${p.name}</strong></td>
            <td><code>${p.sku}</code></td>
            <td>${p.ageGroup} / <strong>${p.size}</strong></td>
            <td><strong class="${p.stock <= p.minLevel ? 'text-red' : ''}">${p.stock} units</strong></td>
            <td>${p.minLevel} units</td>
            <td>
                <span class="status-badge ${p.stock <= p.minLevel ? 'status-low' : 'status-completed'}">
                    ${p.stock <= p.minLevel ? 'LOW STOCK ALERT' : 'Normal'}
                </span>
            </td>
            <td>
                ${p.stock <= p.minLevel ? `<button class="btn-whatsapp" style="padding:4px 8px;font-size:11px;" onclick="sendWhatsAppReorder('Tirupur Supplier', '9443322110', '${p.name}', '${p.size}')"><i class="fa-brands fa-whatsapp"></i> WhatsApp Reorder</button>` : 'OK'}
            </td>
        </tr>
    `).join('');
}

function renderPaymentsView() {
    if (!state.invoices) return;
    let cash = 0, upi = 0, card = 0, debit = 0, credit = 0;

    state.invoices.forEach(inv => {
        if (inv.paymentMode === 'Cash') cash += inv.totalAmount;
        if (inv.paymentMode === 'UPI') upi += inv.totalAmount;
        if (inv.paymentMode === 'Card') card += inv.totalAmount;
        if (inv.paymentMode === 'Debit') debit += inv.totalAmount;
        if (inv.paymentMode === 'Credit') credit += inv.totalAmount;
    });

    document.getElementById('pay-cash-val').textContent = `₹${cash.toLocaleString()}`;
    document.getElementById('pay-upi-val').textContent = `₹${upi.toLocaleString()}`;
    document.getElementById('pay-card-val').textContent = `₹${card.toLocaleString()}`;
    document.getElementById('pay-debit-val').textContent = `₹${debit.toLocaleString()}`;
    document.getElementById('pay-credit-val').textContent = `₹${credit.toLocaleString()}`;
}

async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        if (res.ok) {
            state.settings = await res.json();
            document.getElementById('set-store-name').value = state.settings.storeName || '';
            document.getElementById('set-store-phone').value = state.settings.phone || '';
            document.getElementById('set-store-address').value = state.settings.address || '';
            document.getElementById('set-store-gst').value = state.settings.gstin || '';
            document.getElementById('set-printer-name').value = state.settings.thermalPrinterName || '';
            document.getElementById('set-wa-key').value = state.settings.whatsAppApiKey || '';
            document.getElementById('set-wa-sender').value = state.settings.whatsAppSenderPhone || '';
            document.getElementById('set-wa-template').value = state.settings.defaultMessageTemplate || '';
        }
    } catch (e) {}
}

async function handleSettingsSubmit(e) {
    e.preventDefault();
    const payload = {
        storeName: document.getElementById('set-store-name').value,
        phone: document.getElementById('set-store-phone').value,
        address: document.getElementById('set-store-address').value,
        gstin: document.getElementById('set-store-gst').value,
        thermalPrinterName: document.getElementById('set-printer-name').value,
        whatsAppApiKey: document.getElementById('set-wa-key').value,
        whatsAppSenderPhone: document.getElementById('set-wa-sender').value,
        defaultMessageTemplate: document.getElementById('set-wa-template').value
    };

    const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        playSound('success');
        alert('Store & WhatsApp settings saved successfully!');
        loadSettings();
    }
}

function showErrorModal(title, msg) {
    playSound('error');
    document.querySelector('#modal-error-alert .anim-title').textContent = title;
    document.getElementById('err-message-text').textContent = msg;
    document.getElementById('modal-error-alert')?.classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('show');
}
