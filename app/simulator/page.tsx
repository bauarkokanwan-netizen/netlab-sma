"use client";

// NetLab SMA simulator - latest version for Vercel build.
import { useState } from "react";
import { ReactFlow, Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Monitor, Server, Router, Printer, Plus } from "lucide-react";

const initialNodes: any[] = [];
const initialEdges: any[] = [];

function DeviceNode({ data }: any) {
  const Icon = data.kind === "PC" ? Monitor : data.kind === "Router" ? Router : data.kind === "Printer" ? Printer : Server;

  const statusColor = data.status === "connected"
    ? "bg-green-500"
    : data.status === "waiting"
    ? "bg-yellow-400"
    : "bg-red-500";

  return (
    <div className="relative rounded-2xl border-2 border-slate-700 bg-white p-4 min-w-[170px] text-center shadow">
      <Handle type="target" position={Position.Left} className="!bg-blue-600 !w-4 !h-4" />
      <Handle type="source" position={Position.Right} className="!bg-green-600 !w-4 !h-4" />

      <div className="flex justify-center items-center gap-2 font-bold">
        <Icon className="w-5 h-5" />
        {data.label}
      </div>

      {data.ip && (
        <div className="text-xs mt-1 text-slate-500">{data.ip}</div>
      )}

      <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold">
        <span className={`w-3 h-3 rounded-full ${statusColor}`}></span>
        {data.status}
      </div>
    </div>
  );
}

const nodeTypes = {
  device: DeviceNode,
};

export default function SimulatorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [cableType, setCableType] = useState("straight");

  function addDevice(kind: string) {
    const count = nodes.filter((n: any) => n.data.kind === kind).length + 1;

    const node = {
      id: `${kind}-${Date.now()}`,
      type: "device",
      position: {
        x: 100 + Math.random() * 300,
        y: 100 + Math.random() * 300,
      },
      data: {
        label: `${kind}${count}`,
        kind,
        ip: "",
        mask: "",
        gateway: "",
        status: "disconnected",
      },
    };

    setNodes((nds: any[]) => [...nds, node]);
  }

  function updateStatuses(nextEdges: any[]) {
    setNodes((nds: any[]) =>
      nds.map((node: any) => {
        const connected = nextEdges.some((e: any) => e.source === node.id || e.target === node.id);

        return {
          ...node,
          data: {
            ...node.data,
            status: connected ? "connected" : "disconnected",
          },
        };
      })
    );
  }

  function onConnect(params: any) {
    const newEdges = addEdge(
      {
        ...params,
        animated: true,
        label: cableType,
      },
      edges
    );

    setEdges(newEdges);
    updateStatuses(newEdges);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={cableType}
          onChange={(e) => setCableType(e.target.value)}
          className="rounded-xl border px-3 py-2"
        >
          <option value="straight">Straight</option>
          <option value="crossover">Crossover</option>
          <option value="console">Console</option>
        </select>

        <button onClick={() => addDevice("PC")} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> PC
        </button>

        <button onClick={() => addDevice("Switch")} className="bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Switch
        </button>

        <button onClick={() => addDevice("Router")} className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Router
        </button>

        <button onClick={() => addDevice("Printer")} className="bg-amber-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Printer
        </button>
      </div>

      <div className="h-[700px] rounded-3xl overflow-hidden border bg-white shadow">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 text-sm shadow">
        <b>Status Lampu Port:</b>
        <div className="mt-2 flex gap-4">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Connected</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400"></span> Waiting</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Disconnected</div>
        </div>
      </div>
    </main>
  );
}
