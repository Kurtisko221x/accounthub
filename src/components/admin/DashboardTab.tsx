import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Database, Users, Clock, TrendingUp, Shield, BarChart3, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DashboardTab = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalAccounts: 0,
    availableAccounts: 0,
    usedAccounts: 0,
    totalCategories: 0,
  });
  
  // Feature states
  const [rateLimitingDialog, setRateLimitingDialog] = useState(false);
  const [analyticsDialog, setAnalyticsDialog] = useState(false);
  const [lowStockDialog, setLowStockDialog] = useState(false);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(false);
  const [rateLimitValue, setRateLimitValue] = useState("10");
  const [rateLimitPeriod, setRateLimitPeriod] = useState("hour");
  const [lowStockEnabled, setLowStockEnabled] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [lowStockCategories, setLowStockCategories] = useState<any[]>([]);

  useEffect(() => {
    loadFeatures().then(() => {
      loadStats();
    });
  }, []);

  const loadStats = async () => {
    try {
      // Get total accounts
      const { count: totalAccounts } = await supabase
        .from("accounts")
        .select("*", { count: "exact", head: true });

      // Get available accounts
      const { count: availableAccounts } = await supabase
        .from("accounts")
        .select("*", { count: "exact", head: true })
        .eq("is_used", false);

      // Get used accounts
      const { count: usedAccounts } = await supabase
        .from("accounts")
        .select("*", { count: "exact", head: true })
        .eq("is_used", true);

      // Get total categories
      const { count: totalCategories } = await supabase
        .from("categories")
        .select("*", { count: "exact", head: true });

      setStats({
        totalAccounts: totalAccounts || 0,
        availableAccounts: availableAccounts || 0,
        usedAccounts: usedAccounts || 0,
        totalCategories: totalCategories || 0,
      });
      
      // Check for low stock categories if enabled
      if (lowStockEnabled) {
        await checkLowStock();
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };
  
  const loadFeatures = async () => {
    try {
      // Load rate limiting settings from localStorage (or database)
      const savedRateLimit = localStorage.getItem("rateLimitSettings");
      if (savedRateLimit) {
        const settings = JSON.parse(savedRateLimit);
        setRateLimitEnabled(settings.enabled || false);
        setRateLimitValue(settings.value || "10");
        setRateLimitPeriod(settings.period || "hour");
      }
      
      // Load low stock alert settings
      const savedLowStock = localStorage.getItem("lowStockSettings");
      if (savedLowStock) {
        const settings = JSON.parse(savedLowStock);
        setLowStockEnabled(settings.enabled || false);
        setLowStockThreshold(settings.threshold || "5");
      }
    } catch (error) {
      console.error("Error loading features:", error);
    }
  };
  
  const checkLowStock = async () => {
    try {
      const threshold = parseInt(lowStockThreshold || "5");
      const { data: categories } = await supabase.from("categories").select("id, name");
      if (!categories) return;
      
      const lowStockItems: any[] = [];
      for (const category of categories) {
        const { data: stock } = await supabase.rpc("get_category_stock_count", {
          p_category_id: category.id,
        });
        if (stock !== null && stock < threshold) {
          lowStockItems.push({ ...category, stock });
        }
      }
      setLowStockCategories(lowStockItems);
    } catch (error) {
      console.error("Error checking low stock:", error);
    }
  };
  
  const handleSaveRateLimiting = () => {
    const settings = {
      enabled: rateLimitEnabled,
      value: rateLimitValue,
      period: rateLimitPeriod,
    };
    localStorage.setItem("rateLimitSettings", JSON.stringify(settings));
    toast({
      title: "Rate Limiting Saved",
      description: `Rate limiting ${rateLimitEnabled ? "enabled" : "disabled"}`,
    });
    setRateLimitingDialog(false);
  };
  
  const handleSaveLowStock = async () => {
    const settings = {
      enabled: lowStockEnabled,
      threshold: lowStockThreshold,
    };
    localStorage.setItem("lowStockSettings", JSON.stringify(settings));
    toast({
      title: "Low Stock Alerts Saved",
      description: `Low stock alerts ${lowStockEnabled ? "enabled" : "disabled"}`,
    });
    setLowStockDialog(false);
    if (lowStockEnabled) {
      await checkLowStock();
    }
  };
  
  const handleOpenAnalytics = () => {
    setAnalyticsDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your account generator statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Accounts
            </CardTitle>
            <Database className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalAccounts}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats.availableAccounts}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Used Today
            </CardTitle>
            <Clock className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{stats.usedAccounts}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalCategories}</div>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle>Platform Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Rate Limiting Button */}
            <Button
              onClick={() => setRateLimitingDialog(true)}
              className="flex-1 bg-secondary hover:bg-secondary/80 border border-border/50 text-foreground justify-start gap-3 h-auto py-4 px-6"
              variant="outline"
            >
              <div className="w-1 h-full bg-green-500 rounded-full" />
              <Shield className="w-5 h-5" />
              <span className="font-medium">Add Rate Limiting</span>
            </Button>

            {/* Analytics Dashboard Button */}
            <Button
              onClick={handleOpenAnalytics}
              className="flex-1 bg-secondary hover:bg-secondary/80 border border-border/50 text-foreground justify-start gap-3 h-auto py-4 px-6"
              variant="outline"
            >
              <div className="w-1 h-full bg-green-500 rounded-full" />
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Add Analytics Dashboard</span>
            </Button>

            {/* Low Stock Alerts Button */}
            <Button
              onClick={() => setLowStockDialog(true)}
              className="flex-1 bg-secondary hover:bg-secondary/80 border border-border/50 text-foreground justify-start gap-3 h-auto py-4 px-6"
              variant="outline"
            >
              <div className="w-1 h-full bg-green-500 rounded-full" />
              <Bell className="w-5 h-5" />
              <span className="font-medium">Add Low Stock Alerts</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alerts Display */}
      {lowStockEnabled && lowStockCategories.length > 0 && (
        <Card className="bg-card border-border/50 border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <Bell className="w-5 h-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-sm text-muted-foreground">
                    Only {category.stock} accounts remaining
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rate Limiting Dialog */}
      <Dialog open={rateLimitingDialog} onOpenChange={setRateLimitingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Limiting Configuration</DialogTitle>
            <DialogDescription>
              Control how many accounts can be generated per time period
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="rate-limit-enabled">Enable Rate Limiting</Label>
              <Switch
                id="rate-limit-enabled"
                checked={rateLimitEnabled}
                onCheckedChange={setRateLimitEnabled}
              />
            </div>
            {rateLimitEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rate-limit-value">Max Requests</Label>
                  <Input
                    id="rate-limit-value"
                    type="number"
                    value={rateLimitValue}
                    onChange={(e) => setRateLimitValue(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate-limit-period">Time Period</Label>
                  <select
                    id="rate-limit-period"
                    value={rateLimitPeriod}
                    onChange={(e) => setRateLimitPeriod(e.target.value)}
                    className="w-full p-2 rounded-md border border-input bg-background"
                  >
                    <option value="minute">Per Minute</option>
                    <option value="hour">Per Hour</option>
                    <option value="day">Per Day</option>
                  </select>
                </div>
              </>
            )}
            <Button onClick={handleSaveRateLimiting} className="w-full">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialog} onOpenChange={setAnalyticsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analytics Dashboard</DialogTitle>
            <DialogDescription>
              Detailed insights and statistics about your account platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm">Account Usage Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalAccounts > 0
                      ? ((stats.usedAccounts / stats.totalAccounts) * 100).toFixed(1)
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.usedAccounts} of {stats.totalAccounts} accounts used
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm">Availability Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {stats.totalAccounts > 0
                      ? ((stats.availableAccounts / stats.totalAccounts) * 100).toFixed(1)
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.availableAccounts} accounts available
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Total Categories: {stats.totalCategories}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Available Accounts</span>
                    <span className="font-bold text-green-500">{stats.availableAccounts}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${stats.totalAccounts > 0 ? (stats.availableAccounts / stats.totalAccounts) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Used Accounts</span>
                    <span className="font-bold text-red-500">{stats.usedAccounts}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${stats.totalAccounts > 0 ? (stats.usedAccounts / stats.totalAccounts) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Low Stock Alerts Dialog */}
      <Dialog open={lowStockDialog} onOpenChange={setLowStockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Low Stock Alerts Configuration</DialogTitle>
            <DialogDescription>
              Get notified when account stock drops below a threshold
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="low-stock-enabled">Enable Low Stock Alerts</Label>
              <Switch
                id="low-stock-enabled"
                checked={lowStockEnabled}
                onCheckedChange={setLowStockEnabled}
              />
            </div>
            {lowStockEnabled && (
              <div className="space-y-2">
                <Label htmlFor="low-stock-threshold">Alert Threshold</Label>
                <Input
                  id="low-stock-threshold"
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  min="1"
                  placeholder="Minimum stock before alert"
                />
                <p className="text-xs text-muted-foreground">
                  Alert when stock falls below this number
                </p>
              </div>
            )}
            {lowStockCategories.length > 0 && (
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <p className="text-sm font-medium mb-2">Current Low Stock Categories:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {lowStockCategories.map((cat) => (
                    <li key={cat.id}>• {cat.name} ({cat.stock} remaining)</li>
                  ))}
                </ul>
              </div>
            )}
            <Button onClick={handleSaveLowStock} className="w-full">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
