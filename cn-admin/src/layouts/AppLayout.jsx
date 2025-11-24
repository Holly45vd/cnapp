import { NavLink, Outlet } from "react-router-dom";

export default function AppLayout() {
  const nav = [
    { to: "/app", label: "홈" },
    { to: "/app/words", label: "단어" },
    { to: "/app/grammar", label: "문법" },
    { to: "/app/dialogs", label: "회화" },
    { to: "/app/review", label: "복습" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 상단 헤더 */}
      <header className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">CN Study</h1>
      </header>

      {/* 메인 */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

      {/* 하단 네비게이션 */}
      <footer className="bg-white border-t p-3 flex justify-around">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg ${
                isActive ? "bg-black text-white" : "text-gray-600 hover:bg-gray-200"
              }`
            }
          >
            {n.label}
          </NavLink>
        ))}
      </footer>
    </div>
  );
}
