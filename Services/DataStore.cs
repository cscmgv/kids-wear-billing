using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using KidsBillingApp.Models;

namespace KidsBillingApp.Services
{
    public class DataContainer
    {
        public List<Product> Products { get; set; } = new();
        public List<Invoice> Invoices { get; set; } = new();
        public List<Customer> Customers { get; set; } = new();
        public List<Supplier> Suppliers { get; set; } = new();
        public List<Expense> Expenses { get; set; } = new();
        public List<PurchaseOrder> PurchaseOrders { get; set; } = new();
        public List<AuditLog> AuditLogs { get; set; } = new();
        public StoreSettings Settings { get; set; } = new();
    }

    public class DataStore
    {
        private readonly string _filePath;
        private readonly string _recordBookDir;
        private readonly string _deleteSubDir;
        private readonly string _changesSubDir;
        private readonly object _lock = new();
        public DataContainer Data { get; private set; } = new();

        public DataStore(string dataDirectory = "data")
        {
            if (!Directory.Exists(dataDirectory))
            {
                Directory.CreateDirectory(dataDirectory);
            }
            _filePath = Path.Combine(dataDirectory, "store_data.json");

            _recordBookDir = Path.Combine(Directory.GetCurrentDirectory(), "record_book");
            _deleteSubDir = Path.Combine(_recordBookDir, "delete");
            _changesSubDir = Path.Combine(_recordBookDir, "changes");

            EnsureRecordBookDirectories();
            LoadOrCreateData();
        }

        private void EnsureRecordBookDirectories()
        {
            if (!Directory.Exists(_recordBookDir)) Directory.CreateDirectory(_recordBookDir);
            if (!Directory.Exists(_deleteSubDir)) Directory.CreateDirectory(_deleteSubDir);
            if (!Directory.Exists(_changesSubDir)) Directory.CreateDirectory(_changesSubDir);
        }

        private void LoadOrCreateData()
        {
            lock (_lock)
            {
                if (File.Exists(_filePath))
                {
                    try
                    {
                        var json = File.ReadAllText(_filePath);
                        var loaded = JsonSerializer.Deserialize<DataContainer>(json);
                        if (loaded != null)
                        {
                            Data = loaded;
                            EnsureSeedData();
                            return;
                        }
                    }
                    catch
                    {
                        // Fallback to fresh seeded data
                    }
                }

                SeedInitialData();
                SaveData();
            }
        }

        private void EnsureSeedData()
        {
            if (Data.Products == null || Data.Products.Count == 0)
            {
                SeedInitialData();
                SaveData();
            }
        }

