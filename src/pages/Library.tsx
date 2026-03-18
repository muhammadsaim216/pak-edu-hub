import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const Library = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeLevel = searchParams.get("level") ?? "";
  const initialQ = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(initialQ);

  const { data: levels } = useQuery({
    queryKey: ["education_levels"],
    queryFn: async () => {
      const { data } = await supabase.from("education_levels").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: pdfs, isLoading } = useQuery({
    queryKey: ["pdfs", activeLevel],
    queryFn: async () => {
      let q = supabase
        .from("pdf_materials")
        .select("*, education_levels(name, slug), profiles:author_id(full_name)")
        .order("uploaded_at", { ascending: false });

      if (activeLevel) {
        const level = levels?.find((l) => l.slug === activeLevel);
        if (level) q = q.eq("education_level_id", level.id);
      }

      const { data } = await q;
      return data ?? [];
    },
    enabled: levels !== undefined,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return pdfs ?? [];
    const s = search.toLowerCase();
    return (pdfs ?? []).filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s)
    );
  }, [pdfs, search]);

  const setLevel = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    if (slug) params.set("level", slug);
    else params.delete("level");
    setSearchParams(params);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Library</h1>
          <p className="text-sm text-muted-foreground">Browse and download academic PDFs</p>
        </div>

        {/* Filter chips (mobile) + sidebar (desktop) layout */}
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden w-52 shrink-0 md:block">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Education Levels
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setLevel("")}
                className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                  !activeLevel ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                All Levels
              </button>
              {levels?.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.slug)}
                  className={`rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                    activeLevel === l.slug ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1">
            {/* Mobile chips */}
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2 md:hidden">
              <Badge
                variant={!activeLevel ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setLevel("")}
              >
                All
              </Badge>
              {levels?.map((l) => (
                <Badge
                  key={l.id}
                  variant={activeLevel === l.slug ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setLevel(l.slug)}
                >
                  {l.name}
                </Badge>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or description…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-[10px] border p-4">
                    <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-[10px] border bg-card py-16 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No PDFs found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="group flex flex-col rounded-[10px] border bg-card p-4 ring-1 ring-foreground/5 transition-all duration-150 hover:shadow-md"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2">{pdf.title}</h3>
                    {pdf.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {pdf.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center gap-2 pt-3">
                      <Badge variant="secondary" className="text-[10px]">
                        {(pdf as any).education_levels?.name ?? "—"}
                      </Badge>
                      {pdf.file_size && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {formatSize(pdf.file_size)}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="font-mono">
                          {new Date(pdf.uploaded_at).toLocaleDateString()}
                        </span>
                      </span>
                      <span>{(pdf as any).profiles?.full_name || "Teacher"}</span>
                    </div>
                    <a href={pdf.file_url} target="_blank" rel="noopener noreferrer" className="mt-3">
                      <Button size="sm" variant="outline" className="w-full gap-1 text-xs">
                        <Download className="h-3 w-3" /> Download
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Library;
