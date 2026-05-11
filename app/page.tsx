import Link from "next/link";
import { Network, Monitor, GraduationCap, Rocket } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-500 p-3">
              <Network className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">NetLab SMA</h1>
              <p className="text-slate-300">Simulator jaringan sederhana untuk praktik siswa.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-900 p-5">
              <Monitor className="mb-3 h-8 w-8 text-blue-300" />
              <h2 className="font-semibold">Simulasi Visual</h2>
              <p className="mt-2 text-sm text-slate-300">
                Tambah PC, Switch, Router, lalu hubungkan dengan kabel.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 p-5">
              <GraduationCap className="mb-3 h-8 w-8 text-green-300" />
              <h2 className="font-semibold">Praktik SMA</h2>
              <p className="mt-2 text-sm text-slate-300">
                Cocok untuk IP address, subnet, gateway, dan ping dasar.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 p-5">
              <Rocket className="mb-3 h-8 w-8 text-purple-300" />
              <h2 className="font-semibold">Siap Deploy</h2>
              <p className="mt-2 text-sm text-slate-300">
                Bisa langsung dinaikkan ke GitHub dan Vercel.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/simulator" className="rounded-2xl bg-blue-500 px-5 py-3 font-semibold hover:bg-blue-400">
              Buka Simulator
            </Link>
            <Link href="/praktikum" className="rounded-2xl bg-white/10 px-5 py-3 font-semibold hover:bg-white/20">
              Tugas Praktikum
            </Link>
            <Link href="/materi" className="rounded-2xl bg-white/10 px-5 py-3 font-semibold hover:bg-white/20">
              Materi Singkat
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
