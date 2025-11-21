import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Download, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

interface GeneratedAccount {
  email: string;
  password: string;
  category: string;
}

export const BatchTab = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [count, setCount] = useState("10");
  const [generating, setGenerating] = useState(false);
  const [generatedAccounts, setGeneratedAccounts] = useState<GeneratedAccount[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  };

  const handleBatchGenerate = async () => {
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    const numCount = parseInt(count);
    if (numCount <= 0 || numCount > 100) {
      toast({
        title: "Error",
        description: "Count must be between 1 and 100",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setGeneratedAccounts([]);

    try {
      const category = categories.find((c) => c.id === selectedCategory);
      const results: GeneratedAccount[] = [];

      for (let i = 0; i < numCount; i++) {
        try {
          const { data, error } = await supabase.rpc("generate_account", {
            p_category_id: selectedCategory,
          });

          if (error) throw error;

          const response = data as { error?: string; email?: string; password?: string };

          if (response.error) {
            toast({
              title: "Warning",
              description: `No more accounts available after ${results.length} generations`,
              variant: "destructive",
            });
            break;
          }

          if (response.email && response.password) {
            results.push({
              email: response.email,
              password: response.password,
              category: category?.name || "Unknown",
            });
          }

          // Small delay to avoid overwhelming the server
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error generating account ${i + 1}:`, error);
        }
      }

      setGeneratedAccounts(results);
      toast({
        title: "Success!",
        description: `Generated ${results.length} accounts`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (generatedAccounts.length === 0) return;

    const csvContent = [
      ["Email", "Password", "Category"].join(","),
      ...generatedAccounts.map((acc) =>
        [`"${acc.email}"`, `"${acc.password}"`, `"${acc.category}"`].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch-accounts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Accounts exported to CSV",
    });
  };

  const copyToClipboard = () => {
    if (generatedAccounts.length === 0) return;

    const text = generatedAccounts
      .map((acc) => `${acc.email}:${acc.password}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Accounts copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Batch Account Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Count (1-100)</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <Button
            onClick={handleBatchGenerate}
            disabled={generating || !selectedCategory}
            className="w-full bg-gradient-primary"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generating ? "Generating..." : `Generate ${count} Accounts`}
          </Button>
        </CardContent>
      </Card>

      {generatedAccounts.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Accounts ({generatedAccounts.length})</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button size="sm" variant="outline" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedAccounts.map((account, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{account.email}</TableCell>
                      <TableCell className="font-mono text-sm">{account.password}</TableCell>
                      <TableCell>{account.category}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

