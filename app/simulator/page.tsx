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
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Cable,
  CheckCircle2,
  Monitor,
  Play,
  Plus,
  Printer,
  Router,
  Server,
  Trash2,
  XCircle,
} from "lucide-react";

type DeviceKind = "PC" | "Switch" | "Router" | "Printer";
type CableKind = "straight" | "crossover" | "console";
type PortStatus = "connected" | "waiting" | "disconnected";

type DeviceData = {
  label: string;
  kind: DeviceKind;
  ip: string;
  mask: string;
  gateway: string;
  status: PortStatus;
};

type AppNode = {
  id: string;
  type: "device";
  position: { x: number; y: number };
  data: DeviceData;
};

type AppEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  animated?: boolean;
  label?: string;
  data?: { cableType: CableKind };
  style?: Record<string, string | number>;
  selected?: boolean;
};

const initialNodes: AppNode[] = [];
const initialEdges: AppEdge[] = [];

function isEndDevice(kind: DeviceKind) {
  return kind === "PC" || kind === "Printer";
}

function cableLabel(type: CableKind) {
  if (type === "straight") return "Straight";
  if (type === "crossover") return "Crossover";
  return "Console";
}

function getSubnet24(ip = "") {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return "";
  return parts.slice(0, 3).join(".");
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

function cableStyle(sourceKind: DeviceKind, targetKind: DeviceKind, cableType: CableKind, selected = false) {
  const valid = isCorrectCable(sourceKind, targetKind, cableType);
  const stroke = cableType === "console" ? "#64748b" : valid ? "#16a34a" : "#dc2626";
  return {
    stroke,
    strokeWidth: selected ? 4 : 2.5,
    strokeDasharray: cableType === "console" ? "6 4" : undefined,
  } as Record<string, string | number | undefined>;
}

function DeviceNode({ data }: any) {
  const Icon = data.kind === "PC" ? Monitor : data.kind === "Router" ? Router : data.kind === "Printer" ? Printer : Server;
  const statusClass = data.status === "connected" ? "bg-green-500" : data.status === "waiting" ? "bg-yellow-400" : "bg-red-500";
  return (
    <div className="relative min-w-[170px] rounded-2xl border-2 border-slate-700 bg-white px-4 py-3 text-center shadow-sm">
      <Handle type="target" position={Position.Left} id="left-target" className="!h-4 !w-4 !border-2 !border-white !bg-blue-600" />
      <Handle type="source" position={Position.Right} id="right-source" className="!h-4 !w-4 !border-2 !border-white !bg-green-600" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!h-4 !w-4 !border-2 !border-white !bg-green-600" />
      <Handle type="target" position={Position.Top} id="top-target" className="!h-4 !w-4 !border-2 !border-white !bg-blue-600" />
      <div className="flex items-center justify-center gap-2 font-semibold"><Icon className="h-5 w-5" /><span>{String(data.label)}</span></div>
      {data.ip ? <div className="mt-1 text-xs text-slate-600">{String(data.ip)}</div> : null}
      <div className="mt-2 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-700"><span className={`h-3 w-3 rounded-full ${statusClass}`} />{String(data.status)}</div>
    </div>
  );
}

const nodeTypes = { device: DeviceNode };

function getIcon(kind: DeviceKind) {
  if (kind === "PC") return <Monitor className="h-5 w-5" />;
  if (kind === "Router") return <Router className="h-5 w-5" />;
  if (kind === "Printer") return <Printer className="h-5 w-5" />;
  return <Server className="h-5 w-5" />;
}

function decorateEdges(edges: AppEdge[], nodes: AppNode[], selectedEdgeId = "") {
  return edges.map((edge) => {
    const source = nodes.find((item) => item.id === edge.source);
    const target = nodes.find((item) => item.id === edge.target);
    const currentCableType = edge.data?.cableType || "straight";
    const selected = edge.id === selectedEdgeId;
    return {
      ...edge,
      selected,
      label: cableLabel(currentCableType),
      style: source && target ? cableStyle(source.data.kind, target.data.kind, currentCableType, selected) : edge.style,
    };
  });
}

function updateNodeStatuses(nodes: AppNode[], edges: AppEdge[]) {
  return nodes.map((node) => {
    const connectedEdges = edges.filter((edge) => edge.source === node.id || edge.target === node.id);
    let status: PortStatus = "disconnected";
    if (connectedEdges.length > 0) {
      const allValid = connectedEdges.every((edge) => {
        const source = nodes.find((item) => item.id === edge.source);
        const target = nodes.find((item) => item.id === edge.target);
        if (!source || !target) return false;
        return isCorrectCable(source.data.kind, target.data.kind, edge.data?.cableType || "straight");
      });
      status = allValid ? "connected" : "waiting";
    }
    return { ...node, data: { ...node.data, status } };
  });
}

function networkConnected(start: string, end: string, edges: AppEdge[], nodes: AppNode[]) {
  const graph = new Map<string, string[]>();
  for (const edge of edges) {
    const source = nodes.find((node) => node.id === edge.source);
    const target = nodes.find((node) => node.id === edge.target);
    if (!source || !target) continue;
    const currentCableType = edge.data?.cableType || "straight";
    if (!isCorrectCable(source.data.kind, target.data.kind, currentCableType)) continue;
    graph.set(edge.source, [...(graph.get(edge.source) || []), edge.target]);
    graph.set(edge.target, [...(graph.get(edge.target) || []), edge.source]);
  }
  const queue = [start];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === end) return true;
    visited.add(current);
    for (const next of graph.get(current) || []) if (!visited.has(next)) queue.push(next);
  }
  return false;
}

