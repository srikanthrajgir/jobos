"use client";

import { useState } from 'react';
import { Sparkles, Briefcase, FileText } from 'lucide-react';
import { generateFitGapAction, generateCoverLetterAction } from '@/app/actions/ai';

export default function ApplicationStudioPage() {
  const [jobTitle, setJobTitle] = useState("Senior Frontend Engineer");
  const [companyName, setCompanyName] = useState("Tech Innovators Inc");
  
  const [isGeneratingFit, setIsGeneratingFit] = useState(false);
  const [fitGapResult, setFitGapResult] = useState("");
  
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [draftResult, setDraftResult] = useState("");

  const handleFitGap = async () => {
    setIsGeneratingFit(true);
    try {
      const res = await generateFitGapAction(jobTitle, "Mock resume text");
      if (res.success) setFitGapResult(res.analysis);
    } finally {
      setIsGeneratingFit(false);
    }
  };

  const handleDraft = async () => {
    setIsGeneratingDraft(true);
    try {
      const res = await generateCoverLetterAction(jobTitle, companyName, "Mock resume text");
      if (res.success) setDraftResult(res.draft);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-heading">AI Application Studio</h2>
      </div>

      <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm flex items-center space-x-4 mb-6">
        <Briefcase className="text-primary-teal" />
        <div className="flex-1">
          <p className="text-sm font-bold text-text-muted uppercase">Target Opportunity</p>
          <div className="flex gap-4 mt-2">
            <input 
              type="text" 
              value={jobTitle} 
              onChange={e => setJobTitle(e.target.value)} 
              className="flex-1 bg-bg-input border border-border-light rounded-lg px-3 py-2 text-sm focus:border-accent-orange outline-none" 
            />
            <input 
              type="text" 
              value={companyName} 
              onChange={e => setCompanyName(e.target.value)} 
              className="flex-1 bg-bg-input border border-border-light rounded-lg px-3 py-2 text-sm focus:border-accent-orange outline-none" 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Fit Gap Module */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center">
              <Sparkles size={16} className="text-accent-orange mr-2" /> Fit Gap Analysis
            </h3>
            <button 
              onClick={handleFitGap}
              disabled={isGeneratingFit}
              className="bg-bg-secondary border border-border-light hover:border-accent-orange text-text-charcoal px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            >
              {isGeneratingFit ? "Analyzing..." : "Analyze Fit"}
            </button>
          </div>
          
          <div className="flex-1 bg-bg-main border border-border-light rounded-xl p-4 overflow-y-auto whitespace-pre-wrap text-sm text-text-charcoal min-h-[200px]">
            {fitGapResult || <span className="text-text-muted italic">Click Analyze Fit to compare your canonical resume against this role.</span>}
          </div>
        </div>

        {/* Drafting Module */}
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center">
              <FileText size={16} className="text-primary-teal mr-2" /> Cover Letter Draft
            </h3>
            <button 
              onClick={handleDraft}
              disabled={isGeneratingDraft}
              className="bg-bg-secondary border border-border-light hover:border-primary-teal text-text-charcoal px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            >
              {isGeneratingDraft ? "Drafting..." : "Generate Draft"}
            </button>
          </div>
          
          <div className="flex-1 bg-bg-main border border-border-light rounded-xl p-4 overflow-y-auto whitespace-pre-wrap text-sm text-text-charcoal min-h-[200px]">
             {draftResult || <span className="text-text-muted italic">Generate a tailored cover letter draft based on your resume and the role requirements.</span>}
          </div>
        </div>

      </div>
    </div>
  );
}
