import { useState } from "react";
import { Menu, X, Home, User, Settings, BarChart2, Bell } from "lucide-react";

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  const menus = [
    { name: "Dashboard", icon: <Home />, link: "/" },
    { name: "Users", icon: <User />, link: "/users" },
    { name: "Reports", icon: <BarChart2 />, link: "/reports" },
    { name: "Alerts", icon: <Bell />, link: "/alerts" },
    { name: "Settings", icon: <Settings />, link: "/settings" },
  ];

  return (
    <div
      className={`${
        open ? "w-64" : "w-20"
      } bg-gray-900 h-screen p-5 pt-8 relative duration-300`}
    >
      {/* Toggle button */}
      <button
        className="absolute cursor-pointer -right-3 top-9 w-7 h-7 bg-white border-dark-purple border-2 rounded-full"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Menu Items */}
      <ul className="pt-6">
        {menus.map((menu, index) => (
          <li
            key={index}
            className="flex items-center gap-x-4 p-2 hover:bg-gray-700 text-white text-sm cursor-pointer rounded-md"
          >
            {menu.icon}
            <span className={`${!open && "hidden"} origin-left duration-200`}>
              {menu.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}



