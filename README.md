# NetLab SMA

Simulator jaringan sederhana untuk praktik anak SMA.

## Fitur
- Drag & drop PC, Switch, Router
- Hubungkan perangkat dengan kabel
- Edit IP address, subnet mask, gateway
- Test Ping antar PC
- Mode tugas praktikum
- Materi singkat jaringan dasar

## Jalankan lokal
```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Deploy ke Vercel
1. Upload project ke GitHub.
2. Buka Vercel.
3. Import repository.
4. Klik Deploy.

## Praktik Besok
Gunakan menu **Tugas Praktikum**:
1. Buat 2 PC dan 1 Switch.
2. Hubungkan semuanya.
3. Atur IP PC1: `192.168.1.2`
4. Atur IP PC2: `192.168.1.3`
5. Klik Ping.
6. Jika subnet sama dan terhubung, ping berhasil.
