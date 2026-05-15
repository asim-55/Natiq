import { Link, useParams } from "react-router-dom";
import { ArrowRight, Sparkles, Mic2, Globe, Zap } from "lucide-react";

const content: Record<string, { eyebrow: string; title: string; text: string; cards: {title: string; text: string; icon?: any}[] }> = {
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
      },
      {
        title: "23 Emotions: A Complete Guide",
        text: "Deep dive into each of Natiq's 23 emotional voice styles. Understand when to use happy, sad, dramatic, motivational, or poetic voices for maximum impact in your content.",
      },
      {
        title: "Voice Cloning Best Practices",
        text: "How to record the perfect voice sample for instant cloning. Tips on microphone quality, recording environment, speaking style, and sample duration for optimal results.",
      },
      {
        title: "Building AI Chatbots with Urdu Voice",
        text: "Integrate Natiq into conversational AI systems. Learn authentication, real-time generation, response caching, and creating natural voice interactions in Urdu.",
      },
      {
        title: "Content Creator's Guide to TTS",
        text: "How YouTubers, Instagram creators, and TikTok producers use Natiq for voiceovers. Workflow automation, emotion selection strategies, and audio post-processing tips.",
      },
      {
        title: "Roman Urdu Pronunciation Deep Dive",
        text: "Understanding how Natiq handles spelling variations (kya/kia/kiya, bohat/bohut/buhat), mixed Urdu-English text, and natural Pakistani speaking patterns for realistic voice output.",
      },
      {
        title: "API Integration Patterns",
        text: "Real-world code examples for integrating Natiq into web apps, mobile applications, backend services, and automation workflows. Authentication, error handling, and rate limiting.",
      },
      {
        title: "Emotion-Aware Content Strategy",
        text: "Match emotions to content types: use dramatic voices for storytelling, motivational for inspiring content, calm for meditation, funny for comedy, and romantic for emotional scenes.",
      },
      {
        title: "From Neutral to Expressive Speech",
        text: "When to use emotion-based generation vs neutral speech. Compare use cases for IVR systems, customer support, narration, character voices, and conversational agents.",
      },
      {
        title: "Multilingual TTS Strategy",
        text: "Leverage Natiq's primary Urdu focus with full emotion control, while also using neutral speech generation for 20+ supported languages. Build multilingual applications with consistent voice quality across English, Arabic, Hindi, Turkish, and more.",
      },
    ],
  },
};

export default function ResourcePage() {
  const { page } = useParams<{ page: string }>();
  const c = content[page || "docs"] || content.docs;

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
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {c.cards.map(({title, text, icon: Icon}) => (
              <article key={title} className="soft-card p-6">
                {Icon && (
                  <div className="mb-4 inline-flex rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-2.5 text-cyan-200">
                    <Icon size={20} />
                  </div>
                )}
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
              </article>
            ))}
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
