export interface AIProvider {
  generateText(promptName: string, payload: Record<string, any>): Promise<string>;
  extractResumeText(fileBase64: string, mimeType: string): Promise<string>;
  generateJourney(payload: Record<string, any>): Promise<any>;
}

export class MockAIProvider implements AIProvider {
  async generateText(promptName: string, payload: Record<string, any>): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    if (promptName === 'fit_gap') {
      return `**Fit Gap Analysis: ${payload.jobTitle}**\n\n- **Strong Matches:** TypeScript, React, Next.js.\n- **Partial Matches:** Node.js.\n- **Gaps:** AWS deployment.`;
    }
    
    if (promptName === 'cover_letter') {
      return `Dear Hiring Manager,\n\nI am excited to apply for the ${payload.jobTitle} position at ${payload.companyName}. With my background, I am confident in my ability to contribute.\n\nSincerely,\n[Your Name]`;
    }
    
    return "AI generation complete.";
  }

  async extractResumeText(fileBase64: string, mimeType: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return "John Doe\nSoftware Engineer\n\nExperience: Tech Corp\nSkills: React, TypeScript, Next.js";
  }

  async generateJourney(payload: Record<string, any>): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    // Generates a structured JSON roadmap
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
          actions: [
            { title: "Apply for five relevant roles", type: "application" }
          ]
        },
        {
          stage_key: "grow",
          title: "Build professional credibility",
          target_date: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split('T')[0],
          target_role: "Lead Specialist",
          description: "Take ownership of larger projects and mentor juniors.",
          skills: ["Mentorship", "Project Management"],
          actions: [
            { title: "Lead a cross-functional initiative", type: "experience" }
          ]
        },
        {
          stage_key: "thrive",
          title: "Reach your dream destination",
          target_date: new Date(new Date().setFullYear(new Date().getFullYear() + 6)).toISOString().split('T')[0],
          target_role: payload.targetRole ? `Head of ${payload.targetRole.split(' ').pop()}` : "Department Head",
          description: "Achieve strategic influence and highly stable career security.",
          skills: ["Strategic Planning", "Budgeting"],
          actions: [
            { title: "Expand professional network", type: "networking" }
          ]
        }
      ]
    };
  }
}

export function getAIProvider(): AIProvider {
  return new MockAIProvider();
}
