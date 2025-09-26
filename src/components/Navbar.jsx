import React from "react";

const Navbar = () => {
  return (
    <div className="flex justify-between items-center bg-gray-800 text-white px-6 py-3 shadow-md">
      <h1 className="text-xl font-bold">🔒 Sentinel Dashboard</h1>
      <div>
        <a href="#" className="px-4 hover:text-gray-300">Dashboard</a>
        <a href="#" className="px-4 hover:text-gray-300">Settings</a>
        <a href="#" className="px-4 hover:text-red-400 font-semibold">Logout</a>
      </div>
    </div>
  );
};

export default Navbar;


