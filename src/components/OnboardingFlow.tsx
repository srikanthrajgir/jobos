"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, ArrowRight, CheckCircle2, Loader2, Target, MapPin } from 'lucide-react';
import { submitResumeBuilder, markUploadedResumeReady, submitCareerPreferences, completeOnboarding } from '@/app/actions/onboarding';
import { extractResumeAction } from '@/app/actions/ai';

export default function OnboardingFlow({ initialState }: { initialState: { onboarding_status?: string | null } | null }) {
  const [step, setStep] = useState(initialState?.onboarding_status || 'resume_required');
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState({ career_stage: '', primary_target_role: '', preferred_suburb: '' });
  const [error, setError] = useState('');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builder, setBuilder] = useState({ name: '', summary: '' });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setLoading(true);
    setStep('resume_parsing');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read the selected file'));
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.readAsDataURL(file);
      });
      const inferredMimeType = file.type || (file.name.toLowerCase().endsWith('.pdf')
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      const result = await extractResumeAction({ base64, mimeType: inferredMimeType, filename: file.name });
      await markUploadedResumeReady(result.resumeId);
      setStep('career_preferences_required');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'The résumé could not be processed.');
      setStep('resume_required');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleBuilderClick = async () => {
    if (!builderOpen) {
      setBuilderOpen(true);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await submitResumeBuilder(builder);
      setStep('career_preferences_required');
    } catch (builderError) {
      setError(builderError instanceof Error ? builderError.message : 'The résumé could not be saved.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async () => {
    setLoading(true);
    await submitCareerPreferences(prefs);
    setStep('journey_decision_required');
    setLoading(false);
  };

  const handleJourneyDecision = async (decision: string) => {
    setLoading(true);
    await completeOnboarding(decision);
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[500px]">
      
      {/* Left branding panel */}
      <div className="w-full md:w-1/3 bg-bg-secondary p-8 border-r border-border-light flex flex-col justify-between hidden md:flex">
        <div>
          <div className="text-2xl font-display font-bold flex items-center mb-8">
            <span className="text-accent-orange">JOB</span><span className="text-text-heading">OS</span>
          </div>
          <div className="space-y-6">
            <div className={`flex items-center space-x-3 ${step.includes('resume') ? 'text-primary-teal' : 'text-text-muted'}`}>
              <FileText size={20} /> <span className="font-bold text-sm tracking-wide">1. Résumé</span>
            </div>
            <div className={`flex items-center space-x-3 ${step === 'career_preferences_required' ? 'text-primary-teal' : 'text-text-muted'}`}>
              <Target size={20} /> <span className="font-bold text-sm tracking-wide">2. Preferences</span>
            </div>
            <div className={`flex items-center space-x-3 ${step === 'journey_decision_required' ? 'text-primary-teal' : 'text-text-muted'}`}>
              <MapPin size={20} /> <span className="font-bold text-sm tracking-wide">3. Job Journey</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Content panel */}
      <div className="flex-1 p-8 flex items-center justify-center relative bg-bg-main">
        <AnimatePresence mode="wait">
          
          {step === 'resume_required' && (
            <motion.div key="resume" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="w-full max-w-md">
              <h2 className="text-3xl font-bold text-text-heading mb-3">Let’s start with your résumé</h2>
              <p className="text-text-muted mb-8 text-lg">Your résumé helps JobOS understand your experience, skills and the opportunities that may suit you.</p>
              {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-500">{error}</p>}
              
              <div className="space-y-4">
                <label
                  className="w-full bg-primary-teal text-bg-main border-2 border-primary-teal hover:bg-primary-teal-dark hover:border-primary-teal-dark rounded-xl p-5 flex items-center justify-between transition-all group"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-lg">Upload My Résumé</h3>
                    <p className="text-sm opacity-80 mt-1 font-medium">JobOS will review it and extract useful info.</p>
                  </div>
                  <Upload size={24} className="group-hover:-translate-y-1 transition-transform" />
                  <input type="file" className="sr-only" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleUpload} disabled={loading} />
                </label>

                {builderOpen && (
                  <div className="space-y-3 rounded-xl border border-border-light bg-bg-card p-4">
                    <input
                      value={builder.name}
                      onChange={(event) => setBuilder({ ...builder, name: event.target.value })}
                      maxLength={120}
                      placeholder="Your name"
                      className="w-full rounded-lg border border-border-light bg-bg-input px-3 py-2 text-sm"
                    />
                    <textarea
                      value={builder.summary}
                      onChange={(event) => setBuilder({ ...builder, summary: event.target.value })}
                      rows={6}
                      maxLength={10000}
                      placeholder="Paste or write your experience, education, skills and achievements"
                      className="w-full resize-y rounded-lg border border-border-light bg-bg-input px-3 py-2 text-sm"
                    />
                  </div>
                )}

                <button 
                  onClick={handleBuilderClick}
                  disabled={loading || (builderOpen && (!builder.name.trim() || !builder.summary.trim()))}
                  className="w-full bg-bg-card border-2 border-border-light hover:border-primary-teal text-text-charcoal rounded-xl p-5 flex items-center justify-between transition-all group"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-lg text-text-heading">{builderOpen ? 'Save My Résumé' : 'Build a Résumé'}</h3>
                    <p className="text-sm text-text-muted mt-1 font-medium">{builderOpen ? 'Use these details as your canonical résumé.' : 'Don’t have one? Add your details manually.'}</p>
                  </div>
                  <FileText size={24} className="text-text-muted group-hover:text-primary-teal" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'resume_parsing' && (
            <motion.div key="parsing" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="text-center w-full max-w-md">
              <Loader2 size={48} className="animate-spin text-primary-teal mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-text-heading mb-2">We’ve received your résumé</h2>
              <p className="text-text-muted">JobOS is securely reviewing it to extract your key skills and experience...</p>
            </motion.div>
          )}

          {step === 'career_preferences_required' && (
            <motion.div key="prefs" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="w-full max-w-md">
              <div className="flex items-center space-x-3 text-primary-teal mb-6">
                <CheckCircle2 size={24} />
                <h3 className="font-bold text-lg">Résumé processed securely</h3>
              </div>
              <h2 className="text-3xl font-bold text-text-heading mb-3">A few short questions</h2>
              <p className="text-text-muted mb-8">So JobOS can personalise your search.</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Which best describes you right now?</label>
                  <select 
                    value={prefs.career_stage} 
                    onChange={e => setPrefs({...prefs, career_stage: e.target.value})}
                    className="w-full bg-bg-input border border-border-light rounded-xl p-3 text-sm text-text-charcoal focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal"
                  >
                    <option value="" disabled>Select a stage...</option>
                    <option value="early">Early-career with some experience</option>
                    <option value="experienced">Experienced professional</option>
                    <option value="promotion">Looking for a promotion</option>
                    <option value="career_change">Changing careers or industries</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-muted uppercase tracking-wider mb-2">What type of role are you looking for?</label>
                  <input 
                    type="text" 
                    value={prefs.primary_target_role}
                    onChange={e => setPrefs({...prefs, primary_target_role: e.target.value})}
                    placeholder="e.g. Project Manager"
                    className="w-full bg-bg-input border border-border-light rounded-xl p-3 text-sm text-text-charcoal focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Where would you prefer to work?</label>
                  <input 
                    type="text" 
                    value={prefs.preferred_suburb}
                    onChange={e => setPrefs({...prefs, preferred_suburb: e.target.value})}
                    placeholder="e.g. Sydney CBD (or Remote)"
                    className="w-full bg-bg-input border border-border-light rounded-xl p-3 text-sm text-text-charcoal focus:outline-none focus:border-primary-teal focus:ring-1 focus:ring-primary-teal"
                  />
                </div>
              </div>

              <button 
                onClick={handlePreferencesSubmit}
                disabled={!prefs.career_stage || !prefs.primary_target_role || loading}
                className="w-full mt-8 bg-accent-orange text-white py-3 rounded-xl font-bold hover:bg-[#ea580c] transition-all flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <>Continue <ArrowRight size={18} className="ml-2" /></>}
              </button>
            </motion.div>
          )}

          {step === 'journey_decision_required' && (
            <motion.div key="journey" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="w-full max-w-md text-center">
              <h2 className="text-3xl font-bold text-text-heading mb-3">Where do you want your job to take you?</h2>
              <p className="text-text-muted mb-8 text-lg">JobOS can turn your next role, promotion or business ambition into a practical job journey.</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => handleJourneyDecision('yes')}
                  disabled={loading}
                  className="w-full bg-primary-teal text-bg-main border-2 border-primary-teal py-4 rounded-xl font-bold hover:bg-primary-teal-dark hover:border-primary-teal-dark shadow-md transition-all text-lg"
                >
                  Build My Job Journey
                </button>
                <button 
                  onClick={() => handleJourneyDecision('no')}
                  disabled={loading}
                  className="w-full bg-transparent text-text-muted py-3 rounded-xl font-medium hover:bg-bg-hover hover:text-text-charcoal transition-all text-sm"
                >
                  I’ll do this later
                </button>
              </div>
              <p className="text-xs text-text-muted mt-6">Takes approximately two minutes. You can change your route at any time.</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
