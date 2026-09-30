import Image from "next/image";
import Link from "next/link";
import BookingFlow from "./_components/BookingFlow";

const MAP_SRC = `https://maps.google.com/maps?q=${encodeURIComponent(
  "15 Totius Street, Langenhovenpark, Bloemfontein, Free State, South Africa"
)}&output=embed`;

export default function BookPage() {
  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-bg-surface to-[#F0EBDD]">
      <header className="border-b border-border-subtle bg-bg-surface-alt px-6 py-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-3 font-display text-3xl font-semibold text-text-primary transition-colors duration-150 hover:text-accent-hover"
        >
          <Image
            src="/brand/logo.jpg"
            alt="Natural By Cara logo"
            width={44}
            height={44}
            className="h-10 w-10 rounded-full border border-border-subtle object-cover md:h-11 md:w-11"
          />
          Natural By Cara
        </Link>
        <p className="mt-1 text-xs uppercase tracking-[0.15em] text-accent">
          Qualified Beauty Specialist
        </p>
        <p className="mt-4 text-sm text-text-secondary">Book your appointment</p>
      </header>
      <main className="flex-1 px-6 py-8 md:py-12">
        <BookingFlow />
      </main>
      <footer className="border-t border-border-subtle bg-bg-surface-alt px-6 py-8 text-center text-sm text-text-secondary">
        <div className="relative mx-auto h-[72px] w-[72px]">
          <div className="absolute inset-[-2px] rounded-full ring-2 ring-accent-secondary" aria-hidden="true" />
          <Image
            src="/brand/logo.jpg"
            alt="Natural By Cara logo"
            width={72}
            height={72}
            className="h-full w-full rounded-full object-cover"
          />
        </div>
        <p className="mt-4 font-display text-xl font-semibold text-text-primary">
          Natural By Cara
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-accent">
          Qualified Beauty Specialist
        </p>
        <p className="mt-3">Roca Solida, 15 Totius Street</p>
        <p>Langenhovenpark, Bloemfontein, Free State</p>
        <p className="mt-2">
          <a
            href="tel:0637367062"
            className="underline decoration-accent/50 underline-offset-2 transition-colors duration-150 hover:text-accent-hover"
          >
            063 736 7062
          </a>
        </p>
        <p className="mt-2">
          <a
            href="https://instagram.com/natural.by.cara"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-accent/50 underline-offset-2 transition-colors duration-150 hover:text-accent-hover"
          >
            @natural.by.cara
          </a>
        </p>

        <div className="glass-card mx-auto mt-8 max-w-2xl overflow-hidden p-2 text-left">
          <p className="px-2 pt-1 pb-3 text-center font-display text-lg text-text-primary">
            Find us in Bloemfontein
          </p>
          <div className="overflow-hidden rounded-[14px] border border-border-subtle">
            <iframe
              src={MAP_SRC}
              className="block h-64 w-full md:h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Natural By Cara location — 15 Totius Street, Langenhovenpark, Bloemfontein"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
