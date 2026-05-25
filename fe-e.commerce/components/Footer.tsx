import Link from "next/link";

const FOOTER_LINKS = ["Terms of Service", "Privacy Policy", "Sustainability", "Contact"];

export default function Footer() {
  return (
    <footer className="bg-deep-navy py-12 md:py-20">
      <div className="max-w-[1280px] mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-10">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-primary-container select-none">
          ShopIn
        </Link>
        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="text-xs font-bold uppercase tracking-widest text-ice-blue/60 hover:text-primary-container transition-colors duration-150 hover:underline underline-offset-8 decoration-2"
            >
              {link}
            </a>
          ))}
        </nav>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ice-blue/40 text-center">
          © 2026 SHOPIN. ENGINEERED FOR PRECISION.
        </p>
      </div>
    </footer>
  );
}
