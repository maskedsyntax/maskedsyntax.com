export type BlogPostMeta = {
  title: string;
  slug: string;
  date: string;
  tags: string[];
  summary: string;
  readingTime: string;
  category: "ml" | "systems" | "devtools" | "experiments";
};
