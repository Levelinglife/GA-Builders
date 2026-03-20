# LocalMap — AI Studio Build Prompt
# Paste this entire prompt into AI Studio (Gemini) to connect, extend, and deploy this app.

---

## WHAT THIS APP IS

A personal property intelligence tool for a hyperlocal real estate business in Delhi, India.
It is built for ONE user only — the owner. There is no public-facing product.

The core purpose:
- Store information about properties in your locality
- Quickly retrieve property info when a client walks in
- Match a buyer's requirements against your property database
- Track property status (for sale, rented, occupied, under construction, closed)
- Show exterior and interior photos of each property

---

## TECH STACK

- Frontend: React 18 + Vite
- Styling: Tailwind CSS
- Routing: React Router v6
- Database: Firebase Firestore
- File Storage: Firebase Storage (for property photos)
- Auth: Firebase Auth
- Hosting: Vercel
- Version Control: GitHub

---

## DESIGN SYSTEM (DO NOT CHANGE)

Colors:
- Primary (navy): #001736
- Primary light: #002b5b
- Accent (yellow): #fed65b — used ONLY for the FAB button when active
- Background: #f8f9fb
- Surface (cards): #ffffff
- Surface raised (inputs): #f2f4f6
- Text primary: #191c1e
- Text secondary: #43474f
- Text muted: #747780

Status colors:
- For Sale: green text #217128 on green bg #a0f399
- Rented: blue text #1a5fb4 on blue bg #d0e4ff
- Occupied: grey text #43474f on grey bg #e0e3e5
- Under Construction: amber text #7a4f00 on amber bg #ffe8b0

Typography:
- Display / Headlines: Manrope (bold, 700-800 weight)
- Body / Labels: Inter (400-600 weight)
- House numbers always use Manrope bold, 2 sizes larger than surrounding text

Card design:
- Full width photo card
- Photo takes top 55-60% of card height (~208px)
- Status badge overlaid top-right corner of photo
- House number bold below photo (Manrope, ~24px)
- Owner name and block in smaller text below
- Price on the right if available
- No dividers — use whitespace only
- Cards have subtle shadow, 16px border radius

Bottom navigation:
- Two tabs only: Home (house icon) and Match (search icon)
- FAB (+) button in the center — navy background, white icon
- No other navigation items

Language and copy:
- All prices in Indian Rupees (₹)
- Prices formatted as: under 1L → show full number, 1L-99L → show as X.XL, 1Cr+ → show as X.XCr
- Plot sizes in square yards (sq yd), NOT square feet
- No luxury branding language
- No "Agent Profile", no "Estate Elite", no "Architectural Ledger"
- Keep all labels simple and direct

---

## FIREBASE SETUP INSTRUCTIONS

1. Go to https://console.firebase.google.com
2. Create a new project called "localmap"
3. Enable Firestore Database (start in test mode)
4. Enable Storage (start in test mode)
5. Enable Authentication → Email/Password provider
6. Go to Project Settings → Your Apps → Add Web App
7. Copy the firebaseConfig object
8. Paste it into /src/firebase.js replacing the placeholder values

