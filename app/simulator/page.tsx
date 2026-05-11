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
import { Cable, Monitor, Router, Server, Plus, Play, Trash2 } from "lucide-react";

type DeviceKind = "PC" | "Switch" | "Router";

type DeviceData = {
  label: string;
  kind: DeviceKind;
  ip?: string;
  mask?: string;
  gateway?: string;
} & Record<string, unknown>;

type AppNode = Node<DeviceData, "device">;

function DeviceNode({ data }: NodeProps<AppNode>) {
  const Icon = data.kind === "PC" ? Monitor : data.kind === "Router" ? Router : Server;

  return (
    <div className="relative min-w-[170px] rounded-2xl border-2 border-slate-700 bg-white px-4 py-3 text-center shadow-sm">
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!h-4 !w-4 !border-2 !border-white !bg-blue-600"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!h-4 !w-4 !border-2 !border-white !bg-green-600"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!h-4 !w-4 !border-2 !border-white !bg-green-600"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!h-4 !w-4 !border-2 !border-white !bg-blue-600"
      />

      <div className="flex items-center justify-center gap-2 font-semibold">
        <Icon className="h-5 w-5" />
        <span>{String(data.label)}</span>
      </div>
      {data.ip ? <div className="mt-1 text-xs text-slate-600">{String(data.ip)}</div> : null}
    </div>
  );
}

const nodeTypes = {
  device: DeviceNode,
};

const initialNodes: AppNode[] = [
  {
    id: "pc-1",
    type: "device",
    position: { x: 80, y: 120 },
    data: { label: "PC1", kind: "PC", ip: "192.168.1.2", mask: "255.255.255.0", gateway: "" },
  },
  {
    id: "sw-1",
    type: "device",
    position: { x: 340, y: 120 },
    data: { label: "Switch1", kind: "Switch" },
  },
  {
    id: "pc-2",
    type: "device",
    position: { x: 600, y: 120 },
    data: { label: "PC2", kind: "PC", ip: "192.168.1.3", mask: "255.255.255.0", gateway: "" },
  },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "pc-1", sourceHandle: "right-source", target: "sw-1", targetHandle: "left-target", animated: true },
  { id: "e2", source: "sw-1", sourceHandle: "right-source", target: "pc-2", targetHandle: "left-target", animated: true },
];

function getSubnet24(ip = "") {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return "";
  return parts.slice(0, 3).join(".");
}

function isConnected(start: string, end: string, edges: Edge[]) {
  const graph = new Map<string, string[]>();
  for (const edge of edges) {
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
  return <Server className="h-5 w-5" />;
}

export default function SimulatorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState("pc-1");
  const [fromId, setFromId] = useState("pc-1");
  const [toId, setToId] = useState("pc-2");
  const [result, setResult] = useState("Hubungkan perangkat, atur IP, lalu klik Test Ping.");

  const selectedNode = nodes.find((node) => node.id === selectedId);

  const pcNodes = useMemo(() => nodes.filter((node) => node.data.kind === "PC"), [nodes]);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges]
  );

  function addDevice(kind: DeviceKind) {
    const count = nodes.filter((node) => node.data.kind === kind).length + 1;
    const id = `${kind.toLowerCase()}-${Date.now()}`;
    const newNode: AppNode = {
      id,
      type: "device",
      position: { x: 120 + count * 35, y: 260 + count * 20 },
      data: {
        label: `${kind}${count}`,
        kind,
        ip: kind === "PC" ? `192.168.1.${count + 10}` : "",
        mask: kind === "PC" ? "255.255.255.0" : "",
        gateway: "",
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedId(id);
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

    if (!from || !to) {
      setResult("Pilih PC asal dan PC tujuan terlebih dahulu.");
      return;
    }

    if (from.data.kind !== "PC" || to.data.kind !== "PC") {
      setResult("Ping hanya bisa dilakukan antar PC.");
      return;
    }

    if (!isConnected(from.id, to.id, edges)) {
      setResult(`❌ Ping gagal: ${from.data.label} belum terhubung ke ${to.data.label}.`);
      return;
    }

    if (!from.data.ip || !to.data.ip) {
      setResult("❌ Ping gagal: IP address PC belum lengkap.");
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
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedId("pc-1");
    setFromId("pc-1");
    setToId("pc-2");
    setResult("Lab direset. Coba praktik dari awal.");
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">NetLab SMA - Simulator</h1>
            <p className="text-sm text-slate-500">Klik perangkat untuk edit IP. Tarik kabel dari port warna biru/hijau ke perangkat lain.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => addDevice("PC")} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white">
              <Plus className="h-4 w-4" /> PC
            </button>
            <button onClick={() => addDevice("Switch")} className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-white">
              <Plus className="h-4 w-4" /> Switch
            </button>
            <button onClick={() => addDevice("Router")} className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-white">
              <Plus className="h-4 w-4" /> Router
            </button>
            <button onClick={resetLab} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-white">
              <Trash2 className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>
      </header>

      <section className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_360px]">
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
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <Cable className="h-5 w-5" /> Test Ping
            </h2>
            <label className="text-sm font-semibold">Dari PC</label>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="mt-1 w-full rounded-xl border p-2">
              {pcNodes.map((node) => (
                <option key={node.id} value={node.id}>{String(node.data.label)}</option>
              ))}
            </select>

            <label className="mt-3 block text-sm font-semibold">Ke PC</label>
            <select value={toId} onChange={(e) => setToId(e.target.value)} className="mt-1 w-full rounded-xl border p-2">
              {pcNodes.map((node) => (
                <option key={node.id} value={node.id}>{String(node.data.label)}</option>
              ))}
            </select>

            <button onClick={runPing} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white">
              <Play className="h-4 w-4" /> Test Ping
            </button>

            <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm font-medium">
              {result}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow">
            <h2 className="mb-3 text-lg font-bold">Konfigurasi Perangkat</h2>
            {selectedNode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-3">
                  {getIcon(selectedNode.data.kind)}
                  <span className="font-semibold">{selectedNode.data.kind}</span>
                </div>

                <label className="block text-sm font-semibold">Nama</label>
                <input value={String(selectedNode.data.label)} onChange={(e) => updateSelected("label", e.target.value)} className="w-full rounded-xl border p-2" />

                {selectedNode.data.kind === "PC" && (
                  <>
                    <label className="block text-sm font-semibold">IP Address</label>
                    <input value={String(selectedNode.data.ip || "")} onChange={(e) => updateSelected("ip", e.target.value)} className="w-full rounded-xl border p-2" placeholder="192.168.1.2" />

                    <label className="block text-sm font-semibold">Subnet Mask</label>
                    <input value={String(selectedNode.data.mask || "")} onChange={(e) => updateSelected("mask", e.target.value)} className="w-full rounded-xl border p-2" placeholder="255.255.255.0" />

                    <label className="block text-sm font-semibold">Gateway</label>
                    <input value={String(selectedNode.data.gateway || "")} onChange={(e) => updateSelected("gateway", e.target.value)} className="w-full rounded-xl border p-2" placeholder="192.168.1.1" />
                  </>
                )}
              </div>
            ) : (
              <p className="text-slate-500">Klik perangkat di canvas.</p>
            )}
          </div>

          <div className="rounded-3xl bg-blue-50 p-5 text-sm text-slate-700">
            <b>Catatan guru:</b> Port biru/hijau adalah titik koneksi kabel. Tarik dari satu port ke port perangkat lain.
          </div>
        </aside>
      </section>
    </main>
  );
}
