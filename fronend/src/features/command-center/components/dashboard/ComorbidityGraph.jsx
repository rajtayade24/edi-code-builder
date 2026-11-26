import { useState } from "react";
import { CheckCircle2, Filter, HeartPulse, Network, Sparkles } from "lucide-react";
import { useClinicalStore } from "../../store/useClinicalStore";

export function ComorbidityGraph() {
  const { activePatient, selectedGatNode, setSelectedGatNode } = useClinicalStore();
  const { gatNodes } = activePatient;
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Cardiovascular", "Renal", "Endocrine", "Pulmonary", "Vascular"];

  const filteredNodes =
    selectedCategory === "All" ? gatNodes : gatNodes.filter((n) => n.category === selectedCategory);

  const getNodePos = (node, index) => {
    if (node.x && node.y) return { x: node.x, y: node.y };
    const total = filteredNodes.length || 1;
    const angle = (index / total) * 2 * Math.PI;
    return {
      x: 350 + Math.cos(angle) * 160,
      y: 200 + Math.sin(angle) * 110,
    };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Network className="h-5 w-5 text-navy-900" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Interacting Co-Morbidity Graph (GAT View)
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-navy-50 text-navy-900 border border-navy-200">
              GAT Neural Layer
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Non-linear cross-disease interactions. Line thickness and pulse intensity indicate GAT attention weight.
          </p>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {gatNodes.length === 0 ? (
        <div className="h-64 flex-1 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center p-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No Chronic Co-Morbidity Nodes Detected</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Patient profile indicates zero chronic organ system co-morbidities. GAT network attention is unweighted.
          </p>
        </div>
      ) : filteredNodes.length === 0 ? (
        <div className="h-64 flex-1 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center p-6">
          <Network className="h-10 w-10 text-slate-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No {selectedCategory} Nodes</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            No active co-morbidities match the selected organ-system filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          <div className="lg:col-span-8 bg-slate-900/95 border border-slate-800 rounded-xl relative overflow-hidden h-[380px] shadow-inner flex items-center justify-center">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />

            <svg className="w-full h-full relative z-10" viewBox="0 0 700 400">
              <defs>
                <linearGradient id="edgeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0D9488" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.9" />
                </linearGradient>

                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {filteredNodes.map((node, i) => {
                const posA = getNodePos(node, i);
                return node.connectsTo.map((targetId) => {
                  const targetIndex = filteredNodes.findIndex((n) => n.id === targetId);
                  if (targetIndex === -1) return null;
                  const targetNode = filteredNodes[targetIndex];
                  const posB = getNodePos(targetNode, targetIndex);

                  const weight = (node.attentionWeight + targetNode.attentionWeight) / 2;
                  const strokeWidth = Math.max(1.5, weight * 5);
                  const isSelectedEdge =
                    selectedGatNode?.id === node.id || selectedGatNode?.id === targetNode.id;

                  return (
                    <g key={`${node.id}-${targetId}`}>
                      <line
                        x1={posA.x}
                        y1={posA.y}
                        x2={posB.x}
                        y2={posB.y}
                        stroke={isSelectedEdge ? "#F59E0B" : "url(#edgeGlow)"}
                        strokeWidth={isSelectedEdge ? strokeWidth + 2 : strokeWidth}
                        strokeOpacity={isSelectedEdge ? 1 : 0.6}
                        filter="url(#glow)"
                        className="transition-all duration-300"
                      />
                      {weight > 0.7 ? (
                        <circle r="3" fill="#F59E0B" filter="url(#glow)">
                          <animateMotion
                            path={`M ${posA.x} ${posA.y} L ${posB.x} ${posB.y}`}
                            dur={`${Math.max(1.5, 4 - weight * 3)}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      ) : null}
                    </g>
                  );
                });
              })}

              {filteredNodes.map((node, index) => {
                const pos = getNodePos(node, index);
                const isSelected = selectedGatNode?.id === node.id;
                const nodeRadius = 24 + node.attentionWeight * 12;

                const nodeColor =
                  node.severity === "critical"
                    ? "#EF4444"
                    : node.severity === "high"
                    ? "#F59E0B"
                    : "#10B981";

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedGatNode(node)}
                    className="cursor-pointer group"
                    transform={`translate(${pos.x}, ${pos.y})`}
                  >
                    {node.attentionWeight > 0.7 ? (
                      <circle
                        r={nodeRadius + 8}
                        fill="none"
                        stroke={nodeColor}
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                        className="animate-ping"
                      />
                    ) : null}

                    <circle
                      r={nodeRadius + 4}
                      fill={isSelected ? "#F59E0B" : nodeColor}
                      fillOpacity={isSelected ? 0.3 : 0.15}
                      stroke={isSelected ? "#F59E0B" : nodeColor}
                      strokeWidth={isSelected ? 3 : 2}
                      filter="url(#glow)"
                    />

                    <circle
                      r={nodeRadius}
                      fill={isSelected ? "#1E3A8A" : "#0F172A"}
                      stroke={isSelected ? "#F59E0B" : nodeColor}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-transform group-hover:scale-110"
                    />

                    <text
                      textAnchor="middle"
                      dy="-2"
                      fill="#FFFFFF"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {(node.attentionWeight * 100).toFixed(0)}%
                    </text>
                    <text textAnchor="middle" dy="10" fill="#94A3B8" fontSize="8" fontWeight="600">
                      ATTN
                    </text>

                    <text
                      textAnchor="middle"
                      dy={nodeRadius + 18}
                      fill="#F8FAFC"
                      fontSize="11"
                      fontWeight="bold"
                      className="drop-shadow-md"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="absolute bottom-2 left-3 text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Click node to reveal neural GAT attention details &amp; ICD code</span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            {selectedGatNode ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-bold">
                    ICD-10: {selectedGatNode.icdCode}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      selectedGatNode.severity === "critical"
                        ? "bg-rose-100 text-rose-800"
                        : selectedGatNode.severity === "high"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {selectedGatNode.severity} Severity
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{selectedGatNode.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedGatNode.category} System</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">GAT Attention Weight:</span>
                    <strong className="text-navy-900 font-mono text-sm font-bold">
                      {(selectedGatNode.attentionWeight * 100).toFixed(1)}%
                    </strong>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-navy-900 h-full rounded-full"
                      style={{ width: `${selectedGatNode.attentionWeight * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">Clinical Context &amp; Interaction:</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200 rounded-lg p-2.5">
                    {selectedGatNode.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">
                    Interacting Co-morbidities ({selectedGatNode.connectsTo.length}):
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedGatNode.connectsTo.map((id) => {
                      const connected = gatNodes.find((n) => n.id === id);
                      return (
                        <span
                          key={id}
                          className="text-[11px] bg-white border border-slate-300 text-slate-700 px-2 py-0.5 rounded font-medium"
                        >
                          {connected?.name || id}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <HeartPulse className="h-10 w-10 text-slate-400 mb-2" />
                <h4 className="text-sm font-bold text-slate-800">Select Co-Morbidity Node</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Click any disease node in the Graph Attention Network to view specific cross-disease attention weights and clinical implications.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
