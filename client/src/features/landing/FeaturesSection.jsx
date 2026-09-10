import { FiBookOpen, FiTrendingUp, FiUsers } from 'react-icons/fi';

const features = [
  {
    icon: FiBookOpen,
    title: 'Course Terstruktur',
    description: 'Course yang dirancang oleh mentor berpengalaman dengan kurikulum terstruktur dan materi yang mudah dipahami.',
  },
  {
    icon: FiTrendingUp,
    title: 'Progress Tracking',
    description: 'Pantau perkembangan belajarmu secara real-time. Ketahui sudah sampai mana progress belajarmu.',
  },
  {
    icon: FiUsers,
    title: 'Komunitas Belajar',
    description: 'Diskusi dengan mentor dan sesama siswa di komunitas course. Tanya jawab langsung dengan ahlinya.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="fitur" className="bg-lp-bg-soft px-4 py-[140px] sm:px-6 max-[767px]:py-[90px]">
      <div className="lp-container">
        {/* Section header */}
        <div className="mb-16 text-center lp-reveal">
          <p className="mb-3 font-lp-mono text-[11px] font-medium uppercase tracking-[0.2em] text-lp-accent">
            01 — Fitur
          </p>
          <h2 className="font-lp-sans text-[clamp(32px,5vw,52px)] font-bold tracking-[-0.05em] leading-tight text-lp-text">
            Kenapa Harus Belajar di Sini?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-lp-muted">
            Kami menyediakan pengalaman belajar coding yang terbaik untuk membantu kamu menguasai skill programming.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="lp-skill-card group p-8 lp-reveal"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Icon */}
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[15px] bg-lp-accent-soft text-lp-accent transition-colors group-hover:bg-lp-accent group-hover:text-white">
                <feature.icon className="text-2xl" aria-hidden="true" />
              </div>
              {/* Title */}
              <h3 className="font-lp-sans text-lg font-bold text-lp-text">{feature.title}</h3>
              {/* Description */}
              <p className="mt-3 text-sm leading-relaxed text-lp-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
