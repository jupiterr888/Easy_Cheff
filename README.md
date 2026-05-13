# APLICAȚIE MOBILĂ PENTRU GESTIONAREA REȚETELOR CULINARE

## Descriere generală

EasyChef este o aplicație mobilă dezvoltată în React Native (Expo), destinată utilizatorilor care doresc să găsească, organizeze și planifice rețete culinare în funcție de ingredientele disponibile. Aplicația permite scanarea codurilor de bare pentru adăugarea rapidă a produselor, salvarea rețetelor preferate, setarea preferințelor alimentare, precum și planificarea meselor săptămânale.

Integrează:
- Firebase (Autentificare, Firestore)
- TheMealDB API (rețete externe)
- Cloudinary (încărcare și gestionare imagini)

## Livrabile

- Codul sursă al aplicației mobile (Expo + React Native + TypeScript)
- Documentația tehnică
- Fișierul `README.md` (acesta)

## Repository Git

Adresa repository-ului:  
`https://github.com/alexandrajupiter/Proiect_easychef.git`

## Structura proiectului

```
Proiect_easychef/
├── app/                          # Paginile aplicației (Expo Router)
│   ├── (tabs)/                   # Tab-urile principale
│   │   ├── index.tsx             # Pagina principală
│   │   ├── pantry.tsx            # Cămară personală
│   │   ├── recipes.tsx           # Rețete
│   │   └── profile.tsx           # Profil utilizator
│   ├── auth/                     # Autentificare
│   │   ├── login.tsx             # Pagina de login
│   │   └── register.tsx          # Pagina de înregistrare
│   ├── meal-planner/             # Planificare mese
│   │   ├── MealPlanner.tsx       # Planificator principal
│   │   ├── CalendarModal.tsx     # Modal calendar
│   │   └── MealPlanModal.tsx     # Modal planificare
│   ├── pantry-folder/            # Gestionare cămară
│   │   ├── myIngredients.tsx     # Ingredientele mele
│   │   ├── ingredientsList.tsx   # Lista de ingrediente
│   │   ├── shoppingList.tsx      # Lista de cumpărături
│   │   ├── BarcodeScanner.tsx    # Scanner coduri de bare
│   │   └── BarcodeResults.tsx    # Rezultate scanare
│   ├── recipes-folder/           # Căutare și vizualizare rețete
│   │   ├── recipeList.tsx        # Lista de rețete
│   │   ├── ingredientBasedRecipes.tsx # Rețete bazate pe ingrediente
│   │   ├── savedRecipes.tsx      # Rețete salvate
│   │   ├── myRecipes.tsx         # Rețetele mele
│   │   ├── RecipeForm.tsx        # Formular adăugare rețetă
│   │   ├── recipeMatch.tsx       # Potrivire rețete
│   │   ├── cookingInProgress.tsx # Gătit în progres
│   │   └── completedRecipes.tsx  # Rețete finalizate
│   └── settings-folder/          # Setări și preferințe
│       ├── settings.tsx          # Setări principale
│       ├── preferences.tsx       # Preferințe alimentare
│       ├── bannedIngredients.tsx # Ingrediente interzise
│       ├── changeName.tsx        # Schimbare nume
│       └── changePassword.tsx    # Schimbare parolă
├── backend/                      # Configurare Firebase
│   └── firebase.js               # Configurația Firebase
├── components/                   # Componente reutilizabile
│   ├── StatusBarConfig.tsx       # Configurare status bar
│   ├── PlanRecipeModal.tsx       # Modal planificare rețetă
│   ├── RecipeCompletionModal.tsx # Modal finalizare rețetă
│   └── QuickNavSheet.tsx         # Navigare rapidă
├── constants/                    # Culori și stiluri
│   ├── Colors.ts                 # Paleta de culori
│   └── Styles.ts                 # Stiluri globale
├── services/                     # API extern și funcții auxiliare
│   └── recipeService.ts          # Serviciu rețete
├── types/                        # Tipuri TypeScript
│   ├── Recipe.ts                 # Tipuri pentru rețete
│   └── images.d.ts               # Declarații pentru imagini
├── utils/                        # Utilitare
│   ├── cloudinaryUpload.js       # Upload imagini Cloudinary
│   ├── mealdb.ts                 # Integrare TheMealDB API
│   ├── dietaryPreferences.ts     # Preferințe alimentare
│   └── normalizeQuantity.ts      # Normalizare cantități
├── assets/                       # Imagini, fonturi
│   ├── images/                   # Imagini aplicație
│   └── fonts/                    # Fonturi personalizate
└── documentatie/
    └── Novacescu_Alexandra-Doriana_Documentatie_CTIRO_Licenta.pdf #Documentație
```

