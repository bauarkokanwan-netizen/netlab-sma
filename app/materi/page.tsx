const sections = [
  {
    title: "Pengenalan NetLab SMA",
    text: "NetLab SMA adalah simulator jaringan komputer berbasis web untuk membantu siswa memahami dasar jaringan secara visual dan interaktif. Aplikasi ini dibuat seperti Cisco Packet Tracer versi sederhana untuk praktik SMA.",
  },
  {
    title: "Jaringan Komputer",
    text: "Jaringan komputer adalah hubungan antara dua atau lebih perangkat agar dapat saling bertukar data. Contohnya jaringan lab komputer, WiFi sekolah, jaringan kantor, dan internet rumah.",
  },
  {
    title: "PC",
    text: "PC adalah perangkat pengguna. Di simulator PC dapat diberi IP address, subnet mask, gateway, dihubungkan kabel, mendapat IP dari DHCP, melakukan ping, dan mengirim paket data.",
  },
  {
    title: "Laptop",
    text: "Laptop berfungsi seperti PC, tetapi dapat digunakan untuk simulasi jaringan kabel maupun wireless. Laptop dapat terhubung ke Wireless AP dan mendapat IP otomatis dari DHCP.",
  },
  {
    title: "Smartphone",
    text: "Smartphone digunakan untuk simulasi perangkat mobile. Perangkat ini cocok untuk mempelajari jaringan WiFi, DHCP wireless, dan ping antar perangkat wireless.",
  },
  {
    title: "Switch",
    text: "Switch menghubungkan banyak perangkat dalam satu jaringan lokal atau LAN. Contohnya PC ke switch, printer ke switch, router ke switch, dan access point ke switch.",
  },
  {
    title: "Router",
    text: "Router digunakan untuk menghubungkan jaringan yang berbeda. Dalam dunia nyata router sering dipakai untuk menghubungkan jaringan lokal ke internet.",
  },
  {
    title: "Printer Jaringan",
    text: "Printer jaringan dapat digunakan bersama oleh banyak perangkat. Siswa dapat belajar bahwa printer juga membutuhkan koneksi jaringan dan IP address agar bisa diakses.",
  },
  {
    title: "DHCP Server",
    text: "DHCP Server memberikan IP address secara otomatis kepada perangkat. Dengan DHCP, siswa tidak perlu mengisi IP satu per satu secara manual.",
  },
  {
    title: "Wireless Access Point",
    text: "Wireless AP menyediakan koneksi WiFi. Laptop dan smartphone dapat terhubung ke AP menggunakan koneksi wireless, sedangkan AP biasanya terhubung ke switch menggunakan kabel straight.",
  },
  {
    title: "Kabel Straight",
    text: "Kabel straight digunakan untuk menghubungkan perangkat berbeda jenis, misalnya PC ke switch, router ke switch, atau access point ke switch.",
  },
  {
    title: "Kabel Crossover",
    text: "Kabel crossover digunakan untuk menghubungkan perangkat sejenis, misalnya PC ke PC. Dalam simulator, salah memilih kabel dapat membuat koneksi gagal.",
  },
  {
    title: "Kabel Console",
    text: "Kabel console digunakan untuk konfigurasi perangkat jaringan, bukan untuk komunikasi data biasa. Karena itu kabel console tidak digunakan untuk ping.",
  },
  {
    title: "Wireless Connection",
    text: "Wireless connection digunakan untuk menghubungkan laptop atau smartphone ke Wireless AP. Pada simulator garis wireless berbentuk putus-putus.",
  },
  {
    title: "IP Address",
    text: "IP Address adalah alamat unik perangkat di jaringan. Contohnya 192.168.1.10. Tanpa IP address, perangkat tidak dapat berkomunikasi dengan benar.",
  },
  {
    title: "Subnet Mask",
    text: "Subnet mask menentukan bagian network dan host pada IP address. Contoh yang sering digunakan adalah 255.255.255.0.",
  },
  {
    title: "Default Gateway",
    text: "Gateway adalah pintu keluar jaringan. Biasanya gateway adalah alamat IP router, misalnya 192.168.1.1.",
  },
  {
    title: "Static IP",
    text: "Static IP adalah IP yang diisi manual oleh pengguna. Kelebihannya stabil dan cocok untuk server, tetapi harus dikonfigurasi satu per satu.",
  },
  {
    title: "Dynamic IP / Auto IP",
    text: "Dynamic IP diberikan otomatis oleh DHCP Server. Pada simulator, tombol Auto IP dari DHCP akan mengisi IP, subnet mask, dan gateway secara otomatis.",
  },
  {
    title: "Ping",
    text: "Ping digunakan untuk mengecek apakah dua perangkat dapat saling terhubung. Jika ping gagal, kemungkinan IP salah, kabel salah, subnet berbeda, atau perangkat belum terhubung.",
  },
  {
    title: "Packet Animation",
    text: "Packet Animation memperlihatkan jalur paket data, misalnya PC1 → Switch1 → PC2. Fitur ini membantu siswa memahami perjalanan data dalam jaringan.",
  },
  {
    title: "Status Lampu Port",
    text: "Hijau berarti connected, kuning berarti waiting atau konfigurasi belum lengkap, dan merah berarti disconnected. Ini membantu siswa memahami kondisi koneksi jaringan.",
  },
  {
    title: "Topologi Jaringan",
    text: "Topologi adalah bentuk susunan jaringan. Contohnya topologi star, yaitu semua perangkat terhubung ke switch pusat.",
  },
  {
    title: "Jaringan Wireless",
    text: "Jaringan wireless menggunakan WiFi tanpa kabel. Contohnya laptop atau smartphone yang terhubung ke access point sekolah.",
  },
  {
    title: "Bandwidth",
    text: "Bandwidth adalah kapasitas atau kecepatan transfer data jaringan. Satuan yang tepat untuk kecepatan internet adalah Mbps atau Gbps, bukan GB.",
  },
  {
    title: "Manajemen Bandwidth",
    text: "Manajemen bandwidth adalah proses membagi kecepatan internet ke beberapa perangkat. Contohnya total 100 Mbps dibagi untuk PC, laptop, smartphone, dan server.",
  },
  {
    title: "QoS Dasar",
    text: "QoS atau Quality of Service adalah pengaturan prioritas jaringan. Perangkat penting dapat diberi prioritas tinggi agar koneksinya lebih stabil.",
  },
  {
    title: "Troubleshooting Dasar",
    text: "Jika jaringan gagal, periksa kabel, IP address, subnet mask, gateway, DHCP, status lampu, dan apakah perangkat sudah tersambung ke switch atau AP.",
  },
];

