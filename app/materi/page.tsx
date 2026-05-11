export default function MateriPage() {
  const items = [
    ["IP Address", "Alamat unik perangkat dalam jaringan. Contoh: 192.168.1.2"],
    ["Subnet Mask", "Menentukan bagian network dan host. Contoh umum: 255.255.255.0"],
    ["Switch", "Menghubungkan beberapa perangkat dalam satu jaringan lokal."],
    ["Router", "Menghubungkan dua jaringan yang berbeda."],
    ["Ping", "Perintah untuk mengecek apakah perangkat bisa saling terhubung."],
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Materi Singkat</h1>
        <div className="mt-6 grid gap-4">
          {items.map(([title, text]) => (
            <div key={title} className="rounded-2xl bg-white p-5 shadow">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
