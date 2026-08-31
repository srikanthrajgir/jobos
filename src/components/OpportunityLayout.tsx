"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Bookmark, CheckCircle2, XCircle, Search, MapPin, Briefcase, DollarSign, Calendar, Star, Zap, EyeOff, Loader2, Building2, Target } from 'lucide-react';
import { updateMatchStatus, getApplicationDraft, confirmApplication } from '@/app/actions/opportunities';

const TABS = [
  { id: 'new', label: 'For You', icon: Inbox },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'applied', label: 'Applied', icon: CheckCircle2 },
  { id: 'dismissed', label: 'Dismissed', icon: XCircle }
];

export default function OpportunityLayout({ initialMatches }: { initialMatches: any[] }) {
  const [activeTab, setActiveTab] = useState('new');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matches, setMatches] = useState(initialMatches);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  // App workflow state
  const [appStep, setAppStep] = useState(0); // 0 = none, 1 = review, 2 = confirm
  const [appDraft, setAppDraft] = useState<any>(null);

  const filteredMatches = matches.filter(m => m.status === activeTab);
  
  // Select first match automatically if desktop and none selected
  if (filteredMatches.length > 0 && !selectedId) {
    setSelectedId(filteredMatches[0].opportunity_id);
  } else if (filteredMatches.length === 0 && selectedId) {
    setSelectedId(null);
  }

  const selectedMatch = matches.find(m => m.opportunity_id === selectedId);
  const opp = selectedMatch?.job_opportunities;

  const handleStatusUpdate = async (id: string, status: 'saved' | 'dismissed' | 'applied') => {
    setLoadingAction(`${id}-${status}`);
    try {
      await updateMatchStatus(matches.find(m => m.opportunity_id === id)!.id, status);
      setMatches(matches.map(m => m.opportunity_id === id ? { ...m, status } : m));
      setSelectedId(null);
      setAppStep(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStartApplication = async (id: string) => {
    setLoadingAction(`${id}-draft`);
    try {
      const draft = await getApplicationDraft(id);
      setAppDraft(draft);
      setAppStep(1);
    } catch(e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleConfirmApplication = async (id: string) => {
    setLoadingAction(`${id}-confirm`);
    try {
      await confirmApplication(id, 'email', {
        recipient: opp.application_email,
        subject: appDraft.subject,
        body: appDraft.body
      });
      setMatches(matches.map(m => m.opportunity_id === id ? { ...m, status: 'applied' } : m));
      setAppStep(0);
      setSelectedId(null);
    } catch(e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex border-b border-border-light shrink-0 overflow-x-auto custom-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedId(null); setAppStep(0); }}
            className={`flex items-center space-x-2 px-6 py-4 font-bold text-sm tracking-wide transition-colors whitespace-nowrap border-b-2 ${
              activeTab === tab.id 
                ? 'border-primary-teal text-primary-teal' 
                : 'border-transparent text-text-muted hover:text-text-charcoal hover:bg-bg-hover'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
            <span className="ml-2 bg-bg-secondary text-text-muted px-2 py-0.5 rounded-full text-xs border border-border-light">
              {matches.filter(m => m.status === tab.id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left List */}
        <div className={`w-full md:w-[40%] border-r border-border-light flex flex-col ${selectedId && 'hidden md:flex'}`}>
          <div className="p-4 border-b border-border-light shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Search titles or companies..." 
                className="w-full bg-bg-secondary border border-border-light rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal text-text-charcoal"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {filteredMatches.length === 0 ? (
              <div className="text-center p-8">
                <Inbox size={48} className="mx-auto text-border-light mb-4" />
                <p className="text-text-heading font-bold mb-1">Nothing here yet</p>
                <p className="text-sm text-text-muted">Opportunities will appear here based on your preferences.</p>
              </div>
            ) : (
              filteredMatches.map((match) => {
                const job = match.job_opportunities;
                const isSelected = selectedId === match.opportunity_id;
                
                let badgeColor = "bg-primary-teal-light text-primary-teal-dark";
                if (match.match_category === 'Strong Match') badgeColor = "bg-green-500/10 text-green-500 border border-green-500/20";
                else if (match.match_category === 'Stretch Opportunity') badgeColor = "bg-accent-orange/10 text-accent-orange border border-accent-orange/20";

                return (
                  <button
                    key={match.opportunity_id}
                    onClick={() => { setSelectedId(match.opportunity_id); setAppStep(0); }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-bg-hover border-primary-teal shadow-sm' 
                        : 'bg-bg-main border-border-light hover:border-text-muted'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${badgeColor}`}>
                        {match.match_category}
                      </span>
                      <span className="text-xs text-text-muted">{new Date(match.batch_date).toLocaleDateString()}</span>
                    </div>
                    
                    <h3 className="font-bold text-text-heading text-lg leading-tight mb-1">{job.title}</h3>
                    <p className="text-sm font-medium text-text-charcoal flex items-center mb-3">
                      <Building2 size={14} className="mr-1.5" /> {job.company_name || 'Unknown Company'}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="flex items-center text-xs font-medium text-text-muted bg-bg-secondary px-2 py-1 rounded">
                        <MapPin size={12} className="mr-1" /> {job.suburb || 'Remote'}
                      </span>
                      <span className="flex items-center text-xs font-medium text-text-muted bg-bg-secondary px-2 py-1 rounded">
                        <Briefcase size={12} className="mr-1" /> {job.employment_type || 'Full-time'}
                      </span>
                    </div>
                    
                    {match.match_reasons && match.match_reasons[0] && (
                      <div className="text-sm text-text-charcoal bg-bg-secondary p-3 rounded-lg border border-border-light">
                        <span className="flex items-start">
                          <Star size={14} className="text-accent-orange mr-2 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{match.match_reasons[0]}</span>
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Details */}
        <div className={`w-full md:w-[60%] bg-bg-main overflow-y-auto ${!selectedId && 'hidden md:block'}`}>
          {selectedId && opp ? (
            <div className="p-6 md:p-8 animate-in fade-in duration-300 relative">
              
              <button 
                className="md:hidden mb-6 flex items-center text-sm font-bold text-text-muted hover:text-text-charcoal transition-colors"
                onClick={() => setSelectedId(null)}
              >
                ← Back to list
              </button>

              <div className="flex flex-col md:flex-row md:items-start justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-text-heading mb-2">{opp.title}</h2>
                  <p className="text-lg font-medium text-primary-teal flex items-center">
                    <Building2 size={18} className="mr-2" /> {opp.company_name || 'Unknown Company'}
                  </p>
                </div>
                
                {appStep === 0 && (
                  <div className="flex items-center space-x-3 mt-4 md:mt-0">
                    {activeTab !== 'dismissed' && activeTab !== 'applied' && (
                      <button 
                        onClick={() => handleStatusUpdate(selectedId, 'dismissed')}
                        disabled={!!loadingAction}
                        className="p-2.5 rounded-xl border border-border-light text-text-muted hover:bg-bg-hover hover:text-red-500 hover:border-red-500 transition-colors tooltip"
                        title="Not for me"
                      >
                        {loadingAction === `${selectedId}-dismissed` ? <Loader2 size={20} className="animate-spin" /> : <EyeOff size={20} />}
                      </button>
                    )}
                    {activeTab !== 'saved' && activeTab !== 'applied' && activeTab !== 'dismissed' && (
                      <button 
                        onClick={() => handleStatusUpdate(selectedId, 'saved')}
                        disabled={!!loadingAction}
                        className="p-2.5 rounded-xl border border-border-light text-text-muted hover:bg-bg-hover hover:text-text-charcoal hover:border-text-charcoal transition-colors tooltip"
                        title="Save for later"
                      >
                        {loadingAction === `${selectedId}-saved` ? <Loader2 size={20} className="animate-spin" /> : <Bookmark size={20} />}
                      </button>
                    )}
                    {activeTab !== 'applied' && (
                      <button 
                        onClick={() => handleStartApplication(selectedId)}
                        disabled={!!loadingAction}
                        className="px-6 py-2.5 rounded-xl font-bold bg-primary-teal text-bg-main hover:bg-primary-teal-dark shadow-md transition-colors flex items-center"
                      >
                        {loadingAction === `${selectedId}-draft` ? <Loader2 size={18} className="animate-spin mr-2" /> : <Zap size={18} className="mr-2" />}
                        Apply with JobOS
                      </button>
                    )}
                  </div>
                )}
              </div>

              {appStep === 1 && appDraft && (
                <div className="bg-bg-secondary border border-primary-teal rounded-2xl p-6 mb-8 shadow-sm">
                  <h3 className="font-bold text-lg text-primary-teal-dark mb-4 flex items-center">
                    <Zap size={20} className="mr-2" /> Review Application Draft
                  </h3>
                  
                  <div className="space-y-4 bg-bg-card p-4 rounded-xl border border-border-light mb-6">
                    <div>
                      <span className="text-xs font-bold text-text-muted uppercase">To:</span>
                      <p className="text-sm text-text-charcoal font-medium mt-0.5">{opp.application_email || 'careers@example.com'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-text-muted uppercase">Subject:</span>
                      <input 
                        type="text" 
                        value={appDraft.subject}
                        onChange={(e) => setAppDraft({...appDraft, subject: e.target.value})}
                        className="w-full bg-bg-input border border-border-light rounded-lg p-2 text-sm text-text-charcoal font-medium mt-1 focus:border-primary-teal focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-text-muted uppercase">Message:</span>
                      <textarea 
                        rows={8}
                        value={appDraft.body}
                        onChange={(e) => setAppDraft({...appDraft, body: e.target.value})}
                        className="w-full bg-bg-input border border-border-light rounded-lg p-3 text-sm text-text-charcoal font-medium mt-1 focus:border-primary-teal focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <label className="flex items-start space-x-3 cursor-pointer mb-6">
                    <input type="checkbox" className="mt-1 rounded text-primary-teal focus:ring-primary-teal w-4 h-4 bg-bg-input border-border-light" required id="confirmApp" />
                    <span className="text-sm font-medium text-text-charcoal">
                      I have reviewed this application and authorise JobOS to submit it on my behalf.
                    </span>
                  </label>

                  <div className="flex space-x-4">
                    <button 
                      onClick={() => setAppStep(0)}
                      className="px-6 py-2.5 rounded-xl font-bold bg-bg-card border border-border-light text-text-charcoal hover:bg-bg-hover transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        const cb = document.getElementById('confirmApp') as HTMLInputElement;
                        if(cb.checked) handleConfirmApplication(selectedId);
                        else alert('Please confirm authorisation first.');
                      }}
                      disabled={!!loadingAction}
                      className="flex-1 px-6 py-2.5 rounded-xl font-bold bg-primary-teal text-bg-main hover:bg-primary-teal-dark shadow-md transition-colors flex justify-center items-center"
                    >
                      {loadingAction === `${selectedId}-confirm` ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
                      Submit Application
                    </button>
                  </div>
                </div>
              )}

              {/* Job Details Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-bg-secondary p-4 rounded-xl border border-border-light">
                  <MapPin size={16} className="text-text-muted mb-2" />
                  <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Location</p>
                  <p className="text-sm font-medium text-text-charcoal">{opp.suburb}, {opp.state}</p>
                </div>
                <div className="bg-bg-secondary p-4 rounded-xl border border-border-light">
                  <Briefcase size={16} className="text-text-muted mb-2" />
                  <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm font-medium text-text-charcoal">{opp.employment_type || 'Not provided'}</p>
                </div>
                <div className="bg-bg-secondary p-4 rounded-xl border border-border-light">
                  <DollarSign size={16} className="text-text-muted mb-2" />
                  <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Salary</p>
                  <p className="text-sm font-medium text-text-charcoal">
                    {opp.salary_min ? `$${opp.salary_min.toLocaleString()}` : 'Not provided'}
                  </p>
                </div>
                <div className="bg-bg-secondary p-4 rounded-xl border border-border-light">
                  <Calendar size={16} className="text-text-muted mb-2" />
                  <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Published</p>
                  <p className="text-sm font-medium text-text-charcoal">
                    {opp.published_at ? new Date(opp.published_at).toLocaleDateString() : 'Recent'}
                  </p>
                </div>
              </div>

              {/* AI Match Summary */}
              {selectedMatch && (
                <div className="mb-8 border border-border-light rounded-xl overflow-hidden">
                  <div className="bg-bg-secondary px-5 py-3 border-b border-border-light flex items-center">
                    <Star size={16} className="text-accent-orange mr-2" />
                    <h3 className="font-bold text-sm uppercase tracking-wider text-text-heading">Why JobOS Selected This</h3>
                  </div>
                  <div className="p-5 bg-bg-card">
                    <ul className="space-y-3">
                      {selectedMatch.match_reasons?.map((reason: string, i: number) => (
                        <li key={i} className="flex items-start text-sm font-medium text-text-charcoal">
                          <CheckCircle2 size={16} className="text-green-500 mr-2 mt-0.5 shrink-0" />
                          {reason}
                        </li>
                      ))}
                      {selectedMatch.potential_gaps?.map((gap: string, i: number) => (
                        <li key={i} className="flex items-start text-sm font-medium text-text-charcoal">
                          <XCircle size={16} className="text-accent-orange mr-2 mt-0.5 shrink-0" />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Description Excerpt */}
              <div className="prose prose-invert max-w-none mb-8">
                <h3 className="text-xl font-bold text-text-heading mb-4 border-b border-border-light pb-2">About the Role</h3>
                <p className="text-text-charcoal font-medium leading-relaxed whitespace-pre-wrap">{opp.description_excerpt}</p>
              </div>
              
              {/* Note on data source */}
              <div className="bg-bg-secondary border border-border-light p-4 rounded-xl flex items-start text-xs text-text-muted">
                <Search size={14} className="mr-2 mt-0.5 shrink-0" />
                <p>This opportunity was discovered via authorised channels. Details have been extracted securely. Always verify critical information prior to interview.</p>
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8 bg-bg-main">
              <div>
                <Target size={48} className="mx-auto text-border-light mb-4" />
                <p className="text-text-heading font-bold mb-1">Select an opportunity</p>
                <p className="text-sm text-text-muted">Review the match details and prepare your application.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
