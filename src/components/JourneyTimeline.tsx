"use client";

import { CheckCircle2, Circle, MapPin, Navigation, TrendingUp, Anchor, Briefcase } from "lucide-react";
import type { JourneyMilestone } from "@/types/journey";

export default function JourneyTimeline({ milestones, currentMilestoneId }: { milestones: JourneyMilestone[] | null | undefined; currentMilestoneId?: string | null }) {
  if (!milestones || milestones.length === 0) return null;

  const sortedMilestones = [...milestones].sort((a, b) => a.position - b.position);

  const getStageIcon = (stage: string, active: boolean) => {
    const props = { size: 20, className: active ? "text-primary-teal" : "text-text-muted" };
    switch (stage) {
      case 'find': return <MapPin {...props} />;
      case 'grow': return <TrendingUp {...props} />;
      case 'advance': return <Briefcase {...props} />;
      case 'thrive': return <Navigation {...props} />;
      case 'lead': return <Anchor {...props} />;
      default: return <Circle {...props} />;
    }
  };

  return (
    <div className="w-full relative">
      {/* Desktop Timeline */}
      <div className="hidden md:flex justify-between relative">
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-border-light z-0"></div>
        
        {sortedMilestones.map((milestone, idx) => {
          const isCurrent = milestone.id === currentMilestoneId;
          const isCompleted = milestone.status === 'completed';
          const isPast = sortedMilestones.findIndex(m => m.id === currentMilestoneId) > idx;
          
          let nodeColor = "bg-bg-secondary border-border-light";
          if (isCurrent) nodeColor = "bg-primary-teal-light border-primary-teal";
          if (isCompleted || isPast) nodeColor = "bg-primary-teal border-primary-teal text-white";

          return (
            <div key={milestone.id} className="relative z-10 flex flex-col items-center w-1/5 group cursor-pointer">
              
              <div className="mb-3 text-xs font-bold text-text-muted uppercase tracking-wider h-4">
                {isCurrent && <span className="text-primary-teal bg-primary-teal-light px-2 py-0.5 rounded-full">You are here</span>}
              </div>

              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${nodeColor}`}>
                {isCompleted || isPast ? <CheckCircle2 size={20} /> : getStageIcon(milestone.stage_key, isCurrent)}
              </div>
              
              <div className="mt-4 text-center px-2">
                <h4 className={`text-sm font-bold transition-colors ${isCurrent ? 'text-primary-teal' : 'text-text-heading group-hover:text-primary-teal'}`}>
                  {milestone.stage_key}
                </h4>
                <p className="text-xs text-text-muted mt-1 leading-tight line-clamp-2" title={milestone.title}>
                  {milestone.title}
                </p>
                <p className="text-[10px] font-medium text-text-muted mt-1 bg-bg-secondary inline-block px-1.5 py-0.5 rounded">
                  {milestone.target_date ? new Date(milestone.target_date).getFullYear() : 'Future'}
                </p>
              </div>

            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="md:hidden space-y-6 relative pl-4">
        <div className="absolute top-2 bottom-2 left-6 w-0.5 bg-border-light z-0"></div>
        
        {sortedMilestones.map((milestone, idx) => {
          const isCurrent = milestone.id === currentMilestoneId;
          const isCompleted = milestone.status === 'completed';
          const isPast = sortedMilestones.findIndex(m => m.id === currentMilestoneId) > idx;
          
          let nodeColor = "bg-bg-secondary border-border-light";
          if (isCurrent) nodeColor = "bg-primary-teal-light border-primary-teal";
          if (isCompleted || isPast) nodeColor = "bg-primary-teal border-primary-teal text-white";

          return (
            <div key={milestone.id} className="relative z-10 flex items-start group cursor-pointer">
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${nodeColor}`}>
                {isCompleted || isPast ? <CheckCircle2 size={18} /> : getStageIcon(milestone.stage_key, isCurrent)}
              </div>
              
              <div className="ml-4 flex-1 pt-1">
                <div className="flex justify-between items-start">
                  <h4 className={`text-sm font-bold uppercase transition-colors ${isCurrent ? 'text-primary-teal' : 'text-text-heading'}`}>
                    {milestone.stage_key}
                  </h4>
                  {isCurrent && <span className="text-[10px] font-bold text-primary-teal bg-primary-teal-light px-2 py-0.5 rounded-full uppercase tracking-wider">You are here</span>}
                </div>
                <p className="text-sm font-medium text-text-charcoal mt-0.5">
                  {milestone.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-medium text-text-muted bg-bg-secondary px-2 py-0.5 rounded">
                    {milestone.target_date ? new Date(milestone.target_date).getFullYear() : 'Future'}
                  </span>
                  <span className="text-[11px] font-medium text-text-muted">
                    {milestone.progress}% ready
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
