import type { ReactNode } from "react";
import AdminNav from "./_components/AdminNav";
import LogoutButton from "./_components/LogoutButton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 sm:px-6">
        <div>
          <h1 className="text-base font-semibold text-zinc-900">Natural by Cara</h1>
          <p className="text-xs text-zinc-500">Admin dashboard</p>
        </div>
        <LogoutButton />
      </header>
      <AdminNav />
      <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
