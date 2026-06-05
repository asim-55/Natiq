import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-ink-950">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <img src="/mayna.png" alt="Mayna" className="h-12 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
              Enterprise-grade voice generation for the finance, telecom, and enterprise sectors.
            </p>
          </div>
          {[
            { title: "Product", links: [["Docs", "/docs"], ["Dashboard", "/dashboard"]] },
            { title: "Company", links: [["About", "/about"], ["Blog", "/blog"], ["Contact Us", "/contact"]] },
            { title: "Legal", links: [["Privacy", "#"], ["Terms", "#"]] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map(([label, path]) => (
                  <li key={label}>
                    <Link to={path} className="text-sm text-slate-400 transition hover:text-white">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Mayna. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
