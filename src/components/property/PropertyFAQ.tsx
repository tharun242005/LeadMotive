"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { PropertyFaq } from "@/lib/demo/demo-data";

interface PropertyFAQProps {
  faqs: readonly PropertyFaq[];
}

function AccordionItem({
  faq,
  index,
}: {
  faq: PropertyFaq;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const id = `faq-${index}`;

  return (
    <div className="border-b border-[var(--border-subtle)] last:border-0">
      <button
        id={`${id}-trigger`}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 py-4 px-1 text-left group"
      >
        <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[oklch(0.50_0.15_68)] transition-colors">
          {faq.question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--foreground-subtle)] flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        id={`${id}-content`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className="accordion-content"
        data-open={isOpen}
      >
        <div>
          <p className="text-sm text-[var(--foreground-muted)] pb-4 px-1 leading-relaxed">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PropertyFAQ({ faqs }: PropertyFAQProps) {
  return (
    <section aria-label="Frequently asked questions" className="animate-fade-up">
      <h2 className="text-xl font-bold mb-4">
        Frequently Asked Questions
      </h2>

      <div className="card p-5 sm:p-6">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} faq={faq} index={index} />
        ))}
      </div>
    </section>
  );
}
