import { useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, AlertTriangle } from "lucide-react";
import { useClinicalStore } from "../../store/useClinicalStore";

export function TimeSeriesVitals() {
  const { activePatient } = useClinicalStore();
  const { vitalsSeries } = activePatient;
  const [activeTab, setActiveTab] = useState("map-hr");

  const mapAlertPoints = vitalsSeries.filter((v) => v.isMapAlert || v.map < 65);
  const hasAlertZone = mapAlertPoints.length > 0;
  const lowestAlertPoint = hasAlertZone
    ? mapAlertPoints.reduce((min, point) => (point.map < min.map ? point : min), mapAlertPoints[0])
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Activity className="h-5 w-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Intraoperative &amp; Pre-operative Longitudinal Signals
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
              BiLSTM 12h Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous vital signs &amp; arterial blood lab trajectories. Red zone indicates end-organ hypoperfusion threshold.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("map-hr")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "map-hr" ? "bg-white text-navy-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            MAP &amp; Heart Rate
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("spo2-rr")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "spo2-rr" ? "bg-white text-navy-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            SpO2 &amp; Resp. Rate
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("labs")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "labs" ? "bg-white text-navy-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Lactate &amp; Base Excess
          </button>
        </div>
      </div>

      {hasAlertZone && lowestAlertPoint && activeTab === "map-hr" ? (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>
              HYPOTENSION THRESHOLD ALERT: Mean Arterial Pressure (MAP) dropped below 65 mmHg across{" "}
              <strong>{mapAlertPoints.length} recorded reading(s)</strong> (Min MAP: {lowestAlertPoint.map} mmHg at {lowestAlertPoint.time}).
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold bg-rose-100 border border-rose-300 px-2 py-0.5 rounded shrink-0">
            BiLSTM Flagged
          </span>
        </div>
      ) : null}

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "map-hr" ? (
            <ComposedChart data={vitalsSeries} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis yAxisId="left" domain={[40, 140]} tick={{ fontSize: 11, fill: "#64748B" }} label={{ value: "MAP (mmHg)", angle: -90, position: "insideLeft", fontSize: 10, fill: "#0F766E" }} />
              <YAxis yAxisId="right" orientation="right" domain={[50, 130]} tick={{ fontSize: 11, fill: "#64748B" }} label={{ value: "HR (bpm)", angle: 90, position: "insideRight", fontSize: 10, fill: "#1E3A8A" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "0.75rem", color: "#F8FAFC", fontSize: "12px" }}
                itemStyle={{ color: "#F8FAFC" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <ReferenceLine yAxisId="left" y={65} stroke="#EF4444" strokeDasharray="4 4" label={{ value: "Hypotension Threshold (65 mmHg)", fill: "#EF4444", fontSize: 10, position: "insideBottomRight" }} />
              <ReferenceArea yAxisId="left" y1={40} y2={65} fill="#FEE2E2" fillOpacity={0.4} />
              <Line yAxisId="left" type="monotone" dataKey="map" name="Mean Arterial Pressure (MAP)" stroke="#0D9488" strokeWidth={3} dot={{ r: 4, fill: "#0D9488" }} activeDot={{ r: 7 }} />
              <Line yAxisId="right" type="monotone" dataKey="hr" name="Heart Rate (HR)" stroke="#1E3A8A" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3, fill: "#1E3A8A" }} />
            </ComposedChart>
          ) : activeTab === "spo2-rr" ? (
            <ComposedChart data={vitalsSeries} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis yAxisId="left" domain={[88, 100]} tick={{ fontSize: 11, fill: "#64748B" }} label={{ value: "SpO2 (%)", angle: -90, position: "insideLeft", fontSize: 10, fill: "#2563EB" }} />
              <YAxis yAxisId="right" orientation="right" domain={[10, 30]} tick={{ fontSize: 11, fill: "#64748B" }} label={{ value: "Resp Rate (bpm)", angle: 90, position: "insideRight", fontSize: 10, fill: "#9333EA" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "0.75rem", color: "#F8FAFC", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <ReferenceLine yAxisId="left" y={94} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: "Desaturation Warning (94%)", fill: "#F59E0B", fontSize: 10 }} />
              <Line yAxisId="left" type="monotone" dataKey="spo2" name="Oxygen Saturation (SpO2 %)" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="rr" name="Respiration Rate (RR)" stroke="#9333EA" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          ) : (
            <ComposedChart data={vitalsSeries} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis yAxisId="left" domain={[0, 6]} tick={{ fontSize: 11, fill: "#64748B" }} label={{ value: "Lactate (mmol/L)", angle: -90, position: "insideLeft", fontSize: 10, fill: "#DC2626" }} />
              <YAxis yAxisId="right" orientation="right" domain={[-8, 2]} tick={{ fontSize: 11, fill: "#64748B" }} label={{ value: "Base Excess (mEq/L)", angle: 90, position: "insideRight", fontSize: 10, fill: "#059669" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "0.75rem", color: "#F8FAFC", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <ReferenceLine yAxisId="left" y={2.0} stroke="#DC2626" strokeDasharray="3 3" label={{ value: "Hyperlactatemia Cutoff (2.0 mmol/L)", fill: "#DC2626", fontSize: 10 }} />
              <Line yAxisId="left" type="monotone" dataKey="lactate" name="Serum Lactate (mmol/L)" stroke="#DC2626" strokeWidth={3} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="baseExcess" name="Base Excess (mEq/L)" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
