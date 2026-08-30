"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { getAIProvider } from '@/utils/ai/provider'; // Ideally a server action for this. Let's make a mock call.

export default function NewArticlePage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateOutline = async () => {
    setIsGenerating(true);
    try {
      // Typically this calls a server action, mocked for UI demo
      await new Promise(r => setTimeout(r, 1000));
      setBody("## Introduction\n[AI outline placeholder]\n\n## Key Takeaways\n- Point 1\n- Point 2\n\n## Market Analysis\n[Data here]");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/admin/content" className="p-2 border border-border-light rounded-lg hover:bg-bg-hover text-text-muted transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-2xl font-bold text-text-heading">Create Article</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleGenerateOutline} disabled={isGenerating} className="flex items-center space-x-2 border border-border-light bg-bg-card text-text-charcoal px-4 py-2 rounded-xl font-bold hover:border-accent-orange transition-colors disabled:opacity-50">
            <Sparkles size={16} className="text-accent-orange" />
            <span>AI Outline</span>
          </button>
          <button className="flex items-center space-x-2 bg-primary-teal text-bg-main px-4 py-2 rounded-xl font-bold hover:bg-primary-teal-dark transition-colors">
            <Save size={16} />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Title</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-bg-input border border-border-light rounded-xl p-3 text-lg font-bold text-text-heading focus:outline-none focus:border-primary-teal transition-colors"
            placeholder="e.g. The 2026 Tech Hiring Outlook"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-text-muted uppercase tracking-wider mb-2">Body (Markdown)</label>
          <textarea 
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full bg-bg-input border border-border-light rounded-xl p-4 text-sm text-text-charcoal min-h-[400px] focus:outline-none focus:border-primary-teal transition-colors font-mono"
            placeholder="Write the article content..."
          />
        </div>
      </div>
    </div>
  );
}
