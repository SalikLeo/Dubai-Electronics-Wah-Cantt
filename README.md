# Dubai Electronics Stock Manager

A high-performance, secure, and modern desktop application tailored for managing inventory, sales, expenses, and employees at **Dubai Electronics (Wah Cantt Branch)**.

Built on **Electron** and **React**, this application runs locally on Windows and features a fast offline-first architecture with esbuild.

---

## 🚀 Key Features

*   **🔒 Secure Access**: Password-locked login to protect business records.
*   **📊 Business Dashboard**: Real-time sales summaries, total profit margins, recent transactions, and quick-action shortcuts.
*   **📦 Inventory & Stock Control**: Track items by category, log "Stock In" transactions, view stock level indicators, and set custom cost price attributes.
*   **🛒 POS & Sales Records**: Record sales with split-payment options (Cash/Online), check stock availability, and print layout-optimized customer invoices/receipts.
*   **💸 Expense Tracking**: Log and categorize daily shop/business expenses.
*   **👥 Staff Management**: Record employee contact details, salaries, attendance, and commission rates.
*   **🔔 Intelligent Reminders**: Critical inventory stock alerts and customized business task reminders.
*   **⚙️ Administration Settings**: Customize application logo, branch details, contact numbers, and security credentials.

---

## 🛠️ Tech Stack

*   **Runtime**: Electron
*   **Frontend**: React (18+), Tailwind CSS, Lucide Icons, React Router
*   **Build Tool**: esbuild (configured for fast builds and live reload)
*   **Packaging**: Electron Builder (packaged for Windows distributables)

---

## 💻 Developer Guide

### Prerequisites
*   [Node.js](https://nodejs.org) (v18 or higher recommended)

### Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development build:
   ```bash
   npm run dev
   ```
4. Start the desktop application:
   ```bash
   npm run electron:start
   ```
5. Build the Windows installer (`.exe`):
   ```bash
   npm run build:win
   ```
