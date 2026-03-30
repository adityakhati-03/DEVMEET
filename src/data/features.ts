// components/landing/features.ts
import { Code2, MessageSquare, Rocket, Users, LucideIcon } from "lucide-react";

export interface Feature {
  icon: LucideIcon; // This is a component, not JSX
  title: string;
  description: string;
}

export const features: Feature[] = [
  {
    icon: Code2,
    title: "Real-time Collaboration",
    description: "Code together in real-time with built-in chat and video calls.",
  },
  {
    icon: MessageSquare,
    title: "AI Assistance",
    description: "Get help from AI-powered coding assistants and code review tools.",
  },
  {
    icon: Users,
    title: "Dev Events",
    description: "Join virtual hackathons, workshops, and networking events.",
  },
  {
    icon: Rocket,
    title: "Fast Shipping",
    description: "Deploy your projects quickly with our integrated deployment tools.",
  },
];
