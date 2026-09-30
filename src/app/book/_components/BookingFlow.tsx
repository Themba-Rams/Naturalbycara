"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDaysToDateString,
  formatDateForDisplay,
  formatPrice,
  formatTimeForDisplay,
  todayLocalDateString,
} from "@/lib/formatting";
import DatePicker from "./DatePicker";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
}

interface BookingResult {
  service: Service;
  date: string;
  startTime: string;
}

type SlotsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; slots: string[] }
  | { status: "error"; message: string };

const STEP_NAMES = ["Service", "Date", "Time", "Details", "Confirm"] as const;

export default function BookingFlow() {
  const today = useMemo(() => todayLocalDateString(), []);
  const maxDate = useMemo(() => addDaysToDateString(today, 30), [today]);

  const [services, setServices] = useState<Service[] | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [slotsState, setSlotsState] = useState<SlotsState>({ status: "idle" });

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});

  const [submitState, setSubmitState] = useState<
    { status: "idle" } | { status: "submitting" } | { status: "error"; message: string }
  >({ status: "idle" });

  const [confirmedBooking, setConfirmedBooking] = useState<BookingResult | null>(null);

  // Load active services on mount.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/services")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load services");
        return res.json();
      })
      .then((data: { services: Service[] }) => {
        if (!cancelled) setServices(data.services);
      })
      .catch(() => {
        if (!cancelled) setServicesError("Couldn't load services. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function fetchSlots(serviceId: string, date: string) {
    setSlotsState({ status: "loading" });
    setSelectedSlot(null);
    fetch(`/api/availability?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed to load availability");
        return data as { slots: string[] };
      })
      .then((data) => setSlotsState({ status: "loaded", slots: data.slots }))
      .catch(() =>
        setSlotsState({
          status: "error",
          message: "Couldn't load availability for that date. Please try again.",
        })
      );
  }

  function handleSelectService(service: Service) {
    setSelectedService(service);
    setSelectedDate("");
    setSelectedSlot(null);
    setSlotsState({ status: "idle" });
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    if (selectedService && date) {
      fetchSlots(selectedService.id, date);
    }
  }

  function validateContactForm(): boolean {
    const errors: { name?: string; phone?: string } = {};
    if (clientName.trim().length === 0) {
      errors.name = "Please enter your name.";
    }
    const digits = clientPhone.replace(/[^0-9]/g, "");
    if (digits.length < 7) {
      errors.phone = "Please enter a valid phone number.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleConfirm() {
    if (!selectedService || !selectedDate || !selectedSlot) return;
    if (!validateContactForm()) return;

    setSubmitState({ status: "submitting" });
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: selectedDate,
          startTime: selectedSlot,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
        }),
      });
      const data = await res.json();

      if (res.status === 201) {
        setConfirmedBooking({
          service: selectedService,
          date: selectedDate,
          startTime: selectedSlot,
        });
        setSubmitState({ status: "idle" });
        return;
      }

      if (res.status === 409 && data?.error === "slot_taken") {
        setSubmitState({
          status: "error",
          message: "Sorry, that slot was just booked. Please pick another time.",
        });
        setSelectedSlot(null);
        fetchSlots(selectedService.id, selectedDate);
        return;
      }

      setSubmitState({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
    } catch {
      setSubmitState({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
    }
  }

  // Derive current step index for the progress rail (purely presentational —
  // does not affect the data flow above).
  const currentStepIndex = confirmedBooking
    ? 5
    : selectedSlot
      ? 4
      : selectedDate
        ? 3
        : selectedService
          ? 2
          : 1;

  if (confirmedBooking) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-border-subtle bg-surface-card p-8 text-center shadow-2xl success-scale-in">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success-bg">
          <svg
            viewBox="0 0 24 24"
            width="32"
            height="32"
            fill="none"
            stroke="var(--success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path className="success-check-path" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-5 font-display text-2xl font-medium text-text-primary">
          You&apos;re booked!
        </h2>
        <p className="mt-2 text-text-secondary">
          Thanks for booking with{" "}
          <span className="font-semibold text-text-primary">Natural By Cara</span>.
        </p>
        <dl className="mt-6 w-full space-y-2 rounded-lg bg-bg-surface-alt p-4 text-left text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">Service</dt>
            <dd className="font-semibold text-text-primary">
              {confirmedBooking.service.name}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Date</dt>
            <dd className="font-semibold text-text-primary">
              {formatDateForDisplay(confirmedBooking.date)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Time</dt>
            <dd className="font-semibold text-text-primary">
              {formatTimeForDisplay(confirmedBooking.startTime)}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-sm text-text-muted">
          See you then! If you need to change anything, please reach out directly.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 md:flex-row md:items-start md:gap-12">
      {/* Progress rail: vertical on desktop, compact row on mobile */}
      <nav
        aria-label="Booking progress"
        className="flex gap-4 overflow-x-auto md:sticky md:top-8 md:w-48 md:shrink-0 md:flex-col md:gap-3 md:overflow-visible"
      >
        {STEP_NAMES.map((name, i) => {
          const stepNum = i + 1;
          const isComplete = stepNum < currentStepIndex;
          const isActive = stepNum === currentStepIndex;
          return (
            <div
              key={name}
              className={`flex shrink-0 items-center gap-3 whitespace-nowrap md:whitespace-normal ${
                isActive ? "text-text-primary" : isComplete ? "text-text-secondary" : "text-text-muted"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200 ${
                  isComplete
                    ? "bg-success-bg text-success"
                    : isActive
                      ? "bg-accent text-accent-contrast-text"
                      : "border border-border-default text-text-muted"
                }`}
              >
                {isComplete ? (
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </span>
              <span className="font-sans text-sm font-semibold">{name}</span>
            </div>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-8">
        {/* Step 1: service */}
        <section aria-labelledby="step-service-heading" className="flex flex-col gap-3">
          <h2
            id="step-service-heading"
            className="font-display text-xl font-medium text-text-primary md:text-2xl"
          >
            Choose a service
          </h2>
          {servicesError && <p className="text-sm text-red-400">{servicesError}</p>}
          {!servicesError && services === null && (
            <p className="text-sm text-text-muted">Loading services…</p>
          )}
          {services !== null && services.length === 0 && (
            <p className="text-sm text-text-muted">No services are available right now.</p>
          )}
          <div className="flex flex-col gap-2">
            {services?.map((service) => {
              const isSelected = selectedService?.id === service.id;
              const price = formatPrice(service.price);
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleSelectService(service)}
                  aria-pressed={isSelected}
                  className={`flex min-h-14 items-center justify-between rounded-lg border px-4 py-3 text-left transition-all duration-200 ease-out ${
                    isSelected
                      ? "border-accent bg-surface-card-hover ring-1 ring-accent"
                      : "border-border-subtle bg-surface-card hover:border-border-accent hover:bg-surface-card-hover"
                  }`}
                >
                  <span>
                    <span className="block font-semibold text-text-primary">
                      {service.name}
                    </span>
                    <span className="block text-sm text-text-muted">
                      {service.duration_minutes} min
                    </span>
                  </span>
                  {price && <span className="font-semibold text-accent">{price}</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: date */}
        {selectedService && (
          <section
            aria-labelledby="step-date-heading"
            className="step-enter-forward flex flex-col gap-3"
          >
            <h2
              id="step-date-heading"
              className="font-display text-xl font-medium text-text-primary md:text-2xl"
            >
              Choose a date
            </h2>
            <DatePicker value={selectedDate} onChange={handleSelectDate} min={today} max={maxDate} />
          </section>
        )}

        {/* Step 3: time slot */}
        {selectedService && selectedDate && (
          <section
            aria-labelledby="step-slot-heading"
            className="step-enter-forward flex flex-col gap-3"
          >
            <h2
              id="step-slot-heading"
              className="font-display text-xl font-medium text-text-primary md:text-2xl"
            >
              Choose a time
            </h2>
            {slotsState.status === "loading" && (
              <p className="text-sm text-text-muted">Loading availability…</p>
            )}
            {slotsState.status === "error" && (
              <p className="text-sm text-red-400">{slotsState.message}</p>
            )}
            {slotsState.status === "loaded" && slotsState.slots.length === 0 && (
              <p className="text-sm text-text-muted">
                No availability that day — try another date.
              </p>
            )}
            {slotsState.status === "loaded" && slotsState.slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slotsState.slots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      aria-pressed={isSelected}
                      className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-medium transition-all duration-200 ease-out ${
                        isSelected
                          ? "border-accent bg-accent text-accent-contrast-text"
                          : "border-border-subtle bg-surface-card text-text-secondary hover:border-accent"
                      }`}
                    >
                      {formatTimeForDisplay(slot)}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Step 4: contact details */}
        {selectedSlot && (
          <section
            aria-labelledby="step-details-heading"
            className="step-enter-forward flex flex-col gap-3"
          >
            <h2
              id="step-details-heading"
              className="font-display text-xl font-medium text-text-primary md:text-2xl"
            >
              Your details
            </h2>
            <label className="flex flex-col gap-1 text-sm text-text-secondary">
              Name
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="min-h-12 rounded-lg border border-border-default bg-surface-card px-4 py-3 text-base text-text-primary transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                autoComplete="name"
              />
              {formErrors.name && (
                <span className="text-sm text-red-400">{formErrors.name}</span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm text-text-secondary">
              Phone number
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="min-h-12 rounded-lg border border-border-default bg-surface-card px-4 py-3 text-base text-text-primary transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                autoComplete="tel"
                placeholder="e.g. 082 123 4567"
              />
              {formErrors.phone && (
                <span className="text-sm text-red-400">{formErrors.phone}</span>
              )}
            </label>
          </section>
        )}

        {/* Step 5: confirm */}
        {selectedSlot && (
          <section className="step-enter-forward flex flex-col gap-3">
            {submitState.status === "error" && (
              <p className="text-sm text-red-400">{submitState.message}</p>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitState.status === "submitting"}
              className="min-h-12 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-contrast-text shadow-sm transition-all duration-200 ease-out hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitState.status === "submitting" ? "Booking…" : "Confirm booking"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
