import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, BarChart3, Folder, Database, History, Download, Activity, Key, Settings, QrCode, FileText, HardDrive, Zap, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { AccountsTab } from "@/components/admin/AccountsTab";
import { HistoryTab } from "@/components/admin/HistoryTab";
import { ExportImportTab } from "@/components/admin/ExportImportTab";
import { ActivityLogTab } from "@/components/admin/ActivityLogTab";
import { ApiTab } from "@/components/admin/ApiTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { BackupTab } from "@/components/admin/BackupTab";
import { QRTab } from "@/components/admin/QRTab";
import { ReportsTab } from "@/components/admin/ReportsTab";
import { BatchTab } from "@/components/admin/BatchTab";
import { CodesTab } from "@/components/admin/CodesTab";

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out successfully",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-xl mx-auto mb-4 flex items-center justify-center animate-pulse">
            <span className="text-3xl">⚡</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold">⚡</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Account Generator Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="border-primary/30">
              <a href="/">View Site</a>
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-card border border-border/50 flex-wrap h-auto">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-primary">
              <Folder className="w-4 h-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="accounts" className="data-[state=active]:bg-primary">
              <Database className="w-4 h-4 mr-2" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-primary">
              <Download className="w-4 h-4 mr-2" />
              Export/Import
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-primary">
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-primary">
              <Key className="w-4 h-4 mr-2" />
              API
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="backup" className="data-[state=active]:bg-primary">
              <HardDrive className="w-4 h-4 mr-2" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="qr" className="data-[state=active]:bg-primary">
              <QrCode className="w-4 h-4 mr-2" />
              QR Codes
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-primary">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="batch" className="data-[state=active]:bg-primary">
              <Zap className="w-4 h-4 mr-2" />
              Batch
            </TabsTrigger>
            <TabsTrigger value="codes" className="data-[state=active]:bg-primary">
              <Gift className="w-4 h-4 mr-2" />
              Promo Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>

          <TabsContent value="accounts">
            <AccountsTab />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>

          <TabsContent value="export">
            <ExportImportTab />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLogTab />
          </TabsContent>

          <TabsContent value="api">
            <ApiTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>

          <TabsContent value="backup">
            <BackupTab />
          </TabsContent>

          <TabsContent value="qr">
            <QRTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>

          <TabsContent value="batch">
            <BatchTab />
          </TabsContent>

          <TabsContent value="codes">
            <CodesTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
