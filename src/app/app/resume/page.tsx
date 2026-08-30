"use client";

import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { extractResumeAction } from '@/app/actions/ai';

export default function ResumePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setIsSaved(false);

    try {
      // In a real implementation, convert file to base64
      const mockBase64 = "mock-base64-string";
      const res = await extractResumeAction(mockBase64, file.type);
      if (res.success) {
        setExtractedText(res.text);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-heading">Resume Manager</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Upload Resume</h3>
            <label className="border-2 border-dashed border-border-hover rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-bg-hover hover:border-primary-teal transition-all">
              <UploadCloud size={32} className="text-primary-teal mb-3" />
              <span className="text-sm font-medium text-text-charcoal text-center">Click to upload PDF or DOCX</span>
              <span className="text-xs text-text-muted mt-1">Max size: 5MB</span>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleUpload} />
            </label>
            
            {isUploading && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-text-muted animate-pulse">
                <FileText size={16} />
                <span>Extracting text with AI...</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Extracted Text Review</h3>
              {extractedText && (
                <button 
                  onClick={() => setIsSaved(true)}
                  className="flex items-center space-x-2 bg-primary-teal text-bg-main px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-teal-dark transition-colors"
                >
                  {isSaved ? <><CheckCircle2 size={16} /> <span>Saved</span></> : "Save as Canonical Resume"}
                </button>
              )}
            </div>
            
            {extractedText ? (
              <textarea 
                className="flex-1 w-full bg-bg-input border border-border-light rounded-xl p-4 text-sm text-text-charcoal focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange min-h-[300px]"
                value={extractedText}
                onChange={(e) => {
                  setExtractedText(e.target.value);
                  setIsSaved(false);
                }}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted min-h-[300px] border border-dashed border-border-light rounded-xl bg-bg-hover/50">
                <FileText size={32} className="mb-2 opacity-50" />
                <p>Upload a resume to see extracted text here.</p>
                <p className="text-xs mt-2 max-w-xs text-center">AI will structure your experience so it can be used for Fit Gap analysis and application drafts.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
