import Image from "next/image";
import Link from "next/link";
import Reveal from "./_components/Reveal";

const collage = [
  {
    src: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=900&q=80",
    alt: "Close-up macro detail of a green leaf",
  },
  {
    src: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80",
    alt: "Folded spa linen towels with a fresh orchid",
  },
  {
    src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80",
    alt: "Detail of massage oil being poured for a treatment",
  },
];

const services = [
  {
    name: "Signature Massage",
    description:
      "A slow, pressure-attuned full-body massage to release tension and restore ease.",
    image:
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80",
    tall: true,
  },
  {
    name: "Restorative Facial",
    description:
      "A calming skin treatment tailored to your skin's needs, finished with a gentle glow.",
    image:
      "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=80",
    tall: false,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-bg-surface">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-bg-surface/90 px-6 py-3 backdrop-blur-sm md:px-12">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/logo.jpg"
            alt="Natural By Cara logo"
            width={44}
            height={44}
            className="h-10 w-10 rounded-full border border-border-subtle object-cover md:h-11 md:w-11"
          />
          <span className="font-display text-lg font-semibold text-text-primary md:text-xl">
            Natural By Cara
          </span>
        </Link>
        <Link
          href="/book"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast-text transition-all duration-200 ease-out hover:-translate-y-px hover:bg-accent-hover"
        >
          Book Now
        </Link>
      </header>

      {/* Hero: asymmetrical ~60/40 split */}
      <section className="relative flex flex-col md:flex-row md:min-h-[92vh]">
        <div className="relative h-[46vh] w-full md:h-auto md:w-[60%]">
          <Image
            src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80"
            alt="Warmly lit spa treatment room with linen and stone textures"
            fill
            priority
            sizes="(min-width: 768px) 60vw, 100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-overlay-scrim/40 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-overlay-scrim/25"
            aria-hidden="true"
          />
        </div>

        <div className="flex w-full flex-1 flex-col justify-center px-6 py-12 md:w-[40%] md:px-12 md:py-16">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-accent-secondary">
            Welcome to
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] tracking-[-0.02em] text-text-primary sm:text-6xl md:text-7xl">
            Natural By <em className="text-accent-secondary italic">Cara</em>
          </h1>
          <p className="mt-4 text-sm uppercase tracking-[0.15em] text-text-muted">
            Qualified Beauty Specialist
          </p>
          <p className="mt-6 max-w-md text-base leading-relaxed text-text-secondary md:text-lg">
            Relax and unwind with a massage or beauty treatment, booked in a
            couple of taps — no more waiting on a WhatsApp reply to lock in
            your slot.
          </p>
          <Link
            href="/book"
            className="mt-8 inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-accent px-8 py-3 text-sm font-semibold text-accent-contrast-text shadow-sm transition-all duration-200 ease-out hover:-translate-y-px hover:bg-accent-hover"
          >
            Book Now
          </Link>
        </div>
      </section>

      {/* Services: film-strip on mobile, asymmetric grid on desktop */}
      <section className="bg-bg-surface-alt px-6 py-16 md:px-12 md:py-24">
        <Reveal>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Treatments
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-[-0.01em] text-text-primary md:text-5xl">
            Signature experiences
          </h2>
        </Reveal>

        <div className="mt-10 flex gap-4 overflow-x-auto pb-4 md:mt-14 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:pb-0">
          {services.map((service, i) => (
            <Reveal
              key={service.name}
              delay={i * 100}
              className={`relative w-[80vw] shrink-0 overflow-hidden rounded-xl shadow-lg transition-transform duration-200 ease-out hover:scale-[1.02] hover:shadow-2xl md:w-auto md:shrink ${
                service.tall ? "md:mt-0" : "md:mt-10"
              }`}
            >
              <div
                className={`relative w-full ${
                  service.tall ? "h-72 md:h-96" : "h-72 md:h-72"
                }`}
              >
                <Image
                  src={service.image}
                  alt={service.name}
                  fill
                  sizes="(min-width: 768px) 45vw, 80vw"
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-overlay-scrim/60 via-overlay-scrim/10 to-transparent"
                  aria-hidden="true"
                />
              </div>
              <div className="glass-card absolute inset-x-3 bottom-3 p-5">
                <h3 className="font-display text-2xl font-medium text-text-primary">
                  {service.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {service.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150} className="mt-12">
          <Link
            href="/book"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-border-accent px-8 py-3 text-sm font-semibold text-text-primary transition-all duration-200 ease-out hover:-translate-y-px hover:border-accent hover:text-accent-hover"
          >
            View all treatments &amp; book
          </Link>
        </Reveal>
      </section>

      {/* About Cara: asymmetric photo collage + bio */}
      <section className="bg-bg-surface px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <Reveal className="relative mx-auto h-[380px] w-full max-w-sm md:h-[440px]">
            <div className="absolute left-0 top-10 h-28 w-28 -rotate-3 overflow-hidden rounded-2xl shadow-lg ring-1 ring-border-subtle sm:h-32 sm:w-32">
              <Image
                src={collage[0].src}
                alt={collage[0].alt}
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
            <div className="absolute left-16 top-0 h-64 w-52 overflow-hidden rounded-2xl shadow-xl ring-1 ring-border-subtle sm:h-72 sm:w-60">
              <Image
                src={collage[1].src}
                alt={collage[1].alt}
                fill
                sizes="260px"
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 h-56 w-44 rotate-2 overflow-hidden rounded-2xl shadow-xl ring-1 ring-border-subtle sm:h-64 sm:w-52">
              <Image
                src={collage[2].src}
                alt={collage[2].alt}
                fill
                sizes="220px"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal delay={100} className="glass-card p-8 md:p-10">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-accent-secondary">
              A little about
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-[-0.01em] text-text-primary md:text-4xl">
              Meet Cara
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-secondary">
              Natural By Cara is run by Cara, a Qualified Beauty Specialist
              based at Roca Solida in Langenhovenpark, Bloemfontein. Every
              treatment is unhurried and personal — a space to properly
              switch off, close to home.
            </p>
            <p className="mt-4 text-base leading-relaxed text-text-secondary">
              From massage to skin treatments, each visit is tailored to how
              you&apos;re feeling that day, using techniques and products
              chosen with care.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
