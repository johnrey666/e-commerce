import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-ink/10 bg-paper">
      <div className="mx-auto max-w-[90rem] px-5 py-20 sm:px-10">
        <div className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-6 max-w-md font-display text-[17px] italic leading-relaxed text-ink/55">
            A curated atelier of rare, one-of-one vintage apparel — each piece
            hand-selected, authenticated and delivered to your door.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl gap-12 border-t border-ink/8 pt-12 text-center sm:grid-cols-2 sm:text-left">
          <nav aria-label="Footer">
            <p className="mb-5 text-[9px] font-medium uppercase tracking-[0.4em] text-ink/40">
              Collection
            </p>
            <ul className="space-y-3 text-[13px] text-ink/55">
              <li>
                <Link href="/shop" className="transition-colors duration-300 hover:text-ink">
                  All Pieces
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?section=new-arrivals"
                  className="transition-colors duration-300 hover:text-ink"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?section=on-sale"
                  className="transition-colors duration-300 hover:text-ink"
                >
                  On Sale
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <p className="mb-5 text-[9px] font-medium uppercase tracking-[0.4em] text-ink/40">
              Services
            </p>
            <ul className="space-y-3 text-[13px] text-ink/55">
              <li>Door-to-door delivery</li>
              <li>Online Fast Transaction</li>
              <li>Authenticity guaranteed</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-ink/8 py-6 text-center">
        <p className="text-[9px] font-medium uppercase tracking-[0.35em] text-ink/30">
          © {new Date().getFullYear()} Good Catch — Curated Vintage
        </p>
      </div>
    </footer>
  );
}
