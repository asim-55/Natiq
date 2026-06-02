import { Link, useParams } from "react-router-dom";
import { ArrowRight, Sparkles, Mic2, Globe, Zap, Clock, User, Tag, Layers, Code, BarChart3, DollarSign, FolderOpen } from "lucide-react";

const content: Record<string, { eyebrow: string; title: string; text: string; cards: {title: string; text: string; icon?: any; category?: string; readTime?: string; author?: string; featured?: boolean}[] }> = {
  docs: {
    eyebrow: "Documentation",
    title: "Build Urdu voice into your product",
    text: "Comprehensive API documentation, SDKs, and implementation guides for integrating Natiq's expressive Roman Urdu text-to-speech into your applications.",
    cards: [
      {
        title: "Quick start",
        text: "Get up and running in minutes. Sign up, get your API key, upload a voice sample, and generate your first audio with emotion.",
        icon: Zap
      },
      {
        title: "API Reference",
        text: "Complete REST API documentation with curl examples, request/response schemas, and authentication methods for all endpoints.",
        icon: Globe
      },
      {
        title: "23 Emotions",
        text: "Generate expressive speech with 23 emotional styles from neutral and happy to dramatic, poetic, and motivational voices.",
        icon: Sparkles
      },
      {
        title: "Voice Cloning",
        text: "Upload a 10-30 second audio sample to instantly clone any voice. Use your cloned voice for all emotion-based generations.",
        icon: Mic2
      },
      {
        title: "Roman Urdu Native",
        text: "Built specifically for Roman Urdu pronunciation patterns, mixed vocabulary, and natural Pakistani conversational flow.",
      },
      {
        title: "Streaming & Batch",
        text: "Generate audio in real-time for conversational AI or batch process hundreds of files for content creation workflows.",
      },
    ],
  },
  about: {
    eyebrow: "About Natiq",
    title: "Where Text finds its voice",
    text: "Natiq is an expressive Text-to-Speech system primarily designed for Roman Urdu, built for the way Pakistanis actually type, speak, and communicate online. While optimized for Urdu with 23 emotional styles, Natiq also supports 20+ languages including English, Arabic, Hindi, Turkish, and more for neutral speech generation.",
    cards: [
      {
        title: "Primarily Built for Urdu",
        text: "Roman Urdu is our specialty with its unique rhythm, spelling variations, and expressions. Natiq handles everyday Roman Urdu like 'Kya haal hai?', 'Yaar mujhe samajh nahi aayi', and 'Aaj ka din bohat acha hai' with natural, fluent pronunciation. Full emotion support is available exclusively for Urdu.",
      },
      {
        title: "23 Emotional Voices",
        text: "Every sentence has feeling behind it. Natiq gives you control over emotional delivery with 23 distinct voice styles: happy, sad, angry, excited, calm, dramatic, romantic, serious, funny, motivational, poetic, and more.",
      },
      {
        title: "For Creators & Developers",
        text: "Perfect for YouTube narration, Instagram reels, TikTok voiceovers, AI chatbots, customer support systems, audiobooks, educational content, and any application that needs natural Urdu speech.",
      },
      {
        title: "Instant Voice Cloning",
        text: "Upload a short audio sample (10-30 seconds) and Natiq will clone that voice for all your generations. Maintain brand consistency or create unique character voices for your content.",
      },
      {
        title: "Enterprise Ready",
        text: "Scalable API infrastructure with JWT and long-lived API tokens, organization management, team collaboration, usage tracking, and flexible pricing plans for businesses of all sizes.",
      },
      {
        title: "Multilingual Support",
        text: "While Urdu is our primary focus with full emotion control, Natiq also generates neutral speech in 20+ languages including English, Arabic, Hindi, Punjabi, Turkish, Bengali, Spanish, French, German, and more — perfect for multilingual applications.",
      },
      {
        title: "Natural Speech Flow",
        text: "Natiq understands casual tone, friendly pauses, desi conversational rhythm, soft emotional delivery, dramatic storytelling flow, and natural emphasis — speaking like people actually talk.",
      },
    ],
  },
  blog: {
    eyebrow: "Features",
    title: "Powerful voice capabilities for every use case",
    text: "Discover Natiq's complete feature set built specifically for Roman Urdu. From emotional voice synthesis to instant cloning, multilingual support, and enterprise-grade infrastructure.",
    cards: [
      {
        title: "23 Emotional Voice Styles",
        text: "Generate expressive speech with 23 distinct emotions including happy, sad, angry, excited, calm, dramatic, romantic, serious, funny, motivational, poetic, and more. Each emotion is carefully tuned for natural delivery.",
        icon: Sparkles,
        featured: true
      },
      {
        title: "Instant Voice Cloning",
        text: "Upload a 10-30 second audio sample and clone any voice instantly. Use your cloned voice across all 23 emotions while maintaining consistent quality and characteristics.",
        icon: Mic2,
        featured: true
      },
      {
        title: "Roman Urdu Optimized",
        text: "Built specifically for the way Pakistanis write and speak. Handles spelling variations (kya/kia, bohat/bohut), mixed Urdu-English text, and natural conversational patterns with perfect pronunciation.",
        icon: Globe
      },
      {
        title: "Real-Time Streaming",
        text: "Stream audio as it's generated for conversational AI, live chat systems, and interactive applications. Low latency optimized for real-time voice interactions.",
        icon: Zap
      },
      {
        title: "Batch Processing",
        text: "Generate hundreds or thousands of audio files efficiently for content creation, audiobooks, educational materials, and large-scale voice production workflows.",
        icon: Layers
      },
      {
        title: "Multilingual Support",
        text: "While Urdu is our primary focus with full emotion control, generate neutral speech in 20+ languages including English, Arabic, Hindi, Punjabi, Turkish, Bengali, Spanish, French, and more.",
        icon: Globe
      },
      {
        title: "REST API & SDKs",
        text: "Simple REST API with comprehensive documentation. Easy integration into any application with clear examples, authentication methods, and error handling.",
        icon: Code
      },
      {
        title: "Usage Analytics",
        text: "Track generation history, monitor credit usage, analyze patterns by capability (TTS vs cloning), and get detailed insights into your voice generation activity.",
        icon: BarChart3
      },
      {
        title: "Flexible Pricing",
        text: "Pay only for what you use with our credit-based system. Free tier for testing, Pro for starting out, and Startup or Scale for higher-volume production.",
        icon: DollarSign
      },
      {
        title: "Voice Management",
        text: "Organize and manage your cloned voices with custom names, preview samples, and easy deletion. Upload multiple voices and switch between them seamlessly.",
        icon: FolderOpen
      },
    ],
  },
};

