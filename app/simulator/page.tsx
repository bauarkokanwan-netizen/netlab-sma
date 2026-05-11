"use client";

import { useMemo, useState } from "react";
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
  Laptop,
  Monitor,
  Play,
  Plus,
  Printer,
  Router,
  Server,
  Smartphone,
  Trash2,
  Wifi,
  XCircle,
  Wand2,
} from "lucide-react";

type DeviceKind = "PC" | "Switch" | "Router" | "Printer" | "DHCP" | "Laptop" | "Smartphone" | "AP";
type CableKind = "straight" | "crossover" | "console" | "wireless";
type PortStatus = "connected" | "waiting" | "disconnected";

type AppNode = {
  id: string;
  type: "device";
  position: { x: number; y: number };
  data: {
    label: string;
    kind: DeviceKind;
    ip: string;
    mask: string;
    gateway: string;
    status: PortStatus;
  };
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
  return kind === "PC" || kind === "Printer" || kind === "Laptop" || kind === "Smartphone";
}

function isHostLike(kind: DeviceKind) {
  return kind === "PC" || kind === "Printer" || kind === "DHCP" || kind === "Laptop" || kind === "Smartphone";
}

function isWirelessClient(kind: DeviceKind) {
  return kind === "Laptop" || kind === "Smartphone";
}

function isConfigured(node?: AppNode) {
  if (!node) return false;
  if (!isEndDevice(node.data.kind)) return true;
  return Boolean(node.data.ip.trim() && node.data.mask.trim());
}

function cableLabel(type: CableKind) {
  if (type === "straight") return "Straight";
  if (type === "crossover") return "Crossover";
  if (type === "wireless") return "Wireless";
  return "Console";
}

function getSubnet24(ip = "") {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return "";
  return parts.slice(0, 3).join(".");
}

function isCorrectCable(sourceKind: DeviceKind, targetKind: DeviceKind, cableType: CableKind) {
  if (cableType === "console") return false;
  if (cableType === "wireless") {
    return (
      (isWirelessClient(sourceKind) && targetKind === "AP") ||
      (isWirelessClient(targetKind) && sourceKind === "AP")
    );
  }

  const sourceHost = isHostLike(sourceKind);
  const targetHost = isHostLike(targetKind);
  if (sourceHost && targetHost) return cableType === "crossover";
  if ((sourceHost && targetKind === "Switch") || (targetHost && sourceKind === "Switch")) return cableType === "straight";
  if ((sourceKind === "Router" && targetKind === "Switch") || (sourceKind === "Switch" && targetKind === "Router")) return cableType === "straight";
  if ((sourceKind === "AP" && targetKind === "Switch") || (sourceKind === "Switch" && targetKind === "AP")) return cableType === "straight";
  if ((sourceKind === "AP" && targetKind === "Router") || (sourceKind === "Router" && targetKind === "AP")) return cableType === "straight";
  return true;
}

function cableStyle(sourceKind: DeviceKind, targetKind: DeviceKind, cableType: CableKind, selected = false) {
  const valid = isCorrectCable(sourceKind, targetKind, cableType);
  const stroke = cableType === "console" ? "#64748b" : cableType === "wireless" ? valid ? "#2563eb" : "#dc2626" : valid ? "#16a34a" : "#dc2626";
  const style: Record<string, string | number> = { stroke, strokeWidth: selected ? 4 : 2.5 };
  if (cableType === "console") style.strokeDasharray = "6 4";
  if (cableType === "wireless") style.strokeDasharray = "2 6";
  return style;
}

function DeviceNode({ data }: any) {
  const Icon = data.kind === "PC" ? Monitor : data.kind === "Router" ? Router : data.kind === "Printer" ? Printer : data.kind === "Laptop" ? Laptop : data.kind === "Smartphone" ? Smartphone : data.kind === "AP" ? Wifi : Server;
  const statusClass = data.status === "connected" ? "bg-green-500" : data.status === "waiting" ? "bg-yellow-400" : "bg-red-500";

  return (
    <div className="relative min-w-[170px] rounded-2xl border-2 border-slate-700 bg-white px-4 py-3 text-center shadow-sm">
      <Handle type="target" position={Position.Left} id="left-target" className="!h-4 !w-4 !border-2 !border-white !bg-blue-600" />
      <Handle type="source" position={Position.Right} id="right-source" className="!h-4 !w-4 !border-2 !border-white !bg-green-600" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!h-4 !w-4 !border-2 !border-white !bg-green-600" />
      <Handle type="target" position={Position.Top} id="top-target" className="!h-4 !w-4 !border-2 !border-white !bg-blue-600" />
      <div className="flex items-center justify-center gap-2 font-semibold"><Icon className="h-5 w-5" /><span>{data.label}</span></div>
      {data.ip ? <div className="mt-1 text-xs text-slate-600">{data.ip}</div> : null}
      <div className="mt-2 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-700"><span className={`h-3 w-3 rounded-full ${statusClass}`} />{data.status}</div>
    </div>
  );
}

