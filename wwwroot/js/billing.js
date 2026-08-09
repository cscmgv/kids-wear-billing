// STOREPILOT POS BILLING CASHIER CONTROLLER WITH ANIMATIONS & SOUNDS

let cart = [];
let selectedAgeFilter = 'All';
let selectedCategoryFilter = 'All';

document.addEventListener('DOMContentLoaded', () => {
    initBillingEvents();
});

function initBillingEvents() {
    document.getElementById('pos-search')?.addEventListener('input', (e) => {
        renderPOSCatalog();
    });

    document.querySelectorAll('#pos-age-chips .chip').forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            document.querySelectorAll('#pos-age-chips .chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            selectedAgeFilter = btn.getAttribute('data-age');
            renderPOSCatalog();
        });
    });

    document.querySelectorAll('#pos-cat-chips .chip').forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            document.querySelectorAll('#pos-cat-chips .chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            selectedCategoryFilter = btn.getAttribute('data-cat');
            renderPOSCatalog();
        });
    });

    document.getElementById('clear-cart-btn')?.addEventListener('click', () => {
        playSound('click');
        clearCart();
    });

    document.getElementById('cart-discount-input')?.addEventListener('input', updateCartTotals);

    document.getElementById('checkout-btn')?.addEventListener('click', () => handleCheckout(false));
    document.getElementById('checkout-wa-btn')?.addEventListener('click', () => handleCheckout(true));

    const billingTab = document.querySelector('[data-target="view-billing"]');
    billingTab?.addEventListener('click', () => {
        renderPOSCatalog();
    });
}

function renderPOSCatalog() {
    const grid = document.getElementById('pos-product-grid');
    if (!grid) return;

    const searchTerm = (document.getElementById('pos-search')?.value || '').toLowerCase();
    const currentDept = state.activeDepartment || 'Kids';

    const filtered = (state.products || []).filter(p => {
        const matchesAge = selectedAgeFilter === 'All' || p.ageGroup === selectedAgeFilter;
        const matchesCat = selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter;
        const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm) || p.sku.toLowerCase().includes(searchTerm);
        return matchesAge && matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 40px;">No items matching selected filters</div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="pos-prod-card" onclick="addToCart('${p.id}')">
            <div class="prod-img-wrap">
                <img src="${p.imageUrl || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200'}" alt="${p.name}">
            </div>
            <div class="prod-title">${p.name}</div>
            <div class="prod-meta">
                <span>${p.ageGroup}</span>
                <span class="badge-blue">${p.size}</span>
            </div>
            <div class="prod-price-row">
                <span class="prod-price">₹${p.price}</span>
                <span class="prod-stock-badge ${p.stock <= p.minLevel ? 'stock-low' : 'stock-ok'}">
                    ${p.stock} left
                </span>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    playSound('click');
    const prod = state.products.find(p => p.id === productId);
    if (!prod) return;

    if (prod.stock <= 0) {
        showErrorModal('Out of Stock!', `Sorry, ${prod.name} is currently out of stock.`);
        return;
    }

    const existingIndex = cart.findIndex(c => c.productId === productId);
    if (existingIndex > -1) {
        if (cart[existingIndex].quantity + 1 > prod.stock) {
            showErrorModal('Stock Limit Reached', `Only ${prod.stock} units available in stock.`);
            return;
        }
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            size: prod.size,
            price: prod.price,
            taxRate: prod.taxRate || 5,
            quantity: 1
        });
    }

    renderCartTable();
}

function updateCartQty(index, change) {
    playSound('click');
    if (index < 0 || index >= cart.length) return;
    const item = cart[index];
    const prod = state.products.find(p => p.id === item.productId);

    const newQty = item.quantity + change;
    if (newQty <= 0) {
        cart.splice(index, 1);
    } else if (prod && newQty > prod.stock) {
        showErrorModal('Stock Limit Exceeded', `Only ${prod.stock} units available in stock.`);
    } else {
        item.quantity = newQty;
    }

    renderCartTable();
}

function removeFromCart(index) {
    playSound('click');
    cart.splice(index, 1);
    renderCartTable();
}

function clearCart() {
    cart = [];
    renderCartTable();
}

