import type { ReactNode } from "react";
import Image from "next/image";
import AdminNav from "./_components/AdminNav";
import LogoutButton from "./_components/LogoutButton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border-subtle bg-surface-card-solid px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/logo.jpg"
            alt="Natural By Cara logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full border border-border-subtle object-cover"
          />
          <div>
            <h1 className="font-display text-lg font-semibold leading-tight text-text-primary">
              Natural By Cara
            </h1>
            <p className="text-xs text-text-muted">Admin dashboard</p>
          </div>
        </div>
        <LogoutButton />
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <AdminNav />
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
