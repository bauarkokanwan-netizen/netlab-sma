"use client";

import { useMemo, useState } from "react";
import { Gauge, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";

type Device = {
  id: string;
  name: string;
  type: "PC" | "Laptop" | "Smartphone" | "Printer" | "Server";
  bandwidth: number;
  priority: "Rendah" | "Sedang" | "Tinggi";
};

const initialDevices: Device[] = [
  { id: "pc-1", name: "PC1", type: "PC", bandwidth: 20, priority: "Sedang" },
  { id: "laptop-1", name: "Laptop1", type: "Laptop", bandwidth: 30, priority: "Tinggi" },
  { id: "hp-1", name: "Smartphone1", type: "Smartphone", bandwidth: 10, priority: "Rendah" },
];

export default function BandwidthPage() {
  const [totalBandwidth, setTotalBandwidth] = useState(100);
  const [devices, setDevices] = useState<Device[]>(initialDevices);

  const usedBandwidth = useMemo(
    () => devices.reduce((total, device) => total + Number(device.bandwidth || 0), 0),
    [devices]
  );

  const remainingBandwidth = totalBandwidth - usedBandwidth;
  const isOverLimit = usedBandwidth > totalBandwidth;
  const score = Math.max(0, Math.min(100, Math.round((1 - Math.abs(remainingBandwidth) / Math.max(totalBandwidth, 1)) * 100)));

  function addDevice() {
    const id = `device-${Date.now()}`;
    const number = devices.length + 1;
    setDevices((current) => [
      ...current,
      { id, name: `Device${number}`, type: "PC", bandwidth: 0, priority: "Sedang" },
    ]);
  }

  function updateDevice(id: string, field: keyof Device, value: string | number) {
    setDevices((current) =>
      current.map((device) =>
        device.id === id ? { ...device, [field]: field === "bandwidth" ? Number(value) : value } : device
      )
    );
  }

  function removeDevice(id: string) {
    setDevices((current) => current.filter((device) => device.id !== id));
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5">
      <section className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-3xl bg-white p-6 shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <Gauge className="h-6 w-6" /> Bandwidth Management
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Latihan membagi bandwidth internet ke beberapa perangkat. Gunakan satuan Mbps, bukan GB.
              </p>
            </div>
            <a href="/simulator" className="rounded-xl bg-slate-800 px-4 py-2 text-white">
              Kembali ke Simulator
            </a>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl bg-white p-5 shadow">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <label className="text-sm font-semibold">Total Bandwidth Internet</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={totalBandwidth}
                    onChange={(event) => setTotalBandwidth(Number(event.target.value))}
                    className="w-40 rounded-xl border p-2"
                    min={1}
                  />
                  <span className="font-semibold">Mbps</span>
                </div>
              </div>
              <button onClick={addDevice} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white">
                <Plus className="h-4 w-4" /> Tambah Perangkat
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-3">Nama</th>
                    <th className="px-3">Jenis</th>
                    <th className="px-3">Bandwidth</th>
                    <th className="px-3">Prioritas</th>
                    <th className="px-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id} className="rounded-2xl bg-slate-50">
                      <td className="rounded-l-2xl p-3">
                        <input
                          value={device.name}
                          onChange={(event) => updateDevice(device.id, "name", event.target.value)}
                          className="w-full rounded-xl border bg-white p-2"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={device.type}
                          onChange={(event) => updateDevice(device.id, "type", event.target.value)}
                          className="w-full rounded-xl border bg-white p-2"
                        >
                          <option>PC</option>
                          <option>Laptop</option>
                          <option>Smartphone</option>
                          <option>Printer</option>
                          <option>Server</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={device.bandwidth}
                            onChange={(event) => updateDevice(device.id, "bandwidth", event.target.value)}
                            className="w-28 rounded-xl border bg-white p-2"
                            min={0}
                          />
                          <span>Mbps</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <select
                          value={device.priority}
                          onChange={(event) => updateDevice(device.id, "priority", event.target.value)}
                          className="w-full rounded-xl border bg-white p-2"
                        >
                          <option>Rendah</option>
                          <option>Sedang</option>
                          <option>Tinggi</option>
                        </select>
                      </td>
                      <td className="rounded-r-2xl p-3">
                        <button onClick={() => removeDevice(device.id)} className="rounded-xl bg-red-600 px-3 py-2 text-white">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl bg-white p-5 shadow">
              <h2 className="mb-3 text-lg font-bold">Cek Pembagian</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Total Internet</span>
                  <b>{totalBandwidth} Mbps</b>
                </div>
                <div className="flex items-center justify-between">
                  <span>Terpakai</span>
                  <b>{usedBandwidth} Mbps</b>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sisa</span>
                  <b className={remainingBandwidth < 0 ? "text-red-600" : "text-green-600"}>{remainingBandwidth} Mbps</b>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full ${isOverLimit ? "bg-red-600" : "bg-green-600"}`}
                    style={{ width: `${Math.min(100, Math.max(0, (usedBandwidth / Math.max(totalBandwidth, 1)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow">
              <h2 className="mb-3 text-lg font-bold">Nilai Otomatis</h2>
              <div className="text-4xl font-bold">{score}/100</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {!isOverLimit ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                  Total alokasi tidak melebihi bandwidth
                </div>
                <div className="flex items-center gap-2">
                  {devices.length >= 2 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                  Minimal 2 perangkat
                </div>
                <div className="flex items-center gap-2">
                  {devices.some((device) => device.priority === "Tinggi") ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                  Ada perangkat prioritas tinggi
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-blue-50 p-5 text-sm text-slate-700">
              <b>Catatan Guru:</b> Mbps adalah satuan kecepatan bandwidth. GB adalah kapasitas data. Untuk latihan pembagian kecepatan internet, gunakan Mbps.
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
