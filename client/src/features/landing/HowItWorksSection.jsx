import { FiUserPlus, FiBook, FiPlay, FiCheckCircle } from 'react-icons/fi';

const steps = [
  {
    icon: FiUserPlus,
    title: 'Daftar Akun',
    description: 'Buat akun gratis dalam hitungan detik. Tim kami akan memberikan akses course.',
  },
  {
    icon: FiBook,
    title: 'Akses Course',
    description: 'Setelah admin memberikan akses, semua materi tersedia dan terstruktur untuk dipelajari.',
  },
  {
    icon: FiPlay,
    title: 'Belajar & Praktik',
    description: 'Tonton video lesson, baca materi, dan praktikkan langsung kodingnya.',
  },
  {
    icon: FiCheckCircle,
    title: 'Selesaikan Course',
    description: 'Selesaikan semua lesson dan dapatkan progress belajarmu yang sudah tercatat.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="px-4 py-[120px] sm:px-6 max-[767px]:py-[80px]">
      <div className="lp-container">
        <div className="mb-14 lp-reveal">
          <h2 className="font-lp-sans text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.04em] leading-tight text-lp-text">
            Mulai Belajar dalam 4 Langkah
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-lp-muted">
            Proses belajar yang simpel dan terstruktur agar kamu bisa fokus menguasai skill programming.
          </p>
        </div>

        {/* Steps — alternating layout on desktop */}
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`lp-reveal flex items-start gap-5 rounded-2xl border border-lp-border bg-lp-card p-6 sm:p-7 ${
                i % 2 === 0 ? '' : 'sm:ml-auto sm:max-w-[85%]'
              }`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-lp-accent-soft text-lp-accent">
                <step.icon className="text-lg" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-lp-sans text-lg font-bold text-lp-text">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-lp-muted">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
