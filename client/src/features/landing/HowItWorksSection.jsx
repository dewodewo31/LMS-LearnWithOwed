import { FiUserPlus, FiBook, FiPlay, FiCheckCircle } from 'react-icons/fi';

const steps = [
  {
    icon: FiUserPlus,
    number: '01',
    title: 'Daftar Akun',
    description: 'Buat akun gratis dalam hitungan detik. Tim kami akan memberikan akses course.',
  },
  {
    icon: FiBook,
    number: '02',
    title: 'Akses Course',
    description: 'Pilih course yang ingin dipelajari. Semua materi sudah tersedia dan terstruktur.',
  },
  {
    icon: FiPlay,
    number: '03',
    title: 'Belajar & Praktik',
    description: 'Tonton video lesson, baca materi, dan praktikkan langsung kodingnya.',
  },
  {
    icon: FiCheckCircle,
    number: '04',
    title: 'Selesaikan Course',
    description: 'Selesaikan semua lesson dan dapatkan progress belajarmu yang sudah tercatat.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="px-4 py-[140px] sm:px-6 max-[767px]:py-[90px]">
      <div className="lp-container">
        {/* Section header */}
        <div className="mb-16 text-center lp-reveal">
          <p className="mb-3 font-lp-mono text-[11px] font-medium uppercase tracking-[0.2em] text-lp-accent">
            02 — Cara Kerja
          </p>
          <h2 className="font-lp-sans text-[clamp(32px,5vw,52px)] font-bold tracking-[-0.05em] leading-tight text-lp-text">
            Mulai Belajar dalam 4 Langkah
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-lp-muted">
            Proses belajar yang simpel dan terstruktur agar kamu bisa fokus menguasai skill programming.
          </p>
        </div>

        {/* Steps — timeline on desktop, grid on mobile */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center lp-reveal" style={{ transitionDelay: `${i * 100}ms` }}>
              {/* Connector line — desktop only */}
              {i < steps.length - 1 && (
                <div className="absolute left-[calc(50%+40px)] top-8 hidden h-0.5 w-[calc(100%-80px)] bg-lp-border lg:block" />
              )}

              {/* Step icon */}
              <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-lp-card text-xl font-extrabold text-lp-accent border border-lp-border">
                <step.icon className="text-2xl" aria-hidden="true" />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-lp-accent text-[10px] font-bold text-white font-lp-mono">
                  {step.number}
                </span>
              </div>

              <h3 className="font-lp-sans text-lg font-bold text-lp-text">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-lp-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