export default function ResourcePage() {
  const { page } = useParams<{ page: string }>();
  const c = content[page || "docs"] || content.docs;
  const isBlog = page === "blog";
  const featuredArticles = isBlog ? c.cards.filter(card => card.featured) : [];
  const regularArticles = isBlog ? c.cards.filter(card => !card.featured) : c.cards;

  return (
    <main className="relative z-10 min-h-screen pt-32">
      <section className="section-pad">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">
            <ArrowRight className="rotate-180" size={16} /> Back to home
          </Link>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">{c.eyebrow}</p>
              <h1 className="mt-4 text-balance text-5xl font-semibold leading-tight text-white sm:text-6xl">{c.title}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{c.text}</p>
              
              {page === "docs" && (
                <div className="mt-8">
                  <Link
                    to="/docs"
                    className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-6 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300/20 hover:text-white"
                  >
                    View API Reference
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
            <div className="soft-card p-6">
              <p className="text-sm text-slate-400">Natiq resource center</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {(["docs", "about", "blog"] as const).map((item) => (
                  <Link
                    key={item}
                    to={`/${item}`}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      page === item ? "border-cyan-300/40 bg-cyan-300/10 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="block font-semibold capitalize">{item}</span>
                    <span className="mt-1 block text-sm text-slate-400">
                      {item === "docs" ? "API and integration guides" : item === "about" ? "Mission and vision" : "Platform capabilities"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Articles for Blog */}
          {isBlog && featuredArticles.length > 0 && (
            <div className="mt-20">
              <div className="grid gap-6 lg:grid-cols-2">
                {featuredArticles.map(({title, text, icon: Icon}) => (
                  <div key={title} className="relative overflow-hidden rounded-3xl border-2 border-cyan-300/20 bg-gradient-to-br from-cyan-300/5 to-transparent p-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/20 border border-cyan-300/40">
                        {Icon && <Icon size={24} className="text-cyan-300" />}
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Core Feature</span>
                    </div>
                    
                    <h3 className="text-3xl lg:text-4xl font-black text-white leading-[1.1] mb-5">
                      {title}
                    </h3>
                    <p className="text-base leading-relaxed text-slate-300">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Features - Bento Grid Layout */}
          <div className={`${isBlog ? 'mt-20' : 'mt-14'}`}>
            {isBlog ? (
              <div className="space-y-12">
                {/* Section title */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-300"></div>
                    <h2 className="text-3xl font-black text-white">All Features</h2>
                  </div>
                </div>

                {/* Bento-style asymmetric grid */}
                <div className="grid gap-5 md:grid-cols-6 lg:grid-cols-12 auto-rows-fr">
                  {regularArticles.map(({title, text, icon: Icon}, idx) => {
                    // Vary the column spans for visual interest
                    let colSpan = 'md:col-span-3 lg:col-span-4';
                    if (idx === 0) colSpan = 'md:col-span-6 lg:col-span-6';
                    else if (idx === 1) colSpan = 'md:col-span-3 lg:col-span-6';
                    else if (idx === 2) colSpan = 'md:col-span-3 lg:col-span-4';
                    else if (idx === 3) colSpan = 'md:col-span-6 lg:col-span-8';
                    else if (idx === 4) colSpan = 'md:col-span-3 lg:col-span-4';
                    else if (idx === 5) colSpan = 'md:col-span-3 lg:col-span-6';
                    else if (idx === 6) colSpan = 'md:col-span-6 lg:col-span-6';
                    
                    // Vary the visual style
                    const isBordered = idx % 3 === 0;
                    const hasBackground = idx % 3 === 1;
                    
                    return (
                      <div 
                        key={title}
                        className={`relative ${colSpan} ${
                          isBordered 
                            ? 'border-l-4 border-cyan-300 bg-cyan-300/5 pl-6 pr-6 py-7 rounded-r-2xl' 
                            : hasBackground
                            ? 'rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-7'
                            : 'rounded-2xl border border-white/5 p-7'
                        }`}
                      >
                        {Icon && (
                          <div className="mb-5 inline-flex rounded-xl bg-gradient-to-br from-cyan-300/20 to-cyan-300/5 p-3 text-cyan-300 border border-cyan-300/20">
                            <Icon size={22} />
                          </div>
                        )}
                        
                        <div className="flex flex-col h-full">
                          <h3 className="text-xl lg:text-2xl font-bold text-white leading-tight mb-3">
                            {title}
                          </h3>
                          
                          <p className="text-sm leading-relaxed text-slate-400">
                            {text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Docs and About - keep original grid
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {regularArticles.map(({title, text, icon: Icon}) => (
                  <article key={title} className="group soft-card p-6 transition hover:border-cyan-300/30">
                    {Icon && (
                      <div className="mb-4 inline-flex rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-2.5 text-cyan-200">
                        <Icon size={20} />
                      </div>
                    )}
                    <h2 className="text-xl font-semibold text-white group-hover:text-cyan-100 transition">{title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
          
          {page === "about" && (
            <div className="mt-12 rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan-200">Our Mission</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">
                Give every word a voice that sounds truly human
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-300 mx-auto max-w-3xl">
                Natiq is built for the way people actually write Urdu — casual, expressive, mixed, emotional, and real. We're creating voice technology that understands Pakistani communication patterns and delivers speech that feels natural, not robotic.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
