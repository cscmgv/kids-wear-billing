using System;
using System.Collections.Generic;

namespace KidsBillingApp.Models
{
    public class Product
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Department { get; set; } = "Kids"; // Kids, Men, Women
        public string Name { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public string Category { get; set; } = "General"; // Frocks, Onesies, T-Shirts, Jeans, Ethnic Wear, Party Wear, Nightwear, Accessories, Shoes, Shirts, Sarees, Kurtis, Salwar
        public string AgeGroup { get; set; } = "2-5Y"; // 0-2Y, 2-5Y, 5-10Y, 10-16Y, Adult
        public string Size { get; set; } = "M"; // 0-3M, 3-6M, 6-12M, 1-2Y, 2-4Y, 4-6Y, 6-8Y, 8-10Y, 10-12Y, S, M, L, XL, XXL, 32, 34, 36, 38, 40
        public string Brand { get; set; } = "StorePilot Fashion";
        public decimal Price { get; set; }
        public decimal MRP { get; set; }
        public decimal CostPrice { get; set; }
        public decimal TaxRate { get; set; } = 5.0m; // GST percentage
        public int Stock { get; set; }
        public int MinLevel { get; set; } = 5;
        public string ImageUrl { get; set; } = "";
    }

    public class InvoiceItem
    {
        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public string Size { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal TaxRate { get; set; }
        public int Quantity { get; set; }
        public decimal Total { get; set; }
    }

    public class Invoice
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Department { get; set; } = "Kids"; // Kids, Men, Women
        public string InvoiceNo { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.Now;
        public string CustomerName { get; set; } = "Walk-in Customer";
        public string CustomerPhone { get; set; } = string.Empty;
        public List<InvoiceItem> Items { get; set; } = new();
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentMode { get; set; } = "Cash"; // Cash, UPI, Card, Debit, Credit
        public string Status { get; set; } = "Completed"; // Completed, Returned, Deleted
        public string Notes { get; set; } = string.Empty;
    }

    public class Customer
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal TotalPurchases { get; set; }
        public decimal OutstandingBalance { get; set; }
        public int LoyaltyPoints { get; set; }
    }

    public class Supplier
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal OutstandingPayable { get; set; }
    }

    public class Expense
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = "General";
        public decimal Amount { get; set; }
        public DateTime Date { get; set; } = DateTime.Now;
        public string Notes { get; set; } = string.Empty;
    }

    public class PurchaseOrder
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string OrderNo { get; set; } = string.Empty;
        public string SupplierId { get; set; } = string.Empty;
        public string SupplierName { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.Now;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Received, Cancelled
        public List<InvoiceItem> Items { get; set; } = new();
    }

    public class StoreSettings
    {
        public string StoreName { get; set; } = "Little Stars Kids Wear";
        public string Address { get; set; } = "123 Main Road, Kids Fashion Hub, Chennai";
        public string Phone { get; set; } = "+91 98765 43210";
        public string GSTIN { get; set; } = "33AAAAA0000A1Z5";
        public string WhatsAppApiKey { get; set; } = "demo_whatsapp_key_12345";
        public string WhatsAppSenderPhone { get; set; } = "919876543210";
        public string DefaultMessageTemplate { get; set; } = "Dear {CustomerName}, Thank you for shopping at {StoreName}! Your invoice #{InvoiceNo} for ₹{TotalAmount} is ready. Track details here: {InvoiceUrl}. Have a magical day!";
        public string ThermalPrinterName { get; set; } = "POS-80 Thermal Printer";
        public string ActiveTheme { get; set; } = "theme-default";
    }

    public class AuditLog
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public DateTime Timestamp { get; set; } = DateTime.Now;
        public string ActionType { get; set; } = "DELETE_BILL"; // DELETE_BILL, EDIT_BILL, CANCEL_SUPPLIER_ORDER
        public string InvoiceNo { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Details { get; set; } = string.Empty;
        public string LogFilePath { get; set; } = string.Empty;
    }

    public class SalesTrendPoint
    {
        public string DayName { get; set; } = string.Empty;
        public string DateStr { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public class PaymentModeBreakdown
    {
        public decimal CashTotal { get; set; }
        public decimal UpiTotal { get; set; }
        public decimal CardTotal { get; set; }
        public decimal DebitTotal { get; set; }
        public decimal CreditTotal { get; set; }
    }

    public class ReportGroupItem
    {
        public string PeriodLabel { get; set; } = string.Empty;
        public decimal SalesAmount { get; set; }
        public int BillsCount { get; set; }
        public decimal ProfitAmount { get; set; }
        public decimal ExpensesAmount { get; set; }
        public decimal PurchasesAmount { get; set; }
    }

    public class ComprehensiveReport
    {
        public string GroupBy { get; set; } = "day"; // day, month, year
        public string SelectedPeriod { get; set; } = "today"; // today, yesterday, week, month, all
        public string SelectedPaymentMode { get; set; } = "All"; // All, Cash, UPI, Card, Debit, Credit
        public string FilterSummaryText { get; set; } = string.Empty;
        public PaymentModeBreakdown PaymentBreakdown { get; set; } = new();
        public decimal TotalSales { get; set; }
        public int TotalBillsCount { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal TotalPurchases { get; set; }
        public decimal TotalNetProfit { get; set; }
        public decimal Gst5Amount { get; set; }
        public decimal Gst12Amount { get; set; }
        public decimal CustomerReceivables { get; set; }
        public decimal SupplierPayables { get; set; }
        public List<ReportGroupItem> PeriodBreakdown { get; set; } = new();
        public List<Invoice> FilteredInvoices { get; set; } = new();
        public List<Expense> FilteredExpenses { get; set; } = new();
        public List<PurchaseOrder> FilteredPurchaseOrders { get; set; } = new();
    }

    public class DashboardSummary
    {
        public decimal TodaySales { get; set; }
        public int TodayBillsCount { get; set; }
        public decimal MonthlySales { get; set; }
        public int MonthlyBillsCount { get; set; }
        public int ActiveProducts { get; set; }
        public int LowStockCount { get; set; }
        public int RegisteredCustomers { get; set; }
        public decimal TodayNetProfit { get; set; }
        public decimal TodayExpenses { get; set; }
        public decimal CustomerOutstanding { get; set; }
        public decimal SupplierOutstanding { get; set; }
        public List<Invoice> RecentInvoices { get; set; } = new();
        public List<Product> LowStockAlerts { get; set; } = new();
        public List<SalesTrendPoint> SalesTrend { get; set; } = new();
    }
}
