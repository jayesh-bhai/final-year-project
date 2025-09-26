import React from "react";

const alerts = [
  { type: "SQL Injection", desc: "Attempted SQLi on login page", date: "Apr 20" },
  { type: "XSS Detection", desc: "Suspicious script in input", date: "Apr 19" },
  { type: "Brute Force", desc: "Multiple failed login attempts", date: "Apr 18" },
];

const AlertsTable = () => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition">
      <h2 className="text-md font-bold mb-4">Recent Alerts</h2>
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="py-2">Type</th>
            <th>Description</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="py-2">{a.type}</td>
              <td>{a.desc}</td>
              <td>{a.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AlertsTable;

