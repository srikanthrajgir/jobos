export default function OpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-heading">Discover Opportunities</h2>
        <button className="bg-primary-teal text-bg-main px-4 py-2 rounded-xl font-bold hover:bg-primary-teal-dark transition-colors">
          + Add Opportunity
        </button>
      </div>
      <div className="bg-bg-card border border-border-light rounded-2xl p-8 text-center">
        <p className="text-text-muted">Opportunity discovery feed coming soon.</p>
      </div>
    </div>
  );
}
