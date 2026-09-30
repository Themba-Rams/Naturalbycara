import Link from "next/link";
import LeafDivider from "./_components/LeafDivider";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-cream px-6 py-16 text-center">
      <p className="text-sm font-medium tracking-[0.2em] text-sage-dark uppercase">
        Welcome to
      </p>
      <h1 className="mt-2 font-serif text-5xl font-semibold text-olive-deep sm:text-6xl">
        Natural By Cara
      </h1>
      <p className="mt-2 text-sm tracking-wide text-olive uppercase">
        Qualified Beauty Specialist
      </p>
      <LeafDivider className="mt-6 h-6 w-40 text-sage" />
      <p className="mt-6 max-w-md text-base text-foreground/80">
        Relax and unwind with a massage or beauty treatment, booked in a
        couple of taps — no more waiting on a WhatsApp reply to lock in your
        slot.
      </p>
      <Link
        href="/book"
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-sage px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sage-dark"
      >
        Book Now
      </Link>
    </div>
  );
}
