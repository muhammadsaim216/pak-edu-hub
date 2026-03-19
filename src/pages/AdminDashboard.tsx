import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Shield, ShieldCheck, Users, BookOpen, FileText } from "lucide-react";

/* ─── Education Levels Tab ─── */
function LevelsTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const { data: levels, isLoading } = useQuery({
    queryKey: ["education_levels"],
    queryFn: async () => {
      const { data } = await supabase.from("education_levels").select("*").order("name");
      return data ?? [];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("education_levels").update({ name, slug, description }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("education_levels").insert({ name, slug, description });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["education_levels"] });
      toast({ title: editId ? "Level updated" : "Level created" });
      reset();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("education_levels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["education_levels"] });
      toast({ title: "Level deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const reset = () => { setName(""); setSlug(""); setDescription(""); setEditId(null); setOpen(false); };

  const openEdit = (l: any) => {
    setEditId(l.id); setName(l.name); setSlug(l.slug); setDescription(l.description ?? ""); setOpen(true);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Education Levels</h2>
        <Button size="sm" onClick={() => { reset(); setOpen(true); }} className="gap-1">
          <Plus className="h-4 w-4" /> Add Level
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <div className="rounded-[10px] border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Slug</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels?.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="hidden font-mono text-xs sm:table-cell">{l.slug}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{l.description ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(l)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{l.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove this education level. PDFs referencing it may become orphaned.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMut.mutate(l.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); setOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Level" : "Add Level"}</DialogTitle>
            <DialogDescription>{editId ? "Update the education level details." : "Create a new education level category."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BCS" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. bcs" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description…" />
            </div>
            <Button type="submit" className="w-full" disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : editId ? "Save Changes" : "Create Level"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Users Tab ─── */
function UsersTab() {
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      // Get all profiles and all roles (admin can see both)
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      // Merge roles into profiles
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
      }));
    },
  });

  const toggleTeacher = useMutation({
    mutationFn: async ({ userId, hasTeacher }: { userId: string; hasTeacher: boolean }) => {
      if (hasTeacher) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "teacher");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "teacher" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      toast({ title: "Role updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">User Management</h2>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <div className="rounded-[10px] border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="hidden sm:table-cell">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData?.map((u) => {
                const hasTeacher = u.roles.includes("teacher");
                const hasAdmin = u.roles.includes("admin");
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || "Unnamed"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <Badge key={r} variant={r === "admin" ? "default" : r === "teacher" ? "secondary" : "outline"} className="text-xs">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs sm:table-cell">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {!hasAdmin && (
                        <Button
                          size="sm"
                          variant={hasTeacher ? "outline" : "secondary"}
                          onClick={() => toggleTeacher.mutate({ userId: u.id, hasTeacher })}
                          disabled={toggleTeacher.isPending}
                          className="gap-1 text-xs"
                        >
                          {hasTeacher ? <Shield className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                          {hasTeacher ? "Revoke Teacher" : "Grant Teacher"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* ─── Files Moderation Tab ─── */
function FilesTab() {
  const queryClient = useQueryClient();

  const { data: allPdfs, isLoading } = useQuery({
    queryKey: ["admin_all_pdfs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pdf_materials")
        .select("*, education_levels(name), profiles!pdf_materials_author_id_fkey(full_name)")
        .order("uploaded_at", { ascending: false });
      return data ?? [];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pdf_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_all_pdfs"] });
      toast({ title: "PDF deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">All PDFs</h2>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : allPdfs?.length === 0 ? (
        <div className="rounded-[10px] border bg-card py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No PDFs uploaded yet.</p>
        </div>
      ) : (
        <div className="rounded-[10px] border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Author</TableHead>
                <TableHead className="hidden sm:table-cell">Level</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPdfs?.map((pdf: any) => (
                <TableRow key={pdf.id}>
                  <TableCell className="font-medium">{pdf.title}</TableCell>
                  <TableCell className="hidden text-sm sm:table-cell">{pdf.profiles?.full_name || "Unknown"}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className="text-xs">{pdf.education_levels?.name ?? "—"}</Badge>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs md:table-cell">
                    {new Date(pdf.uploaded_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{pdf.title}"?</AlertDialogTitle>
                          <AlertDialogDescription>This PDF will be permanently removed.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMut.mutate(pdf.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* ─── Main Admin Dashboard ─── */
const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();

  if (authLoading) return <Layout><div className="p-8"><Skeleton className="h-8 w-48" /></div></Layout>;
  if (!user || !isAdmin) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Admin access required.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage categories, users, and content</p>
        </div>

        <Tabs defaultValue="levels" className="space-y-6">
          <TabsList>
            <TabsTrigger value="levels" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Levels
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="levels"><LevelsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="files"><FilesTab /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
