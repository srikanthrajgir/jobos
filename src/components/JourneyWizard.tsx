"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Save, Sparkles, Loader2 } from 'lucide-react';
import { generateJobJourney, saveJobJourney } from '@/app/actions/journeys';
import type { JourneyPlan } from '@/lib/validation';

export default function JourneyWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    currentRole: '',
    targetRole: '',
    longTermGoals: [] as string[],
    targetCompanies: ''
  });

  const [generatedPlan, setGeneratedPlan] = useState<JourneyPlan | null>(null);

  const LONG_TERM_GOALS = [
    "Secure and stable employment",
    "Higher income",
    "Become a specialist",
    "Move into management",
    "Work for a dream company",
    "Change industries",
    "Improve work-life balance",
    "Become a consultant",
    "Start a business",
    "Employ and mentor others",
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateJobJourney(formData);
      if (res.success) {
        setGeneratedPlan(res.plan);
        setStep(5); // Move to review step
      }
    } catch (error) {
      console.error(error);
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveJobJourney(generatedPlan);
      if (res.success) {
        // Ideally fetch the full joined object, but for now just reload page
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      longTermGoals: prev.longTermGoals.includes(goal) 
        ? prev.longTermGoals.filter(g => g !== goal)
        : [...prev.longTermGoals, goal]
    }));
  };

  return (
    <div className="fixed inset-0 bg-bg-main/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-bg-card w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full border border-border-light"
      >
        <div className="flex justify-between items-center p-6 border-b border-border-light bg-bg-secondary">
          <div>
            <h2 className="text-xl font-bold text-text-heading">Build Your Route</h2>
            <p className="text-sm text-text-muted mt-1">Step {step} of 5</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:bg-bg-hover rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-bold text-text-heading">Where are you now?</h3>
              <p className="text-text-muted">Confirm your current status so we can chart the best route.</p>
              
              <div>
                <label className="block text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Current or Most Recent Role</label>
                <input 
                  type="text" 
                  value={formData.currentRole}
                  onChange={(e) => setFormData({...formData, currentRole: e.target.value})}
                  className="w-full bg-bg-input border border-border-light rounded-xl p-3 text-sm text-text-charcoal focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal"
                  placeholder="e.g. Project Coordinator"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-bold text-text-heading">What is your next destination?</h3>
              <p className="text-text-muted">What specific role are you targeting right now?</p>
              
              <div>
                <label className="block text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Target Role</label>
                <input 
                  type="text" 
                  value={formData.targetRole}
                  onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                  className="w-full bg-bg-input border border-border-light rounded-xl p-3 text-sm text-text-charcoal focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal"
                  placeholder="e.g. Senior Project Manager"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-bold text-text-heading">What does long-term success mean?</h3>
              <p className="text-text-muted">Select all the ambitions that matter to your job journey.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LONG_TERM_GOALS.map(goal => {
                  const isSelected = formData.longTermGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`p-4 rounded-xl text-left border transition-all text-sm font-medium ${
                        isSelected 
                          ? 'bg-primary-teal-light border-primary-teal text-primary-teal-dark font-bold' 
                          : 'bg-bg-main border-border-light text-text-charcoal hover:border-text-muted'
                      }`}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-bold text-text-heading">Dream Companies & Capabilities</h3>
              <p className="text-text-muted">Any specific places you want to land, or skills you want to master?</p>
              
              <div>
                <label className="block text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Target Companies (Comma separated)</label>
                <input 
                  type="text" 
                  value={formData.targetCompanies}
                  onChange={(e) => setFormData({...formData, targetCompanies: e.target.value})}
                  className="w-full bg-bg-input border border-border-light rounded-xl p-3 text-sm text-text-charcoal focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal"
                  placeholder="e.g. Multiplex, Lendlease, Tech Corp"
                />
              </div>
            </div>
          )}

          {step === 5 && generatedPlan && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-primary-teal-light border border-primary-teal rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-primary-teal-dark flex items-center">
                  <Sparkles size={20} className="mr-2" />
                  Your Generated Route
                </h3>
                <p className="text-primary-teal-dark/80 text-sm mt-1">{generatedPlan.summary}</p>
              </div>
              
              <div className="space-y-4">
                {generatedPlan.milestones.map((m, idx) => (
                  <div key={idx} className="border border-border-light rounded-xl p-4 bg-bg-main">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-bg-secondary px-2 py-0.5 rounded text-text-muted mb-2 inline-block">
                          {m.stage_key}
                        </span>
                        <h4 className="font-bold text-text-heading">{m.title}</h4>
                        <p className="text-sm font-medium text-primary-teal mt-0.5">{m.target_role}</p>
                      </div>
                      <span className="text-xs font-bold text-text-muted">{m.target_date}</span>
                    </div>
                    <p className="text-sm text-text-charcoal mt-2">{m.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-border-light bg-bg-secondary flex justify-between">
          {step > 1 && step < 5 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-6 py-2.5 rounded-xl font-bold text-text-charcoal hover:bg-bg-hover transition-colors flex items-center"
            >
              <ArrowLeft size={18} className="mr-2" /> Back
            </button>
          ) : <div></div>}
          
          {step < 4 ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl font-bold bg-text-heading text-bg-main hover:bg-text-charcoal transition-colors flex items-center shadow-md"
            >
              Continue <ArrowRight size={18} className="ml-2" />
            </button>
          ) : step === 4 ? (
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-bold bg-primary-teal text-bg-main hover:bg-primary-teal-dark transition-colors flex items-center shadow-md disabled:opacity-70"
            >
              {loading ? <><Loader2 size={18} className="mr-2 animate-spin" /> Generating...</> : <><Sparkles size={18} className="mr-2" /> Generate Route</>}
            </button>
          ) : (
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-bold bg-accent-orange text-white hover:bg-[#ea580c] transition-colors flex items-center shadow-md disabled:opacity-70"
            >
              {saving ? <><Loader2 size={18} className="mr-2 animate-spin" /> Saving...</> : <><Save size={18} className="mr-2" /> Save & Start Journey</>}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
