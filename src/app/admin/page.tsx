"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  LogOut,
  Users,
  MessageSquare,
  Calendar,
  CheckCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  Mail,
  Phone,
  ExternalLink,
  X,
} from "lucide-react";
import {
  SEED_INQUIRIES,
  PROPERTIES,
  getPropertyBySlug,
  getBuilderForProperty,
  type SeedInquiry,
  type InquiryStatus,
  type BookingStatus,
  type EmailStatus,
  type ChatSessionStatus,
} from "@/lib/demo/demo-data";

// Status badge component
function StatusBadge({
  status,
  type,
}: {
  status: string;
  type: "inquiry" | "booking" | "email" | "chat";
}) {
  const styles: Record<string, string> = {
    // Inquiry
    new_inquiry: "badge-brand",
    conversation_started: "badge-brand",
    requirements_captured: "badge-warning",
    property_questions_answered: "badge-warning",
    visit_requested: "badge-warning",
    follow_up_required: "badge-error",
    completed: "badge-success",
    cancelled: "badge-neutral",
    // Booking
    none: "badge-neutral",
    pending_confirmation: "badge-warning",
    confirmed: "badge-success",
    no_show: "badge-error",
    reschedule_requested: "badge-warning",
    // Email
    pending: "badge-warning",
    sent: "badge-success",
    failed: "badge-error",
    // Chat
    active: "badge-success",
    expired: "badge-neutral",
    revoked: "badge-error",
  };

  const labels: Record<string, string> = {
    new_inquiry: "New",
    conversation_started: "In Conversation",
    requirements_captured: "Requirements Captured",
    property_questions_answered: "Questions Answered",
    visit_requested: "Visit Requested",
    follow_up_required: "Follow-up Required",
    completed: "Completed",
    cancelled: "Cancelled",
    none: "None",
    pending_confirmation: "Pending",
    confirmed: "Confirmed",
    no_show: "No-show",
    reschedule_requested: "Reschedule",
    pending: "Pending",
    sent: "Sent",
    failed: "Failed",
    active: "Active",
    expired: "Expired",
    revoked: "Revoked",
  };

  return (
    <span className={`badge ${styles[status] ?? "badge-neutral"}`}>
      {labels[status] ?? status}
    </span>
  );
}

