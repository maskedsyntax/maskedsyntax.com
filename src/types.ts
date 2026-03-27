export type ProjectStatus = "active" | "experimental" | "archived";

export type Project = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  problemStatement: string;
  solution: string;
  keyFeatures: string[];
  techStack: string[];
  uniquePoints: string[];
  status: ProjectStatus;
  tags: string[];
  repoUrl?: string;
  liveUrl?: string;
  score: number;
  featured?: boolean;
  current?: boolean;
};

export type BlogPostMeta = {
  title: string;
  slug: string;
  date: string;
  tags: string[];
  summary: string;
  readingTime: string;
  category: "ml" | "systems" | "devtools" | "experiments";
};
