import React from "react";

const users = [
  { user: "user1", ip: "192.168.0.1", activity: "2 minutes ago", status: "Normal" },
  { user: "user2", ip: "192.168.0.2", activity: "5 minutes ago", status: "Suspicious" },
  { user: "user3", ip: "192.168.0.3", activity: "10 minutes ago", status: "Normal" },
  { user: "user4", ip: "192.168.0.4", activity: "15 minutes ago", status: "Normal" },
  { user: "user5", ip: "192.168.0.5", activity: "20 minutes ago", status: "Normal" },
];

const UsersTable = () => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition">
      <h2 className="text-md font-bold mb-4">Recent Users</h2>
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b bg-gray-100">
            <th className="py-2">User</th>
            <th>IP Address</th>
            <th>Last Activity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="py-2">{u.user}</td>
              <td>{u.ip}</td>
              <td>{u.activity}</td>
              <td
                className={
                  u.status === "Suspicious"
                    ? "text-red-500 font-bold"
                    : "text-green-600"
                }
              >
                {u.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;

