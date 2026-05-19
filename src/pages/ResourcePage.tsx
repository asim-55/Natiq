import { Link, useParams } from "react-router-dom";
import { ArrowRight, Sparkles, Mic2, Globe, Zap, Clock, User, Tag } from "lucide-react";

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
    eyebrow: "Blog",
    title: "Voice AI insights and multilingual TTS guides",
    text: "Learn how to build with Natiq, understand Roman Urdu voice synthesis with emotions, explore multilingual neutral speech generation in 20+ languages, and discover real-world applications of text-to-voice technology.",
    cards: [
      {
        title: "Getting Started with Natiq TTS",
        text: "A comprehensive guide to understanding Natiq's text-to-speech capabilities. Primary focus on Roman Urdu with 23 emotions, plus neutral speech generation in 20+ languages including English, Arabic, Hindi, and more. Learn how Natiq handles spelling variations and pronunciation patterns.",
        category: "Getting Started",
        readTime: "8 min read",
        author: "Natiq Team",
        featured: true
      },
      {
        title: "23 Emotions: A Complete Guide",
        text: "Deep dive into each of Natiq's 23 emotional voice styles. Understand when to use happy, sad, dramatic, motivational, or poetic voices for maximum impact in your content.",
        category: "Features",
        readTime: "12 min read",
        author: "Natiq Team",
        featured: true
      },
      {
        title: "Voice Cloning Best Practices",
        text: "How to record the perfect voice sample for instant cloning. Tips on microphone quality, recording environment, speaking style, and sample duration for optimal results.",
        category: "Tutorials",
        readTime: "6 min read",
        author: "Natiq Team"
      },
      {
        title: "Building AI Chatbots with Urdu Voice",
        text: "Integrate Natiq into conversational AI systems. Learn authentication, real-time generation, response caching, and creating natural voice interactions in Urdu.",
        category: "Development",
        readTime: "10 min read",
        author: "Natiq Team"
      },
      {
        title: "Content Creator's Guide to TTS",
        text: "How YouTubers, Instagram creators, and TikTok producers use Natiq for voiceovers. Workflow automation, emotion selection strategies, and audio post-processing tips.",
        category: "Use Cases",
        readTime: "7 min read",
        author: "Natiq Team"
      },
      {
        title: "Roman Urdu Pronunciation Deep Dive",
        text: "Understanding how Natiq handles spelling variations (kya/kia/kiya, bohat/bohut/buhat), mixed Urdu-English text, and natural Pakistani speaking patterns for realistic voice output.",
        category: "Technical",
        readTime: "9 min read",
        author: "Natiq Team"
      },
      {
        title: "API Integration Patterns",
        text: "Real-world code examples for integrating Natiq into web apps, mobile applications, backend services, and automation workflows. Authentication, error handling, and rate limiting.",
        category: "Development",
        readTime: "11 min read",
        author: "Natiq Team"
      },
      {
        title: "Emotion-Aware Content Strategy",
        text: "Match emotions to content types: use dramatic voices for storytelling, motivational for inspiring content, calm for meditation, funny for comedy, and romantic for emotional scenes.",
        category: "Strategy",
        readTime: "8 min read",
        author: "Natiq Team"
      },
      {
        title: "From Neutral to Expressive Speech",
        text: "When to use emotion-based generation vs neutral speech. Compare use cases for IVR systems, customer support, narration, character voices, and conversational agents.",
        category: "Use Cases",
        readTime: "6 min read",
        author: "Natiq Team"
      },
      {
        title: "Multilingual TTS Strategy",
        text: "Leverage Natiq's primary Urdu focus with full emotion control, while also using neutral speech generation for 20+ supported languages. Build multilingual applications with consistent voice quality across English, Arabic, Hindi, Turkish, and more.",
        category: "Strategy",
        readTime: "10 min read",
        author: "Natiq Team"
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
                      {item === "docs" ? "API and integration guides" : item === "about" ? "Mission and vision" : "Guides and insights"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Articles for Blog */}
          {isBlog && featuredArticles.length > 0 && (
            <div className="mt-14">
              <div className="mb-6 flex items-center gap-2">
                <Sparkles size={20} className="text-cyan-300" />
                <h2 className="text-xl font-semibold text-white">Featured Articles</h2>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {featuredArticles.map(({title, text, category, readTime, author}) => (
                  <article key={title} className="group relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/10 to-transparent p-8 transition hover:border-cyan-300/40 hover:shadow-lg hover:shadow-cyan-300/10">
                    <div className="mb-4 flex items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 font-medium text-cyan-200">
                        <Tag size={12} />
                        {category}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={12} />
                        {readTime}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-cyan-100 transition">{title}</h3>
                    <p className="mt-3 text-base leading-7 text-slate-300">{text}</p>
                    <div className="mt-6 flex items-center border-t border-white/10 pt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <User size={14} />
                        <span>{author}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Regular Articles */}
          <div className={`${isBlog ? 'mt-14' : 'mt-14'}`}>
            {isBlog && <h2 className="mb-6 text-xl font-semibold text-white">All Articles</h2>}
            <div className={`grid gap-5 ${isBlog ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
              {regularArticles.map(({title, text, icon: Icon, category, readTime, author}) => (
                <article key={title} className={`group soft-card p-6 transition hover:border-cyan-300/30 ${isBlog ? 'hover:shadow-lg hover:shadow-cyan-300/5' : ''}`}>
                  {Icon && (
                    <div className="mb-4 inline-flex rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-2.5 text-cyan-200">
                      <Icon size={20} />
                    </div>
                  )}
                  {isBlog && category && (
                    <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-medium">
                        <Tag size={10} />
                        {category}
                      </span>
                      {readTime && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {readTime}
                        </span>
                      )}
                    </div>
                  )}
                  <h2 className="text-xl font-semibold text-white group-hover:text-cyan-100 transition">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
                  {isBlog && (
                    <div className="mt-4 flex items-center border-t border-white/10 pt-4">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User size={12} />
                        {author}
                      </span>
                    </div>
                  )}
                </article>
              ))}
            </div>
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
