import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Currency } from "@/lib/finance/types";
import { useFinanceStore } from "@/lib/finance/store";
import { useFinovaAuth } from "@/lib/auth/finova-session";
import { toast } from "@/components/ui/sonner";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const settings = useFinanceStore((s) => s.settings);
  const setName = useFinanceStore((s) => s.setName);
  const setCurrency = useFinanceStore((s) => s.setCurrency);
  const loadDemo = useFinanceStore((s) => s.loadDemo);
  const resetEmpty = useFinanceStore((s) => s.resetEmpty);
  const exportJson = useFinanceStore((s) => s.exportJson);
  const importJson = useFinanceStore((s) => s.importJson);
  const user = useFinovaAuth((s) => s.user);
  const clearSession = useFinovaAuth((s) => s.clearSession);
  const navigate = useNavigate();

  const download = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finova-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  return (
    <div className="dash-scene mx-auto max-w-xl">
      <PageHeader
        kicker="Settings"
        title="The house rules"
        description="FINOVA keeps the ledger in this browser. Export a backup if this device is not forever."
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {user ? (
            <>
              <p className="text-sm">
                Signed in with {user.method}: <span className="text-foreground">{user.destination}</span>
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  clearSession();
                  toast.success("Signed out");
                  void navigate({ to: "/login" });
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Sign in with email or phone OTP to keep this session on this device.
              </p>
              <Button asChild>
                <Link to="/login">Sign in</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={settings.displayName}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={settings.currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={download}>
            Export backup
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "application/json";
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                if (file.size > 2_000_000) {
                  toast.error("Backup is too large (max 2 MB).");
                  return;
                }
                const text = await file.text();
                const ok = importJson(text);
                toast[ok ? "success" : "error"](ok ? "Ledger restored" : "That file is not a FINOVA backup");
              };
              input.click();
            }}
          >
            Import
          </Button>
          <Button variant="outline" onClick={() => { loadDemo(); toast.success("Demo ledger loaded"); }}>
            Load demo
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              resetEmpty();
              toast.success("Ledger cleared");
            }}
          >
            Reset
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        FINOVA is a private wealth ledger. Transactions stay on this device unless you export them.
        AI answers are informational, not financial advice.
      </p>
    </div>
  );
}
