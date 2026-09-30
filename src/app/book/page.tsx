import Link from "next/link";
import BookingFlow from "./_components/BookingFlow";
import LeafDivider from "../_components/LeafDivider";

export default function BookPage() {
  return (
    <div className="flex flex-1 flex-col bg-cream">
      <header className="border-b border-sage/20 bg-cream px-6 py-8 text-center">
        <Link href="/" className="font-serif text-3xl font-semibold text-olive-deep">
          Natural By Cara
        </Link>
        <p className="mt-1 text-xs tracking-[0.15em] text-sage-dark uppercase">
          Qualified Beauty Specialist
        </p>
        <LeafDivider className="mx-auto mt-4 h-5 w-32 text-sage" />
        <p className="mt-4 text-sm text-foreground/70">Book your appointment</p>
      </header>
      <main className="flex-1 px-6 py-8">
        <BookingFlow />
      </main>
      <footer className="border-t border-sage/20 bg-cream-dark/40 px-6 py-8 text-center text-sm text-foreground/70">
        <p className="font-serif text-xl font-semibold text-olive-deep">Natural By Cara</p>
        <p className="mt-1 tracking-wide text-sage-dark uppercase text-xs">
          Qualified Beauty Specialist
        </p>
        <p className="mt-3">Roca Solida, 15 Totius Street</p>
        <p>Langenhovenpark, Bloemfontein, Free State</p>
        <p className="mt-2">
          <a href="tel:0637367062" className="underline decoration-sage/50 underline-offset-2 hover:text-olive-deep">
            063 736 7062
          </a>
        </p>
        <p className="mt-2">
          <a
            href="https://instagram.com/natural.by.cara"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-sage/50 underline-offset-2 hover:text-olive-deep"
          >
            @natural.by.cara
          </a>
        </p>
      </footer>
    </div>
  );
}
