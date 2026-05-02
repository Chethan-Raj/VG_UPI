# UPI QR Pay App

Simple offline UPI QR code generator for Android.

## Setup your UPI ID

Open `upiConfig.js` and replace:
```js
upiId: "ant@upibank",   // Your UPI ID
name: "Ant",            // Your name
```
**Only edit this file.** Nothing else needs to change.

---

## Install & Run locally

```bash
npm install
npx expo start
```
Scan QR with Expo Go app to preview instantly.

---

## Build APK (offline install)

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo account (free)
```bash
eas login
```

### 3. Build APK
```bash
eas build -p android --profile preview
```
EAS builds on cloud → downloads `.apk` → install on phone via USB or share link.

---

## How it works

- **Home screen**: numpad → enter amount → tap "Generate QR"
- **QR screen**: generates standard `upi://pay?pa=...&am=...` QR code
- Any UPI app (GPay, PhonePe, Paytm, BHIM) can scan it
- 100% offline after install — no internet needed

## File structure

```
upi-qr-app/
├── upiConfig.js        ← ✏️  EDIT THIS: your UPI ID + name
├── App.js              ← navigation root
├── app/
│   ├── HomeScreen.js   ← keypad + amount entry
│   └── QRScreen.js     ← QR display
├── app.json            ← expo config
├── eas.json            ← build profiles
└── package.json        ← dependencies
```
