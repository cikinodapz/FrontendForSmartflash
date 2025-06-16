## Struktur Folder Proyek

```
FrontendForSmartflash/
├── app/
│   ├── layout.tsx          # Root layout dengan theme provider
│   ├── page.tsx            # Landing page dengan demo interaktif
│   ├── manifest.ts         # Konfigurasi PWA
│   ├── globals.css         # Styling global
│   ├── login/              # Halaman autentikasi
│   ├── dashboard/          # Dashboard pengguna
│   ├── create/             # Pembuatan deck
│   ├── edit/[id]/          # Edit deck
│   ├── study/[id]/         # Sesi belajar
│   ├── eksplorasi/         # Eksplorasi deck publik
│   └── settings/           # Pengaturan aplikasi
├── components/
│   ├── ui/                 # Komponen UI reusable
│   ├── navigation.tsx      # Navigasi global
│   └── theme-provider.tsx  # Manajemen tema
└── package.json            # Dependencies dan scripts
```

## Cara Instalasi & Menjalankan Aplikasi

**Catatan**: Ini adalah aplikasi web Next.js, bukan aplikasi Android. Berikut langkah instalasi yang benar:

1. **Clone repository**
   ```bash
   git clone https://github.com/cikinodapz/FrontendForSmartflash.git
   cd FrontendForSmartflash
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Jalankan development server**
   ```bash
   npm run dev
   ``` [6](#0-5) 

4. **Akses aplikasi**
   - Buka browser dan kunjungi `http://localhost:4000`

5. **Build untuk production**
   ```bash
   npm run build
   npm start
   ```

## Teknologi yang Digunakan

### Frontend Framework & Library
- **Next.js 15.2.4** - React framework dengan SSR/SSG 
- **React 18.3.1** - Library UI 
- **TypeScript 5** - Type-safe development 

### Styling & UI
- **Tailwind CSS 3.4.17** - Utility-first CSS framework 
- **Framer Motion 12.15.0** - Library animasi 
- **Radix UI** - Komponen UI primitif yang accessible 
- **Lucide React** - Sistem ikon 

### Authentication & Forms
- **NextAuth.js 4.24.11** - Sistem autentikasi
- **React Hook Form 7.54.1** - Manajemen form  
- **Google OAuth** - Login dengan Google 

### Data Visualization & Charts
- **Recharts** - Library chart dan visualisasi data

### PWA Features
- **Manifest konfigurasi** untuk standalone app experience 
- **Theme system** dengan dark/light mode 
