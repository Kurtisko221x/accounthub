import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Webhook, Save, Moon, Sun, Disc, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const SettingsTab = () => {
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailHost, setEmailHost] = useState("");
  const [emailPort, setEmailPort] = useState("587");
  const [emailUser, setEmailUser] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const settings = localStorage.getItem("platformSettings");
    if (settings) {
      const parsed = JSON.parse(settings);
      setDarkMode(parsed.darkMode || false);
      setEmailEnabled(parsed.emailEnabled || false);
      setEmailHost(parsed.emailHost || "");
      setEmailPort(parsed.emailPort || "587");
      setEmailUser(parsed.emailUser || "");
      setWebhookEnabled(parsed.webhookEnabled || false);
      setWebhookUrl(parsed.webhookUrl || "");
      setDiscordWebhook(parsed.discordWebhook || "");
      setSlackWebhook(parsed.slackWebhook || "");
    }
  };

  const saveSettings = () => {
    const settings = {
      darkMode,
      emailEnabled,
      emailHost,
      emailPort,
      emailUser,
      webhookEnabled,
      webhookUrl,
      discordWebhook,
      slackWebhook,
    };
    localStorage.setItem("platformSettings", JSON.stringify(settings));
    
    // Apply dark mode
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Theme Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Enable dark theme</p>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Send email alerts for important events</p>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>
          {emailEnabled && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label>SMTP Host</Label>
                <Input
                  value={emailHost}
                  onChange={(e) => setEmailHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>SMTP Port</Label>
                <Input
                  value={emailPort}
                  onChange={(e) => setEmailPort(e.target.value)}
                  placeholder="587"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Username</Label>
                <Input
                  value={emailUser}
                  onChange={(e) => setEmailUser(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Password</Label>
                <Input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Webhooks</Label>
              <p className="text-xs text-muted-foreground">Send webhook notifications</p>
            </div>
            <Switch checked={webhookEnabled} onCheckedChange={setWebhookEnabled} />
          </div>
          {webhookEnabled && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-domain.com/webhook"
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discord Integration */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Disc className="w-5 h-5" />
            Discord Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Discord Webhook URL</Label>
            <Input
              value={discordWebhook}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground">
              Get webhook URL from Discord server settings
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Slack Integration */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Slack Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Slack Webhook URL</Label>
            <Input
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground">
              Get webhook URL from Slack app settings
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveSettings} className="w-full bg-gradient-primary">
        <Save className="w-4 h-4 mr-2" />
        Save All Settings
      </Button>
    </div>
  );
};