        private void SeedInitialData()
        {
            Data = new DataContainer
            {
                Settings = new StoreSettings(),
                Products = new List<Product>
                {
                    // 🧒 KIDS WEAR DEPARTMENT
                    new Product { Id = "p1", Department = "Kids", Name = "Baby Soft Cotton Onesie Set (3 Pack)", SKU = "KW-ONS-01", Category = "Onesies", AgeGroup = "0-2Y", Size = "3-6M", Brand = "BabyHug", Price = 499, MRP = 699, CostPrice = 320, TaxRate = 5, Stock = 15, MinLevel = 5, ImageUrl = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300" },
                    new Product { Id = "p2", Department = "Kids", Name = "Little Princess Floral Party Frock", SKU = "KW-FRK-02", Category = "Frocks", AgeGroup = "2-5Y", Size = "2-4Y", Brand = "Lilliput", Price = 899, MRP = 1299, CostPrice = 550, TaxRate = 5, Stock = 1, MinLevel = 5, ImageUrl = "https://images.unsplash.com/photo-1621452773781-0f992fd1f5cb?w=300" },
                    new Product { Id = "p3", Department = "Kids", Name = "Boys Printed Cartoon Cotton T-Shirt", SKU = "KW-TSH-03", Category = "T-Shirts", AgeGroup = "2-5Y", Size = "4-6Y", Brand = "Hopscotch", Price = 349, MRP = 499, CostPrice = 200, TaxRate = 5, Stock = 24, MinLevel = 6, ImageUrl = "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=300" },
                    new Product { Id = "p4", Department = "Kids", Name = "Kids Stretchable Denim Jeans", SKU = "KW-JNS-04", Category = "Jeans", AgeGroup = "5-10Y", Size = "6-8Y", Brand = "Mothercare", Price = 799, MRP = 1099, CostPrice = 480, TaxRate = 5, Stock = 12, MinLevel = 4, ImageUrl = "https://images.unsplash.com/photo-1541216970279-affbfdd55aa8?w=300" },
                    new Product { Id = "p5", Department = "Kids", Name = "Festive Boys Ethnic Kurta Pyjama Set", SKU = "KW-ETH-05", Category = "Ethnic Wear", AgeGroup = "5-10Y", Size = "8-10Y", Brand = "Manyavar Kids", Price = 1299, MRP = 1799, CostPrice = 800, TaxRate = 12, Stock = 8, MinLevel = 3, ImageUrl = "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300" },
                    new Product { Id = "p6", Department = "Kids", Name = "Girls Velvet Winter Hooded Jacket", SKU = "KW-JKT-06", Category = "Party Wear", AgeGroup = "10-16Y", Size = "12-14Y", Brand = "Gini & Jony", Price = 1499, MRP = 1999, CostPrice = 950, TaxRate = 12, Stock = 6, MinLevel = 2, ImageUrl = "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=300" },

                    // 👨 MEN WEAR DEPARTMENT
                    new Product { Id = "m1", Department = "Men", Name = "Men Premium Slim Fit Cotton Shirt", SKU = "MW-SHR-01", Category = "Shirts", AgeGroup = "Adult", Size = "L", Brand = "Peter England", Price = 999, MRP = 1499, CostPrice = 600, TaxRate = 5, Stock = 20, MinLevel = 5, ImageUrl = "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300" },
                    new Product { Id = "m2", Department = "Men", Name = "Men Casual Crew Neck T-Shirt", SKU = "MW-TSH-02", Category = "T-Shirts", AgeGroup = "Adult", Size = "M", Brand = "US Polo", Price = 499, MRP = 799, CostPrice = 280, TaxRate = 5, Stock = 30, MinLevel = 8, ImageUrl = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300" },
                    new Product { Id = "m3", Department = "Men", Name = "Men Stretchable Denim Jeans", SKU = "MW-JNS-03", Category = "Jeans", AgeGroup = "Adult", Size = "32", Brand = "Levis", Price = 1499, MRP = 2199, CostPrice = 900, TaxRate = 5, Stock = 14, MinLevel = 4, ImageUrl = "https://images.unsplash.com/photo-1542272604-780c36856842?w=300" },
                    new Product { Id = "m4", Department = "Men", Name = "Men Traditional Silk Kurta Set", SKU = "MW-ETH-04", Category = "Ethnic Wear", AgeGroup = "Adult", Size = "XL", Brand = "Manyavar", Price = 2199, MRP = 2999, CostPrice = 1400, TaxRate = 12, Stock = 7, MinLevel = 2, ImageUrl = "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300" },

                    // 👩 WOMEN WEAR DEPARTMENT
                    new Product { Id = "w1", Department = "Women", Name = "Women Designer Silk Saree with Zari", SKU = "WW-SAR-01", Category = "Sarees", AgeGroup = "Adult", Size = "Free", Brand = "Nalli Silk", Price = 2999, MRP = 3999, CostPrice = 1800, TaxRate = 5, Stock = 12, MinLevel = 3, ImageUrl = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300" },
                    new Product { Id = "w2", Department = "Women", Name = "Women Printed Anarkali Kurti Set", SKU = "WW-KUR-02", Category = "Kurtis", AgeGroup = "Adult", Size = "M", Brand = "Biba", Price = 1199, MRP = 1699, CostPrice = 700, TaxRate = 5, Stock = 18, MinLevel = 5, ImageUrl = "https://images.unsplash.com/photo-1583391733975-d147321287c2?w=300" },
                    new Product { Id = "w3", Department = "Women", Name = "Women Designer Salwar Suit Set", SKU = "WW-SLW-03", Category = "Salwar", AgeGroup = "Adult", Size = "L", Brand = "Aurelia", Price = 1599, MRP = 2299, CostPrice = 950, TaxRate = 5, Stock = 10, MinLevel = 4, ImageUrl = "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300" },
                    new Product { Id = "w4", Department = "Women", Name = "Women Chic Floral Summer Top", SKU = "WW-TOP-04", Category = "Tops", AgeGroup = "Adult", Size = "S", Brand = "Westside", Price = 699, MRP = 999, CostPrice = 400, TaxRate = 5, Stock = 22, MinLevel = 6, ImageUrl = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300" }
                },
                Customers = new List<Customer>
                {
                    new Customer { Id = "c1", Name = "Kavitha Rajan", Phone = "9876543210", Address = "T Nagar, Chennai", TotalPurchases = 4500, OutstandingBalance = 0, LoyaltyPoints = 120 },
                    new Customer { Id = "c2", Name = "Arun Kumar", Phone = "9123456789", Address = "Velachery, Chennai", TotalPurchases = 2800, OutstandingBalance = 450, LoyaltyPoints = 75 },
                    new Customer { Id = "c3", Name = "Meena Ramesh", Phone = "9988776655", Address = "Anna Nagar, Chennai", TotalPurchases = 6200, OutstandingBalance = 0, LoyaltyPoints = 200 }
                },
                Suppliers = new List<Supplier>
                {
                    new Supplier { Id = "s1", Name = "Tirupur Kids Garments Pvt Ltd", Phone = "9443322110", Company = "Tirupur Tex", Address = "Tirupur, TN", OutstandingPayable = 12500 },
                    new Supplier { Id = "s2", Name = "Surat Silk & Frocks Hub", Phone = "9825012345", Company = "Surat Frocks Co", Address = "Surat, Gujarat", OutstandingPayable = 8400 }
                },
                Expenses = new List<Expense>
                {
                    new Expense { Id = "e1", Title = "Shop Electricity Bill", Category = "Utilities", Amount = 1850, Date = DateTime.Today.AddDays(-2), Notes = "TNEB Bill July" },
                    new Expense { Id = "e2", Title = "Staff Salary Advance", Category = "Payroll", Amount = 3000, Date = DateTime.Today.AddDays(-5), Notes = "Sales Staff" }
                },
                PurchaseOrders = new List<PurchaseOrder>
                {
                    new PurchaseOrder
                    {
                        Id = "po-101",
                        OrderNo = "PO-2026-001",
                        SupplierId = "s1",
                        SupplierName = "Tirupur Tex",
                        Date = DateTime.Today.AddDays(-3),
                        TotalAmount = 12500,
                        Status = "Received",
                        Items = new List<InvoiceItem>
                        {
                            new InvoiceItem { ProductId = "p1", ProductName = "Baby Soft Cotton Onesie Set", SKU = "KW-ONS-01", Size = "3-6M", Price = 320, Quantity = 25 }
                        }
                    },
                    new PurchaseOrder
                    {
                        Id = "po-102",
                        OrderNo = "PO-2026-002",
                        SupplierId = "s2",
                        SupplierName = "Surat Frocks Co",
                        Date = DateTime.Today.AddDays(-1),
                        TotalAmount = 8400,
                        Status = "Pending",
                        Items = new List<InvoiceItem>
                        {
                            new InvoiceItem { ProductId = "p2", ProductName = "Little Princess Floral Party Frock", SKU = "KW-FRK-02", Size = "2-4Y", Price = 550, Quantity = 15 }
                        }
                    }
                },
                Invoices = new List<Invoice>
                {
                    new Invoice
                    {
                        Id = "inv-1001",
                        InvoiceNo = "INV-2026-001",
                        Date = DateTime.Today,
                        CustomerName = "Kavitha Rajan",
                        CustomerPhone = "9876543210",
                        SubTotal = 1398,
                        TaxAmount = 69.9m,
                        DiscountAmount = 67.9m,
                        TotalAmount = 1400,
                        PaymentMode = "UPI",
                        Status = "Completed",
                        Notes = "WhatsApp Invoice Sent",
                        Items = new List<InvoiceItem>
                        {
                            new InvoiceItem { ProductId = "p1", ProductName = "Baby Soft Cotton Onesie Set", SKU = "KW-ONS-01", Size = "3-6M", Price = 499, TaxRate = 5, Quantity = 1 },
                            new InvoiceItem { ProductId = "p2", ProductName = "Little Princess Floral Party Frock", SKU = "KW-FRK-02", Size = "2-4Y", Price = 899, TaxRate = 5, Quantity = 1 }
                        }
                    }
                }
            };
        }

        public void SaveData()
        {
            lock (_lock)
            {
                try
                {
                    var options = new JsonSerializerOptions { WriteIndented = true };
                    var json = JsonSerializer.Serialize(Data, options);
                    File.WriteAllText(_filePath, json);
                }
                catch
                {
                    // Ignore transient write errors
                }
            }
        }

        // COMPREHENSIVE MULTI-FILTER REPORT GENERATOR (DAY/MONTH/YEAR, PAYMENT MODES, DATE RANGES)
        public ComprehensiveReport GetComprehensiveReport(string groupBy = "day", string period = "today", string fromDate = "", string toDate = "", string paymentMode = "All")
        {
            lock (_lock)
            {
                var today = DateTime.Today;
                DateTime startFilter = today;
                DateTime endFilter = today.AddDays(1).AddTicks(-1);
                string filterSummary = "Today's Performance";

                if (period == "yesterday")
                {
                    startFilter = today.AddDays(-1);
                    endFilter = today.AddTicks(-1);
                    filterSummary = "Yesterday's Performance";
                }
                else if (period == "week")
                {
                    startFilter = today.AddDays(-(int)today.DayOfWeek);
                    filterSummary = "This Week's Performance";
                }
                else if (period == "month")
                {
                    startFilter = new DateTime(today.Year, today.Month, 1);
                    filterSummary = "This Month's Performance";
                }
                else if (period == "all")
                {
                    startFilter = DateTime.MinValue;
                    endFilter = DateTime.MaxValue;
                    filterSummary = "All Time Business Performance";
                }
                else if (!string.IsNullOrEmpty(fromDate) && !string.IsNullOrEmpty(toDate))
                {
                    if (DateTime.TryParse(fromDate, out var f) && DateTime.TryParse(toDate, out var t))
                    {
                        startFilter = f.Date;
                        endFilter = t.Date.AddDays(1).AddTicks(-1);
                        filterSummary = $"Filtered from {startFilter:dd MMM yyyy} to {t:dd MMM yyyy}";
                    }
                }

                var invoices = Data.Invoices
                    .Where(i => i.Status == "Completed" && i.Date >= startFilter && i.Date <= endFilter)
                    .ToList();

                var expenses = Data.Expenses
                    .Where(e => e.Date >= startFilter && e.Date <= endFilter)
                    .ToList();

                var purchases = Data.PurchaseOrders
                    .Where(p => p.Status != "Cancelled" && p.Date >= startFilter && p.Date <= endFilter)
                    .ToList();

                // Payment Mode Filter (All, Cash, UPI, Card, Debit, Credit)
                if (!string.IsNullOrEmpty(paymentMode) && !paymentMode.Equals("All", StringComparison.OrdinalIgnoreCase))
                {
                    invoices = invoices.Where(i => i.PaymentMode.Equals(paymentMode, StringComparison.OrdinalIgnoreCase)).ToList();
                    filterSummary += $" | Payment Mode: {paymentMode}";
                }

                var paymentBreakdown = new PaymentModeBreakdown
                {
                    CashTotal = invoices.Where(i => i.PaymentMode == "Cash").Sum(i => i.TotalAmount),
                    UpiTotal = invoices.Where(i => i.PaymentMode == "UPI").Sum(i => i.TotalAmount),
                    CardTotal = invoices.Where(i => i.PaymentMode == "Card").Sum(i => i.TotalAmount),
                    DebitTotal = invoices.Where(i => i.PaymentMode == "Debit").Sum(i => i.TotalAmount),
                    CreditTotal = invoices.Where(i => i.PaymentMode == "Credit").Sum(i => i.TotalAmount)
                };

                decimal gst5 = 0, gst12 = 0;
                decimal totalCostOfGoods = 0;

                foreach (var inv in invoices)
                {
                    foreach (var item in inv.Items)
                    {
                        if (item.TaxRate == 12) gst12 += (item.Price * item.Quantity * 0.12m);
                        else gst5 += (item.Price * item.Quantity * 0.05m);

                        var prod = Data.Products.FirstOrDefault(p => p.Id == item.ProductId);
                        var cost = prod != null ? prod.CostPrice : item.Price * 0.6m;
                        totalCostOfGoods += cost * item.Quantity;
                    }
                }

                var totalSales = invoices.Sum(i => i.TotalAmount);
                var totalExpenses = expenses.Sum(e => e.Amount);
                var totalPurchases = purchases.Sum(p => p.TotalAmount);
                var netProfit = Math.Max(0, totalSales - totalCostOfGoods - totalExpenses);

                // Grouped Period Breakdown
                var periodItems = new List<ReportGroupItem>();

                if (groupBy == "month")
                {
                    var groupedInvoices = invoices.GroupBy(i => new { i.Date.Year, i.Date.Month });
                    foreach (var grp in groupedInvoices.OrderByDescending(g => g.Key.Year).ThenByDescending(g => g.Key.Month))
                    {
                        var dt = new DateTime(grp.Key.Year, grp.Key.Month, 1);
                        var label = dt.ToString("MMM yyyy");
                        var sAmt = grp.Sum(i => i.TotalAmount);
                        var expAmt = expenses.Where(e => e.Date.Year == grp.Key.Year && e.Date.Month == grp.Key.Month).Sum(e => e.Amount);
                        var purAmt = purchases.Where(p => p.Date.Year == grp.Key.Year && p.Date.Month == grp.Key.Month).Sum(p => p.TotalAmount);

                        periodItems.Add(new ReportGroupItem
                        {
                            PeriodLabel = label,
                            SalesAmount = sAmt,
                            BillsCount = grp.Count(),
                            ExpensesAmount = expAmt,
                            PurchasesAmount = purAmt,
                            ProfitAmount = Math.Max(0, sAmt * 0.35m - expAmt)
                        });
                    }
                }
                else if (groupBy == "year")
                {
                    var groupedInvoices = invoices.GroupBy(i => i.Date.Year);
                    foreach (var grp in groupedInvoices.OrderByDescending(g => g.Key))
                    {
                        var label = grp.Key.ToString();
                        var sAmt = grp.Sum(i => i.TotalAmount);
                        var expAmt = expenses.Where(e => e.Date.Year == grp.Key).Sum(e => e.Amount);
                        var purAmt = purchases.Where(p => p.Date.Year == grp.Key).Sum(p => p.TotalAmount);

                        periodItems.Add(new ReportGroupItem
                        {
                            PeriodLabel = label,
                            SalesAmount = sAmt,
                            BillsCount = grp.Count(),
                            ExpensesAmount = expAmt,
                            PurchasesAmount = purAmt,
                            ProfitAmount = Math.Max(0, sAmt * 0.35m - expAmt)
                        });
                    }
                }
                else // Day wise
                {
                    var groupedInvoices = invoices.GroupBy(i => i.Date.Date);
                    foreach (var grp in groupedInvoices.OrderByDescending(g => g.Key))
                    {
                        var label = grp.Key.ToString("dd MMM yyyy (ddd)");
                        var sAmt = grp.Sum(i => i.TotalAmount);
                        var expAmt = expenses.Where(e => e.Date.Date == grp.Key).Sum(e => e.Amount);
                        var purAmt = purchases.Where(p => p.Date.Date == grp.Key).Sum(p => p.TotalAmount);

                        periodItems.Add(new ReportGroupItem
                        {
                            PeriodLabel = label,
                            SalesAmount = sAmt,
                            BillsCount = grp.Count(),
                            ExpensesAmount = expAmt,
                            PurchasesAmount = purAmt,
                            ProfitAmount = Math.Max(0, sAmt * 0.35m - expAmt)
                        });
                    }
                }

                return new ComprehensiveReport
                {
                    GroupBy = groupBy,
                    SelectedPeriod = period,
                    SelectedPaymentMode = paymentMode,
                    FilterSummaryText = filterSummary,
                    PaymentBreakdown = paymentBreakdown,
                    TotalSales = totalSales,
                    TotalBillsCount = invoices.Count,
                    TotalExpenses = totalExpenses,
                    TotalPurchases = totalPurchases,
                    TotalNetProfit = netProfit,
                    Gst5Amount = gst5,
                    Gst12Amount = gst12,
                    CustomerReceivables = Data.Customers.Sum(c => c.OutstandingBalance),
                    SupplierPayables = Data.Suppliers.Sum(s => s.OutstandingPayable),
                    PeriodBreakdown = periodItems,
                    FilteredInvoices = invoices,
                    FilteredExpenses = expenses,
                    FilteredPurchaseOrders = purchases
                };
            }
        }

        // CANCEL SUPPLIER PURCHASE ORDER WITH AUDIT LOGGING
        public bool CancelPurchaseOrder(string orderId, string reason = "Order Cancelled by User")
        {
            lock (_lock)
            {
                var po = Data.PurchaseOrders.FirstOrDefault(p => p.Id == orderId || p.OrderNo == orderId);
                if (po == null) return false;

                EnsureRecordBookDirectories();

                po.Status = "Cancelled";

                var timestampStr = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                var filename = $"cancel_po_{po.OrderNo}_{timestampStr}.json";
                var fullPath = Path.Combine(_deleteSubDir, filename);

                var logPayload = new
                {
                    LogId = Guid.NewGuid().ToString(),
                    Timestamp = DateTime.Now,
                    Action = "CANCEL_SUPPLIER_PURCHASE_ORDER",
                    Reason = reason,
                    PurchaseOrder = po
                };

                try
                {
                    var logJson = JsonSerializer.Serialize(logPayload, new JsonSerializerOptions { WriteIndented = true });
                    File.WriteAllText(fullPath, logJson);
                }
                catch { }

                Data.AuditLogs.Add(new AuditLog
                {
                    Id = Guid.NewGuid().ToString(),
                    Timestamp = DateTime.Now,
                    ActionType = "CANCEL_SUPPLIER_ORDER",
                    InvoiceNo = po.OrderNo,
                    CustomerName = po.SupplierName,
                    Amount = po.TotalAmount,
                    Details = $"Supplier Purchase Order #{po.OrderNo} was CANCELLED. Reason: {reason}",
                    LogFilePath = fullPath
                });

                SaveData();
                return true;
            }
        }

        // DELETE SUPPLIER
        public bool DeleteSupplier(string supplierId, string reason = "Admin Deleted Supplier")
        {
            lock (_lock)
            {
                var sup = Data.Suppliers.FirstOrDefault(s => s.Id == supplierId || s.Company == supplierId);
                if (sup == null) return false;

                EnsureRecordBookDirectories();

                var timestampStr = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                var filename = $"delete_supplier_{sup.Company.Replace(" ", "_")}_{timestampStr}.json";
                var fullPath = Path.Combine(_deleteSubDir, filename);

                var logPayload = new
                {
                    LogId = Guid.NewGuid().ToString(),
                    Timestamp = DateTime.Now,
                    Action = "DELETE_SUPPLIER",
                    Reason = reason,
                    Supplier = sup
                };

                try
                {
                    var logJson = JsonSerializer.Serialize(logPayload, new JsonSerializerOptions { WriteIndented = true });
                    File.WriteAllText(fullPath, logJson);
                }
                catch { }

                Data.AuditLogs.Add(new AuditLog
                {
                    Id = Guid.NewGuid().ToString(),
                    Timestamp = DateTime.Now,
                    ActionType = "DELETE_SUPPLIER",
                    InvoiceNo = "N/A",
                    CustomerName = sup.Company,
                    Amount = sup.OutstandingPayable,
                    Details = $"Deleted supplier {sup.Company} ({sup.Name}). Reason: {reason}",
                    LogFilePath = fullPath
                });

                Data.Suppliers.Remove(sup);
                SaveData();

                return true;
            }
        }

        // DELETE INVOICE
        public bool DeleteInvoice(string invoiceId, string reason = "User Request")
        {
            lock (_lock)
            {
                var inv = Data.Invoices.FirstOrDefault(i => i.Id == invoiceId || i.InvoiceNo == invoiceId);
                if (inv == null) return false;

                EnsureRecordBookDirectories();

                foreach (var item in inv.Items)
                {
                    var prod = Data.Products.FirstOrDefault(p => p.Id == item.ProductId);
                    if (prod != null)
                    {
                        prod.Stock += item.Quantity;
                    }
                }

                if (inv.PaymentMode == "Credit" && !string.IsNullOrEmpty(inv.CustomerPhone))
                {
                    var cust = Data.Customers.FirstOrDefault(c => c.Phone == inv.CustomerPhone);
                    if (cust != null)
                    {
                        cust.OutstandingBalance = Math.Max(0, cust.OutstandingBalance - inv.TotalAmount);
                        cust.TotalPurchases = Math.Max(0, cust.TotalPurchases - inv.TotalAmount);
                    }
                }

                var timestampStr = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                var filename = $"delete_bill_{inv.InvoiceNo}_{timestampStr}.json";
                var fullPath = Path.Combine(_deleteSubDir, filename);

                var logPayload = new
                {
                    LogId = Guid.NewGuid().ToString(),
                    Timestamp = DateTime.Now,
                    Action = "DELETE_RECEIPT_AND_BILL",
                    Reason = reason,
                    Invoice = inv,
                    RestoredItemsCount = inv.Items.Count
                };

                try
                {
                    var logJson = JsonSerializer.Serialize(logPayload, new JsonSerializerOptions { WriteIndented = true });
                    File.WriteAllText(fullPath, logJson);
                }
                catch { }

                Data.AuditLogs.Add(new AuditLog
                {
                    Id = Guid.NewGuid().ToString(),
                    Timestamp = DateTime.Now,
                    ActionType = "DELETE_RECEIPT",
                    InvoiceNo = inv.InvoiceNo,
                    CustomerName = inv.CustomerName,
                    Amount = inv.TotalAmount,
                    Details = $"Deleted receipt & restored stock for {inv.Items.Count} items. Reason: {reason}",
                    LogFilePath = fullPath
                });

                Data.Invoices.Remove(inv);
                SaveData();

                return true;
            }
        }

        // DELETE CUSTOMER
        public bool DeleteCustomer(string customerId, string reason = "Admin Deleted Customer")
        {
            lock (_lock)
            {
                var cust = Data.Customers.FirstOrDefault(c => c.Id == customerId || c.Phone == customerId);
                if (cust == null) return false;

                EnsureRecordBookDirectories();

                var timestampStr = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                var filename = $"delete_customer_{cust.Name.Replace(" ", "_")}_{timestampStr}.json";
                var fullPath = Path.Combine(_deleteSubDir, filename);

                var logPayload = new
                {
                    LogId = Guid.NewGuid().ToString(),
                    Timestamp = DateTime.Now,
                    Action = "DELETE_CUSTOMER",
                    Reason = reason,
                    Customer = cust
                };

                try
                {
                    var logJson = JsonSerializer.Serialize(logPayload, new JsonSerializerOptions { WriteIndented = true });
                    File.WriteAllText(fullPath, logJson);
                }
                catch { }

                Data.AuditLogs.Add(new AuditLog
                {
                    Id = Guid.NewGuid().ToString(),
                    Timestamp = DateTime.Now,
                    ActionType = "DELETE_CUSTOMER",
                    InvoiceNo = "N/A",
                    CustomerName = cust.Name,
                    Amount = cust.OutstandingBalance,
                    Details = $"Admin deleted customer {cust.Name} ({cust.Phone}). Reason: {reason}",
                    LogFilePath = fullPath
                });

                Data.Customers.Remove(cust);
                SaveData();

                return true;
            }
        }

        public DashboardSummary GetDashboardSummary(string period = "today", string fromDate = "", string toDate = "")
        {
            lock (_lock)
            {
                var today = DateTime.Today;
                DateTime startFilter = today;
                DateTime endFilter = today.AddDays(1).AddTicks(-1);

                if (period == "yesterday")
                {
                    startFilter = today.AddDays(-1);
                    endFilter = today.AddTicks(-1);
                }
                else if (period == "week")
                {
                    startFilter = today.AddDays(-(int)today.DayOfWeek);
                }
                else if (period == "month")
                {
                    startFilter = new DateTime(today.Year, today.Month, 1);
                }
                else if (!string.IsNullOrEmpty(fromDate) && !string.IsNullOrEmpty(toDate))
                {
                    if (DateTime.TryParse(fromDate, out var f) && DateTime.TryParse(toDate, out var t))
                    {
                        startFilter = f.Date;
                        endFilter = t.Date.AddDays(1).AddTicks(-1);
                    }
                }

                var filteredInvoices = Data.Invoices
                    .Where(i => i.Date >= startFilter && i.Date <= endFilter && i.Status == "Completed")
                    .ToList();

                var todayInvoices = Data.Invoices.Where(i => i.Date.Date == today && i.Status == "Completed").ToList();
                var monthlyInvoices = Data.Invoices.Where(i => i.Date.Month == today.Month && i.Date.Year == today.Year && i.Status == "Completed").ToList();

                var todaySales = filteredInvoices.Sum(i => i.TotalAmount);
                var monthlySales = monthlyInvoices.Sum(i => i.TotalAmount);
                var activeProducts = Data.Products.Count;
                var lowStockAlerts = Data.Products.Where(p => p.Stock <= p.MinLevel).ToList();
                var registeredCustomers = Data.Customers.Count;

                var todayExpenses = Data.Expenses.Where(e => e.Date >= startFilter && e.Date <= endFilter).Sum(e => e.Amount);
                var customerOutstanding = Data.Customers.Sum(c => c.OutstandingBalance);
                var supplierOutstanding = Data.Suppliers.Sum(s => s.OutstandingPayable);

                var salesTrend = new List<SalesTrendPoint>();
                for (int i = 6; i >= 0; i--)
                {
                    var day = today.AddDays(-i);
                    var dayName = i == 0 ? "Today" : day.ToString("ddd");
                    var dateStr = day.ToString("dd MMM");
                    var dayTotal = Data.Invoices.Where(inv => inv.Date.Date == day && inv.Status == "Completed").Sum(inv => inv.TotalAmount);
                    salesTrend.Add(new SalesTrendPoint
                    {
                        DayName = dayName,
                        DateStr = dateStr,
                        Amount = dayTotal
                    });
                }

                decimal todayCost = 0;
                foreach (var inv in filteredInvoices)
                {
                    foreach (var item in inv.Items)
                    {
                        var prod = Data.Products.FirstOrDefault(p => p.Id == item.ProductId);
                        var cost = prod != null ? prod.CostPrice : item.Price * 0.6m;
                        todayCost += cost * item.Quantity;
                    }
                }
                var todayNetProfit = Math.Max(0, todaySales - todayCost - todayExpenses);

                return new DashboardSummary
                {
                    TodaySales = todaySales,
                    TodayBillsCount = filteredInvoices.Count,
                    MonthlySales = monthlySales,
                    MonthlyBillsCount = monthlyInvoices.Count,
                    ActiveProducts = activeProducts,
                    LowStockCount = lowStockAlerts.Count,
                    RegisteredCustomers = registeredCustomers,
                    TodayNetProfit = todayNetProfit,
                    TodayExpenses = todayExpenses,
                    CustomerOutstanding = customerOutstanding,
                    SupplierOutstanding = supplierOutstanding,
                    RecentInvoices = Data.Invoices.OrderByDescending(i => i.Date).Take(10).ToList(),
                    LowStockAlerts = lowStockAlerts,
                    SalesTrend = salesTrend
                };
            }
        }
    }
}
