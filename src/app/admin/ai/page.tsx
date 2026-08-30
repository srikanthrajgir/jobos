"use client";

import { Activity, Power, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function AdminAIPage() {
  const [aiEnabled, setAiEnabled] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-heading">AI Administration</h2>
        <button 
          onClick={() => setAiEnabled(!aiEnabled)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-colors ${
            aiEnabled ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-primary-teal text-bg-main hover:bg-primary-teal-dark'
          }`}
        >
          <Power size={18} />
          <span>{aiEnabled ? 'Emergency Disable AI' : 'Enable AI Features'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="text-primary-teal" />
            <h3 className="text-sm font-bold text-text-muted uppercase">Provider Status</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${aiEnabled ? 'bg-primary-teal' : 'bg-red-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${aiEnabled ? 'bg-primary-teal' : 'bg-red-500'}`}></span>
            </span>
            <span className="font-bold text-lg">{aiEnabled ? 'Connected (MockProvider)' : 'Offline (Disabled)'}</span>
          </div>
        </div>

        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-text-muted uppercase mb-4">Usage Estimates (MTD)</h3>
          <div className="text-3xl font-black">45,210 <span className="text-sm text-text-muted font-medium">tokens</span></div>
          <p className="text-xs text-text-muted mt-2">Cost est: ~$0.45</p>
        </div>

        <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-text-muted uppercase mb-4">Success Rate</h3>
          <div className="text-3xl font-black text-primary-teal-dark">99.8%</div>
          <p className="text-xs text-text-muted mt-2">12 failures / 5,120 runs</p>
        </div>
      </div>

      <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm mt-6">
        <h3 className="text-sm font-bold text-text-muted uppercase mb-6 flex items-center">
          <AlertTriangle size={16} className="text-accent-orange mr-2" /> Feature Prompts & Limits
        </h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-light text-text-muted text-xs uppercase tracking-wider">
              <th className="pb-3 font-bold">Feature Key</th>
              <th className="pb-3 font-bold">Prompt Version</th>
              <th className="pb-3 font-bold">Rate Limit</th>
              <th className="pb-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {['extract_resume', 'fit_gap', 'cover_letter'].map(key => (
              <tr key={key}>
                <td className="py-4 text-sm font-bold font-mono text-text-charcoal">{key}</td>
                <td className="py-4 text-sm text-text-muted">v1.2.0</td>
                <td className="py-4 text-sm text-text-muted">5 / min / user</td>
                <td className="py-4 text-sm"><span className="text-primary-teal font-bold text-xs uppercase bg-primary-teal-light px-2 py-1 rounded">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
