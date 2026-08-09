using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.Json;
using KidsBillingApp.Models;
using KidsBillingApp.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Register DataStore Singleton
builder.Services.AddSingleton<DataStore>();

// CORS & Routing
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseDefaultFiles();
app.UseStaticFiles();

// --- AUTH API ENDPOINT ---
app.MapPost("/api/auth/login", (LoginRequest req) =>
{
    var role = req.Role ?? "Admin";
    var pass = req.Password ?? "";

    if (role.Equals("Admin", StringComparison.OrdinalIgnoreCase) && (pass == "1234" || pass == "admin123"))
    {
        return Results.Ok(new { success = true, role = "Admin", name = "System Admin", message = "Admin Login Successful" });
    }
    else if (role.Equals("Cashier", StringComparison.OrdinalIgnoreCase) && (pass == "0000" || pass == "cashier123"))
    {
        return Results.Ok(new { success = true, role = "Cashier", name = "Cashier Staff", message = "Cashier Login Successful" });
    }

    return Results.BadRequest(new { success = false, message = "Incorrect Password! Please enter valid PIN." });
});

// --- DASHBOARD SUMMARY API ---
app.MapGet("/api/dashboard", (DataStore store, string? period, string? from, string? to) =>
{
    var summary = store.GetDashboardSummary(period ?? "today", from ?? "", to ?? "");
    return Results.Ok(summary);
});

// --- COMPREHENSIVE REPORTS API WITH FULL FILTERS ---
app.MapGet("/api/reports", (DataStore store, string? groupBy, string? period, string? from, string? to, string? paymentMode) =>
{
    var report = store.GetComprehensiveReport(
        groupBy ?? "day",
        period ?? "today",
        from ?? "",
        to ?? "",
        paymentMode ?? "All"
    );
    return Results.Ok(report);
});

