import { Mail, MessageCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ContactPage() {
  return (
    <main className="relative z-10 min-h-screen pt-32 pb-20">
      <section className="section-pad">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">
            <ArrowRight className="rotate-180" size={16} /> Back to home
          </Link>

          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">Contact Us</p>
            <h1 className="mt-4 text-balance text-5xl font-semibold leading-tight text-white sm:text-6xl">
              Talk to the Mayna team
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Have a question about voice generation, pricing, API access, or a custom deployment? Send us a note and our team will help you choose the right path.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <div className="soft-card p-7">
              <div className="mb-5 inline-flex rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200">
                <MessageCircle size={22} />
              </div>
              <h2 className="text-2xl font-semibold text-white">How we can help</h2>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Reach out for product support, billing questions, enterprise plans, voice cloning help, or API integration guidance.
              </p>
            </div>

            <div className="soft-card p-7">
              <div className="mb-5 inline-flex rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200">
                <Mail size={22} />
              </div>
              <h2 className="text-2xl font-semibold text-white">Email us</h2>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                We usually respond as soon as possible during business hours.
              </p>
              <a
                href="mailto:support@mayna.ai"
                className="mt-6 inline-flex items-center gap-2 text-lg font-semibold text-cyan-200 transition hover:text-white"
              >
                support@mayna.ai
              </a>
            </div>
          </div>

          <div className="mt-14 rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-200">Support</p>
            <p className="mt-4 text-2xl font-semibold text-white">support@mayna.ai</p>
          </div>
        </div>
      </section>
    </main>
  );
}
