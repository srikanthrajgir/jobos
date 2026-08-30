export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-heading">Platform Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-bg-card p-6 rounded-2xl border border-border-light">
          <h3 className="text-sm font-bold text-text-muted uppercase">Total Users</h3>
          <div className="text-3xl font-black mt-2">1,248</div>
        </div>
        <div className="bg-bg-card p-6 rounded-2xl border border-border-light">
          <h3 className="text-sm font-bold text-text-muted uppercase">Active Companies</h3>
          <div className="text-3xl font-black mt-2">342</div>
        </div>
        <div className="bg-bg-card p-6 rounded-2xl border border-border-light">
          <h3 className="text-sm font-bold text-text-muted uppercase">Jobs Tracked</h3>
          <div className="text-3xl font-black mt-2">8,921</div>
        </div>
        <div className="bg-bg-card p-6 rounded-2xl border border-border-light">
          <h3 className="text-sm font-bold text-text-muted uppercase">AI Runs</h3>
          <div className="text-3xl font-black mt-2">45k</div>
        </div>
      </div>
    </div>
  );
}