// Products Endpoints
app.MapGet("/api/products", (DataStore store, string? category, string? ageGroup, string? search) =>
{
    var products = store.Data.Products.AsQueryable();
    if (!string.IsNullOrEmpty(category) && category != "All")
    {
        products = products.Where(p => p.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
    }
    if (!string.IsNullOrEmpty(ageGroup) && ageGroup != "All")
    {
        products = products.Where(p => p.AgeGroup.Equals(ageGroup, StringComparison.OrdinalIgnoreCase));
    }
    if (!string.IsNullOrEmpty(search))
    {
        var q = search.ToLower();
        products = products.Where(p => p.Name.ToLower().Contains(q) || p.SKU.ToLower().Contains(q));
    }
    return Results.Ok(products.ToList());
});

app.MapPost("/api/products", (DataStore store, Product product) =>
{
    if (string.IsNullOrEmpty(product.Id)) product.Id = Guid.NewGuid().ToString();
    store.Data.Products.Add(product);
    store.SaveData();
    return Results.Created($"/api/products/{product.Id}", product);
});

app.MapPut("/api/products/{id}", (DataStore store, string id, Product updatedProduct) =>
{
    var existing = store.Data.Products.FirstOrDefault(p => p.Id == id);
    if (existing == null) return Results.NotFound();

    existing.Name = updatedProduct.Name;
    existing.SKU = updatedProduct.SKU;
    existing.Category = updatedProduct.Category;
    existing.AgeGroup = updatedProduct.AgeGroup;
    existing.Size = updatedProduct.Size;
    existing.Brand = updatedProduct.Brand;
    existing.Price = updatedProduct.Price;
    existing.MRP = updatedProduct.MRP;
    existing.CostPrice = updatedProduct.CostPrice;
    existing.TaxRate = updatedProduct.TaxRate;
    existing.Stock = updatedProduct.Stock;
    existing.MinLevel = updatedProduct.MinLevel;
    existing.ImageUrl = updatedProduct.ImageUrl;

    store.SaveData();
    return Results.Ok(existing);
});

app.MapDelete("/api/products/{id}", (DataStore store, string id) =>
{
    var prod = store.Data.Products.FirstOrDefault(p => p.Id == id);
    if (prod == null) return Results.NotFound();
    store.Data.Products.Remove(prod);
    store.SaveData();
    return Results.Ok(new { message = "Product deleted successfully" });
});

// Invoices Endpoints
app.MapGet("/api/invoices", (DataStore store) =>
{
    return Results.Ok(store.Data.Invoices.OrderByDescending(i => i.Date).ToList());
});

app.MapGet("/api/invoices/{id}", (DataStore store, string id) =>
{
    var inv = store.Data.Invoices.FirstOrDefault(i => i.Id == id || i.InvoiceNo == id);
    return inv != null ? Results.Ok(inv) : Results.NotFound();
});

app.MapPost("/api/invoices", (DataStore store, Invoice invoice) =>
{
    invoice.Id = Guid.NewGuid().ToString();
    invoice.InvoiceNo = $"INV-{DateTime.Now:yyyyMMdd}-{store.Data.Invoices.Count + 101}";
    invoice.Date = DateTime.Now;

    foreach (var item in invoice.Items)
    {
        var prod = store.Data.Products.FirstOrDefault(p => p.Id == item.ProductId);
        if (prod != null)
        {
            prod.Stock = Math.Max(0, prod.Stock - item.Quantity);
        }
    }

    if (!string.IsNullOrEmpty(invoice.CustomerPhone))
    {
        var cust = store.Data.Customers.FirstOrDefault(c => c.Phone == invoice.CustomerPhone);
        if (cust != null)
        {
            cust.TotalPurchases += invoice.TotalAmount;
            if (invoice.PaymentMode == "Credit")
            {
                cust.OutstandingBalance += invoice.TotalAmount;
            }
        }
    }

    store.Data.Invoices.Add(invoice);
    store.SaveData();
    return Results.Created($"/api/invoices/{invoice.Id}", invoice);
});

// DELETE RECEIPT / BILL
app.MapDelete("/api/invoices/{id}", (DataStore store, string id, string? reason) =>
{
    var success = store.DeleteInvoice(id, reason ?? "Admin Deleted Bill");
    if (!success) return Results.NotFound(new { message = "Invoice not found or already deleted" });
    return Results.Ok(new { success = true, message = "Bill deleted successfully, stock restored, and audit log created in record_book/delete/" });
});

// Customers Endpoints
app.MapGet("/api/customers", (DataStore store) =>
{
    return Results.Ok(store.Data.Customers.ToList());
});

app.MapPost("/api/customers", (DataStore store, Customer customer) =>
{
    if (string.IsNullOrEmpty(customer.Id)) customer.Id = Guid.NewGuid().ToString();
    store.Data.Customers.Add(customer);
    store.SaveData();
    return Results.Created($"/api/customers/{customer.Id}", customer);
});

app.MapDelete("/api/customers/{id}", (DataStore store, string id, string? reason) =>
{
    var success = store.DeleteCustomer(id, reason ?? "Admin Deleted Customer");
    if (!success) return Results.NotFound(new { message = "Customer not found" });
    return Results.Ok(new { success = true, message = "Customer deleted successfully and logged to record_book/delete/" });
});

// --- SUPPLIERS & PURCHASE ORDERS ENDPOINTS ---
app.MapGet("/api/suppliers", (DataStore store) =>
{
    return Results.Ok(store.Data.Suppliers.ToList());
});

app.MapPost("/api/suppliers", (DataStore store, Supplier supplier) =>
{
    if (string.IsNullOrEmpty(supplier.Id)) supplier.Id = Guid.NewGuid().ToString();
    store.Data.Suppliers.Add(supplier);
    store.SaveData();
    return Results.Created($"/api/suppliers/{supplier.Id}", supplier);
});

app.MapDelete("/api/suppliers/{id}", (DataStore store, string id, string? reason) =>
{
    var success = store.DeleteSupplier(id, reason ?? "Admin Deleted Supplier");
    if (!success) return Results.NotFound(new { message = "Supplier not found" });
    return Results.Ok(new { success = true, message = "Supplier deleted successfully and logged to record_book/delete/" });
});

// PURCHASE ORDERS API
app.MapGet("/api/purchase-orders", (DataStore store) =>
{
    return Results.Ok(store.Data.PurchaseOrders.OrderByDescending(p => p.Date).ToList());
});

app.MapPost("/api/purchase-orders", (DataStore store, PurchaseOrder order) =>
{
    order.Id = Guid.NewGuid().ToString();
    order.OrderNo = $"PO-{DateTime.Now:yyyyMMdd}-{store.Data.PurchaseOrders.Count + 101}";
    order.Date = DateTime.Now;
    order.Status = string.IsNullOrEmpty(order.Status) ? "Pending" : order.Status;

    var sup = store.Data.Suppliers.FirstOrDefault(s => s.Id == order.SupplierId || s.Company == order.SupplierName);
    if (sup != null)
    {
        sup.OutstandingPayable += order.TotalAmount;
    }

    if (order.Status == "Received")
    {
        foreach (var item in order.Items)
        {
            var prod = store.Data.Products.FirstOrDefault(p => p.Id == item.ProductId);
            if (prod != null)
            {
                prod.Stock += item.Quantity;
            }
        }
    }

    store.Data.PurchaseOrders.Add(order);
    store.SaveData();
    return Results.Created($"/api/purchase-orders/{order.Id}", order);
});

// CANCEL SUPPLIER PURCHASE ORDER
app.MapDelete("/api/purchase-orders/{id}", (DataStore store, string id, string? reason) =>
{
    var success = store.CancelPurchaseOrder(id, reason ?? "Supplier Order Cancelled");
    if (!success) return Results.NotFound(new { message = "Purchase Order not found" });
    return Results.Ok(new { success = true, message = "Supplier Purchase Order cancelled and logged to record_book/delete/" });
});

// Expenses Endpoints
app.MapGet("/api/expenses", (DataStore store) =>
{
    return Results.Ok(store.Data.Expenses.OrderByDescending(e => e.Date).ToList());
});

app.MapPost("/api/expenses", (DataStore store, Expense expense) =>
{
    if (string.IsNullOrEmpty(expense.Id)) expense.Id = Guid.NewGuid().ToString();
    expense.Date = DateTime.Now;
    store.Data.Expenses.Add(expense);
    store.SaveData();
    return Results.Created($"/api/expenses/{expense.Id}", expense);
});

// Record Book Audit Logs Endpoint
app.MapGet("/api/logs", (DataStore store) =>
{
    return Results.Ok(store.Data.AuditLogs.OrderByDescending(l => l.Timestamp).ToList());
});

// Settings Endpoints
app.MapGet("/api/settings", (DataStore store) =>
{
    return Results.Ok(store.Data.Settings);
});

app.MapPost("/api/settings", (DataStore store, StoreSettings settings) =>
{
    store.Data.Settings = settings;
    store.SaveData();
    return Results.Ok(store.Data.Settings);
});

// WhatsApp API Integration Endpoint
app.MapPost("/api/whatsapp/send-invoice", (DataStore store, WhatsAppRequest req) =>
{
    var settings = store.Data.Settings;
    var inv = store.Data.Invoices.FirstOrDefault(i => i.Id == req.InvoiceId || i.InvoiceNo == req.InvoiceId);

    string phone = req.Phone;
    if (string.IsNullOrEmpty(phone) && inv != null)
    {
        phone = inv.CustomerPhone;
    }

    phone = new string(phone.Where(char.IsDigit).ToArray());
    if (phone.Length == 10) phone = "91" + phone;

    string message = "";
    if (inv != null)
    {
        var itemsText = string.Join("\n", inv.Items.Select(it => $"• {it.ProductName} ({it.Size}) x{it.Quantity} = ₹{it.Total}"));
        message = $"🛍️ *{settings.StoreName} - Bill Receipt*\n" +
                  $"----------------------------------------\n" +
                  $"📄 *Invoice No:* {inv.InvoiceNo}\n" +
                  $"📅 *Date:* {inv.Date:dd-MMM-yyyy hh:mm tt}\n" +
                  $"👤 *Customer:* {inv.CustomerName}\n" +
                  $"----------------------------------------\n" +
                  $"*Items Purchased:*\n{itemsText}\n" +
                  $"----------------------------------------\n" +
                  $"💵 *Subtotal:* ₹{inv.SubTotal}\n" +
                  $"🏷️ *Discount:* ₹{inv.DiscountAmount}\n" +
                  $"📊 *GST Tax:* ₹{inv.TaxAmount}\n" +
                  $"💰 *TOTAL PAID:* ₹{inv.TotalAmount} ({inv.PaymentMode})\n" +
                  $"----------------------------------------\n" +
                  $"Thank you for visiting *{settings.StoreName}*! Please visit again. 🌟";
    }
    else if (!string.IsNullOrEmpty(req.CustomText))
    {
        message = req.CustomText;
    }

    var encodedMessage = WebUtility.UrlEncode(message);
    var waUrl = $"https://wa.me/{phone}?text={encodedMessage}";
    var webApiUrl = $"https://api.whatsapp.com/send?phone={phone}&text={encodedMessage}";

    return Results.Ok(new
    {
        success = true,
        phone = phone,
        messageText = message,
        waUrl = waUrl,
        webApiUrl = webApiUrl,
        apiStatus = "Simulated WhatsApp Webhook / API Message Ready"
    });
});

app.Run();

public record LoginRequest(string Username, string Password, string Role);
public record WhatsAppRequest(string InvoiceId, string Phone, string CustomText);