## Cerințe sistem

- Node.js v18+
- npm sau yarn
- Expo CLI instalat global (`npm install -g expo-cli`)
- Expo Go (instalat pe telefon – iOS/Android)
- Cont Firebase (pentru backend)
- Cont Cloudinary (pentru imagini)

## Instalare și configurare

1. Clonează proiectul:
```bash
git clone https://github.com/alexandrajupiter/Proiect_easychef.git
cd Proiect_easychef
```

2. Instalează dependințele:
```bash
npm install
```

3. Configurează Firebase:
- Creează un proiect în [Firebase Console](https://console.firebase.google.com)
- Activează Authentication (email/parolă), Firestore și Storage
- Creează fișierul `.env` în rădăcina proiectului:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

4. Configurează Cloudinary:
- Creează un cont pe [cloudinary.com](https://cloudinary.com)
- Actualizează `utils/cloudinaryUpload.js` cu credențialele tale:

```js
const cloudinaryConfig = {
  cloud_name: "your-cloud-name",
  api_key: "your-api-key",
  api_secret: "your-api-secret"
};
```

5. Configurează regulile Firestore:
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /recipes/{recipeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Rulare aplicație

1. Pornește serverul de dezvoltare:
```bash
npm start
```

2. Deschide aplicația **Expo Go** pe telefon

3. Scanează codul QR afișat în terminal

4. Alternativ:
- `a` pentru emulator Android
- `i` pentru simulator iOS

## Funcționalități principale

- **Autentificare și înregistrare** cu Firebase
- **Gestionare ingrediente** (cămara personală)
- **Căutare rețete** bazată pe ingrediente disponibile
- **Planificare mese** pe zile și săptămâni
- **Salvare și notare** rețete preferate
- **Excludere alergeni** și preferințe alimentare
- **Scanare coduri de bare** pentru produse
- **Upload imagini** pentru rețete personalizate
- **Sincronizare în cloud** a datelor utilizator

## Scripturi disponibile

```bash
npm start          # Rulează Expo
npm run android    # Rulează pe emulator Android
npm run ios        # Rulează pe simulator iOS
npm run web        # Rulează în browser
npm test           # Rulează testele
```

## Structura Firestore

```
users/{userId}/
├── ingredients/pantry/           # Ingrediente în cămară
├── favorites/recipes/            # Rețete favorite
├── completedRecipes/             # Rețete finalizate
├── shoppingList/                 # Lista de cumpărături
├── mealPlans/                    # Planuri de mese
└── preferences/                  # Preferințe utilizator
    ├── dietaryRestrictions/      # Restricții alimentare
    └── bannedIngredients/        # Ingrediente interzise
```

## API-uri și servicii integrate

- **TheMealDB** – rețete și ingrediente externe
- **Firebase Auth** – autentificare utilizatori
- **Firestore** – stocare date utilizator și rețete
- **Cloudinary** – upload și optimizare imagini
- **Expo Camera** – scanare coduri de bare

## Probleme frecvente

- **Eroare Metro bundler**:  
  ```bash
  npx expo install --fix
  ```

- **Firebase nu funcționează**:
  - Verifică configurarea în `.env`
  - Verifică regulile Firestore
  - Verifică dacă Authentication este activat

- **Cloudinary nu funcționează**:
  - Verifică datele din `cloudinaryUpload.js`
  - Asigură-te că contul este activ

- **Camera nu funcționează**:
  - Verifică permisiunile din aplicație
  - Asigură-te că aplicația are acces la cameră în sistemul de operare

- **Eroare de tipuri TypeScript**:
  ```bash
  npm run build
  ```

## Contribuții

1. Forkează repository-ul
2. Creează un branch nou:
   ```bash
   git checkout -b feature/noua-funcționalitate
   ```
3. Fă modificările și commit:
   ```bash
   git commit -am "Adaugă funcționalitate nouă"
   ```
4. Trimite modificările:
   ```bash
   git push origin feature/noua-funcționalitate
   ```
5. Creează un Pull Request

## Securitate

- Credențialele Firebase sunt protejate prin variabile de mediu
- Fișierul `firebase-adminsdk.json` este exclus din Git
- Toate fișierele sensibile sunt protejate în `.gitignore`

## Licență

Acest proiect este realizat în scop educațional și nu este destinat utilizării comerciale. 