function renderCartTable() {
    const tbody = document.getElementById('cart-items-tbody');
    if (!tbody) return;

    if (cart.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-cart-row">
                <td colspan="5" style="text-align:center;color:#94a3b8;padding:24px;">Cart is empty. Select products on the left to add.</td>
            </tr>
        `;
        updateCartTotals();
        return;
    }

    tbody.innerHTML = cart.map((item, idx) => `
        <tr>
            <td>
                <div><strong>${item.productName}</strong></div>
                <div style="font-size:11px;color:#64748b;">${item.sku} | <span class="badge-sub">${item.size}</span></div>
            </td>
            <td>
                <div class="qty-control">
                    <button class="btn-qty" onclick="updateCartQty(${idx}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn-qty" onclick="updateCartQty(${idx}, 1)">+</button>
                </div>
            </td>
            <td>₹${item.price}</td>
            <td><strong>₹${(item.price * item.quantity).toFixed(2)}</strong></td>
            <td>
                <i class="fa-solid fa-xmark text-rose" style="cursor:pointer;" onclick="removeFromCart(${idx})"></i>
            </td>
        </tr>
    `).join('');

    updateCartTotals();
}

function updateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountInput = parseFloat(document.getElementById('cart-discount-input')?.value || 0);

    let taxAmount = 0;
    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        taxAmount += itemSubtotal * ((item.taxRate || 5) / 100);
    });

    const total = Math.max(0, subtotal + taxAmount - discountInput);

    document.getElementById('cart-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('cart-tax').textContent = `₹${taxAmount.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `₹${total.toFixed(2)}`;
}

async function handleCheckout(sendWhatsApp = false) {
    if (cart.length === 0) {
        showErrorModal('Empty Cart', 'Please add kids wear items to the cart before completing checkout.');
        return;
    }

    const customerName = document.getElementById('cart-cust-name')?.value || 'Walk-in Customer';
    const customerPhone = document.getElementById('cart-cust-phone')?.value || '';
    const paymentMode = document.querySelector('input[name="pay-mode"]:checked')?.value || 'UPI';
    const discountAmount = parseFloat(document.getElementById('cart-discount-input')?.value || 0);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let taxAmount = 0;
    cart.forEach(item => {
        taxAmount += (item.price * item.quantity) * ((item.taxRate || 5) / 100);
    });
    const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);

    const invoicePayload = {
        customerName: customerName,
        customerPhone: customerPhone,
        items: cart,
        subTotal: subtotal,
        taxAmount: taxAmount,
        discountAmount: discountAmount,
        totalAmount: totalAmount,
        paymentMode: paymentMode,
        status: 'Completed',
        notes: sendWhatsApp ? 'WhatsApp Bill Triggered' : 'POS Cashier Direct'
    };

    try {
        const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoicePayload)
        });

        if (res.ok) {
            const invoiceData = await res.json();
            clearCart();
            document.getElementById('cart-cust-name').value = '';
            document.getElementById('cart-cust-phone').value = '';

            // Play Success Cha-Ching Tone!
            playSound('success');

            // Show Animated Success Modal
            document.getElementById('succ-inv-no').textContent = invoiceData.invoiceNo;
            document.getElementById('succ-amount').textContent = `₹${invoiceData.totalAmount.toLocaleString()}`;
            document.getElementById('succ-cust-name').textContent = invoiceData.customerName;
            document.getElementById('succ-pay-mode').textContent = invoiceData.paymentMode;

            const waBtn = document.getElementById('succ-wa-btn');
            if (waBtn) {
                waBtn.onclick = () => {
                    closeModal('modal-success-anim');
                    triggerWhatsAppInvoice(invoiceData.id, invoiceData.customerPhone);
                };
            }

            document.getElementById('modal-success-anim')?.classList.add('show');

            // Refresh data
            loadDashboardData();
            loadProductsMaster();

            if (sendWhatsApp) {
                triggerWhatsAppInvoice(invoiceData.id, invoiceData.customerPhone);
            }
        } else {
            showErrorModal('Transaction Failed', 'Unable to record invoice. Please check data and try again.');
        }
    } catch (err) {
        console.error('Checkout error:', err);
        showErrorModal('Network Error', 'Could not connect to server.');
    }
}
