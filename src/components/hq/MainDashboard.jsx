import DashboardChat from "../dashboard/DashboardChat"
import BoosterverseDesktop from "../../pages/BoosterverseDesktop"

export const MainDashboard = () => {
  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      <section className="w-2/5 min-w-0">
        <DashboardChat />
      </section>
      <section className="w-3/5 min-w-0 rounded-2xl border border-[var(--wood-border)] overflow-hidden">
        <BoosterverseDesktop />
      </section>
    </div>
  );
};
