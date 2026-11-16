"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardNav({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
      {links.map((l) => {
        const active = l.href === "/dashboard" ? path === "/dashboard" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
              active ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}