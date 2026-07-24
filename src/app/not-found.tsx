import { NotFound } from "@/components/feedback/NotFound/NotFound";

export default function GlobalNotFound() {
  return (
    <NotFound
      title="Page not found"
      description="The page you're looking for doesn't exist or may have moved."
      actionLabel="Back to Home"
      actionHref="/"
    />
  );
}