const practices = [
  "Praktik 1: Hubungkan dua PC dengan kabel crossover, beri IP manual, lalu test ping.",
  "Praktik 2: Buat jaringan PC ke switch menggunakan kabel straight, lalu test ping antar PC.",
  "Praktik 3: Tambahkan DHCP Server, hubungkan ke switch, lalu gunakan Auto IP.",
  "Praktik 4: Tambahkan Wireless AP, laptop, dan smartphone, lalu hubungkan dengan wireless.",
  "Praktik 5: Buka halaman bandwidth, bagi 100 Mbps ke beberapa perangkat, lalu cek nilai otomatis.",
];

export default function MateriPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-white p-7 shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Modul Pembelajaran</p>
          <h1 className="mt-2 text-3xl font-bold">Materi Lengkap NetLab SMA</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Bahan bacaan ini menjelaskan semua fitur yang ada di aplikasi NetLab SMA. Guru dapat menggunakan materi ini sebagai panduan saat menjelaskan praktik jaringan komputer di kelas.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="/simulator" className="rounded-xl bg-blue-600 px-4 py-2 text-white">Buka Simulator</a>
            <a href="/bandwidth" className="rounded-xl bg-slate-800 px-4 py-2 text-white">Latihan Bandwidth</a>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {sections.map((item) => (
            <article key={item.title} className="rounded-3xl bg-white p-5 shadow">
              <h2 className="text-xl font-bold">{item.title}</h2>
              <p className="mt-2 leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl bg-white p-7 shadow">
          <h2 className="text-2xl font-bold">Contoh Langkah Praktikum</h2>
          <div className="mt-4 grid gap-3">
            {practices.map((practice, index) => (
              <div key={practice} className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                <b>{index + 1}.</b> {practice}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-blue-50 p-7 text-slate-700">
          <h2 className="text-2xl font-bold">Kesimpulan</h2>
          <p className="mt-3 leading-7">
            Dengan NetLab SMA, siswa dapat belajar jaringan komputer secara bertahap: mulai dari mengenal perangkat, memasang kabel, mengisi IP, menggunakan DHCP, mencoba wireless, melakukan ping, melihat packet animation, sampai membagi bandwidth internet. Materi ini membantu siswa memahami teori sekaligus praktik jaringan secara visual.
          </p>
        </section>
      </div>
    </main>
  );
}
