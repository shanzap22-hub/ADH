# 📊 Razorpay Payment Data - Complete Guide

## 🎯 Where to Find Razorpay Payment Data

### **Location: Admin Transactions Page**
**URL:** https://adh.today/admin/transactions

---

## 📋 **Payment Flow:**

### **1. User Clicks "Join The Hub Now" on Homepage**
↓
### **2. Razorpay Payment Gateway Opens**
↓
### **3. User Completes Payment**
↓
### **4. Data Saved to `transactions` Table**

---

## 🗄️ **Database Table: `transactions`**

### **Razorpay Payment Fields:**

```sql
transactions {
  id                    -- Unique transaction ID
  razorpay_order_id     -- Razorpay order ID
  razorpay_payment_id   -- Razorpay payment ID
  student_email         -- User's email
  student_name          -- User's name
  phone_number          -- Phone number
  whatsapp_number       -- WhatsApp number
  amount                -- Amount in paise (₹999 = 99900)
  membership_plan       -- silver/gold/platinum etc
  status                -- verified/pending/refunded
  source                -- 'razorpay' (for online payments)
  created_at            -- Payment date/time
  notes                 -- Additional notes
}
```

---

## 🎯 **How to View Razorpay Payments:**

### **Option 1: Admin Dashboard (Recommended)**

1. Go to: **https://adh.today/admin/transactions**
2. Click tab: **"Paid Transactions"**
3. Filter by:
   - Date range
   - Membership tier
   - Search by name/email/phone

### **Option 2: Filter by Source**

All Razorpay payments have:
- `source = 'razorpay'`
- `razorpay_payment_id` is not null
- `status = 'verified'` (successful payments)

### **Option 3: Drop-offs (Incomplete Payments)**

1. Go to: **https://adh.today/admin/transactions**
2. Click tab: **"Drop-offs (Incomplete)"**
3. Shows users who:
   - Started payment
   - Didn't complete
   - `status = 'pending'`

---

## 📊 **Transaction Statuses:**

| Status | Meaning |
|--------|---------|
| `verified` | ✅ Payment successful |
| `pending` | ⏳ Payment started but not completed (drop-off) |
| `refunded` | 💸 Payment refunded |

---

## 🔍 **Search & Filter:**

### **Search by:**
- Student name
- Email
- Phone number
- WhatsApp number

### **Filter by:**
- Date range (last 7/30/90 days)
- Membership tier (Bronze/Silver/Gold/Platinum)
- Status (Verified/Pending/Refunded)

---

## 📈 **What You Can See:**

### **For Each Payment:**
1. ✅ Student name & email
2. ✅ Phone & WhatsApp numbers
3. ✅ Amount paid
4. ✅ Membership plan purchased
5. ✅ Payment date (days ago)
6. ✅ Razorpay payment ID
7. ✅ Course progress (if enrolled)
8. ✅ Source (razorpay/manual)

---

## 🎯 **Actions You Can Take:**

### **1. Edit Transaction**
- Update amount
- Change membership plan
- Add notes
- Update phone/WhatsApp

### **2. Refund Payment** (Razorpay only)
- Click refund button
- Type "refund" to confirm
- Money returns to customer

### **3. Export to Google Sheet**
- Click "Sync New Data to Sheet"
- All transactions exported

---

## 🔄 **Auto-Sync Features:**

### **When User Updates Profile:**
- Email → Auto-syncs to transactions
- Name → Auto-syncs to transactions
- Phone → Auto-syncs to transactions
- WhatsApp → Auto-syncs to transactions
- **Membership Tier → Auto-syncs to transactions** ✨ (NEW!)

---

## 📱 **Real-Time Updates:**

Razorpay payments appear **immediately** after successful payment:
1. User pays on Razorpay
2. Webhook triggers
3. Transaction created with `status = 'verified'`
4. User's profile updated with membership tier
5. Visible in admin dashboard instantly

---

## 🎯 **Summary:**

**Question:** "Home page-ൽ Join The Hub Now click ചെയ്ത് Razorpay-ൽ പോയി payment ചെയ്യാതവരുടെ data എനിക്ക് എവിടെ ലഭിക്കും?"

**Answer:** 
1. ✅ **Successful payments:** `/admin/transactions` → "Paid Transactions" tab
2. ✅ **Drop-offs (incomplete):** `/admin/transactions` → "Drop-offs" tab
3. ✅ **All data:** `/admin/transactions` → "All Records" tab

**All Razorpay payment data is in the `transactions` table!** 🎉
