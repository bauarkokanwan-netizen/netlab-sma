"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Cable, Monitor, Router, Server, Plus, Play, Trash2, Printer, CheckCircle2, XCircle } from "lucide-react";

type DeviceKind = "PC" | "Switch" | "Router" | "Printer";
type CableKind = "straight" | "crossover" | "console";

type DeviceData = {
  label: string;
  kind: DeviceKind;
  ip?: string;
  mask?: string;
  gateway?: string;
} & Record<string, unknown>;

type CableData = {
  cableType?: CableKind;
  label?: string;
} & Record<string, unknown>;

type AppNode = Node<DeviceData, "device">;
type AppEdge = Edge<CableData>;

function DeviceNode({ data }: NodeProps<AppNode>) {
  const Icon =
    data.kind === "PC"
      ? Monitor
      : data.kind === "Router"
      ? Router
      : data.kind === "Printer"
      ? Printer
      : Server;

  return (
    <div className="relative min-w-[170px] rounded-2xl border-2 border-slate-700 bg-white px-4 py-3 text-center shadow-sm">
      <Handle type="target" position={Position.Left} id="left-target" className="!h-4 !w-4 !border-2 !border-white !bg-blue-600" />
      <Handle type="source" position={Position.Right} id="right-source" className="!h-4 !w-4 !border-2 !border-white !bg-green-600" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!h-4 !w-4 !border-2 !border-white !bg-green-600" />
      <Handle type="target" position={Position.Top} id="top-target" className="!h-4 !w-4 !border-2 !border-white !bg-blue-600" />

      <div className="flex items-center justify-center gap-2 font-semibold">
        <Icon className="h-5 w-5" />
        <span>{String(data.label)}</span>
      </div>
      {data.ip ? <div className="mt-1 text-xs text-slate-600">{String(data.ip)}</div> : null}
      <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-green-700">
        <span className="h-2 w-2 rounded-full bg-green-500" /> Port aktif
      </div>
    </div>
  );
}

const nodeTypes = {
  device: DeviceNode,
};

const initialNodes: AppNode[] = [];
const initialEdges: AppEdge[] = [];

function getSubnet24(ip = "") {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return "";
  return parts.slice(0, 3).join(".");
}

function isEndDevice(kind: DeviceKind) {
  return kind === "PC" || kind === "Printer";
}

function isCorrectCable(sourceKind: DeviceKind, targetKind: DeviceKind, cableType: CableKind) {
  if (cableType === "console") return false;
  const sourceEnd = isEndDevice(sourceKind);
  const targetEnd = isEndDevice(targetKind);

  if (sourceEnd && targetEnd) return cableType === "crossover";
  if ((sourceEnd && targetKind === "Switch") || (targetEnd && sourceKind === "Switch")) return cableType === "straight";
  if ((sourceKind === "Router" && targetKind === "Switch") || (sourceKind === "Switch" && targetKind === "Router")) return cableType === "straight";
  return true;
}

function isConnected(start: string, end: string, edges: AppEdge[], nodes: AppNode[]) {
  const graph = new Map<string, string[]>();

  for (const edge of edges) {
    const source = nodes.find((node) => node.id === edge.source);
    const target = nodes.find((node) => node.id === edge.target);
    if (!source || !target) continue;

    const cableType = edge.data?.cableType || "straight";
    if (!isCorrectCable(source.data.kind, target.data.kind, cableType)) continue;

    graph.set(edge.source, [...(graph.get(edge.source) || []), edge.target]);
    graph.set(edge.target, [...(graph.get(edge.target) || []), edge.source]);
  }

  const visited = new Set<string>();
  const queue = [start];

  while (queue.length) {
    const current = queue.shift()!;
    if (current === end) return true;
    visited.add(current);
    for (const next of graph.get(current) || []) {
      if (!visited.has(next)) queue.push(next);
    }
  }

  return false;
}

function getIcon(kind: DeviceKind) {
  if (kind === "PC") return <Monitor className="h-5 w-5" />;
  if (kind === "Router") return <Router className="h-5 w-5" />;
  if (kind === "Printer") return <Printer className="h-5 w-5" />;
  return <Server className="h-5 w-5" />;
}

