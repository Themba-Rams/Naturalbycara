"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDaysToDateString,
  formatDateForDisplay,
  formatPrice,
  formatTimeForDisplay,
  todayLocalDateString,
} from "@/lib/formatting";
import LeafDivider from "../../_components/LeafDivider";

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

  if (confirmedBooking) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-sage/30 bg-cream-dark/40 p-6 text-center">
        <LeafDivider className="mx-auto h-5 w-32 text-sage" />
        <h2 className="mt-3 font-serif text-2xl font-semibold text-olive-deep">
          You&apos;re booked!
        </h2>
        <p className="mt-2 text-foreground/80">
          Thanks for booking with <span className="font-medium">Natural By Cara</span>.
        </p>
        <dl className="mt-4 space-y-1 text-left text-sm text-foreground/80">
          <div className="flex justify-between">
            <dt className="text-foreground/50">Service</dt>
            <dd className="font-medium">{confirmedBooking.service.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/50">Date</dt>
            <dd className="font-medium">{formatDateForDisplay(confirmedBooking.date)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/50">Time</dt>
            <dd className="font-medium">{formatTimeForDisplay(confirmedBooking.startTime)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-foreground/50">
          See you then! If you need to change anything, please reach out directly.
        </p>
        <LeafDivider className="mx-auto mt-4 h-5 w-32 text-sage" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8">
      {/* Step 1: service */}
      <section aria-labelledby="step-service-heading" className="flex flex-col gap-3">
        <h2 id="step-service-heading" className="font-serif text-xl font-semibold text-olive-deep">
          1. Choose a service
        </h2>
        {servicesError && <p className="text-sm text-red-700">{servicesError}</p>}
        {!servicesError && services === null && (
          <p className="text-sm text-foreground/60">Loading services…</p>
        )}
        {services !== null && services.length === 0 && (
          <p className="text-sm text-foreground/60">No services are available right now.</p>
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
                className={`flex min-h-14 items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? "border-sage bg-sage/10 ring-1 ring-sage"
                    : "border-sage/30 bg-white/40 hover:border-sage"
                }`}
              >
                <span>
                  <span className="block font-medium text-olive-deep">{service.name}</span>
                  <span className="block text-sm text-foreground/60">
                    {service.duration_minutes} min
                  </span>
                </span>
                {price && <span className="font-medium text-olive-deep">{price}</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2: date */}
      {selectedService && (
        <section aria-labelledby="step-date-heading" className="flex flex-col gap-3">
          <h2 id="step-date-heading" className="font-serif text-xl font-semibold text-olive-deep">
            2. Choose a date
          </h2>
          <label className="flex flex-col gap-1 text-sm text-foreground/80">
            <span className="sr-only">Appointment date</span>
            <input
              type="date"
              value={selectedDate}
              min={today}
              max={maxDate}
              onChange={(e) => handleSelectDate(e.target.value)}
              className="min-h-12 rounded-lg border border-sage/40 bg-white/60 px-4 py-3 text-base text-foreground focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
          </label>
        </section>
      )}

      {/* Step 3: time slot */}
      {selectedService && selectedDate && (
        <section aria-labelledby="step-slot-heading" className="flex flex-col gap-3">
          <h2 id="step-slot-heading" className="font-serif text-xl font-semibold text-olive-deep">
            3. Choose a time
          </h2>
          {slotsState.status === "loading" && (
            <p className="text-sm text-foreground/60">Loading availability…</p>
          )}
          {slotsState.status === "error" && (
            <p className="text-sm text-red-700">{slotsState.message}</p>
          )}
          {slotsState.status === "loaded" && slotsState.slots.length === 0 && (
            <p className="text-sm text-foreground/60">
              No availability that day — try another date.
            </p>
          )}
          {slotsState.status === "loaded" && slotsState.slots.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {slotsState.slots.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    aria-pressed={isSelected}
                    className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-sage bg-sage text-white"
                        : "border-sage/30 bg-white/40 text-foreground/80 hover:border-sage"
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
        <section aria-labelledby="step-details-heading" className="flex flex-col gap-3">
          <h2 id="step-details-heading" className="font-serif text-xl font-semibold text-olive-deep">
            4. Your details
          </h2>
          <label className="flex flex-col gap-1 text-sm text-foreground/80">
            Name
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="min-h-12 rounded-lg border border-sage/40 bg-white/60 px-4 py-3 text-base text-foreground focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
              autoComplete="name"
            />
            {formErrors.name && <span className="text-sm text-red-700">{formErrors.name}</span>}
          </label>
          <label className="flex flex-col gap-1 text-sm text-foreground/80">
            Phone number
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="min-h-12 rounded-lg border border-sage/40 bg-white/60 px-4 py-3 text-base text-foreground focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
              autoComplete="tel"
              placeholder="e.g. 082 123 4567"
            />
            {formErrors.phone && (
              <span className="text-sm text-red-700">{formErrors.phone}</span>
            )}
          </label>
        </section>
      )}

      {/* Step 5: confirm */}
      {selectedSlot && (
        <section className="flex flex-col gap-3">
          {submitState.status === "error" && (
            <p className="text-sm text-red-700">{submitState.message}</p>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitState.status === "submitting"}
            className="min-h-12 rounded-full bg-sage px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitState.status === "submitting" ? "Booking…" : "Confirm booking"}
          </button>
        </section>
      )}
    </div>
  );
}
