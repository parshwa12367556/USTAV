
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { budgetItemSchema, type BudgetItemInput } from "@/schemas";
import { budgetService } from "@/services/budget.service";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, TrendingUp, PieChart as PieIcon } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { formatCurrency } from "@/utils/format";
import { BUDGET_CATEGORIES } from "@/constants";

export default function FamilyBudget() {
  const { toast } = useToast();
  const { data: summary } = useQuery({ queryKey: ["budgetSummary", "fam_001"], queryFn: () => budgetService.summary("fam_001") });
  const { data: items } = useQuery({ queryKey: ["budgetItems", "fam_001"], queryFn: () => budgetService.list("fam_001") });
  const {
    register, handleSubmit, formState: { errors }, reset, setValue, watch,
  } = useForm<BudgetItemInput>({ resolver: zodResolver(budgetItemSchema), defaultValues: { category: "", name: "", estimatedAmount: 0, actualAmount: 0, paidAmount: 0, date: "" } });

  const category = watch("category");
  const onSubmit = async (data: BudgetItemInput) => {
    try {
      await budgetService.create(data);
      toast({ title: "Expense added", description: data.name + " added to budget." });
      reset();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Could not add expense", variant: "destructive" });
    }
  };

  const byCat = summary?.byCategory || {};
  const catEntries = Object.entries(byCat) as [string, { estimated: number; actual: number }][];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Budget Management</h1>
          <p className="text-muted-foreground">Set, track and control your celebration budget.</p>
        </div>
        <Button className="bg-burgundy text-white flex items-center gap-2"><Plus className="h-4 w-4" /> Add Expense</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Estimated", value: summary?.totalEstimated || 1200000, icon: <CreditCard className="h-5 w-5" /> },
          { label: "Actual Expenses", value: summary?.totalActual || 232599, icon: <TrendingUp className="h-5 w-5" /> },
          { label: "Amount Paid", value: summary?.totalPaid || 116799, icon: <CreditCard className="h-5 w-5" /> },
          { label: "Remaining", value: summary?.remainingBalance || 967401, icon: <PieIcon className="h-5 w-5" /> },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">{s.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(s.value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle className="text-lg font-serif">Category-wise Spending</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <PieChart width={400} height={300}>
                  <Pie data={catEntries.map(([k,v]) => ({ name: BUDGET_CATEGORIES.find((c)=>c.value===k)?.label||k, value: v.actual }))} dataKey="value" cx={200} cy={150} innerRadius={60} outerRadius={100} fill="#888">
                    <Cell fill="#7A2338" /><Cell fill="#C7A15A" /><Cell fill="#21865B" /><Cell fill="#EAE4E0" /><Cell fill="#541729" />
                  </Pie>
                </PieChart>
              </div>
              <div className="mt-4 space-y-2 text-xs">
                {catEntries.slice(0,4).map(([k,v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-muted-foreground">{BUDGET_CATEGORIES.find((c)=>c.value===k)?.label||k}</span>
                    <span className="font-medium">{formatCurrency(v.actual)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg font-serif">Add Expense</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="category">Category</Label><Select value={category} onValueChange={(v)=>setValue("category",v)} {...register("category")}><option value="">Select category</option>{BUDGET_CATEGORIES.map((c)=> <option key={c.value} value={c.value}>{c.label}</option>)}</Select><p className="text-xs text-destructive">{errors.category?.message}</p></div>
                <div className="space-y-2"><Label htmlFor="name">Expense name</Label><Input id="name" {...register("name")} /><p className="text-xs text-destructive">{errors.name?.message}</p></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="estimatedAmount">Estimated (?)</Label><Input id="estimatedAmount" type="number" {...register("estimatedAmount")} /></div>
                  <div className="space-y-2"><Label htmlFor="actualAmount">Actual (?)</Label><Input id="actualAmount" type="number" {...register("actualAmount")} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="paidAmount">Paid (?)</Label><Input id="paidAmount" type="number" {...register("paidAmount")} /></div>
                <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" type="date" {...register("date")} /></div>
                <Button type="submit" className="w-full bg-burgundy text-white">Add Expense</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <h4 className="font-semibold mb-4">Recent Expenses</h4>
              <div className="space-y-4">
                {(items || []).slice(0,5).map((i) => (
                  <div key={i.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <div className="font-medium text-foreground">{i.name}</div>
                      <div className="text-xs text-muted-foreground">{i.category}  {i.vendor || ""}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">{formatCurrency(i.actualAmount)}</div>
                      <div className="text-xs text-muted-foreground">{i.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