function cableLabel(cableType: CableKind) {
  if (cableType === "straight") return "Straight";
  if (cableType === "crossover") return "Crossover";
  return "Console";
}

export default function SimulatorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>(initialEdges);
  const [selectedId, setSelectedId] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [cableType, setCableType] = useState<CableKind>("straight");
  const [result, setResult] = useState("Canvas kosong. Tambahkan PC, Switch, Router, atau Printer untuk mulai praktik.");

  const selectedNode = nodes.find((node) => node.id === selectedId);
  const endDeviceNodes = useMemo(
    () => nodes.filter((node) => isEndDevice(node.data.kind)),
    [nodes]
  );

  const validCableCount = useMemo(() => {
    return edges.filter((edge) => {
      const source = nodes.find((node) => node.id === edge.source);
      const target = nodes.find((node) => node.id === edge.target);
      if (!source || !target) return false;
      return isCorrectCable(source.data.kind, target.data.kind, edge.data?.cableType || "straight");
    }).length;
  }, [edges, nodes]);

  const invalidCableCount = edges.length - validCableCount;
  const configuredEndDeviceCount = endDeviceNodes.filter((node) => node.data.ip && node.data.mask).length;
  const hasSwitch = nodes.some((node) => node.data.kind === "Switch");

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            label: cableLabel(cableType),
            data: { cableType, label: cableLabel(cableType) },
            style: cableType === "console" ? { strokeDasharray: "6 4" } : undefined,
          },
          eds
        )
      ),
    [setEdges, cableType]
  );

  function addDevice(kind: DeviceKind) {
    const count = nodes.filter((node) => node.data.kind === kind).length + 1;
    const id = `${kind.toLowerCase()}-${Date.now()}`;
    const newNode: AppNode = {
      id,
      type: "device",
      position: { x: 120 + count * 35, y: 120 + count * 35 },
      data: {
        label: `${kind}${count}`,
        kind,
        ip: "",
        mask: "",
        gateway: "",
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedId(id);

    if (isEndDevice(kind)) {
      setFromId((prev) => prev || id);
      setToId((prev) => prev || id);
    }
  }

  function updateSelected(field: keyof DeviceData, value: string) {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedId ? { ...node, data: { ...node.data, [field]: value } } : node
      )
    );
  }

  function runPing() {
    const from = nodes.find((node) => node.id === fromId);
    const to = nodes.find((node) => node.id === toId);

    if (!from || !to || fromId === toId) {
      setResult("Tambahkan minimal 2 perangkat akhir, lalu pilih asal dan tujuan yang berbeda.");
      return;
    }

    if (!isEndDevice(from.data.kind) || !isEndDevice(to.data.kind)) {
      setResult("Ping hanya bisa dilakukan dari/ke PC atau Printer.");
      return;
    }

    if (!isConnected(from.id, to.id, edges, nodes)) {
      setResult(`❌ Ping gagal: ${from.data.label} belum terhubung ke ${to.data.label}, atau jenis kabel salah.`);
      return;
    }

    if (!from.data.ip || !to.data.ip) {
      setResult("❌ Ping gagal: IP address perangkat belum lengkap.");
      return;
    }

    if (getSubnet24(String(from.data.ip)) !== getSubnet24(String(to.data.ip))) {
      setResult(
        `❌ Ping gagal: subnet berbeda. ${from.data.ip} dan ${to.data.ip} tidak berada dalam jaringan /24 yang sama.`
      );
      return;
    }

    setResult(`✅ Ping berhasil: ${from.data.label} dapat terhubung ke ${to.data.label}.`);
  }

  function resetLab() {
    setNodes([]);
    setEdges([]);
    setSelectedId("");
    setFromId("");
    setToId("");
    setResult("Canvas dikosongkan. Mulai praktik dari awal.");
  }

  const canConfigureIp =
    selectedNode?.data.kind === "PC" || selectedNode?.data.kind === "Printer";

  return (
    <main className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">NetLab SMA - Simulator</h1>
            <p className="text-sm text-slate-500">Canvas kosong seperti Cisco Packet Tracer. Pilih kabel, tambah perangkat, lalu tarik kabel dari port biru/hijau.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={cableType} onChange={(e) => setCableType(e.target.value as CableKind)} className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold">
              <option value="straight">Kabel Straight</option>
              <option value="crossover">Kabel Crossover</option>
              <option value="console">Kabel Console</option>
            </select>
            <button onClick={() => addDevice("PC")} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white"><Plus className="h-4 w-4" /> PC</button>
            <button onClick={() => addDevice("Switch")} className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-white"><Plus className="h-4 w-4" /> Switch</button>
            <button onClick={() => addDevice("Router")} className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-white"><Plus className="h-4 w-4" /> Router</button>
            <button onClick={() => addDevice("Printer")} className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-white"><Plus className="h-4 w-4" /> Printer</button>
            <button onClick={resetLab} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-white"><Trash2 className="h-4 w-4" /> Reset</button>
          </div>
        </div>
      </header>

      <section className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_380px]">
        <div className="h-[650px] overflow-hidden rounded-3xl border bg-white shadow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-5 shadow">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Cable className="h-5 w-5" /> Test Ping</h2>
            <label className="text-sm font-semibold">Dari Perangkat</label>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="mt-1 w-full rounded-xl border p-2">
              <option value="">Pilih perangkat</option>
              {endDeviceNodes.map((node) => <option key={node.id} value={node.id}>{String(node.data.label)}</option>)}
            </select>

            <label className="mt-3 block text-sm font-semibold">Ke Perangkat</label>
            <select value={toId} onChange={(e) => setToId(e.target.value)} className="mt-1 w-full rounded-xl border p-2">
              <option value="">Pilih perangkat</option>
              {endDeviceNodes.map((node) => <option key={node.id} value={node.id}>{String(node.data.label)}</option>)}
            </select>

            <button onClick={runPing} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white"><Play className="h-4 w-4" /> Test Ping</button>
            <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm font-medium">{result}</div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow">
            <h2 className="mb-3 text-lg font-bold">Cek Otomatis Praktikum</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">{endDeviceNodes.length >= 2 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Minimal 2 PC/Printer</div>
              <div className="flex items-center gap-2">{hasSwitch ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Ada Switch</div>
              <div className="flex items-center gap-2">{edges.length >= 2 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Minimal 2 kabel</div>
              <div className="flex items-center gap-2">{invalidCableCount === 0 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Kabel benar: {validCableCount}/{edges.length}</div>
              <div className="flex items-center gap-2">{configuredEndDeviceCount >= 2 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} IP terisi: {configuredEndDeviceCount}/{endDeviceNodes.length}</div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow">
            <h2 className="mb-3 text-lg font-bold">Konfigurasi Perangkat</h2>
            {selectedNode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-3">{getIcon(selectedNode.data.kind)}<span className="font-semibold">{selectedNode.data.kind}</span></div>
                <label className="block text-sm font-semibold">Nama</label>
                <input value={String(selectedNode.data.label)} onChange={(e) => updateSelected("label", e.target.value)} className="w-full rounded-xl border p-2" />
                {canConfigureIp && (
                  <>
                    <label className="block text-sm font-semibold">IP Address</label>
                    <input value={String(selectedNode.data.ip || "")} onChange={(e) => updateSelected("ip", e.target.value)} className="w-full rounded-xl border p-2" placeholder="contoh: 192.168.1.2" />
                    <label className="block text-sm font-semibold">Subnet Mask</label>
                    <input value={String(selectedNode.data.mask || "")} onChange={(e) => updateSelected("mask", e.target.value)} className="w-full rounded-xl border p-2" placeholder="contoh: 255.255.255.0" />
                    <label className="block text-sm font-semibold">Gateway</label>
                    <input value={String(selectedNode.data.gateway || "")} onChange={(e) => updateSelected("gateway", e.target.value)} className="w-full rounded-xl border p-2" placeholder="contoh: 192.168.1.1" />
                  </>
                )}
              </div>
            ) : (
              <p className="text-slate-500">Belum ada perangkat dipilih. Tambahkan perangkat lalu klik perangkat tersebut.</p>
            )}
          </div>

          <div className="rounded-3xl bg-blue-50 p-5 text-sm text-slate-700">
            <b>Catatan kabel:</b> PC/Printer ke Switch pakai Straight. PC ke PC atau PC ke Printer pakai Crossover. Console belum dipakai untuk ping.
          </div>
        </aside>
      </section>
    </main>
  );
}
