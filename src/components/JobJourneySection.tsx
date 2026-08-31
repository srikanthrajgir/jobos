"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MapPin, ChevronRight, CheckCircle2, ArrowRight, Play, Compass, Loader2 } from 'lucide-react';
import JourneyWizard from './JourneyWizard';
import JourneyTimeline from './JourneyTimeline';

export default function JobJourneySection({ initialJourney }: { initialJourney: any }) {
  const [journey, setJourney] = useState(initialJourney);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  if (!journey) {
    return (
      <div className="bg-bg-card border border-border-light rounded-2xl p-8 shadow-sm text-center mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-teal to-accent-orange opacity-50"></div>
        <Compass size={40} className="text-primary-teal mx-auto mb-4 opacity-80" />
        <h2 className="text-2xl font-bold text-text-heading mb-2">Where do you want your job to take you?</h2>
        <p className="text-text-muted mb-6 max-w-lg mx-auto">
          JobOS can turn your next role, promotion or business ambition into a practical job journey.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => setIsWizardOpen(true)}
            className="bg-primary-teal text-bg-main px-6 py-3 rounded-xl font-bold hover:bg-primary-teal-dark transition-colors flex items-center shadow-md"
          >
            Build My Job Journey <ArrowRight size={18} className="ml-2" />
          </button>
          <button className="text-text-muted hover:text-text-charcoal font-medium text-sm transition-colors">
            I'll do this later
          </button>
        </div>
        <p className="text-xs text-text-muted mt-4">Takes approximately two minutes. You can change your route at any time.</p>
        
        <AnimatePresence>
          {isWizardOpen && (
            <JourneyWizard 
              onClose={() => setIsWizardOpen(false)} 
              onComplete={(newJourney) => setJourney(newJourney)} 
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  const currentMilestone = journey.job_milestones?.find((m: any) => m.id === journey.current_milestone_id) || journey.job_milestones?.[0];
  const nextAction = currentMilestone?.job_milestone_actions?.[0];

  return (
    <div className="mb-8">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-2xl font-bold text-text-heading flex items-center">
            Your Job Journey 
            <span className="ml-3 px-2.5 py-1 bg-primary-teal-light text-primary-teal-dark text-[10px] uppercase tracking-wider font-bold rounded-md">
              Active Route
            </span>
          </h2>
          <p className="text-text-muted text-sm mt-1">Choose your destination. JobOS helps build the route.</p>
        </div>
        <button onClick={() => setIsWizardOpen(true)} className="text-sm font-bold text-primary-teal hover:text-primary-teal-dark transition-colors hidden sm:block">
          Recalculate Route
        </button>
      </div>

      <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm mb-6">
        <JourneyTimeline milestones={journey.job_milestones} currentMilestoneId={journey.current_milestone_id} />
      </div>

      {currentMilestone && (
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex-1">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Next Destination</h3>
            <div className="text-xl font-bold text-text-heading mb-2">
              {currentMilestone.target_role || currentMilestone.title} <span className="text-text-muted font-normal">by {currentMilestone.target_date ? new Date(currentMilestone.target_date).getFullYear() : 'Soon'}</span>
            </div>
            
            <div className="flex items-center mt-4">
              <div className="w-full bg-bg-secondary h-2 rounded-full overflow-hidden mr-4">
                <div className="bg-primary-teal h-full" style={{ width: `${currentMilestone.progress || 0}%` }}></div>
              </div>
              <span className="text-sm font-bold text-primary-teal">{currentMilestone.progress || 0}% ready</span>
            </div>
            <p className="text-xs text-text-muted mt-2">
              {currentMilestone.progress > 0 ? `${currentMilestone.job_milestone_actions?.length || 0} actions completed` : 'Complete today\'s recommended action to move one step closer.'}
            </p>
          </div>

          <div className="w-full md:w-px md:h-24 bg-border-light"></div>

          <div className="flex-1 w-full">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center">
              <Play size={14} className="text-accent-orange mr-1.5" /> Today's Move
            </h3>
            
            {nextAction ? (
              <div className="group border border-border-light rounded-xl p-4 hover:border-accent-orange hover:shadow-md transition-all cursor-pointer bg-bg-main relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-orange"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-text-heading group-hover:text-accent-orange transition-colors">{nextAction.title}</h4>
                    <p className="text-xs text-text-muted mt-1">Supports your <span className="capitalize font-semibold text-text-charcoal">{currentMilestone.stage_key}</span> milestone</p>
                  </div>
                  <button className="text-text-muted group-hover:text-accent-orange p-1 rounded-full hover:bg-accent-orange/10 transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-border-light rounded-xl p-4 text-center text-text-muted bg-bg-hover/50">
                <CheckCircle2 size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">You're all caught up for today!</p>
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isWizardOpen && (
          <JourneyWizard 
            onClose={() => setIsWizardOpen(false)} 
            onComplete={(newJourney) => {
              setJourney(newJourney);
              setIsWizardOpen(false);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
