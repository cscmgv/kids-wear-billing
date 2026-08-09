// STOREPILOT WHATSAPP INTEGRATION & RECEIPT CONTROLLER

async function viewReceiptModal(invoiceId, autoOpenWhatsApp = false) {
    try {
        const res = await fetch(`/api/invoices/${invoiceId}`);
        if (!res.ok) return;

        const inv = await res.json();
        const settings = state.settings || { storeName: 'Little Stars Kids Wear', address: 'Main Road', phone: '9876543210' };

        const receiptHtml = `
            <div class="receipt-center">
                <div class="receipt-title">${settings.storeName || 'Little Stars Kids Wear'}</div>
                <div style="font-size:11px;">${settings.address || 'Chennai'}</div>
                <div style="font-size:11px;">Ph: ${settings.phone || '+91 98765 43210'} | GSTIN: ${settings.gstin || '33AAAAA0000A1Z5'}</div>
            </div>
            <div class="receipt-divider"></div>
            <div><strong>Invoice No:</strong> ${inv.invoiceNo}</div>
            <div><strong>Date:</strong> ${new Date(inv.date).toLocaleString()}</div>
            <div><strong>Customer:</strong> ${inv.customerName} (${inv.customerPhone || 'N/A'})</div>
            <div><strong>Payment Mode:</strong> ${inv.paymentMode}</div>
            <div class="receipt-divider"></div>
            <div style="font-weight:bold;display:flex;justify-content:space-between;">
                <span>Item & Size</span>
                <span>Qty x Price = Total</span>
            </div>
            <div class="receipt-divider"></div>
            ${inv.items.map(it => `
                <div class="receipt-item-row">
                    <span>${it.productName} (${it.size})</span>
                    <span>${it.quantity} x ₹${it.price} = ₹${(it.quantity * it.price).toFixed(2)}</span>
                </div>
            `).join('')}
            <div class="receipt-divider"></div>
            <div class="receipt-item-row"><span>Subtotal:</span><span>₹${inv.subTotal.toFixed(2)}</span></div>
            <div class="receipt-item-row"><span>Discount:</span><span>-₹${inv.discountAmount.toFixed(2)}</span></div>
            <div class="receipt-item-row"><span>GST Tax:</span><span>+₹${inv.taxAmount.toFixed(2)}</span></div>
            <div class="receipt-divider"></div>
            <div class="receipt-item-row" style="font-size:15px;font-weight:bold;">
                <span>GRAND TOTAL:</span>
                <span>₹${inv.totalAmount.toFixed(2)}</span>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-center" style="font-size:11px;margin-top:10px;">
                Thank you for shopping Kids Wear! 🌟<br>
                Items once sold can be exchanged within 7 days.
            </div>
        `;

        document.getElementById('receipt-content').innerHTML = receiptHtml;

        // Configure WhatsApp button click handler
        const waBtn = document.getElementById('btn-modal-wa-send');
        if (waBtn) {
            waBtn.onclick = () => triggerWhatsAppInvoice(inv.id, inv.customerPhone);
        }

        document.getElementById('modal-receipt').classList.add('show');

        if (autoOpenWhatsApp) {
            triggerWhatsAppInvoice(inv.id, inv.customerPhone);
        }
    } catch (e) {
        console.error('Error rendering receipt:', e);
    }
}

async function triggerWhatsAppInvoice(invoiceId, phone) {
    let targetPhone = phone;
    if (!targetPhone) {
        targetPhone = prompt('Enter customer WhatsApp mobile number (e.g. 9876543210):');
        if (!targetPhone) return;
    }

    try {
        const res = await fetch('/api/whatsapp/send-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invoiceId: invoiceId,
                phone: targetPhone,
                customText: ''
            })
        });

        if (res.ok) {
            const data = await res.json();
            // Open direct WhatsApp web or app link
            window.open(data.waUrl, '_blank');
        }
    } catch (e) {
        console.error('Error sending WhatsApp invoice:', e);
    }
}

function sendWhatsAppInvoiceDirect(invoiceId, phone) {
    triggerWhatsAppInvoice(invoiceId, phone);
}

// WHATSAPP PAYMENT DUE REMINDER FOR CUSTOMER
function sendWhatsAppReminder(customerName, phone, amount) {
    if (!phone) {
        alert('Customer mobile number is missing.');
        return;
    }
    const storeName = state.settings?.storeName || 'Little Stars Kids Wear';
    const message = `Hello *${customerName}*! 👋\n` +
                    `This is a friendly reminder from *${storeName}*.\n` +
                    `You have an outstanding payment balance of *₹${amount.toLocaleString()}*.\n` +
                    `Kindly clear your dues via UPI or cash on your next visit. Thank you! 🌟`;

    const encoded = encodeURIComponent(message);
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank');
}

// WHATSAPP REORDER ALERT FOR SUPPLIER
function sendWhatsAppReorder(companyName, phone, productName = 'Kids Wear Garments', size = '') {
    if (!phone) {
        alert('Supplier phone number is missing.');
        return;
    }
    const storeName = state.settings?.storeName || 'Little Stars Kids Wear';
    const message = `Hello *${companyName}*! 📦\n` +
                    `Greetings from *${storeName}*.\n` +
                    `We need to place an urgent re-order for:\n` +
                    `• Item: *${productName}* ${size ? `(Size: ${size})` : ''}\n` +
                    `Please share the latest catalog, stock availability, and invoice quotation. Thanks!`;

    const encoded = encodeURIComponent(message);
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank');
}
