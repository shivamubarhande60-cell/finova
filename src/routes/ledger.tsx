import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search, Upload } from "lucide-react";
import { PageHeader } from "@/components/finance/page-header";
import { TxRow } from "@/components/finance/tx-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fromCsv, toCsv } from "@/lib/finance/compute";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/finance/categories";
import { useFinanceStore } from "@/lib/finance/store";
import { useLedger } from "@/lib/finance/use-ledger";
import { toast } from "@/components/ui/sonner";

export const Route = createFileRoute("/ledger")({ component: LedgerPage });

function LedgerPage() {
  const { transactions, accounts } = useLedger();
  const addMany = useFinanceStore((s) => s.addMany);
  const openForm = useFinanceStore((s) => s.openForm);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [category, setCategory] = useState("all");

  const cats = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return transactions.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (category !== "all" && t.category !== category) return false;
      if (!query) return true;
      return (
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        (t.notes ?? "").toLowerCase().includes(query)
      );
    });
  }, [transactions, q, type, category]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finova-ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const onImport = async (file: File) => {
    if (file.size > 1_000_000) {
      toast.error("File is too large (max 1 MB).");
      return;
    }
    const text = await file.text();
    const rows = fromCsv(text, accounts[0]?.id ?? "acc_checking");
    if (!rows.length) {
      toast.error("No rows found in that file.");
      return;
    }
    addMany(rows);
    toast.success(`Imported ${rows.length} rows`);
  };

  return (
    <div className="dash-scene mx-auto max-w-6xl">
      <PageHeader
        kicker="Ledger"
        title="Every movement"
        description="Search, filter, import, and export. Your books stay on this device."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm">
              <Upload className="h-4 w-4" />
              Import CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onImport(f);
                  e.target.value = "";
                }}
              />
            </label>
            <Button onClick={() => openForm()}>Add</Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search descriptions, notes, categories"
            className="pl-9"
          />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger className="sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {cats.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-5">
          <p className="pb-3 text-xs text-muted-foreground">{filtered.length} rows</p>
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nothing matches. Add a transaction or load the sample ledger in Settings.
            </p>
          ) : (
            filtered.map((tx) => <TxRow key={tx.id} tx={tx} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
