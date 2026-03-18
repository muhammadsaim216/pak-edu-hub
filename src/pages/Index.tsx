import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, ArrowRight, GraduationCap, FileText, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: levels } = useQuery({
    queryKey: ["education_levels"],
    queryFn: async () => {
      const { data } = await supabase.from("education_levels").select("*").order("name");
      return data ?? [];
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/library?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <GraduationCap className="h-3.5 w-3.5" /> Pakistan's Academic Resource Hub
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Access verified academic{" "}
              <span className="text-primary">PDFs</span> in one place
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Browse thousands of academic materials across BCS, BEE, BCE, and more — curated by educators, for students.
            </p>
            <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-md gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search PDFs by title or topic…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x px-4 py-6 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{levels?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">Education Levels</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
              <FileText className="h-5 w-5" /> PDFs
            </div>
            <div className="text-xs text-muted-foreground">Growing library</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
              <Users className="h-5 w-5" /> Community
            </div>
            <div className="text-xs text-muted-foreground">Educators & students</div>
          </div>
        </div>
      </section>

      {/* Featured Levels */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Education Levels</h2>
            <p className="text-sm text-muted-foreground">Browse by program category</p>
          </div>
          <Link to="/library">
            <Button variant="ghost" size="sm">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {levels?.map((level) => (
            <Link
              key={level.id}
              to={`/library?level=${level.slug}`}
              className="group rounded-[10px] border bg-card p-5 ring-1 ring-foreground/5 transition-all duration-150 hover:shadow-md hover:ring-primary/20"
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
              <h3 className="font-semibold">{level.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{level.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h2 className="text-xl font-semibold">Are you an educator?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Share your academic materials with thousands of Pakistani students.
          </p>
          <Link to="/signup" className="mt-6 inline-block">
            <Button>Register as Teacher <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
