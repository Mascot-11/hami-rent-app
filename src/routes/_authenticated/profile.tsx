import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getProfile, upsertProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User, Phone, MapPin, Mail, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — Hamro Rent" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getProfile);
  const upsertFn = useServerFn(upsertProfile);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getFn(),
  });

  // Get email from supabase auth client-side
  const [email, setEmail] = useState("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setAddress(profile.address ?? "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => {
      if (!fullName.trim()) throw new Error("Full name is required");
      return upsertFn({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isComplete = profile?.full_name && profile?.phone && profile?.address;

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your details appear on bills and receipts shared with tenants.
        </p>
      </div>

      {/* Completion banner */}
      {!isComplete && (
        <div className="flex gap-3 items-start bg-warning/10 border border-warning/25 rounded-xl p-4 text-sm">
          <AlertCircle className="h-5 w-5 text-warning-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-warning-foreground">Profile incomplete</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Add your name, phone, and address so they appear on tenant bills and receipts.
            </p>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="flex gap-3 items-center bg-success/10 border border-success/20 rounded-xl p-4 text-sm">
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
          <p className="font-medium text-success">Profile complete</p>
        </div>
      )}

      {/* Email (read-only) */}
      <Card className="p-4 sm:p-5 space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide mb-2">
          <Mail className="h-3.5 w-3.5" /> Account email
        </div>
        <p className="text-sm font-medium">{email || "—"}</p>
        <p className="text-xs text-muted-foreground">Your login email. Cannot be changed here.</p>
      </Card>

      {/* Editable profile */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
          <User className="h-3.5 w-3.5" /> Landlord details
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Full name <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="e.g. Ram Bahadur Shrestha"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone number
          </label>
          <Input
            placeholder="e.g. 9841000000"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Address
          </label>
          <Textarea
            placeholder="e.g. Baneshwor, Kathmandu"
            value={address}
            onChange={e => setAddress(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="w-full sm:w-auto"
        >
          {save.isPending ? "Saving…" : "Save profile"}
        </Button>
      </Card>
    </div>
  );
}
