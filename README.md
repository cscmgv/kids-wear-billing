# ⚡ StorePilot - Kids Wear Billing & POS Management System

A modern **Kids Wear Billing & POS (Point of Sale) Management Software** built with **.NET 10 (ASP.NET Core Minimal APIs)** and an interactive **HTML5/CSS3/JS Web UI**.

---

## ✨ Core Features

- **⚡ POS Cashier Terminal**:
  - Kids Wear product filtering by Age Group (0-2Y, 2-5Y, 5-10Y, 10-16Y) & Categories (Frocks, Onesies, T-Shirts, Jeans, Shoes).
  - Barcode SKU search & cart tax/discount calculation.

- **📊 Instant Auto-Filtering Reports**:
  - Live filter pills: `Today`, `Yesterday`, `This Week`, `This Month`, `All Time`.
  - Clickable Payment Mode Cards (`Cash`, `UPI`, `Card`, `Debit`, `Credit`) with instant live table filtering.
  - Granularity grouping (`Day-wise`, `Month-wise`, `Year-wise`).

- **📁 Real Excel & PDF Export**:
  - **Export to Excel (`.xlsx`)**: Generates structured Excel spreadsheets via SheetJS.
  - **Export to PDF**: Formats clean, official store letterhead PDF reports without browser screenshot artifacts.

- **💬 WhatsApp Business API Integration**:
  - Click-to-chat billing URL generation (`wa.me`) for instant receipt sending and low stock reorders.

- **🔒 Role-Based Access Control (RBAC)**:
  - **Admin**: Full access, product CRUD, customer deletion, supplier order cancellation, audit log access.
  - **Cashier**: Billing checkout and product catalog entry. Restricts delete actions.
  - **Manual PIN Entry**: Password field requires manual entry for security.

- **📁 Record Book Audit System**:
  - Automated JSON audit logging in `/record_book/delete/` for deleted bills, deleted customer records, deleted suppliers, and cancelled purchase orders.

---

## 🛠️ Technology Stack

- **Backend**: .NET 10 Minimal APIs (C#)
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, Custom CSS3 Design System
- **Persistence**: JSON File Datastore (`data/store_data.json`) with Thread Locking
- **Audio Feedback**: Synthesized Web Audio API sound effects

---

## 🚀 Quick Start Guide

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download) installed on your system.

### Running locally
1. Open PowerShell or Command Prompt in the project folder:
   ```bash
   cd c:\Users\ELCOT\kids
   ```
2. Run the ASP.NET Core server:
   ```bash
   dotnet run
   ```
3. Open your browser at:
   ```text
   http://localhost:5164
   ```

---

## 🔑 Default Credentials

| Role | PIN Password | Permissions |
| --- | --- | --- |
| **Admin** | `1234` | Full System Control, Delete Bills/Customers, View Reports & Audit Logs |
| **Cashier** | `0000` | POS Billing Terminal & Product Entry |

---

## 📁 Repository Upload Instructions (GitHub)

If Git for Windows is installed:
```bash
git init
git add .
git commit -m "Initial commit - StorePilot Kids Wear Billing System"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```
