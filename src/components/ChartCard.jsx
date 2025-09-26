import React from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const dataLine = [
  { date: "Apr 14", threats: 5 },
  { date: "Apr 16", threats: 10 },
  { date: "Apr 18", threats: 20 },
  { date: "Apr 20", threats: 18 },
];

const dataPie = [
  { name: "SQLi", value: 40 },
  { name: "XSS", value: 30 },
  { name: "Brute Force", value: 30 },
];
const COLORS = ["#0088FE", "#FFBB28", "#00C49F"];

const ChartCard = ({ title, type }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition">
      <h2 className="text-md font-bold mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={200}>
        {type === "line" ? (
          <LineChart data={dataLine}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="threats"
              stroke="#2563EB"
              strokeWidth={2}
            />
          </LineChart>
        ) : (
          <PieChart>
            <Pie
              data={dataPie}
              cx="50%"
              cy="50%"
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {dataPie.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartCard;


