import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ReportsTab = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("weekly");
  const [loading, setLoading] = useState(false);

  const generatePDFReport = async () => {
    setLoading(true);
    try {
      // Get statistics
      const [accounts, categories, history] = await Promise.all([
        supabase.from("accounts").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*"),
        supabase
          .from("generation_history")
          .select("*")
          .gte("generated_at", getDateRange(reportType))
          .order("generated_at", { ascending: false }),
      ]);

      // Create PDF content (simple HTML to PDF approach)
      const reportContent = `
        <html>
          <head>
            <title>Account Generator Report - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Account Generator Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Report Type: ${reportType}</p>
            
            <h2>Statistics</h2>
            <table>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
              <tr>
                <td>Total Accounts</td>
                <td>${accounts.count || 0}</td>
              </tr>
              <tr>
                <td>Total Categories</td>
                <td>${categories.data?.length || 0}</td>
              </tr>
              <tr>
                <td>Generations in Period</td>
                <td>${history.data?.length || 0}</td>
              </tr>
            </table>
            
            <h2>Category Distribution</h2>
            <table>
              <tr>
                <th>Category</th>
                <th>Accounts</th>
              </tr>
              ${categories.data?.map((cat: any) => `
                <tr>
                  <td>${cat.name}</td>
                  <td>N/A</td>
                </tr>
              `).join("") || ""}
            </table>
            
            <h2>Recent Generations</h2>
            <table>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Email</th>
              </tr>
              ${history.data?.slice(0, 50).map((entry: any) => `
                <tr>
                  <td>${new Date(entry.generated_at).toLocaleString()}</td>
                  <td>${entry.category_name || "N/A"}</td>
                  <td>${entry.email}</td>
                </tr>
              `).join("") || ""}
            </table>
          </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([reportContent], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${reportType}-${new Date().toISOString().split("T")[0]}.html`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "Your report has been generated and downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (type: string) => {
    const now = new Date();
    if (type === "daily") {
      now.setHours(0, 0, 0, 0);
    } else if (type === "weekly") {
      now.setDate(now.getDate() - 7);
    } else if (type === "monthly") {
      now.setMonth(now.getMonth() - 1);
    }
    return now.toISOString();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Report</SelectItem>
                <SelectItem value="weekly">Weekly Report</SelectItem>
                <SelectItem value="monthly">Monthly Report</SelectItem>
                <SelectItem value="all">All Time Report</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={generatePDFReport}
            disabled={loading}
            className="w-full bg-gradient-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

