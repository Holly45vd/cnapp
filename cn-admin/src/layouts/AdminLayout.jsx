import { NavLink, Outlet } from "react-router-dom";
import { logout } from "../firebase/auth";

export default function AdminLayout() {
  const nav = [
    { to: "/admin/words", label: "단어" },
    { to: "/admin/sentences", label: "문장" },
    { to: "/admin/dialogs", label: "회화" },
    { to: "/admin/grammar", label: "문법" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-white border-r p-4 space-y-4">
        <h1 className="text-xl font-bold">Admin</h1>

        <nav className="flex flex-col gap-2">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg ${
                  isActive ? "bg-black text-white" : "hover:bg-gray-100"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => logout()}
          className="text-sm text-gray-600 hover:text-black"
        >
          로그아웃
        </button>
      </aside>

      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