Firestore Security Rules (paste these in Firestore → Rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Storage Security Rules (paste in Storage → Rules):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## FIRESTORE DATA STRUCTURE

Collection: `properties`
Each document:
```
{
  houseNo: string,          // REQUIRED — e.g. "B-47" or "108"
  ownerName: string,        // Owner's full name
  block: string,            // e.g. "Block B, Sector 7, Uttam Nagar"
  plotSize: number,         // in square yards
  floors: string,           // e.g. "G+2"
  type: string,             // "Residential" | "Commercial" | "Mixed Use" | "Plot / Land"
  status: string,           // "for_sale" | "rented" | "occupied" | "construction" | "closed"
  price: number,            // in rupees, e.g. 8500000 for 85L
  contact: string,          // phone number
  notes: string,            // free text notes
  photos: [string],         // array of Firebase Storage download URLs
  lat: number,              // GPS latitude (optional, for future map)
  lng: number,              // GPS longitude (optional, for future map)
  createdAt: timestamp,
  updatedAt: timestamp
}
```

Collection: `requirements` (for future use — save buyer requirements)
```
{
  clientName: string,
  contact: string,
  block: string,
  type: string,
  minSize: number,
  maxSize: number,
  maxBudget: number,
  notes: string,
  status: "active" | "fulfilled" | "closed",
  createdAt: timestamp
}
```

---

## SCREENS (what exists and what to complete)

### 1. Home Screen (/src/screens/Home.jsx) — DONE
Shows: search bar (dark navy header), filter pills (All / For Sale / Rented / Occupied / Construction), scrollable list of PropertyCard components.
Search filters by houseNo, ownerName, and block.
Filter pills filter by status.

### 2. Add / Edit Property (/src/screens/AddProperty.jsx) — DONE
Fields: House Number (required), Owner Name, Contact, Block/Sector, Plot Size, Floors, Property Type, Status, Price, Photos (up to 8), Notes, Lat/Lng (optional).
Edit mode pre-fills all fields from existing Firestore document.
Photos upload to Firebase Storage under /properties/{docId}/.

### 3. Property Detail (/src/screens/PropertyDetail.jsx) — DONE
Shows: full-width hero photo with swipeable gallery, photo thumbnail strip, status badge, price, house number, block, info grid (plot size, floors, type), owner name, contact (tappable phone link), notes, Google Maps link if GPS exists, delete button.

### 4. Match Screen (/src/screens/Match.jsx) — DONE
Form: Client Name, Contact, Block, Type, Min Size, Max Size, Max Budget.
Searches Firestore for status=for_sale, then filters client-side.
Results shown as PropertyCard components below.

### 5. Bottom Navigation (/src/components/BottomNav.jsx) — DONE
Two tabs: Home and Match. FAB in center for Add. Hidden on detail page.

---

## WHAT YOU NEED TO COMPLETE

### Task 1 — Firebase Auth (Login Screen)
Add a simple login screen that shows BEFORE the app loads.
- Email + Password fields
- Sign in button using Firebase Auth signInWithEmailAndPassword
- Show error if wrong credentials
- Once signed in, show the main app
- Persist session (Firebase does this by default)
- No sign up screen — you create your own account directly in Firebase Console

How to create your account:
Go to Firebase Console → Authentication → Users → Add User → enter your email and password.
That's the only account that will ever exist.

### Task 2 — Save Requirements
On the Match screen, add a "Save Requirement" button after running a search.
Save the current form values as a document in the `requirements` Firestore collection.
Below the search form, show a list of saved active requirements.
Each saved requirement shows client name, block, budget. Tap to re-run the same search.

### Task 3 — Photo Swipe on Detail
Make the photo gallery on PropertyDetail swipeable on mobile (touch swipe left/right).
Use touch events: onTouchStart, onTouchEnd, detect swipe direction, update photoIndex.
No external library needed.

### Task 4 — PWA Setup
Add a manifest.json to the public folder:
```json
{
  "name": "LocalMap",
  "short_name": "LocalMap",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#001736",
  "theme_color": "#001736",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
Add to index.html: `<link rel="manifest" href="/manifest.json" />`
Create a simple navy square icon (192x192 and 512x512) with white house icon.

### Task 5 — GitHub + Vercel Deploy
1. Initialize git: `git init`
2. Create .gitignore with: node_modules/, dist/, .env
3. Create a .env file: `VITE_FIREBASE_API_KEY=...` etc (move Firebase config to env vars)
4. Push to GitHub
5. Connect repo to Vercel
6. Add environment variables in Vercel dashboard
7. Deploy

---

## IMPORTANT RULES (DO NOT CHANGE THESE)

1. Never change the color palette
2. Never add more bottom navigation tabs — maximum is Home and Match plus the FAB
3. Never add stats/dashboard tiles to the home screen (active leads, portfolio value etc.)
4. Never use dollar signs — always Indian Rupees (₹)
5. Never add luxury real estate copy ("architectural essence", "ledger", etc.)
6. Plot sizes always in square yards
7. The app is for one user only — no multi-user features
8. Keep the full-width photo card layout on home — do not revert to thumbnail cards
9. All buttons use the primary navy color (#001736) — never yellow for primary actions

---

## RUNNING LOCALLY

```bash
cd localmap
npm install
npm run dev
```

App runs at http://localhost:5173

---

## FILE STRUCTURE

```
localmap/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── manifest.json (to be created)
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── firebase.js          ← PUT YOUR FIREBASE CONFIG HERE
    ├── components/
    │   ├── BottomNav.jsx
    │   ├── PropertyCard.jsx
    │   └── StatusBadge.jsx
    └── screens/
        ├── Home.jsx
        ├── AddProperty.jsx
        ├── PropertyDetail.jsx
        └── Match.jsx
```
