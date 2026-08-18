"use client";

import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="relative border-t border-border-subtle mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Logo size="sm" />
            <p className="text-sm text-muted max-w-sm leading-relaxed">
              DARKO is a browser-first virtual hangout platform. Create a room, share one link — watch together, talk, play games, share files. No app install, no mandatory account.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted">Product</h4>
            <ul className="space-y-2">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-secondary hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted">Legal</h4>
            <ul className="space-y-2">
              {siteConfig.footer.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-secondary hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} DARKO. Built with browser-native tech. ₹0 infrastructure.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