// Summary card
function SummaryCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  trend?: string;
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-[oklch(0.58_0.16_70_/_0.1)] flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-[oklch(0.50_0.15_68)]" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-[var(--foreground-muted)]">{label}</p>
        {trend && (
          <p className="text-xs text-[var(--foreground-subtle)] mt-0.5">
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}

// Detail panel
function InquiryDetailPanel({
  inquiry,
  onClose,
}: {
  inquiry: SeedInquiry;
  onClose: () => void;
}) {
  const property = getPropertyBySlug(inquiry.propertySlug);
  const builder = property ? getBuilderForProperty(property) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[var(--surface)] border-l border-[var(--border-color)] shadow-[var(--shadow-elevated)] overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--surface)] border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-lg">Inquiry Details</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Lead section */}
          <section>
            <h3 className="text-xs font-semibold text-[var(--foreground-subtle)] uppercase tracking-wider mb-3">
              Lead
            </h3>
            <div className="space-y-2">
              <p className="font-semibold text-lg">{inquiry.userName}</p>
              <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <Mail className="w-3.5 h-3.5" />
                <span>{inquiry.userEmail}</span>
              </div>
              {inquiry.userPhone && (
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{inquiry.userPhone}</span>
                </div>
              )}
            </div>
          </section>

          {/* Property section */}
          {property && (
            <section>
              <h3 className="text-xs font-semibold text-[var(--foreground-subtle)] uppercase tracking-wider mb-3">
                Property
              </h3>
              <div className="card p-4">
                <p className="font-semibold">{property.name}</p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {property.location.locality}, Bengaluru
                </p>
                <p className="text-sm text-[oklch(0.50_0.15_68)] mt-1">
                  {property.priceRangeLabel}
                </p>
              </div>
            </section>
          )}

          {/* Builder section */}
          {builder && (
            <section>
              <h3 className="text-xs font-semibold text-[var(--foreground-subtle)] uppercase tracking-wider mb-3">
                Builder
              </h3>
              <div className="card p-4">
                <p className="font-semibold">{builder.name}</p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  {builder.tagline}
                </p>
              </div>
            </section>
          )}

          {/* Status overview */}
          <section>
            <h3 className="text-xs font-semibold text-[var(--foreground-subtle)] uppercase tracking-wider mb-3">
              Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[var(--surface-elevated)]">
                <p className="text-xs text-[var(--foreground-subtle)] mb-1">
                  Inquiry
                </p>
                <StatusBadge
                  status={inquiry.inquiryStatus}
                  type="inquiry"
                />
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface-elevated)]">
                <p className="text-xs text-[var(--foreground-subtle)] mb-1">
                  Email
                </p>
                <StatusBadge
                  status={inquiry.emailStatus}
                  type="email"
                />
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface-elevated)]">
                <p className="text-xs text-[var(--foreground-subtle)] mb-1">
                  Chat
                </p>
                <StatusBadge
                  status={inquiry.chatSessionStatus}
                  type="chat"
                />
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface-elevated)]">
                <p className="text-xs text-[var(--foreground-subtle)] mb-1">
                  Booking
                </p>
                <StatusBadge
                  status={inquiry.bookingStatus}
                  type="booking"
                />
              </div>
            </div>
          </section>

          {/* Quick actions */}
          <section>
            <h3 className="text-xs font-semibold text-[var(--foreground-subtle)] uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="btn btn-secondary w-full justify-start text-sm">
                Revoke Chat Token
              </button>
              <button className="btn btn-secondary w-full justify-start text-sm">
                Mark Follow-up Required
              </button>
              <button className="btn btn-secondary w-full justify-start text-sm">
                Add Admin Note
              </button>
            </div>
          </section>

          {/* Demo notice */}
          <div className="p-3 rounded-lg bg-[oklch(0.72_0.18_80_/_0.06)] border border-[oklch(0.72_0.18_80_/_0.15)]">
            <p className="text-xs text-[var(--foreground-muted)]">
              This is a demonstration with synthetic data. Quick actions are
              non-functional in this preview.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<SeedInquiry | null>(
    null
  );

  // Compute summary stats from seed data
  const totalInquiries = SEED_INQUIRIES.length;
  const activeConversations = SEED_INQUIRIES.filter(
    (i) => i.chatSessionStatus === "active"
  ).length;
  const pendingBookings = SEED_INQUIRIES.filter(
    (i) =>
      i.bookingStatus === "pending_confirmation" ||
      i.bookingStatus === "confirmed"
  ).length;
  const completedVisits = SEED_INQUIRIES.filter(
    (i) => i.bookingStatus === "completed"
  ).length;

  // Filter inquiries
  const filteredInquiries = SEED_INQUIRIES.filter((inquiry) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inquiry.userName.toLowerCase().includes(q) ||
      inquiry.userEmail.toLowerCase().includes(q) ||
      inquiry.propertySlug.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--surface-elevated)]">
      {/* Admin header */}
      <header className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border-color)] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-screen-2xl flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--gradient-brand)] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm">IQOL Admin</span>
              <span className="badge badge-neutral text-[0.5rem] ml-2">
                DEMO
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--foreground-subtle)] hidden sm:block">
              admin@example.test
            </span>
            <Link
              href="/admin/login"
              className="btn btn-ghost btn-sm text-[var(--foreground-subtle)]"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-screen-2xl w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Operations Dashboard</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Track inquiries, conversations and bookings across all properties.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
          <SummaryCard
            icon={Users}
            label="Total Inquiries"
            value={totalInquiries}
          />
          <SummaryCard
            icon={MessageSquare}
            label="Active Conversations"
            value={activeConversations}
          />
          <SummaryCard
            icon={Calendar}
            label="Pending Bookings"
            value={pendingBookings}
          />
          <SummaryCard
            icon={CheckCircle}
            label="Completed Visits"
            value={completedVisits}
          />
        </div>

        {/* Search & filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email or property…"
              className="input pl-10"
              aria-label="Search inquiries"
            />
          </div>
          <button className="btn btn-secondary gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Inquiry table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--surface-elevated)]">
                  <th className="text-left py-3 px-4 font-semibold text-[var(--foreground-muted)] whitespace-nowrap">
                    Lead Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-[var(--foreground-muted)] whitespace-nowrap hidden sm:table-cell">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-[var(--foreground-muted)] whitespace-nowrap">
                    Property
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-[var(--foreground-muted)] whitespace-nowrap hidden md:table-cell">
                    Inquiry
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-[var(--foreground-muted)] whitespace-nowrap hidden lg:table-cell">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-[var(--foreground-muted)] whitespace-nowrap hidden lg:table-cell">
                    Chat
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-[var(--foreground-muted)] whitespace-nowrap">
                    Booking
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-[var(--foreground-muted)] whitespace-nowrap hidden xl:table-cell">
                    Language
                  </th>
                  <th className="py-3 px-4" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.map((inquiry, index) => {
                  const property = getPropertyBySlug(inquiry.propertySlug);
                  return (
                    <tr
                      key={index}
                      className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
                      onClick={() => setSelectedInquiry(inquiry)}
                    >
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        {inquiry.userName}
                      </td>
                      <td className="py-3 px-4 text-[var(--foreground-muted)] whitespace-nowrap hidden sm:table-cell">
                        {inquiry.userEmail}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-sm">
                          {property?.name ?? inquiry.propertySlug}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <StatusBadge
                          status={inquiry.inquiryStatus}
                          type="inquiry"
                        />
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <StatusBadge
                          status={inquiry.emailStatus}
                          type="email"
                        />
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <StatusBadge
                          status={inquiry.chatSessionStatus}
                          type="chat"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={inquiry.bookingStatus}
                          type="booking"
                        />
                      </td>
                      <td className="py-3 px-4 hidden xl:table-cell">
                        <span className="text-xs text-[var(--foreground-subtle)] uppercase">
                          {inquiry.preferredLanguage}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          className="btn btn-ghost btn-sm"
                          aria-label={`View details for ${inquiry.userName}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredInquiries.length === 0 && (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-[var(--foreground-subtle)] mx-auto mb-3 opacity-50" />
              <p className="text-sm text-[var(--foreground-muted)]">
                No inquiries match your search.
              </p>
            </div>
          )}
        </div>

        {/* Demo notice */}
        <p className="text-xs text-[var(--foreground-subtle)] text-center mt-6">
          Showing {filteredInquiries.length} seed inquiries · All data is
          synthetic
        </p>
      </main>

      {/* Detail panel */}
      {selectedInquiry && (
        <InquiryDetailPanel
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
        />
      )}
    </div>
  );
}
