import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AddLeagueDialogProps {
  sport: string;
}

export function AddLeagueDialog({ sport }: AddLeagueDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    file: null as File | null,
  });

  const uploadLeagueMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/sports/custom/leagues/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "League added successfully",
      });
      setForm({ name: "", file: null });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/sports/custom/leagues"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add league",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast({
        title: "Error",
        description: "Please enter a league name",
        variant: "destructive",
      });
      return;
    }

    // Validate file type (JPEG, PNG, GIF only)
    if (form.file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(form.file.type)) {
        toast({
          title: "Error",
          description: "Only JPEG, PNG, and GIF files are allowed",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (2MB limit)
      if (form.file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 2MB",
          variant: "destructive",
        });
        return;
      }
    }

    const formData = new FormData();
    if (form.file) {
      formData.append("badge", form.file);
    }
    formData.append("name", form.name);
    formData.append("sport", sport);

    uploadLeagueMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          data-testid="button-add-league"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add League
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" data-testid="dialog-add-league">
        <DialogHeader>
          <DialogTitle>Add New League</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="league-name">League Name</Label>
            <Input
              id="league-name"
              data-testid="input-league-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Premier League"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="league-file">Badge Image (Optional)</Label>
            <Input
              id="league-file"
              type="file"
              data-testid="input-league-file"
              accept="image/jpeg,image/png,image/gif"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
            />
            <p className="text-xs text-muted-foreground">
              Max 2MB. Formats: JPEG, PNG, GIF
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-league"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              data-testid="button-submit-league"
              disabled={uploadLeagueMutation.isPending}
            >
              {uploadLeagueMutation.isPending ? "Adding..." : "Add League"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