const nodeTypes = { device: DeviceNode };

function getIcon(kind: DeviceKind) {
  if (kind === "PC") return <Monitor className="h-5 w-5" />;
  if (kind === "Router") return <Router className="h-5 w-5" />;
  if (kind === "Printer") return <Printer className="h-5 w-5" />;
  if (kind === "Laptop") return <Laptop className="h-5 w-5" />;
  if (kind === "Smartphone") return <Smartphone className="h-5 w-5" />;
  if (kind === "AP") return <Wifi className="h-5 w-5" />;
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
      const allCableAndIpReady = connectedEdges.every((edge) => {
        const source = nodes.find((item) => item.id === edge.source);
        const target = nodes.find((item) => item.id === edge.target);
        if (!source || !target) return false;
        const cableOk = isCorrectCable(source.data.kind, target.data.kind, edge.data?.cableType || "straight");
        const ipOk = isConfigured(source) && isConfigured(target);
        return cableOk && ipOk;
      });
      status = allCableAndIpReady ? "connected" : "waiting";
    }
    return { ...node, data: { ...node.data, status } };
  });
}

function physicalConnected(start: string, end: string, edges: AppEdge[], nodes: AppNode[]) {
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

function buildNetworkGraph(edges: AppEdge[], nodes: AppNode[]) {
  const graph = new Map<string, string[]>();
  for (const edge of edges) {
    const source = nodes.find((node) => node.id === edge.source);
    const target = nodes.find((node) => node.id === edge.target);
    if (!source || !target) continue;
    const currentCableType = edge.data?.cableType || "straight";
    if (!isCorrectCable(source.data.kind, target.data.kind, currentCableType)) continue;
    if (!isConfigured(source) || !isConfigured(target)) continue;
    graph.set(edge.source, [...(graph.get(edge.source) || []), edge.target]);
    graph.set(edge.target, [...(graph.get(edge.target) || []), edge.source]);
  }
  return graph;
}

function networkConnected(start: string, end: string, edges: AppEdge[], nodes: AppNode[]) {
  const graph = buildNetworkGraph(edges, nodes);
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

function findPacketPath(start: string, end: string, edges: AppEdge[], nodes: AppNode[]) {
  const graph = buildNetworkGraph(edges, nodes);
  const queue: string[][] = [[start]];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    if (current === end) return path.map((id) => nodes.find((node) => node.id === id)?.data.label || id);
    visited.add(current);
    for (const next of graph.get(current) || []) if (!visited.has(next)) queue.push([...path, next]);
  }
  return [];
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
  const [packetRoute, setPacketRoute] = useState<string[]>([]);
  const [packetStep, setPacketStep] = useState(0);

  const typedNodes = nodes as AppNode[];
  const typedEdges = edges as AppEdge[];
  const decoratedEdges = decorateEdges(typedEdges, typedNodes, selectedEdgeId);
  const selectedNode = typedNodes.find((node) => node.id === selectedId);
  const selectedEdge = typedEdges.find((edge) => edge.id === selectedEdgeId);
  const endDeviceNodes = useMemo(() => typedNodes.filter((node) => isEndDevice(node.data.kind)), [typedNodes]);
  const hasSwitch = typedNodes.some((node) => node.data.kind === "Switch");
  const hasDhcp = typedNodes.some((node) => node.data.kind === "DHCP");
  const hasWirelessAp = typedNodes.some((node) => node.data.kind === "AP");
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

  function animatePacket(route: string[]) {
    setPacketRoute(route);
    setPacketStep(0);
    let step = 0;
    const intervalId = window.setInterval(() => {
      step += 1;
      setPacketStep(step);
      if (step >= route.length - 1) window.clearInterval(intervalId);
    }, 650);
  }

  function addDevice(kind: DeviceKind) {
    const count = typedNodes.filter((node) => node.data.kind === kind).length + 1;
    const id = `${kind.toLowerCase()}-${Date.now()}`;
    const label = kind === "DHCP" ? `DHCP${count}` : kind === "AP" ? `AP${count}` : `${kind}${count}`;
    const newNode: AppNode = { id, type: "device", position: { x: 120 + count * 35, y: 120 + count * 35 }, data: { label, kind, ip: "", mask: "", gateway: "", status: "disconnected" } };
    setNodes((currentNodes: AppNode[]) => [...currentNodes, newNode]);
    setSelectedId(id);
    setSelectedEdgeId("");
    if (isEndDevice(kind)) {
      setFromId((prev) => prev || id);
      setToId((prev) => prev || id);
    }
  }

  function updateSelected(field: keyof AppNode["data"], value: string) {
    setNodes((currentNodes: AppNode[]) => {
      const updatedNodes = currentNodes.map((node) => node.id === selectedId ? { ...node, data: { ...node.data, [field]: value } } : node);
      return updateNodeStatuses(updatedNodes, typedEdges);
    });
  }

  function autoIpSelectedDevice() {
    if (!selectedNode || !isEndDevice(selectedNode.data.kind)) return setResult("Pilih PC, Laptop, Smartphone, atau Printer terlebih dahulu untuk Auto IP.");
    const dhcpServer = typedNodes.find((node) => node.data.kind === "DHCP");
    if (!dhcpServer) return setResult("❌ Auto IP gagal: tambahkan DHCP Server terlebih dahulu.");
    if (!physicalConnected(selectedNode.id, dhcpServer.id, typedEdges, typedNodes)) return setResult("❌ Auto IP gagal: perangkat belum terhubung ke DHCP Server dengan kabel/wireless yang benar.");
    const usedIps = new Set(typedNodes.map((node) => node.data.ip).filter(Boolean));
    let nextIp = "";
    for (let host = 10; host <= 254; host++) {
      const candidate = `192.168.1.${host}`;
      if (!usedIps.has(candidate)) { nextIp = candidate; break; }
    }
    if (!nextIp) return setResult("❌ Auto IP gagal: pool DHCP sudah penuh.");
    setNodes((currentNodes: AppNode[]) => {
      const updatedNodes = currentNodes.map((node) => node.id === selectedNode.id ? { ...node, data: { ...node.data, ip: nextIp, mask: "255.255.255.0", gateway: "192.168.1.1" } } : node);
      return updateNodeStatuses(updatedNodes, typedEdges);
    });
    setResult(`✅ DHCP berhasil: ${selectedNode.data.label} mendapat IP ${nextIp}.`);
  }

  function removeSelectedCable() {
    if (!selectedEdgeId) return setResult("Klik kabel/wireless link yang ingin dihapus terlebih dahulu.");
    const nextEdges = typedEdges.filter((edge) => edge.id !== selectedEdgeId);
    setEdges(nextEdges);
    refreshAfterEdges(nextEdges);
    setSelectedEdgeId("");
    setResult("Koneksi berhasil dihapus.");
  }

  function removeSelectedDevice() {
    if (!selectedId) return setResult("Klik perangkat yang ingin dihapus terlebih dahulu.");
    const removedNode = typedNodes.find((node) => node.id === selectedId);
    const nextNodes = typedNodes.filter((node) => node.id !== selectedId);
    const nextEdges = typedEdges.filter((edge) => edge.source !== selectedId && edge.target !== selectedId);
    setNodes(updateNodeStatuses(nextNodes, nextEdges));
    setEdges(nextEdges);
    setSelectedId("");
    setSelectedEdgeId("");
    if (fromId === selectedId) setFromId("");
    if (toId === selectedId) setToId("");
    setResult(`${removedNode?.data.label || "Perangkat"} berhasil dihapus beserta koneksi yang terhubung.`);
  }

  function resetLab() {
    setNodes([]); setEdges([]); setSelectedId(""); setSelectedEdgeId(""); setFromId(""); setToId(""); setPacketRoute([]); setPacketStep(0);
    setResult("Canvas dikosongkan. Mulai praktik dari awal.");
  }

  function onConnect(connection: any) {
    setEdges((currentEdges: any[]) => {
      const nextRaw = addEdge({ ...connection, animated: true, label: cableLabel(cableType), data: { cableType } }, currentEdges) as AppEdge[];
      setNodes((currentNodes: AppNode[]) => updateNodeStatuses(currentNodes, nextRaw));
      return decorateEdges(nextRaw, typedNodes, selectedEdgeId);
    });
  }

  function runPing() {
    const from = typedNodes.find((node) => node.id === fromId);
    const to = typedNodes.find((node) => node.id === toId);
    if (!from || !to || fromId === toId) return setResult("Tambahkan minimal 2 PC/Laptop/Smartphone/Printer, lalu pilih asal dan tujuan yang berbeda.");
    if (!isEndDevice(from.data.kind) || !isEndDevice(to.data.kind)) return setResult("Ping hanya bisa dilakukan dari/ke PC, Laptop, Smartphone, atau Printer.");
    if (!from.data.ip || !to.data.ip) return setResult("❌ Ping gagal: IP address perangkat belum lengkap.");
    if (!networkConnected(from.id, to.id, typedEdges, typedNodes)) return setResult(`❌ Ping gagal: ${from.data.label} belum terhubung ke ${to.data.label}, atau jenis koneksi salah.`);
    if (getSubnet24(from.data.ip) !== getSubnet24(to.data.ip)) return setResult(`❌ Ping gagal: subnet berbeda. ${from.data.ip} dan ${to.data.ip} tidak satu jaringan /24.`);
    const route = findPacketPath(from.id, to.id, typedEdges, typedNodes);
    animatePacket(route);
    setResult(`✅ Ping berhasil: ${from.data.label} dapat terhubung ke ${to.data.label}. Packet dikirim melalui ${route.join(" → ")}.`);
  }

  const canConfigureIp = selectedNode ? isEndDevice(selectedNode.data.kind) : false;

  return (
    <main className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold">NetLab SMA - Simulator</h1><p className="text-sm text-slate-500">Pilih kabel/wireless, tambah perangkat, isi IP manual atau gunakan DHCP, lalu test ping.</p></div>
          <div className="flex flex-wrap gap-2">
            <select value={cableType} onChange={(event) => setCableType(event.target.value as CableKind)} className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold"><option value="straight">Kabel Straight</option><option value="crossover">Kabel Crossover</option><option value="wireless">Wireless</option><option value="console">Kabel Console</option></select>
            <button onClick={() => addDevice("PC")} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white"><Plus className="h-4 w-4" /> PC</button>
            <button onClick={() => addDevice("Laptop")} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-white"><Plus className="h-4 w-4" /> Laptop</button>
            <button onClick={() => addDevice("Smartphone")} className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-white"><Plus className="h-4 w-4" /> Smartphone</button>
            <button onClick={() => addDevice("AP")} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white"><Plus className="h-4 w-4" /> Wireless AP</button>
            <button onClick={() => addDevice("Switch")} className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-white"><Plus className="h-4 w-4" /> Switch</button>
            <button onClick={() => addDevice("Router")} className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-white"><Plus className="h-4 w-4" /> Router</button>
            <button onClick={() => addDevice("Printer")} className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-white"><Plus className="h-4 w-4" /> Printer</button>
            <button onClick={() => addDevice("DHCP")} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white"><Plus className="h-4 w-4" /> DHCP</button>
            <button onClick={removeSelectedDevice} className="flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-white"><Trash2 className="h-4 w-4" /> Hapus Perangkat</button>
            <button onClick={removeSelectedCable} className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-white"><Trash2 className="h-4 w-4" /> Hapus Koneksi</button>
            <button onClick={resetLab} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-white"><Trash2 className="h-4 w-4" /> Reset</button>
          </div>
        </div>
      </header>

      <section className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_390px]">
        <div className="h-[690px] overflow-hidden rounded-3xl border bg-white shadow">
          <ReactFlow nodes={nodes} edges={decoratedEdges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_, node) => { setSelectedId(node.id); setSelectedEdgeId(""); }} onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedId(""); setResult("Koneksi dipilih. Klik Hapus Koneksi untuk menghapusnya."); }} deleteKeyCode={["Backspace", "Delete"]} onEdgesDelete={(deleted) => { const deletedIds = new Set(deleted.map((edge) => edge.id)); const nextEdges = typedEdges.filter((edge) => !deletedIds.has(edge.id)); refreshAfterEdges(nextEdges); setSelectedEdgeId(""); }} fitView>
            <Background /><Controls /><MiniMap />
          </ReactFlow>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-5 shadow"><h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Cable className="h-5 w-5" /> Test Ping</h2><label className="text-sm font-semibold">Dari Perangkat</label><select value={fromId} onChange={(event) => setFromId(event.target.value)} className="mt-1 w-full rounded-xl border p-2"><option value="">Pilih perangkat</option>{endDeviceNodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select><label className="mt-3 block text-sm font-semibold">Ke Perangkat</label><select value={toId} onChange={(event) => setToId(event.target.value)} className="mt-1 w-full rounded-xl border p-2"><option value="">Pilih perangkat</option>{endDeviceNodes.map((node) => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select><button onClick={runPing} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white"><Play className="h-4 w-4" /> Test Ping</button><div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm font-medium">{result}</div></div>

          <div className="rounded-3xl bg-white p-5 shadow"><h2 className="mb-3 text-lg font-bold">Packet Animation</h2>{packetRoute.length > 0 ? (<div className="rounded-2xl bg-blue-50 p-4 text-sm"><div className="mb-3 font-semibold">Simulasi paket berjalan:</div><div className="flex flex-wrap items-center gap-2">{packetRoute.map((label, index) => (<div key={`${label}-${index}`} className="flex items-center gap-2"><span className={`rounded-xl px-3 py-2 font-semibold ${index === packetStep ? "bg-blue-600 text-white" : index < packetStep ? "bg-green-100 text-green-700" : "bg-white text-slate-700"}`}>{index === packetStep ? "📦 " : ""}{label}</span>{index < packetRoute.length - 1 ? <span className="font-bold text-blue-500">→</span> : null}</div>))}</div></div>) : (<p className="text-sm text-slate-500">Klik Test Ping berhasil untuk melihat paket bergerak dari asal ke tujuan.</p>)}</div>

          <div className="rounded-3xl bg-white p-5 shadow"><h2 className="mb-3 text-lg font-bold">Cek Otomatis Praktikum</h2><div className="space-y-2 text-sm"><div className="flex items-center gap-2">{endDeviceNodes.length >= 2 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Minimal 2 end device</div><div className="flex items-center gap-2">{hasSwitch ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Ada Switch</div><div className="flex items-center gap-2">{hasWirelessAp ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Wireless AP tersedia</div><div className="flex items-center gap-2">{hasDhcp ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} DHCP Server tersedia</div><div className="flex items-center gap-2">{typedEdges.length >= 2 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Minimal 2 koneksi</div><div className="flex items-center gap-2">{invalidCableCount === 0 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} Koneksi benar: {validCableCount}/{typedEdges.length}</div><div className="flex items-center gap-2">{configuredEndDeviceCount >= 2 ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />} IP terisi: {configuredEndDeviceCount}/{endDeviceNodes.length}</div></div></div>

          <div className="rounded-3xl bg-white p-5 shadow"><h2 className="mb-3 text-lg font-bold">Konfigurasi Perangkat</h2>{selectedNode ? (<div className="space-y-3"><div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-3">{getIcon(selectedNode.data.kind)}<span className="font-semibold">{selectedNode.data.kind}</span></div><label className="block text-sm font-semibold">Nama</label><input value={selectedNode.data.label} onChange={(event) => updateSelected("label", event.target.value)} className="w-full rounded-xl border p-2" />{canConfigureIp && (<><div className="rounded-2xl bg-slate-50 p-3 text-sm"><b>Mode IP:</b> isi manual untuk Static IP, atau klik Auto IP untuk Dynamic IP dari DHCP.</div><label className="block text-sm font-semibold">IP Address</label><input value={selectedNode.data.ip} onChange={(event) => updateSelected("ip", event.target.value)} className="w-full rounded-xl border p-2" placeholder="contoh: 192.168.1.2" /><label className="block text-sm font-semibold">Subnet Mask</label><input value={selectedNode.data.mask} onChange={(event) => updateSelected("mask", event.target.value)} className="w-full rounded-xl border p-2" placeholder="contoh: 255.255.255.0" /><label className="block text-sm font-semibold">Gateway</label><input value={selectedNode.data.gateway} onChange={(event) => updateSelected("gateway", event.target.value)} className="w-full rounded-xl border p-2" placeholder="contoh: 192.168.1.1" /><button onClick={autoIpSelectedDevice} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white"><Wand2 className="h-4 w-4" /> Auto IP dari DHCP</button></>)}</div>) : selectedEdge ? (<p className="text-slate-600">Koneksi dipilih: <b>{selectedEdge.label}</b>. Tekan tombol <b>Hapus Koneksi</b> atau tombol <b>Delete</b>.</p>) : (<p className="text-slate-500">Belum ada perangkat/koneksi dipilih.</p>)}</div>

          <div className="rounded-3xl bg-white p-5 text-sm shadow"><b>Status Lampu & Koneksi:</b><div className="mt-2 flex flex-wrap gap-3"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-500" /> Connected / koneksi benar + IP lengkap</div><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-yellow-400" /> Waiting / koneksi salah atau IP belum lengkap</div><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500" /> Disconnected</div></div><p className="mt-2 text-slate-600">Wireless: Laptop/Smartphone ↔ Wireless AP pakai tipe Wireless. AP ↔ Switch/Router pakai Straight.</p></div>
        </aside>
      </section>
    </main>
  );
}
