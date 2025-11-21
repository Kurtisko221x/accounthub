import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, Trash2, Check, Crown, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromoCode {
  id: string;
  code: string;
  plan: 'free' | 'vip';
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  max_uses: number;
  current_uses: number;
  created_at: string;
}

export const CodesTab = () => {
  const { toast } = useToast();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [newCode, setNewCode] = useState("");
  const [plan, setPlan] = useState<'free' | 'vip'>('vip');
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    const { data } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setCodes(data as PromoCode[]);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerateCode = async () => {
    if (!newCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a code or generate one",
        variant: "destructive",
      });
      return;
    }

    const codeData: any = {
      code: newCode.trim().toUpperCase(),
      plan: plan,
      max_uses: parseInt(maxUses) || 1,
      current_uses: 0,
    };

    if (expiresAt) {
      codeData.expires_at = expiresAt;
    }

    const { error } = await supabase.from("promo_codes").insert(codeData);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Promo code "${newCode.toUpperCase()}" created for ${plan.toUpperCase()} plan`,
      });
      setNewCode("");
      setMaxUses("1");
      setExpiresAt("");
      loadCodes();
    }
  };

  const handleGenerateRandomCode = () => {
    let code = generateCode();
    // Check if code already exists
    while (codes.some((c) => c.code === code)) {
      code = generateCode();
    }
    setNewCode(code);
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;

    const { error } = await supabase.from("promo_codes").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Promo code deleted",
      });
      loadCodes();
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isActive = (code: PromoCode) => {
    if (isExpired(code.expires_at)) return false;
    if (code.current_uses >= code.max_uses) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Generate New Code */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Generate Promo Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code or generate"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="bg-secondary border-border font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateRandomCode}
                  className="border-primary/30"
                >
                  Generate
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Plan Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={plan === 'free' ? 'default' : 'outline'}
                  onClick={() => setPlan('free')}
                  className={plan === 'free' ? 'bg-blue-500' : ''}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  FREE
                </Button>
                <Button
                  type="button"
                  variant={plan === 'vip' ? 'default' : 'outline'}
                  onClick={() => setPlan('vip')}
                  className={plan === 'vip' ? 'bg-yellow-500' : ''}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  VIP
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Expires At (optional)</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <Button
            onClick={handleGenerateCode}
            className="w-full bg-gradient-primary"
            disabled={!newCode.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Promo Code
          </Button>
        </CardContent>
      </Card>

      {/* Codes List */}
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle>Promo Codes ({codes.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No promo codes found. Generate one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  codes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-secondary px-2 py-1 rounded">
                            {code.code}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(code.code, code.id)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedId === code.id ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={code.plan === 'vip' ? 'default' : 'secondary'}>
                          {code.plan === 'vip' ? (
                            <>
                              <Crown className="w-3 h-3 mr-1" />
                              VIP
                            </>
                          ) : (
                            <>
                              <Gift className="w-3 h-3 mr-1" />
                              FREE
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {code.current_uses} / {code.max_uses}
                      </TableCell>
                      <TableCell>
                        {isActive(code) ? (
                          <Badge className="bg-green-500/10 text-green-500">Active</Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-500">
                            {isExpired(code.expires_at) ? 'Expired' : 'Used Up'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {code.expires_at
                          ? new Date(code.expires_at).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {new Date(code.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(code.id)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
