import React from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import StatCard from "./components/StatCard";
import ChartCard from "./components/ChartCard";
import AlertsTable from "./components/AlertsTable";
import UsersTable from "./components/UsersTable";

function App() {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-y-auto">
          {/* Top Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard />
            <ChartCard title="Threat Trend" type="line" />
            <ChartCard title="Attack Types" type="pie" />
          </div>

          {/* Bottom Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AlertsTable />
            <UsersTable />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
