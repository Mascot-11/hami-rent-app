import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/language-context";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { v, firstError } from "@/lib/validators";
import { getProfile, upsertProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User, Phone, MapPin, Mail, CheckCircle2, AlertCircle, Crown, QrCode, Loader2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getMySubscription } from "@/lib/subscription.functions";
import { SignedImg } from "@/hooks/use-signed-url";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — Hamro Rent" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function SlotCard() {
  const subFn = useServerFn(getMySubscription);
  const { data: sub } = useQuery({ queryKey: ["my-subscription"], queryFn: () => subFn() });
  if (!sub) return null;
  const pct = sub.tenant_slots > 0 ? Math.min(100, (sub.tenants_used / sub.tenant_slots) * 100) : 100;
  const atLimit = sub.tenants_used >= sub.tenant_slots;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide mb-3">
        <Crown className="h-3.5 w-3.5" /> Tenant slots
      </div>
      <div className="flex items-end justify-between mb-2">
        <p className="text-2xl font-display tabular-nums">
          {sub.tenants_used}<span className="text-muted-foreground text-base"> / {sub.tenant_slots}</span>
        </p>
        <span className="text-xs font-semibold rounded-full px-2 py-0.5 capitalize bg-primary/10 text-primary">
          {sub.plan} plan{sub.expired ? " (lapsed)" : sub.status !== "active" ? ` (${sub.status})` : ""}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-muted-foreground mt-3">
        {atLimit
          ? "You've used all your slots. Contact the administrator to upgrade — payments are handled manually."
          : `${sub.tenant_slots - sub.tenants_used} slot${sub.tenant_slots - sub.tenants_used !== 1 ? "s" : ""} remaining for new active tenants.`}
        {sub.expires_at && ` Plan valid until ${new Date(sub.expires_at).toLocaleDateString("en-NP")}.`}
      </p>
    </Card>
  );
}

function ProfilePage() {
  const { t } = useLanguage();
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
  const [qrPath, setQrPath] = useState<string | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setAddress(profile.address ?? "");
      setQrPath(profile.payment_qr_path ?? null);
    }
  }, [profile]);

  // Same allowlist/size cap as tenant document uploads — uploads are an
  // injection/abuse vector regardless of feature.
  const MAX_QR_BYTES = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_QR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
  const safeName = (n: string) => n.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (file.size > MAX_QR_BYTES) return toast.error("File too large (max 5 MB)");
    if (!ALLOWED_QR_TYPES.has(file.type)) return toast.error("Please upload a JPG, PNG, or WEBP image");

    setUploadingQr(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const path = `${user.id}/qr/payment_qr_${Date.now()}_${safeName(file.name)}`;
      const { data, error } = await supabase.storage.from("tenant-docs").upload(path, file, { upsert: true });
      if (error) throw new Error(error.message);
      setQrPath(data.path);
      toast.success("QR uploaded — click Save profile to apply");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingQr(false);
    }
  };

  const save = useMutation({
    mutationFn: () => {
      const err = firstError(v.name(fullName), v.phone(phone), v.maxLen(address, "Address", 300));
      if (err) throw new Error(err);
      return upsertFn({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          payment_qr_path: qrPath,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(t("profile.savedToast"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isComplete = profile?.full_name && profile?.phone && profile?.address;

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display">{t("profile.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("profile.subtitle")}
        </p>
      </div>

      {/* Completion banner */}
      {!isComplete && (
        <div className="flex gap-3 items-start bg-warning/10 border border-warning/25 rounded-xl p-4 text-sm">
          <AlertCircle className="h-5 w-5 text-warning-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-warning-foreground">{t("profile.incomplete")}</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {t("profile.incompleteDesc")}
            </p>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="flex gap-3 items-center bg-success/10 border border-success/20 rounded-xl p-4 text-sm">
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
          <p className="font-medium text-success">{t("profile.complete")}</p>
        </div>
      )}

      {/* Tenant slots / subscription */}
      <SlotCard />

      {/* Email (read-only) */}
      <Card className="p-4 sm:p-5 space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide mb-2">
          <Mail className="h-3.5 w-3.5" /> {t("profile.accountEmail")}
        </div>
        <p className="text-sm font-medium">{email || "—"}</p>
        <p className="text-xs text-muted-foreground">{t("profile.emailNote")}</p>
      </Card>

      {/* Editable profile */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
          <User className="h-3.5 w-3.5" /> {t("profile.landlordDetails")}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {t("profile.fullName")} <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder={t("profile.fullNameHint")}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {t("profile.phoneNumber")}
          </label>
          <Input
            placeholder={t("profile.phoneHint")}
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {t("profile.address")}
          </label>
          <Textarea
            placeholder={t("profile.addressHint")}
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
          {save.isPending ? t("action.saving") : t("profile.saveProfile")}
        </Button>
      </Card>

      {/* Payment QR */}
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
          <QrCode className="h-3.5 w-3.5" /> {t("profile.paymentQr")}
        </div>
        <p className="text-xs text-muted-foreground">{t("profile.paymentQrDesc")}</p>

        <div className="flex items-center gap-4">
          {qrPath ? (
            <div className="relative">
              <SignedImg
                path={qrPath}
                alt="Payment QR"
                className="h-28 w-28 rounded-lg object-contain border bg-white p-1"
              />
              <button
                type="button"
                onClick={() => setQrPath(null)}
                title={t("profile.removeQr")}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="h-28 w-28 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
              <QrCode className="h-8 w-8" />
            </div>
          )}

          <label className="inline-flex items-center gap-1.5 text-sm font-medium border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted disabled:opacity-50">
            {uploadingQr && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploadingQr ? t("profile.uploadingQr") : qrPath ? t("profile.changeQr") : t("profile.uploadQr")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleQrUpload}
              disabled={uploadingQr}
            />
          </label>
        </div>

        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {save.isPending ? t("action.saving") : t("profile.saveProfile")}
        </Button>
      </Card>
    </div>
  );
}
