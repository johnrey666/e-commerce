import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-ink/10 bg-paper">
      <div className="mx-auto max-w-[90rem] px-5 py-12 sm:px-10">
        <nav aria-label="Footer" className="mx-auto max-w-lg text-center">
          <div className="rule-diamond mx-auto max-w-xs">
            <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-ink/40">
              Collection
            </p>
          </div>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[13px] text-ink/55">
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
      </div>

      <div className="border-t border-ink/8 py-6 text-center">
        <p className="text-[9px] font-medium uppercase tracking-[0.35em] text-ink/30">
          © {new Date().getFullYear()} Good Catch — Curated Vintage
        </p>
      </div>
    </footer>
  );
}
