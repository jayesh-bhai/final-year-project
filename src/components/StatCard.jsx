import React from "react";

const StatCard = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-center hover:shadow-xl transition">
      <div className="text-center">
        <div className="text-green-500 text-5xl">✅</div>
        <h2 className="text-xl font-bold mt-2">Secure</h2>
        <p className="text-gray-500">No threats detected</p>
      </div>
    </div>
  );
};

export default StatCard;

