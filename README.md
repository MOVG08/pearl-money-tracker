# 💸 Money Tracker

A modern financial tracking application designed for individuals, freelancers, and small businesses to manage income, expenses, and financial insights in a simple and scalable way.

---

## 🚀 Overview

Pearl is a mobile-first finance tracker that allows users to:

- Track **income and expenses**
- Organize transactions by **accounts** (cash, bank, etc.)
- Associate transactions with **profiles** (clients, vendors, people)
- Visualize financial data through **dashboards and charts**
- Prepare for future features like:
  - 📷 OCR (handwritten & receipts)
  - 💬 WhatsApp chatbot integration
  - 🧠 AI-powered insights

---

## 🧱 Tech Stack

- **Frontend**: Lovable (AI-generated UI)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Database**: PostgreSQL
- **Auth**: Supabase Auth
- **Future integrations**:
  - Google Vision API (OCR)
  - LLM API (data extraction + insights)
  - WhatsApp API (Twilio or Meta Cloud API)

---

## 🗄️ Database Schema

### Accounts
Represents where money is stored.

| Field       | Type  |
|------------|------|
| id         | uuid |
| user_id    | uuid |
| name       | text |
| type       | text |

---

### Profiles
Represents entities you interact with (clients, vendors, people).

| Field       | Type  |
|------------|------|
| id         | uuid |
| user_id    | uuid |
| name       | text |
| type       | text |

---

### Transactions
Represents movements of money.

| Field         | Type  |
|--------------|------|
| id           | uuid |
| user_id      | uuid |
| account_id   | uuid |
| to_account_id| uuid (for transfers) |
| profile_id   | uuid |
| amount       | numeric |
| type         | text (`income`, `expense`, `transfer`) |
| category     | text |
| note         | text |
| date         | date |

---

## 🔁 Transaction Logic

- **Income** → money coming in  
- **Expense** → money going out  
- **Transfer** → movement between accounts (not counted in profit/loss)

---

## 📊 Key Metrics

- **Balance** = Income − Expenses  
- **Cash Flow Over Time**
- **Income/Expense Breakdown by Profile**

---

## 🔐 Security

- Row Level Security (RLS) enabled
- Each user can only access their own data
- Supabase Auth handles authentication

---

## ⚙️ Setup

### 1. Clone repo

```bash
git clone https://github.com/MOVG08/pearl-money-tracker.git
cd pearl-money-tracker
