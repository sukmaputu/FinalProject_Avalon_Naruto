"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart, Bar, XAxis, YAxis } from "recharts";

import { useState } from "react";

type PredictionResponse =
  | {
      prediction: number;
      result: string;
      confidence: number;
      top_features?: string[]; // ini optional
    }
  | {
      total_data: number;
      attack: number;
      normal: number;
      avg_confidence?: number;
      top_features?: string[];
    }
  | {
      error: string;
    };

export default function Home() {
  const COLORS = ["#EF4444", "#10B981"];
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/predict-csv", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      setResult(json);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const handlePredict = async () => {
    setLoading(true);
    setResult(null);
    setLastUpdated(new Date().toLocaleTimeString());

    const data = {
      data: {
        "Destination Port": 55144,
        "Flow Duration": 1,
        "Total Fwd Packets": 2,
        "Total Backward Packets": 0,
        "Total Length of Fwd Packets": 37,
        "Total Length of Bwd Packets": 0,
        "Fwd Packet Length Max": 31,
        "Fwd Packet Length Min": 6,
        "Fwd Packet Length Mean": 18.5,
        "Fwd Packet Length Std": 17.67766953,
        "Bwd Packet Length Max": 0,
        "Bwd Packet Length Min": 0,
        "Bwd Packet Length Mean": 0,
        "Bwd Packet Length Std": 0,
        "Flow Bytes/s": 37000000,
        "Flow Packets/s": 2000000,
        "Flow IAT Mean": 1,
        "Flow IAT Std": 0,
        "Flow IAT Max": 1,
        "Flow IAT Min": 1,
        "Fwd IAT Total": 1,
        "Fwd IAT Mean": 1,
        "Fwd IAT Std": 0,
        "Fwd IAT Max": 1,
        "Fwd IAT Min": 1,
        "Bwd IAT Total": 0,
        "Bwd IAT Mean": 0,
        "Bwd IAT Std": 0,
        "Bwd IAT Max": 0,
        "Bwd IAT Min": 0,
        "Fwd PSH Flags": 1,
        "Bwd PSH Flags": 0,
        "Fwd URG Flags": 0,
        "Bwd URG Flags": 0,
        "Fwd Header Length": 40,
        "Bwd Header Length": 0,
        "Fwd Packets/s": 2000000,
        "Bwd Packets/s": 0,
        "Min Packet Length": 6,
        "Max Packet Length": 31,
        "Packet Length Mean": 22.66666667,
        "Packet Length Std": 14.43375673,
        "Packet Length Variance": 208.3333333,
        "FIN Flag Count": 0,
        "SYN Flag Count": 1,
        "RST Flag Count": 0,
        "PSH Flag Count": 0,
        "ACK Flag Count": 1,
        "URG Flag Count": 0,
        "CWE Flag Count": 0,
        "ECE Flag Count": 0,
        "Down/Up Ratio": 0,
        "Average Packet Size": 34,
        "Avg Fwd Segment Size": 18.5,
        "Avg Bwd Segment Size": 0,
        "Fwd Avg Bytes/Bulk": 0,
        "Fwd Avg Packets/Bulk": 0,
        "Fwd Avg Bulk Rate": 0,
        "Bwd Avg Bytes/Bulk": 0,
        "Bwd Avg Packets/Bulk": 0,
        "Bwd Avg Bulk Rate": 0,
        "Subflow Fwd Packets": 2,
        "Subflow Fwd Bytes": 37,
        "Subflow Bwd Packets": 0,
        "Subflow Bwd Bytes": 0,
        Init_Win_bytes_forward: 980,
        Init_Win_bytes_backward: -1,
        act_data_pkt_fwd: 1,
        min_seg_size_forward: 20,
        "Active Mean": 0,
        "Active Std": 0,
        "Active Max": 0,
        "Active Min": 0,
        "Idle Mean": 0,
        "Idle Std": 0,
        "Idle Max": 0,
        "Idle Min": 0,
      },
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json: PredictionResponse = await res.json();
      setResult(json);
    } catch {
      setResult({ error: "Connection error ❌" });
    }

    setLoading(false);
  };

  const isSingleResult = (
    res: PredictionResponse,
  ): res is {
    prediction: number;
    result: string;
    confidence: number;
    top_features?: string[];
  } => {
    return "result" in res;
  };

  {
    result &&
      "top_features" in result &&
      result.top_features?.map((f: string, i: number) => <li key={i}>{f}</li>);
  }

  const featureData =
    result && isSingleResult(result) && result.top_features
      ? result.top_features.map((f: string, i: number) => ({
          name: f,
          value: 100 - i * 15,
        }))
      : [];
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      {" "}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/*  LEFT PANEL (CONTROL) */}
        <div className="md:col-span-1 p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl">
          <h1 className="text-xl font-bold mb-2">🚨 IDS Control</h1>

          <p className="text-gray-300 text-sm mb-6">
            Real-time intrusion detection system
          </p>

          <button
            onClick={handlePredict}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
            }`}
          >
            {loading ? "Analyzing..." : "Run Detection"}
          </button>

          <label className="mt-4 w-full cursor-pointer block">
            <div className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-center">
              {file ? file.name : "📂 Choose CSV File"}
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          <button
            onClick={handleUpload}
            className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            Upload CSV
          </button>

          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-5">
              🕒 Last updated: {lastUpdated}
            </p>
          )}
        </div>

        {/* RIGHT PANEL (RESULT DASHBOARD) */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl">
          <h2 className="text-xl font-bold mb-4">📊 SOC Dashboard</h2>

          {!result && (
            <p className="text-gray-400 text-sm">
              No data yet. Run detection to see results.
            </p>
          )}

          {result && (
            <div className="space-y-4">
              {"error" in result && (
                <div className="p-4 bg-yellow-500/20 border border-yellow-400 rounded-xl">
                  <p className="text-yellow-300 font-semibold">
                    {result.error}
                  </p>
                </div>
              )}

              {"attack" in result &&
                (() => {
                  const chartData = [
                    { name: "Attack", value: result.attack },
                    { name: "Normal", value: result.normal },
                  ];

                  const attackRatio = (result.attack / result.total_data) * 100;

                  const getThreatLevel = (ratio: number) => {
                    if (ratio > 80)
                      return { label: "CRITICAL 🚨", color: "text-red-500" };
                    if (ratio > 40)
                      return { label: "HIGH ⚠️", color: "text-orange-400" };
                    if (ratio > 10)
                      return { label: "MEDIUM ⚡", color: "text-yellow-300" };
                    return { label: "LOW 🟢", color: "text-green-400" };
                  };

                  const threat = getThreatLevel(attackRatio);

                  return (
                    <>
                      <div className="p-4 rounded-xl bg-black/30 border border-white/10 text-center">
                        <p className="text-xs text-gray-400">Threat Level</p>
                        <p className={`text-xl font-bold ${threat.color}`}>
                          {threat.label}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-white/10 rounded-xl text-center">
                          <p className="text-gray-400 text-xs">Total</p>
                          <p className="text-lg font-bold">
                            {result.total_data}
                          </p>
                        </div>

                        <div className="p-4 bg-red-500/20 rounded-xl text-center border border-red-400">
                          <p className="text-red-300 text-xs">Attack</p>
                          <p className="text-lg font-bold">{result.attack}</p>
                        </div>

                        <div className="p-4 bg-green-500/20 rounded-xl text-center border border-green-400">
                          <p className="text-green-300 text-xs">Normal</p>
                          <p className="text-lg font-bold">{result.normal}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-center">
                        <div className="bg-white/10 p-2 rounded-lg">
                          Attack Ratio:{" "}
                          {((result.attack / result.total_data) * 100).toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="bg-white/10 p-2 rounded-lg">
                          Normal Ratio:{" "}
                          {((result.normal / result.total_data) * 100).toFixed(
                            1,
                          )}
                          %
                        </div>
                      </div>

                      {/* ✅ SINGLE RESULT */}
                      {result && isSingleResult(result) && (
                        <>
                          <p className="text-sm mt-2">
                            Confidence: {(result.confidence * 100).toFixed(2)}%
                          </p>

                          <div className="bg-gray-700 h-2 rounded-full mt-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${result.confidence * 100}%` }}
                            />
                          </div>

                          {result.top_features && (
                            <div className="mt-4 text-xs text-gray-300">
                              <p className="font-semibold">Top Features:</p>
                              <ul className="list-disc ml-4">
                                {result.top_features.map((f, i) => (
                                  <li key={i}>{f}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}

                      {/* Batch Result */}
                      {result && "attack" in result && (
                        <>
                          {"avg_confidence" in result &&
                            result.avg_confidence !== undefined && (
                              <p className="text-xs text-gray-400 text-center">
                                Avg Confidence:{" "}
                                {(result.avg_confidence * 100).toFixed(2)}%
                              </p>
                            )}

                          {result.top_features && (
                            <div className="mt-4 text-xs text-gray-300 text-center">
                              <p className="font-semibold">Top Features:</p>
                              <ul className="list-disc ml-4 inline-block text-left">
                                {result.top_features.map((f, i) => (
                                  <li key={i}>{f}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}

                      {/* Chart */}
                      <div className="w-full h-64">
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={chartData}
                              dataKey="value"
                              nameKey="name"
                              outerRadius={90}
                            >
                              {chartData.map((_, index) => (
                                <Cell key={index} fill={COLORS[index]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <p className="text-xs text-gray-400 text-center">
                        AI batch detection result visualization
                      </p>
                    </>
                  );
                })()}

              {/* Single Result */}
              {"result" in result && (
                <div
                  className={`p-6 rounded-xl text-center border ${
                    result.result.includes("ATTACK")
                      ? "bg-red-500/20 border-red-400"
                      : "bg-green-500/20 border-green-400"
                  }`}
                >
                  <p className="text-xl font-bold">
                    {result.result.includes("ATTACK")
                      ? "🚨 ATTACK DETECTED"
                      : "🛡️ NORMAL TRAFFIC"}
                  </p>

                  <p className="text-sm text-gray-300 mt-2">
                    Real-time prediction from AI model
                  </p>
                </div>
              )}

              {result &&
                isSingleResult(result) &&
                result.top_features &&
                featureData.length > 0 && (
                  <div className="mt-6 p-4 bg-black/30 rounded-xl border border-white/10">
                    <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                      🔍 <span>Feature Importance (AI Explainability)</span>
                    </p>

                    {/* Chart */}
                    <div className="w-full h-40">
                      <ResponsiveContainer>
                        <BarChart data={featureData}>
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: "#9CA3AF" }}
                            interval={0}
                            angle={-20}
                            textAnchor="end"
                            height={40}
                          />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#111827",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                            labelStyle={{ color: "#9CA3AF" }}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-center">
                      Top features contributing to AI decision
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
