export interface AIProvider {
  generateText(promptName: string, payload: Record<string, any>): Promise<string>;
  extractResumeText(fileBase64: string, mimeType: string): Promise<string>;
}

export class MockAIProvider implements AIProvider {
  async generateText(promptName: string, payload: Record<string, any>): Promise<string> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    if (promptName === 'fit_gap') {
      return `**Fit Gap Analysis: ${payload.jobTitle}**\n\n- **Strong Matches:** TypeScript, React, Next.js.\n- **Partial Matches:** Node.js (You have some backend experience, but the role requires advanced microservices).\n- **Gaps:** AWS deployment (Consider highlighting your Docker experience as a transferable skill).`;
    }
    
    if (promptName === 'cover_letter') {
      return `Dear Hiring Manager,\n\nI am excited to apply for the ${payload.jobTitle} position at ${payload.companyName}. With my background in ${payload.skills || 'software engineering'}, I am confident in my ability to contribute effectively to your team.\n\nSincerely,\n[Your Name]`;
    }
    
    return "AI generation complete.";
  }

  async extractResumeText(fileBase64: string, mimeType: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return "John Doe\nSoftware Engineer\n\nExperience:\n- Senior Developer at Tech Corp (2020-2023)\n- Web Developer at Startup Inc (2018-2020)\n\nSkills: React, TypeScript, Next.js, Node.js, CSS.";
  }
}

// Factory to get the active provider based on environment variables
export function getAIProvider(): AIProvider {
  // In production, you would check process.env.AI_PROVIDER (e.g., 'openai', 'anthropic')
  // For the vertical slice, we return the Mock provider.
  return new MockAIProvider();
}
