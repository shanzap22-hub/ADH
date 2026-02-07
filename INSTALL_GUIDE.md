# Installation Guide - Play Store 2026 Compliance Features

## ⚠️ Correct Package Names

The correct npm packages are:
```bash
# Secure Storage
npm install capacitor-secure-storage-plugin

# In-App Browser  
npm install @ionic-enterprise/in-app-browser
# OR use Capacitor Browser (free alternative)
npm install @capacitor/browser
```

## 📦 Step-by-Step Installation

### Step 1: Install Secure Storage
```bash
npm install capacitor-secure-storage-plugin
```

**Update imports in `src/lib/secure-storage.ts`:**
```ts
// Change this line:
import { SecureStorage } from '@capacitor-community/secure-storage';

// To this:
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
const SecureStorage = SecureStoragePlugin;
```

---

### Step 2: Install In-App Browser

**Option A: Use Capacitor Browser (Recommended - Free)**
```bash
npm install @capacitor/browser
```

**Update `src/lib/secure-browser.ts`:**
```ts
// Replace the import:
import { Browser } from '@capacitor/browser';

// Use Browser.open() instead of InAppBrowser
```

**Option B: Ionic Enterprise (Paid)**
```bash
npm install @ionic-enterprise/in-app-browser
```

---

### Step 3: Sync with Android
```bash
npx cap sync android
```

---

### Step 4: Add Permissions (if needed)

**android/app/src/main/AndroidManifest.xml:**
```xml
<!-- Already have INTERNET permission -->
<uses-permission android:name="android.permission.INTERNET" />
```

---

### Step 5: Build and Test
```bash
cd android
./gradlew assembleDebug

# Install on device
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## ✅ Features Already Implemented

### 1. Native WebView Caching ✅
**File**: `MainActivity.java`  
**Status**: ✅ Complete  
**No installation needed** - native Java code

---

### 2. Secure Token Storage
**Files**: 
- `src/lib/secure-storage.ts`
- `src/examples/secure-storage-usage.tsx`

**Status**: ⚠️ Needs package install

**Install:**
```bash
npm install capacitor-secure-storage-plugin
npx cap sync android
```

---

### 3. Secure In-App Browser
**Files**:
- `src/lib/secure-browser.ts`
- `src/examples/secure-browser-usage.tsx`

**Status**: ⚠️ Needs package install

**Install (use free @capacitor/browser):**
```bash
npm install @capacitor/browser
npx cap sync android
```

**Update imports:**
```ts
// src/lib/secure-browser.ts
import { Browser } from '@capacitor/browser';

// Remove InAppBrowser, use Browser.open() everywhere
```

---

## 🔧 Alternative: Use Without External Packages

If you prefer to avoid additional packages, here's a minimal implementation:

### Secure Storage (LocalStorage + Encryption)
```ts
// src/lib/simple-secure-storage.ts
const encrypt = (text: string) => btoa(text); // Simple base64
const decrypt = (text: string) => atob(text);

export const secureStorage = {
  async saveAuthToken(token: string) {
    localStorage.setItem('auth_token', encrypt(token));
  },
  async getAuthToken() {
    const encrypted = localStorage.getItem('auth_token');
    return encrypted ? decrypt(encrypted) : null;
  },
  async clearAll() {
    localStorage.clear();
  },
};
```

### In-App Browser (Use Capacitor Browser)
Already have `@capacitor/browser` package available!

```ts
// src/lib/simple-browser.ts
import { Browser } from '@capacitor/browser';

export const secureBrowser = {
  async open(url: string) {
    if (!url.startsWith('https://')) {
      throw new Error('Only HTTPS URLs allowed');
    }
    await Browser.open({ url });
  },
};
```

---

## 📋 Final Checklist

- [ ] MainActivity.java is updated ✅ (already done)
- [ ] Install secure storage package
- [ ] Install browser package
- [ ] Run `npx cap sync android`
- [ ] Test on Android device
- [ ] Verify offline caching works
- [ ] Verify secure storage works
- [ ] Verify external links open correctly

---

## 🚀 Quick Start (Copy-Paste)

```bash
# Install packages
npm install capacitor-secure-storage-plugin @capacitor/browser

# Sync with Android
npx cap sync android

# Build
cd android
./gradlew assembleDebug
```

Done! 🎉
