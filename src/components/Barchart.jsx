// src/components/Barchart.jsx
import React, { useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,   // ✅ tambahkan ini biar <Cell> dikenali
} from "recharts";


const COLORS = ["#4facfe", "#ff6b6b", "#3ddb97", "#ffa726", "#8b5cf6", "#f59e0b", "#60a5fa", "#ef4444", "#10b981"];

const MONTHS = [
    { key: "JAN", label: "Jan" },
    { key: "FEB", label: "Feb" },
    { key: "MAR", label: "Mar" },
    { key: "APR", label: "Apr" },
    { key: "MAY", label: "May" },
    { key: "JUN", label: "Jun" },
    { key: "JUL", label: "Jul" },
    { key: "AUG", label: "Aug" },
    { key: "SEP", label: "Sep" },
    { key: "OCT", label: "Oct" },
    { key: "NOV", label: "Nov" },
    { key: "DEC", label: "Dec" },
];

function getNumericValue(row, keys) {
    for (const k of keys) {
        if (!(k in row)) continue;
        const raw = row[k];
        if (raw === null || raw === undefined || raw === "") continue;

        let s = String(raw).replace(/\s+/g, "").replace(/,/g, "");
        let isNeg = false;
        if (/^\(.+\)$/.test(s)) {
            isNeg = true;
            s = s.replace(/^\(|\)$/g, "");
        }

        let n = Number(s);
        if (Number.isNaN(n)) n = 0;
        if (isNeg) n = -Math.abs(n);
        return n;
    }
    return 0;
}

export default function Barchart({ data = [], selectedYear = "2025", setSelectedYear = () => { } }) {
    const [selectedCategory, setSelectedCategory] = useState("All");

    // --- agregasi per bulan
    const chartData = useMemo(() => {
        const monthAcc = {};
        MONTHS.forEach((m) => (monthAcc[m.label] = 0));

        data.forEach((row) => {
            const category =
                row.CATEGORY ??
                row.category ??
                row.Category ??
                row["ACCOUNT NAME"] ??
                row["ACCOUNT NAME "] ??
                "Unknown";

            if (selectedCategory !== "All" && category !== selectedCategory) return;

            MONTHS.forEach((m) => {
                const n = getNumericValue(row, [
                    m.key,
                    m.label,
                    m.key.toUpperCase(),
                    m.key.toLowerCase(),
                    m.label.toUpperCase(),
                    m.label.toLowerCase(),
                ]);
                monthAcc[m.label] += Math.abs(n);
            });
        });

        return Object.entries(monthAcc).map(([month, value]) => ({
            month,
            value,
        }));
    }, [data, selectedCategory]);

    const categories = ["All", ...new Set(data.map((row) =>
        row.CATEGORY ?? row.category ?? row.Category ?? row["ACCOUNT NAME"] ?? row["ACCOUNT NAME "] ?? "Unknown"
    ))];

    return (

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Bar Chart Per Bulan
            </h3>

            {/* Kontrol */}
            <div className="flex flex-wrap gap-3 mb-4 items-center justify-center sm:justify-start">
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                </select>

                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                    {categories.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>

            {/* Chart */}
            <div className="w-full h-80 bg-gray-50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="month"
                            interval={0}
                            tick={{ fontSize: 10, fill: '#4b5563' }}
                            angle={-30}
                            textAnchor="end"
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#4b5563' }} />
                        <Tooltip
                            formatter={(val) => Number(val).toLocaleString()}
                            contentStyle={{
                                backgroundColor: '#f9fafb',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px'
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="value">
                            {chartData.map((entry, index) => (
                                <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
