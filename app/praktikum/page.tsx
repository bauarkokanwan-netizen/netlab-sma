import Link from "next/link";

export default function PraktikumPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow">
        <h1 className="text-3xl font-bold">Tugas Praktikum Besok</h1>
        <p className="mt-2 text-slate-600">Topik: membuat LAN sederhana dan menguji ping.</p>

        <ol className="mt-6 list-decimal space-y-3 pl-6">
          <li>Buka halaman Simulator.</li>
          <li>Tambahkan 2 PC dan 1 Switch.</li>
          <li>Hubungkan PC1 ke Switch dan PC2 ke Switch.</li>
          <li>Klik PC1, isi IP: <b>192.168.1.2</b></li>
          <li>Klik PC2, isi IP: <b>192.168.1.3</b></li>
          <li>Pilih PC asal dan tujuan, lalu klik <b>Test Ping</b>.</li>
          <li>Catat hasilnya di buku praktik.</li>
        </ol>

        <div className="mt-6 rounded-2xl bg-blue-50 p-4">
          <h2 className="font-semibold">Kriteria Nilai</h2>
          <ul className="mt-2 list-disc pl-6 text-slate-700">
            <li>Topologi benar: 30 poin</li>
            <li>IP address benar: 30 poin</li>
            <li>Ping berhasil: 30 poin</li>
            <li>Kerapian laporan: 10 poin</li>
          </ul>
        </div>

        <Link href="/simulator" className="mt-6 inline-block rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white">
          Mulai Praktikum
        </Link>
      </div>
    </main>
  );
}
