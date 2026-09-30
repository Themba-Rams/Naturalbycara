import Link from "next/link";
import BookingFlow from "./_components/BookingFlow";

export default function BookPage() {
  return (
    <div className="flex flex-1 flex-col bg-bg-surface">
      <header className="border-b border-border-subtle bg-bg-surface-alt px-6 py-8 text-center">
        <Link
          href="/"
          className="font-display text-3xl font-semibold text-text-primary transition-colors duration-150 hover:text-accent-hover"
        >
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
        <p className="font-display text-xl font-semibold text-text-primary">
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
      </footer>
    </div>
  );
}
