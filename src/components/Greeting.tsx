"use client";

import { useEffect, useState } from 'react';

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
  "Clarity of purpose leads to quality opportunities."
];

export default function Greeting({ firstName }: { firstName?: string }) {
  const [greeting, setGreeting] = useState("Good morning");
  const [message, setMessage] = useState(MOTIVATIONAL_MESSAGES[0]);

  useEffect(() => {
    // Client-side time to avoid hydration mismatch
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Pseudo-random message that changes per session (using day of year + hour to keep it stable per session roughly)
    const seed = new Date().getDay() + new Date().getHours();
    setMessage(MOTIVATIONAL_MESSAGES[seed % MOTIVATIONAL_MESSAGES.length]);
  }, []);

  const name = firstName ? `, ${firstName}` : '';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h1 className="text-3xl md:text-4xl font-bold text-text-heading mb-2">
        {greeting}{name}.
      </h1>
      <p className="text-text-muted text-lg font-medium">{message}</p>
    </div>
  );
}
