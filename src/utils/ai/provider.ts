export interface AIProvider {
  generateText(promptName: string, payload: Record<string, any>): Promise<string>;
  extractResumeText(fileBase64: string, mimeType: string): Promise<string>;
  generateJourney(payload: Record<string, any>): Promise<any>;
  rankOpportunities(userProfile: any, opportunities: any[]): Promise<any[]>;
  draftApplicationEmail(userProfile: any, opportunity: any): Promise<{subject: string, body: string}>;
}

export class MockAIProvider implements AIProvider {
  async generateText(promptName: string, payload: Record<string, any>): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    if (promptName === 'fit_gap') {
      return `**Fit Gap Analysis: ${payload.jobTitle}**\n\n- **Strong Matches:** TypeScript, React, Next.js.\n- **Partial Matches:** Node.js.\n- **Gaps:** AWS deployment.`;
    }
    return "AI generation complete.";
  }

  async extractResumeText(fileBase64: string, mimeType: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return "John Doe\nSoftware Engineer\n\nExperience: Tech Corp\nSkills: React, TypeScript, Next.js";
  }

  async generateJourney(payload: Record<string, any>): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return {
      journeyTitle: `From ${payload.currentRole || 'Professional'} to ${payload.longTermGoals?.includes('management') ? 'Leadership' : 'Specialist'}`,
      summary: "A flexible route connecting your next move to your long-term ambitions.",
      milestones: [
        {
          stage_key: "find",
          title: "Secure the right first role",
          target_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          target_role: payload.targetRole || "Senior Specialist",
          description: "Build local experience and establish a strong foundation.",
          skills: ["Technical Execution", "Communication"],
          actions: [{ title: "Apply for five relevant roles", type: "application" }]
        }
      ]
    };
  }

  async rankOpportunities(userProfile: any, opportunities: any[]): Promise<any[]> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return opportunities.map((opp, index) => {
      let category = 'Good Match';
      if (index === 0) category = 'Strong Match';
      if (index > 5) category = 'Stretch Opportunity';
      
      return {
        opportunity_id: opp.id,
        match_category: category,
        match_score: 95 - (index * 5),
        match_reasons: [
          `Your background aligns with ${opp.title} requirements.`,
          `The location matches your preference.`
        ],
        potential_gaps: [
          "Might require upskilling in domain-specific tools."
        ],
        recommended_approach: "Highlight your recent projects in your cover letter."
      };
    });
  }

  async draftApplicationEmail(userProfile: any, opportunity: any): Promise<{subject: string, body: string}> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const name = userProfile?.first_name || 'Candidate';
    return {
      subject: `Application: ${opportunity.title} — ${name}`,
      body: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${opportunity.title} position at ${opportunity.company_name || 'your company'}.\n\nWith my background and experience, I am confident in my ability to contribute effectively to your team. Please find my résumé attached for your review.\n\nI look forward to the opportunity to discuss this role further.\n\nKind regards,\n${name}\n${userProfile?.email || ''}`
    };
  }
}

export function getAIProvider(): AIProvider {
  return new MockAIProvider();
}
