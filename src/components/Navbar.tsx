import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ChevronDown, Menu, X, LogOut, LayoutDashboard, Shield } from "lucide-react";

export function Navbar() {
  const { user, isTeacher, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: levels } = useQuery({
    queryKey: ["education_levels"],
    queryFn: async () => {
      const { data } = await supabase.from("education_levels").select("*").order("name");
      return data ?? [];
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <BookOpen className="h-5 w-5" />
          <span className="text-base">EduPDF Pakistan</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <Link to="/library">
            <Button variant="ghost" size="sm">Library</Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Levels <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {levels?.map((l) => (
                <DropdownMenuItem key={l.id} onClick={() => navigate(`/library?level=${l.slug}`)}>
                  {l.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {(isTeacher || isAdmin) && (
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="mr-1 h-3.5 w-3.5" /> Dashboard
              </Button>
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                <Shield className="mr-1 h-3.5 w-3.5" /> Admin
              </Button>
            </Link>
          )}

          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1 h-3.5 w-3.5" /> Sign Out
            </Button>
          ) : (
            <Link to="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            <Link to="/library" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start">Library</Button>
            </Link>
            {levels?.map((l) => (
              <Link key={l.id} to={`/library?level=${l.slug}`} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start pl-6 text-muted-foreground">
                  {l.name}
                </Button>
              </Link>
            ))}
            {(isTeacher || isAdmin) && (
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">Dashboard</Button>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">Admin</Button>
              </Link>
            )}
            {user ? (
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
                Sign Out
              </Button>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
