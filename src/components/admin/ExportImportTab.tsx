import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, FileText, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ExportImportTab = () => {
  const { toast } = useToast();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"categories" | "accounts">("accounts");

  const exportCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;

      const csvContent = [
        ["id", "name", "image_url", "created_at"].join(","),
        ...(data || []).map((cat) =>
          [
            cat.id,
            `"${cat.name}"`,
            cat.image_url ? `"${cat.image_url}"` : "",
            cat.created_at || "",
          ].join(",")
        ),
      ].join("\n");

      downloadCSV(csvContent, "categories-export.csv");
      toast({
        title: "Success",
        description: "Categories exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*, categories(name)");
      if (error) throw error;

      const csvContent = [
        ["id", "category_name", "email", "password", "is_used", "created_at", "used_at"].join(","),
        ...(data || []).map((acc: any) =>
          [
            acc.id,
            acc.categories?.name || "",
            `"${acc.email}"`,
            `"${acc.password}"`,
            acc.is_used ? "true" : "false",
            acc.created_at || "",
            acc.used_at || "",
          ].join(",")
        ),
      ].join("\n");

      downloadCSV(csvContent, "accounts-export.csv");
      toast({
        title: "Success",
        description: "Accounts exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("generation_history")
        .select("*")
        .order("generated_at", { ascending: false });
      if (error) throw error;

      const csvContent = [
        ["id", "category_name", "email", "generated_at", "ip_address"].join(","),
        ...(data || []).map((entry) =>
          [
            entry.id,
            entry.category_name ? `"${entry.category_name}"` : "",
            `"${entry.email}"`,
            entry.generated_at || "",
            entry.ip_address || "",
          ].join(",")
        ),
      ].join("\n");

      downloadCSV(csvContent, "generation-history-export.csv");
      toast({
        title: "Success",
        description: "History exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await importFile.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

      if (importType === "categories") {
        const categories = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
          const category: any = {};
          headers.forEach((header, index) => {
            if (header === "name" || header === "image_url") {
              category[header] = values[index] || null;
            }
          });
          return category;
        });

        const { error } = await supabase.from("categories").insert(categories);
        if (error) throw error;

        toast({
          title: "Success",
          description: `${categories.length} categories imported`,
        });
      } else {
        // Import accounts
        const categoryMap = new Map<string, string>();
        const { data: categories } = await supabase.from("categories").select("id, name");
        categories?.forEach((cat) => {
          categoryMap.set(cat.name, cat.id);
        });

        const accounts = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
          const account: any = {};
          headers.forEach((header, index) => {
            if (header === "category_name") {
              const categoryId = categoryMap.get(values[index]);
              if (categoryId) account.category_id = categoryId;
            } else if (header === "email" || header === "password") {
              account[header] = values[index];
            }
          });
          return account;
        }).filter((acc) => acc.category_id && acc.email && acc.password);

        const { error } = await supabase.from("accounts").insert(accounts);
        if (error) throw error;

        toast({
          title: "Success",
          description: `${accounts.length} accounts imported`,
        });
      }

      setImportFile(null);
      // Reset file input
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportJSON = async (type: "categories" | "accounts") => {
    try {
      let data: any;
      if (type === "categories") {
        const { data: categories, error } = await supabase.from("categories").select("*");
        if (error) throw error;
        data = categories;
      } else {
        const { data: accounts, error } = await supabase
          .from("accounts")
          .select("*, categories(name)");
        if (error) throw error;
        data = accounts;
      }

      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `${type} exported to JSON`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="flex gap-2">
                <Button onClick={exportCategories} variant="outline" className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={() => exportJSON("categories")} variant="outline" className="flex-1">
                  <Database className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Accounts</Label>
              <div className="flex gap-2">
                <Button onClick={exportAccounts} variant="outline" className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={() => exportJSON("accounts")} variant="outline" className="flex-1">
                  <Database className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Generation History</Label>
              <Button onClick={exportHistory} variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Export History CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Import Type</Label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value as "categories" | "accounts")}
              className="w-full p-2 rounded-md border border-input bg-background"
            >
              <option value="categories">Categories</option>
              <option value="accounts">Accounts</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>CSV File</Label>
            <Input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground">
              Select a CSV file to import. Format should match exported files.
            </p>
          </div>
          <Button
            onClick={handleImport}
            disabled={!importFile}
            className="w-full bg-gradient-primary"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import {importType === "categories" ? "Categories" : "Accounts"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

