import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Upload, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { user, isTeacher, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [levelId, setLevelId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: levels } = useQuery({
    queryKey: ["education_levels"],
    queryFn: async () => {
      const { data } = await supabase.from("education_levels").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: myPdfs, isLoading } = useQuery({
    queryKey: ["my_pdfs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("pdf_materials")
        .select("*, education_levels(name)")
        .eq("author_id", user!.id)
        .order("uploaded_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pdf_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_pdfs"] });
      toast({ title: "PDF deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLevelId("");
    setFile(null);
    setEditId(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploading(true);

    try {
      let fileUrl = "";
      let fileSize: number | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("pdfs").upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("pdfs").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileSize = file.size;
      }

      if (editId) {
        const updates: any = { title, description, education_level_id: levelId };
        if (fileUrl) {
          updates.file_url = fileUrl;
          updates.file_size = fileSize;
        }
        const { error } = await supabase.from("pdf_materials").update(updates).eq("id", editId);
        if (error) throw error;
        toast({ title: "PDF updated" });
      } else {
        if (!fileUrl) throw new Error("Please select a file");
        const { error } = await supabase.from("pdf_materials").insert({
          title,
          description,
          file_url: fileUrl,
          file_size: fileSize,
          education_level_id: levelId,
          author_id: user.id,
        });
        if (error) throw error;
        toast({ title: "PDF uploaded!" });
      }

      queryClient.invalidateQueries({ queryKey: ["my_pdfs"] });
      queryClient.invalidateQueries({ queryKey: ["pdfs"] });
      setUploadOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (pdf: any) => {
    setEditId(pdf.id);
    setTitle(pdf.title);
    setDescription(pdf.description ?? "");
    setLevelId(pdf.education_level_id);
    setUploadOpen(true);
  };

  if (authLoading) return <Layout><div className="p-8"><Skeleton className="h-8 w-48" /></div></Layout>;
  if (!user || (!isTeacher && !isAdmin)) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            You need a teacher account to access the dashboard.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your uploaded PDFs</p>
          </div>
          <Button onClick={() => { resetForm(); setUploadOpen(true); }} className="gap-1">
            <Plus className="h-4 w-4" /> Upload PDF
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-[10px] border bg-card p-4">
            <div className="text-2xl font-bold text-primary">{myPdfs?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">Total Uploads</div>
          </div>
          <div className="rounded-[10px] border bg-card p-4">
            <div className="text-2xl font-bold text-primary">{levels?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">Levels Available</div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : myPdfs?.length === 0 ? (
          <div className="rounded-[10px] border bg-card py-16 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No uploads yet. Start by uploading a PDF!</p>
          </div>
        ) : (
          <div className="rounded-[10px] border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Level</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myPdfs?.map((pdf) => (
                  <TableRow key={pdf.id}>
                    <TableCell className="font-medium">{pdf.title}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="text-xs">
                        {(pdf as any).education_levels?.name ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs sm:table-cell">
                      {new Date(pdf.uploaded_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(pdf)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(pdf.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Upload/Edit Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(o) => { if (!o) resetForm(); setUploadOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit PDF" : "Upload PDF"}</DialogTitle>
            <DialogDescription>
              {editId ? "Update the details of your PDF." : "Share a new academic resource."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Data Structures Notes" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description…" />
            </div>
            <div className="space-y-2">
              <Label>Education Level</Label>
              <Select value={levelId} onValueChange={setLevelId} required>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  {levels?.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name} — {l.description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{editId ? "Replace File (optional)" : "PDF File"}</Label>
              <div className="rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50">
                <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mx-auto block w-full max-w-xs text-sm"
                  required={!editId}
                />
                {file && <p className="mt-1 text-xs text-muted-foreground">{file.name}</p>}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? "Uploading…" : editId ? "Save Changes" : "Upload PDF"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Dashboard;
