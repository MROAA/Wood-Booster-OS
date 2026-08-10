import { useNavigate } from 'react-router-dom';
export const MainDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="relative flex flex-col gap-8">
      {/* Himmennetty puusyy-tekstuuri taustalla - kokeilu, helppo poistaa jos ei toimi.
          Lähde: boosterverse/ec36b216-...png -moodboardin yksi ruutu. */}
      <img
        src="/branding/dashboard-texture.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full rounded-2xl object-cover opacity-[0.08]"
      />
      <header>
        <h1 className="text-2xl font-semibold text-[var(--wood-text)]">
          Tervetuloa Wood-booster <span className="text-[var(--wood-accent)]">HQ</span>
        </h1>
        <p className="text-sm text-[var(--wood-muted)]">
          Työpöytä — pikalinkit tärkeimpiin osiin
        </p>
      </header>
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-card)] p-4 cursor-pointer hover:border-[var(--wood-accent)] transition"
          onClick={() => navigate('/projects')}
        >
          <span className="text-2xl">📁</span>
          <p className="mt-2 text-sm text-[var(--wood-text)]">Projektit</p>
        </div>
        <div
          className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-card)] p-4 cursor-pointer hover:border-[var(--wood-accent)] transition"
          onClick={() => navigate('/knowledge')}
        >
          <span className="text-2xl">◌</span>
          <p className="mt-2 text-sm text-[var(--wood-text)]">Knowledge</p>
        </div>
        <div
          className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-card)] p-4 cursor-pointer hover:border-[var(--wood-accent)] transition"
          onClick={() => navigate('/customers')}
        >
          <span className="text-2xl">◎</span>
          <p className="mt-2 text-sm text-[var(--wood-text)]">Asiakkaat</p>
        </div>
      </section>
    </div>
  );
};
