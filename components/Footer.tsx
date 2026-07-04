import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-brand/8 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-5 py-14 sm:flex-row sm:justify-between sm:px-8">
        <div className="space-y-4">
          <Logo size="lg" />
          <p className="max-w-xs text-sm leading-relaxed text-brand/40">
            Curated thrifted apparel. Order online, pay via GCash, delivered
            to your door.
          </p>
        </div>

        <div className="flex gap-16 text-sm">
          <nav aria-label="Footer">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand/50">
              Shop
            </p>
            <ul className="space-y-2.5 text-brand/45">
              <li><Link href="/shop" className="transition-colors hover:text-brand">All items</Link></li>
              <li><Link href="/shop?section=new-arrivals" className="transition-colors hover:text-brand">New</Link></li>
              <li><Link href="/shop?section=on-sale" className="transition-colors hover:text-brand">Sale</Link></li>
            </ul>
          </nav>
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand/50">
              Delivery
            </p>
            <ul className="space-y-2.5 text-brand/45">
              <li>Door-to-door</li>
              <li>GCash payment</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-brand/8 py-5 text-center text-[11px] text-brand/30">
        © {new Date().getFullYear()} Good Catch
      </div>
    </footer>
  );
}
