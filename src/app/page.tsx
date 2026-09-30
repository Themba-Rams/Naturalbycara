import Image from "next/image";
import Link from "next/link";
import Reveal from "./_components/Reveal";

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
            className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/10 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-bg-surface"
            aria-hidden="true"
          />
        </div>

        <div className="flex w-full flex-1 flex-col justify-center px-6 py-12 md:w-[40%] md:px-12 md:py-16">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Welcome to
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] tracking-[-0.02em] text-text-primary sm:text-6xl md:text-7xl">
            Natural By <em className="text-accent italic">Cara</em>
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
              className={`relative w-[80vw] shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-surface-card shadow-lg transition-transform duration-200 ease-out hover:scale-[1.02] hover:shadow-2xl md:w-auto md:shrink ${
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
                  className="absolute inset-0 bg-gradient-to-t from-bg-surface/90 via-bg-surface/20 to-transparent"
                  aria-hidden="true"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6">
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
    </div>
  );
}