export default function SimulatorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>(initialEdges);
  const [selectedId, setSelectedId] = useState("");
  const [selectedEdgeId, setSelectedEdgeId] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [cableType, setCableType] = useState<CableKind>("straight");
  const [result, setResult] = useState("Canvas kosong. Tambahkan perangkat untuk mulai praktik.");

  const typedNodes = nodes as AppNode[];
  const typedEdges = edges as AppEdge[];
  const selectedNode = typedNodes.find((node) => node.id === selectedId);
  const selectedEdge = typedEdges.find((edge) => edge.id === selectedEdgeId);
  const endDeviceNodes = useMemo(() => typedNodes.filter((node) => isEndDevice(node.data.kind)), [typedNodes]);
  const hasSwitch = typedNodes.some((node) => node.data.kind === "Switch");
  const configuredEndDeviceCount = endDeviceNodes.filter((node) => node.data.ip && node.data.mask).length;
  const validCableCount = useMemo(() => typedEdges.filter((edge) => {
    const source = typedNodes.find((node) => node.id === edge.source);
    const target = typedNodes.find((node) => node.id === edge.target);
    if (!source || !target) return false;
    return isCorrectCable(source.data.kind, target.data.kind, edge.data?.cableType || "straight");
  }).length, [typedEdges, typedNodes]);
  const invalidCableCount = typedEdges.length - validCableCount;

  function refreshAfterEdges(nextEdges: AppEdge[]) {
    setNodes((currentNodes: AppNode[]) => updateNodeStatuses(currentNodes, nextEdges));
  }

  const onConnect = useCallback((connection: any) => {
    setEdges((currentEdges: any[]) => {
      const nextRaw = addEdge({ ...connection, animated: true, label: cableLabel(cableType), data: { cableType } }, currentEdges) as AppEdge[];
      let decorated: AppEdge[] = nextRaw;
      setNodes((currentNodes: AppNode[]) => {
        const nextNodes = updateNodeStatuses(currentNodes, nextRaw);
        decorated = decorateEdges(nextRaw, nextNodes, selectedEdgeId);
        return nextNodes;
      });
      return decorated;
    });
  }, [setEdges, setNodes, cableType, selectedEdgeId]);

  function removeSelectedCable() {
    if (!selectedEdgeId) {
      setResult("Klik kabel yang ingin dihapus terlebih dahulu.");
      return;
    }
    const nextEdges = typedEdges.filter((edge) => edge.id !== selectedEdgeId);
    setEdges(nextEdges);
    refreshAfterEdges(nextEdges);
    setSelectedEdgeId("");
    setResult("Kabel berhasil dihapus. Buat kabel baru jika diperlukan.");
  }

  function addDevice(kind: DeviceKind) {
    const count = typedNodes.filter((node) => node.data.kind === kind).length + 1;
    const id = `${kind.toLowerCase()}-${Date.now()}`;
    const newNode: AppNode = { id, type: "device", position: { x: 120 + count * 35, y: 120 + count * 35 }, data: { label: `${kind}${count}`, kind, ip: "", mask: "", gateway: "", status: "disconnected" } };
    setNodes((currentNodes: AppNode[]) => [...currentNodes, newNode]);
    setSelectedId(id);
    setSelectedEdgeId("");
    if (isEndDevice(kind)) {
      setFromId((prev) => prev || id);
      setToId((prev) => prev || id);
    }
  }

  function updateSelected(field: keyof DeviceData, value: string) {
    setNodes((currentNodes: AppNode[]) => currentNodes.map((node) => node.id === selectedId ? { ...node, data: { ...node.data, [field]: value } } : node));
  }

  function resetLab() {
    setNodes([]);
    setEdges([]);
    setSelectedId("");
    setSelectedEdgeId("");
    setFromId("");
    setToId("");
    setResult("Canvas dikosongkan. Mulai praktik dari awal.");
  }

  function runPing() {
    const from = typedNodes.find((node) => node.id === fromId);
    const to = typedNodes.find((node) => node.id === toId);
    if (!from || !to || fromId === toId) return setResult("Tambahkan minimal 2 PC/Printer, lalu pilih asal dan tujuan yang berbeda.");
    if (!isEndDevice(from.data.kind) || !isEndDevice(to.data.kind)) return setResult("Ping hanya bisa dilakukan dari/ke PC atau Printer.");
    if (!networkConnected(from.id, to.id, typedEdges, typedNodes)) return setResult(`❌ Ping gagal: ${from.data.label} belum terhubung ke ${to.data.label}, atau jenis kabel salah.`);
    if (!from.data.ip || !to.data.ip) return setResult("❌ Ping gagal: IP address perangkat belum lengkap.");
    if (getSubnet24(from.data.ip) !== getSubnet24(to.data.ip)) return setResult(`❌ Ping gagal: subnet berbeda. ${from.data.ip} dan ${to.data.ip} tidak satu jaringan /24.`);
    setResult(`✅ Ping berhasil: ${from.data.label} dapat terhubung ke ${to.data.label}.`);
  }

  const canConfigureIp = selectedNode?.data.kind === "PC" || selectedNode?.data.kind === "Printer";

  return (
    <main className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold">NetLab SMA - Simulator</h1><p className="text-sm text-slate-500">Pilih kabel, tambah perangkat, isi IP, lalu test ping. Klik kabel untuk menghapusnya.</p></div>
          <div className="flex flex-wrap gap-2">
            <select value={cableType} onChange={(event) => setCableType(event.target.value as CableKind)} className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><option value="straight">Kabel Straight</option><option value="crossover">Kabel Crossover</option><option value="console">Kabel Console</option></select>
            <button onClick={() => addDevice("PC")} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white"><Plus className="h-4 w-4" /> PC</button>
            <button onClick={() => addDevice("Switch")} className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-white"><Plus className="h-4 w-4" /> Switch</button>
            <button onClick={() => addDevice("Router")} className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-white"><Plus className="h-4 w-4" /> Router</button>
            <button onClick={() => addDevice("Printer")} className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-white"><Plus className="h-4 w-4" /> Printer</button>
            <button onClick={removeSelectedCable} className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-white"><Trash2 className="h-4 w-4" /> Hapus Kabel</button>
            <button onClick={resetLab} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-white"><Trash2 className="h-4 w-4" /> Reset</button>
          </div>
        </div>
      </header>
      <section className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_390px]">
        <div className="h-[690px] overflow-hidden rounded-3xl border bg-white shadow">
          <ReactFlow nodes={decorateEdges(typedEdges, typedNodes, selectedEdgeId).length ? nodes : nodes} edges={decorateEdges(typedEdges, typedNodes, selectedEdgeId)} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_, node) => { setSelectedId(node.id); setSelectedEdgeId(""); }} onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedId(""); setResult("Kabel dipilih. Klik Hapus Kabel untuk menghapusnya."); }} deleteKeyCode={["Backspace", "Delete"]} onEdgesDelete={(deleted) => { const deletedIds = new Set(deleted.map((edge) => edge.id)); const nextEdges = typedEdges.filter((edge) => !deletedIds.has(edge.id)); refreshAfterEdges(nextEdges); setSelectedEdgeId(""); }} fitView>
            <Background /><Controls /><MiniMap />
          </ReactFlow>
        </div>
        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-5 shadow"><h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Cable className="h-5 w-5" /> Test Ping</h2><label className="text-sm font-semibold">Dari Perangkat</label><select value={fromId} onChange={(event) => setFromId(event.target.value)} className="mt-1 w-full rounded-xl border p-2"><option value="">Pilih perangkat</option>{endDeviceNodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select><label className="mt-3 block text-sm font-semibold">Ke Perangkat</label><select value={toId} onChange={(event) => setToId(event.target.value)} className="mt-1 w-full rounded-xl border p-2"><option value="">Pilih perangkat</option>{endDeviceNodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select><button onClick={runPing} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white"><Play className="h-4 w-4" /> Test Ping</button><div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm font-medium">{result}</div></div>
          <div className="rounded-3xl bg-white p-5 shadow"><h2 className="mb-3 text-lg font-bold">Cek Otomatis Praktikum</h2><div className="space-y-2 text-sm"><div className="flex items-center gap-2">{endDeviceNodes.length >= 2 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Minimal 2 PC/Printer</div><div className="flex items-center gap-2">{hasSwitch ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Ada Switch</div><div className="flex items-center gap-2">{typedEdges.length >= 2 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Minimal 2 kabel</div><div className="flex items-center gap-2">{invalidCableCount === 0 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Kabel benar: {validCableCount}/{typedEdges.length}</div><div className="flex items-center gap-2">{configuredEndDeviceCount >= 2 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} IP terisi: {configuredEndDeviceCount}/{endDeviceNodes.length}</div></div></div>
          <div className="rounded-3xl bg-white p-5 shadow"><h2 className="mb-3 text-lg font-bold">Konfigurasi Perangkat</h2>{selectedNode ? (<div className="space-y-3"><div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-3">{getIcon(selectedNode.data.kind)}<span className="font-semibold">{selectedNode.data.kind}</span></div><label className="block text-sm font-semibold">Nama</label><input value={selectedNode.data.label} onChange={(event) => updateSelected("label", event.target.value)} className="w-full rounded-xl border p-2" />{canConfigureIp && (<><label className="block text-sm font-semibold">IP Address</label><input value={selectedNode.data.ip} onChange={(event) => updateSelected("ip", event.target.value)} className="w-full rounded-xl border p-2" placeholder="contoh: 192.168.1.2" /><label className="block text-sm font-semibold">Subnet Mask</label><input value={selectedNode.data.mask} onChange={(event) => updateSelected("mask", event.target.value)} className="w-full rounded-xl border p-2" placeholder="contoh: 255.255.255.0" /><label className="block text-sm font-semibold">Gateway</label><input value={selectedNode.data.gateway} onChange={(event) => updateSelected("gateway", event.target.value)} className="w-full rounded-xl border p-2" placeholder="contoh: 192.168.1.1" /></>)}</div>) : selectedEdge ? (<p className="text-slate-600">Kabel dipilih: <b>{selectedEdge.label}</b>. Tekan tombol <b>Hapus Kabel</b> atau tombol <b>Delete</b>.</p>) : (<p className="text-slate-500">Belum ada perangkat/kabel dipilih.</p>)}</div>
          <div className="rounded-3xl bg-white p-5 text-sm shadow"><b>Status Lampu & Kabel:</b><div className="mt-2 flex flex-wrap gap-3"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-500" /> Connected / kabel benar</div><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-yellow-400" /> Waiting / kabel salah</div><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500" /> Disconnected</div></div><p className="mt-2 text-slate-600">Kabel hijau = benar, merah = salah, abu putus-putus = console.</p></div>
        </aside>
      </section>
    </main>
  );
}
