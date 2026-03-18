import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>© 2026 EduPDF Pakistan</span>
        </div>
        <p className="text-xs text-muted-foreground">Academic resources for Pakistani students & educators.</p>
      </div>
    </footer>
  );
}
