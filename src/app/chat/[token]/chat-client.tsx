"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import Image from "next/image";
import {
  Mic,
  MicOff,
  Send,
  Globe,
  Volume2,
  Building,
  MapPin,
  Calendar,
  ChevronDown,
  Loader2,
  Shield,
  Clock,
} from "lucide-react";
import {
  PROPERTIES,
  SUPPORTED_LANGUAGES,
  getBuilderForProperty,
  type SupportedLanguage,
  type DemoProperty,
  type DemoBuilder,
} from "@/lib/demo/demo-data";

// Chat message type
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number; // Use epoch ms instead of Date to avoid SSR issues
  language?: SupportedLanguage;
}

// Voice state
type VoiceState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "error"
  | "unavailable";

function ChatHeader({
  property,
  builder,
  language,
  onLanguageChange,
}: {
  property: DemoProperty;
  builder: DemoBuilder;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}) {
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="glass-card border-b border-[var(--border-color)] px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0">
            <Image
              src={property.heroImageUrl}
              alt={property.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm truncate">{property.name}</h1>
            <p className="text-xs text-[var(--foreground-muted)] truncate">
              {property.location.locality}, Bengaluru · {builder.name}
            </p>
          </div>
        </div>

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setLangOpen((prev) => !prev)}
            className="btn btn-ghost btn-sm gap-1.5"
            aria-label="Select language"
            aria-expanded={langOpen}
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">
              {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label}
            </span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {langOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setLangOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 w-48 card p-1.5 shadow-[var(--shadow-elevated)] animate-scale-in">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setLangOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      language === lang.code
                        ? "bg-[oklch(0.58_0.16_70_/_0.1)] text-[oklch(0.50_0.15_68)] font-medium"
                        : "hover:bg-[var(--surface-elevated)]"
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span className="text-xs text-[var(--foreground-subtle)]">
                      {lang.nativeLabel}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function VoiceControl({
  voiceState,
  onToggle,
}: {
  voiceState: VoiceState;
  onToggle: () => void;
}) {
  const isActive = voiceState === "listening" || voiceState === "speaking";

  return (
    <div className="flex items-center justify-center py-4">
      <button
        onClick={onToggle}
        disabled={voiceState === "unavailable"}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
          voiceState === "listening"
            ? "bg-[oklch(0.58_0.22_25)] text-white shadow-lg"
            : voiceState === "speaking"
            ? "bg-[oklch(0.62_0.16_180)] text-white"
            : voiceState === "thinking"
            ? "bg-[oklch(0.58_0.16_70)] text-white"
            : "bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:bg-[oklch(0.58_0.16_70_/_0.1)] hover:text-[oklch(0.50_0.15_68)]"
        }`}
        aria-label={isActive ? "Stop recording" : "Start voice conversation"}
      >
        {voiceState === "listening" ? (
          <MicOff className="w-7 h-7" />
        ) : voiceState === "thinking" ? (
          <Loader2 className="w-7 h-7 animate-spin" />
        ) : voiceState === "speaking" ? (
          <Volume2 className="w-7 h-7" />
        ) : (
          <Mic className="w-7 h-7" />
        )}

        {/* Pulse ring for active states */}
        {isActive && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-current" />
        )}
      </button>

      <p className="ml-4 text-sm text-[var(--foreground-muted)]">
        {voiceState === "idle" && "Tap to start speaking"}
        {voiceState === "listening" && "Listening…"}
        {voiceState === "thinking" && "Processing…"}
        {voiceState === "speaking" && "Assistant is speaking"}
        {voiceState === "error" && "Voice error — use text instead"}
        {voiceState === "unavailable" && "Voice unavailable — use text below"}
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs text-[var(--foreground-subtle)] bg-[var(--surface-elevated)] px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 animate-fade-up`}
    >
      <div
        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[var(--gradient-brand)] text-white rounded-br-md"
            : "bg-[var(--surface-elevated)] border border-[var(--border-color)] rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <p
          className={`text-[0.625rem] mt-1.5 ${
            isUser ? "text-white/50" : "text-[var(--foreground-subtle)]"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          })}{" "}
          IST
        </p>
      </div>
    </div>
  );
}

function PropertyDetailCard({ property }: { property: DemoProperty }) {
  return (
    <section className="card p-5 animate-fade-up" aria-label="Property details">
      <h2 className="font-bold text-base mb-4 flex items-center gap-2">
        <Building className="w-4 h-4 text-[oklch(0.50_0.15_68)]" />
        Your Property
      </h2>
      <div className="space-y-3">
        <div>
          <p className="font-semibold">{property.name}</p>
          <p className="text-sm text-[var(--foreground-muted)] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {property.location.locality}, Bengaluru
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {property.configurations.map((config) => (
            <div
              key={config.type}
              className="p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)]"
            >
              <p className="text-xs text-[var(--foreground-subtle)] mb-0.5">
                {config.type}
              </p>
              <p className="text-sm font-semibold">
                {config.areaSqftMin.toLocaleString("en-IN")}–
                {config.areaSqftMax.toLocaleString("en-IN")} sq. ft.
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm pt-2 border-t border-[var(--border-subtle)]">
          <span className="text-[var(--foreground-muted)]">Price range</span>
          <span className="font-semibold text-[oklch(0.50_0.15_68)]">
            {property.priceRangeLabel}
          </span>
        </div>
        {property.possessionStatus && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--foreground-muted)]">Possession</span>
            <span className="text-sm">{property.possessionStatus}</span>
          </div>
        )}
        <div className="pt-2">
          <p className="text-xs font-medium text-[var(--foreground-subtle)] uppercase tracking-wide mb-2">
            Key Amenities
          </p>
          <div className="flex flex-wrap gap-1.5">
            {property.amenities.slice(0, 6).map((a) => (
              <span key={a} className="badge badge-neutral text-[0.625rem] py-0.5">
                {a}
              </span>
            ))}
            {property.amenities.length > 6 && (
              <span className="badge badge-neutral text-[0.625rem] py-0.5">
                +{property.amenities.length - 6} more
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BookingWidget({ property }: { property: DemoProperty }) {
  return (
    <section className="card p-5 animate-fade-up" aria-label="Schedule a visit">
      <h2 className="font-bold text-base mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[oklch(0.50_0.15_68)]" />
        Schedule a Visit
      </h2>
      <p className="text-sm text-[var(--foreground-muted)] mb-4">
        Visit the {property.name} site office. Available weekdays and Saturdays.
      </p>
      <div className="p-4 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-center mb-4">
        <Clock className="w-6 h-6 text-[var(--foreground-subtle)] mx-auto mb-2" />
        <p className="text-sm text-[var(--foreground-muted)]">
          Slot booking will be available after conversation start.
        </p>
        <p className="text-xs text-[var(--foreground-subtle)] mt-1">
          Ask the AI assistant to check available slots.
        </p>
      </div>
      <p className="text-xs text-[var(--foreground-subtle)] leading-relaxed">
        {property.visitInstructions}
      </p>
    </section>
  );
}

interface ChatClientProps {
  token: string;
}

export default function ChatClient({ token }: ChatClientProps) {
  // For demo, pick a property based on token hash
  const property = PROPERTIES[0];
  const builder = getBuilderForProperty(property)!;

  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize messages on mount to avoid SSR Date issues
  useEffect(() => {
    const now = Date.now();
    setMessages([
      {
        id: "system-1",
        role: "system",
        content: "Conversation started · Demo mode",
        timestamp: now,
      },
      {
        id: "assistant-1",
        role: "assistant",
        content: `Welcome! I'm your AI assistant for ${property.name} in ${property.location.locality}, Bengaluru.\n\nI can help you with:\n• Property details, configurations and pricing\n• Amenity information\n• Location and connectivity\n• Scheduling a site visit\n\nFeel free to ask in English, Hindi, Kannada, Telugu, Tamil, or Malayalam. How can I help you today?`,
        timestamp: now,
      },
    ]);
  }, [property.name, property.location.locality]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleVoiceToggle() {
    if (voiceState === "idle") {
      setVoiceState("listening");
      setTimeout(() => setVoiceState("thinking"), 3000);
      setTimeout(() => {
        setVoiceState("speaking");
        const now = Date.now();
        const config3bhk = property.configurations.find(
          (c) => c.type === "3 BHK"
        );
        setMessages((prev) => [
          ...prev,
          {
            id: `user-voice-${now}`,
            role: "user",
            content: "Tell me about the price of a 3 BHK",
            timestamp: now,
            language,
          },
          {
            id: `assistant-voice-${now}`,
            role: "assistant",
            content: `The 3 BHK apartments at ${property.name} range from ${config3bhk?.areaSqftMin?.toLocaleString("en-IN") ?? "N/A"} to ${config3bhk?.areaSqftMax?.toLocaleString("en-IN") ?? "N/A"} sq. ft. The price range is approximately ${property.priceRangeLabel}.\n\nWould you like to know more about the configurations or schedule a site visit?`,
            timestamp: now + 1,
          },
        ]);
        setTimeout(() => setVoiceState("idle"), 2000);
      }, 5000);
    } else {
      setVoiceState("idle");
    }
  }

  function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const now = Date.now();
    const userMessage: ChatMessage = {
      id: `user-${now}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: now,
      language,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `Thank you for your question about "${userMessage.content}". In this demo, I would normally look up the answer from ${property.name}'s approved data and respond in ${SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label ?? "English"}.\n\nThis is a UI preview — the AI conversation backend will be connected in Phase 4.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1200);
  }

  return (
    <div className="flex flex-col h-dvh">
      {/* Chat header */}
      <ChatHeader
        property={property}
        builder={builder}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Conversation column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Voice control */}
          <VoiceControl voiceState={voiceState} onToggle={handleVoiceToggle} />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Text input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-[var(--border-color)] p-4 flex gap-3"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message…"
              className="input flex-1"
              aria-label="Chat message input"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="btn btn-primary"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Side panel — property details + booking */}
        <aside className="hidden lg:flex lg:w-96 lg:flex-col lg:border-l lg:border-[var(--border-color)] overflow-y-auto p-6 space-y-6 bg-[var(--surface-elevated)]">
          <PropertyDetailCard property={property} />

          {/* Builder card */}
          <section className="card p-5 animate-fade-up" aria-label="Builder details">
            <h2 className="font-bold text-base mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-[oklch(0.50_0.15_68)]" />
              Builder Details
            </h2>
            <p className="font-semibold text-sm">{builder.name}</p>
            <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">
              {builder.description}
            </p>
            <span className="badge badge-neutral text-[0.625rem] mt-3">
              DEMO — Synthetic information
            </span>
          </section>

          <BookingWidget property={property} />

          {/* Chat disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[oklch(0.72_0.18_80_/_0.06)] border border-[oklch(0.72_0.18_80_/_0.15)]">
            <Shield className="w-4 h-4 text-[oklch(0.52_0.16_75)] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
              This conversation may be recorded as text for demonstration
              purposes. Voice recordings are not stored.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
