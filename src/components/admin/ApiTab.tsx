import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Key, Globe, Code, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ApiTab = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string>("");
  const [showKey, setShowKey] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const keys = localStorage.getItem("apiKeys");
      if (keys) {
        setApiKeys(JSON.parse(keys));
      }
    } catch (error) {
      console.error("Error loading API keys:", error);
    }
  };

  const generateApiKey = () => {
    const key = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(key);
    
    const newKeys = [
      ...apiKeys,
      {
        id: Date.now().toString(),
        key: key.substring(0, 20) + "...",
        fullKey: key,
        created: new Date().toISOString(),
        active: true,
      },
    ];
    
    localStorage.setItem("apiKeys", JSON.stringify(newKeys));
    setApiKeys(newKeys);
    
    toast({
      title: "API Key Generated",
      description: "Save this key securely - it won't be shown again!",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const revokeApiKey = (id: string) => {
    const updated = apiKeys.filter((k) => k.id !== id);
    localStorage.setItem("apiKeys", JSON.stringify(updated));
    setApiKeys(updated);
    toast({
      title: "API Key Revoked",
      description: "The API key has been revoked",
    });
  };

  const baseUrl = window.location.origin;

  return (
    <div className="space-y-6">
      {/* API Keys Management */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={generateApiKey} className="bg-gradient-primary">
              <Key className="w-4 h-4 mr-2" />
              Generate New API Key
            </Button>
          </div>

          {apiKey && (
            <div className="p-4 bg-secondary rounded-lg border border-primary/50">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Your API Key:</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(apiKey)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <code className="text-sm font-mono break-all">
                {showKey ? apiKey : "sk_************************************"}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ Save this key now - it won't be shown again!
              </p>
            </div>
          )}

          {apiKeys.length > 0 && (
            <div className="space-y-2">
              <Label>Active API Keys</Label>
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div>
                    <code className="text-sm font-mono">{key.key}</code>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(key.created).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => revokeApiKey(key.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            API Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Base URL: <code className="bg-secondary px-2 py-1 rounded">{baseUrl}/api</code>
                </p>
                <p className="text-sm text-muted-foreground">
                  Authentication: Include your API key in the header
                </p>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <pre className="text-xs overflow-x-auto">
{`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="generate" className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-2">Generate Account</h3>
                <Badge className="mb-2">POST</Badge>
                <code className="text-sm">{baseUrl}/api/generate</code>
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Request Body:</p>
                  <pre className="text-xs bg-secondary p-3 rounded overflow-x-auto">
{`{
  "category_id": "uuid-of-category"
}`}
                  </pre>
                  <p className="text-sm font-medium mt-4">Response:</p>
                  <pre className="text-xs bg-secondary p-3 rounded overflow-x-auto">
{`{
  "success": true,
  "email": "user@example.com",
  "password": "password123"
}`}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-2">Get Categories</h3>
                <Badge className="mb-2">GET</Badge>
                <code className="text-sm">{baseUrl}/api/categories</code>
                <p className="text-sm font-medium mt-4">Response:</p>
                <pre className="text-xs bg-secondary p-3 rounded overflow-x-auto">
{`[
  {
    "id": "uuid",
    "name": "Category Name",
    "image_url": "https://...",
    "stock": 100
  }
]`}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold mb-2">Get Statistics</h3>
                <Badge className="mb-2">GET</Badge>
                <code className="text-sm">{baseUrl}/api/stats</code>
                <p className="text-sm font-medium mt-4">Response:</p>
                <pre className="text-xs bg-secondary p-3 rounded overflow-x-auto">
{`{
  "totalAccounts": 1000,
  "availableAccounts": 750,
  "usedAccounts": 250,
  "totalCategories": 10
}`}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

