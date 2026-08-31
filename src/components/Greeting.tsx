const MOTIVATIONAL_MESSAGES = [
  "Small actions create career momentum.",
  "Your next opportunity starts with today’s move.",
  "Consistency turns applications into conversations.",
  "Every follow-up keeps the door open.",
  "Build the career before the opportunity arrives.",
  "Progress becomes visible when you track it.",
  "One focused action can change your direction.",
  "Preparation is the ultimate competitive advantage.",
  "Your experience is valuable; make sure they see it.",
  "Clarity of purpose leads to quality opportunities.",
];

export default function Greeting({ firstName }: { firstName?: string }) {
  const message = MOTIVATIONAL_MESSAGES[(firstName?.length || 0) % MOTIVATIONAL_MESSAGES.length];
  const name = firstName ? `, ${firstName}` : "";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h1 className="mb-2 text-3xl font-bold text-text-heading md:text-4xl">
        Welcome back{name}.
      </h1>
      <p className="text-lg font-medium text-text-muted">{message}</p>
    </div>
  );
}
