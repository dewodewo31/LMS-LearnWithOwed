import { FiBookOpen, FiTrendingUp, FiUsers } from 'react-icons/fi';

const features = [
  {
    icon: FiBookOpen,
    title: 'Course Terstruktur',
    description: 'Course yang dirancang oleh mentor berpengalaman dengan kurikulum terstruktur dan materi yang mudah dipahami.',
    flagship: true,
    details: [
      'Materi disusun berdasarkan level kesulitan',
      'Setiap course memiliki path belajar yang jelas',
      'Video lesson, artikel, dan latihan praktik',
    ],
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
  const flagship = features.find((f) => f.flagship);
  const others = features.filter((f) => !f.flagship);

  return (
    <section id="fitur" className="bg-lp-bg-soft px-4 py-[120px] sm:px-6 max-[767px]:py-[80px]">
      <div className="lp-container">
        <div className="mb-14 lp-reveal">
          <h2 className="font-lp-sans text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.04em] leading-tight text-lp-text">
            Kenapa Harus Belajar di Sini?
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-lp-muted">
            Kami menyediakan pengalaman belajar coding yang terbaik untuk membantu kamu menguasai skill programming.
          </p>
        </div>

        {/* Flagship feature — full width */}
        {flagship && (
          <div className="lp-skill-card mb-5 p-8 lp-reveal sm:p-10">
            <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-lp-accent-soft text-lp-accent">
                <flagship.icon className="text-xl" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-lp-sans text-xl font-bold text-lp-text">{flagship.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-lp-muted">{flagship.description}</p>
                {flagship.details && (
                  <ul className="mt-4 space-y-2">
                    {flagship.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2 text-sm text-lp-muted">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lp-accent" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Supporting features — 2-column grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          {others.map((feature, i) => (
            <div
              key={feature.title}
              className="lp-skill-card p-7 lp-reveal"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-lp-accent-soft text-lp-accent">
                <feature.icon className="text-lg" aria-hidden="true" />
              </div>
              <h3 className="font-lp-sans text-lg font-bold text-lp-text">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-lp-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
