import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download, Upload, Calendar, Clock, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const BackupTab = () => {
  const { toast } = useToast();
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [backups, setBackups] = useState<any[]>([]);

  const createBackup = async () => {
    try {
      // Get all data
      const [categories, accounts, history] = await Promise.all([
        supabase.from("categories").select("*"),
        supabase.from("accounts").select("*, categories(name)"),
        supabase.from("generation_history").select("*").limit(1000),
      ]);

      const backup = {
        timestamp: new Date().toISOString(),
        categories: categories.data || [],
        accounts: accounts.data || [],
        history: history.data || [],
        version: "1.0",
      };

      // Save to localStorage for now (in production, save to cloud storage)
      const existingBackups = JSON.parse(localStorage.getItem("backups") || "[]");
      const newBackups = [backup, ...existingBackups].slice(0, 10); // Keep last 10
      localStorage.setItem("backups", JSON.stringify(newBackups));

      // Download backup file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      setBackups(newBackups);
      toast({
        title: "Backup Created",
        description: "Your backup has been created and downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const restoreBackup = async (file: File) => {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.categories || !backup.accounts) {
        throw new Error("Invalid backup file format");
      }

      if (!confirm("This will overwrite existing data. Are you sure?")) return;

      // Restore categories
      if (backup.categories.length > 0) {
        await supabase.from("categories").upsert(backup.categories);
      }

      // Restore accounts
      if (backup.accounts.length > 0) {
        const accountsToInsert = backup.accounts.map((acc: any) => ({
          id: acc.id,
          category_id: acc.category_id,
          email: acc.email,
          password: acc.password,
          is_used: acc.is_used || false,
          created_at: acc.created_at,
          used_at: acc.used_at,
        }));
        await supabase.from("accounts").upsert(accountsToInsert);
      }

      toast({
        title: "Backup Restored",
        description: "Your data has been restored successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      restoreBackup(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Auto Backup Settings */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Automatic Backups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Automatic Backups</Label>
              <p className="text-xs text-muted-foreground">
                Automatically backup your data on a schedule
              </p>
            </div>
            <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
          </div>
          {autoBackup && (
            <div className="space-y-2 pt-4 border-t border-border">
              <Label>Backup Frequency</Label>
              <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Backup */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Create Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a manual backup of all your data. This includes categories, accounts, and history.
          </p>
          <Button onClick={createBackup} className="w-full bg-gradient-primary">
            <Database className="w-4 h-4 mr-2" />
            Create Backup Now
          </Button>
        </CardContent>
      </Card>

      {/* Restore Backup */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Restore Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Restore data from a previously created backup file.
          </p>
          <div>
            <Input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="bg-secondary border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      {backups.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Backup History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {backups.map((backup, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      Backup {new Date(backup.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {backup.categories?.length || 0} categories,{" "}
                      {backup.accounts?.length || 0} accounts
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(backup, null, 2)], {
                        type: "application/json",
                      });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `backup-${new Date(backup.timestamp).toISOString().split("T")[0]}.json`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

