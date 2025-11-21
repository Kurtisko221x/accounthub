import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, Sparkles, QrCode, Download, Crown, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { sendDiscordWebhook } from "@/lib/discordWebhook";

const generateQRCode = (text: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
};

interface Category {
  id: string;
  name: string;
  image_url: string | null;
  stock?: number;
}

interface GenerateModalProps {
  category: Category;
  open: boolean;
  onClose: () => void;
  userPlan?: 'free' | 'vip';
}

interface AccountResult {
  email: string;
  password: string;
  success_rate?: number;
  plan?: string;
  quality?: string;
}

export const GenerateModal = ({ category, open, onClose, userPlan = 'free' }: GenerateModalProps) => {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AccountResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
        
        // Get user profile for username
        const { data: profile } = await supabase
          .from("users_profile")
          .select("username, email")
          .eq("user_id", session.user.id)
          .single();
        
        if (profile) {
          setUserName(profile.username || null);
          if (profile.email) {
            setUserEmail(profile.email);
          }
        }
      }
    };
    getUserInfo();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    
    // Simulate "hacking" animation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // userPlan here is actually the selectedGeneratorType (free/vip) from the section clicked
      // Pass generator type explicitly to ensure correct account selection
      const { data, error } = await supabase.rpc("generate_account", {
        p_category_id: category.id,
        p_user_id: userId || null,
        p_generator_type: userPlan, // Explicitly pass generator type (free/vip)
      });

      if (error) throw error;

      // Type guard for the response
      const response = data as { 
        error?: string; 
        email?: string; 
        password?: string; 
        success?: boolean;
        success_rate?: number;
        plan?: string;
        quality?: string;
      };

      if (response.error) {
        toast({
          title: "No Accounts Available",
          description: response.error,
          variant: "destructive",
        });
      } else if (response.email && response.password) {
        const accountData: AccountResult = {
          email: response.email,
          password: response.password,
          success_rate: response.success_rate || (userPlan === 'vip' ? 90 : 10),
          plan: response.plan || userPlan,
          quality: response.quality || userPlan,
        };
        setResult(accountData);
        const qrText = `Email: ${accountData.email}\nPassword: ${accountData.password}`;
        setQrUrl(generateQRCode(qrText));
        
        // Send Discord webhook notification
        const timestamp = new Date().toISOString();
        await sendDiscordWebhook(
          accountData.email,
          category.name,
          userEmail,
          userName,
          (accountData.plan as 'free' | 'vip') || userPlan,
          timestamp
        );
        
        toast({
          title: "✅ Success!",
          description: `Account generated successfully (${accountData.success_rate}% success rate)`,
        });
      }
    } catch (error) {
      console.error("Error generating account:", error);
      toast({
        title: "Error",
        description: "Failed to generate account",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      const text = `Email: ${result.email}\nPassword: ${result.password}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Credentials copied to clipboard",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              {category.name}
            </DialogTitle>
            <Badge 
              variant={userPlan === 'vip' ? 'default' : 'secondary'} 
              className={`ml-2 ${
                userPlan === 'vip' 
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' 
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
              }`}
            >
              {userPlan === 'vip' ? (
                <>
                  <Crown className="w-3 h-3 mr-1" />
                  VIP Generator ({result?.success_rate || 90}%)
                </>
              ) : (
                <>
                  <Gift className="w-3 h-3 mr-1" />
                  FREE Generator ({result?.success_rate || 10}%)
                </>
              )}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!result && !generating && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-xl bg-secondary flex items-center justify-center text-5xl">
                {category.image_url && category.image_url.startsWith('http') ? (
                  <img 
                    src={category.image_url} 
                    alt={category.name}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.textContent = getCategoryIcon(category.name);
                    }}
                  />
                ) : (
                  getCategoryIcon(category.name)
                )}
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Click the button below to generate a {category.name} account
                </p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Badge 
                    variant={userPlan === 'vip' ? 'default' : 'secondary'}
                    className={
                      userPlan === 'vip' 
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' 
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                    }
                  >
                    {userPlan === 'vip' ? (
                      <>
                        <Crown className="w-3 h-3 mr-1" />
                        VIP Generator - 90% Success Rate
                      </>
                    ) : (
                      <>
                        <Gift className="w-3 h-3 mr-1" />
                        FREE Generator - 10% Success Rate
                      </>
                    )}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                className={`w-full ${
                  userPlan === 'vip' 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90'
                } text-white font-bold py-6 text-lg`}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                GENERATE ACCOUNT
              </Button>
            </div>
          )}

          {generating && (
            <div className="text-center space-y-4 py-8">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
                <div className="absolute inset-0 w-16 h-16 mx-auto animate-ping opacity-20 bg-primary rounded-full" />
              </div>
              <p className="text-lg font-medium text-primary animate-pulse">
                Searching for available accounts...
              </p>
              <p className="text-sm text-muted-foreground">
                This may take a few seconds
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/50">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-green-400">Account Generated Successfully!</p>
                  <p className="text-xs text-green-400/80">Your account is ready to use</p>
                </div>
              </div>

              {/* Success Rate Info */}
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate:</span>
                  <Badge variant={result.plan === 'vip' ? 'default' : 'secondary'}>
                    {result.success_rate || (result.plan === 'vip' ? 90 : 10)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Generator Type:</span>
                  <Badge variant={result.plan === 'vip' ? 'default' : 'secondary'}>
                    {result.plan === 'vip' ? (
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
                </div>
              </div>

              <div className="p-4 rounded-lg bg-secondary border border-border space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">EMAIL</label>
                  <p className="font-mono text-sm mt-1 text-foreground">{result.email}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">PASSWORD</label>
                  <p className="font-mono text-sm mt-1 text-foreground">{result.password}</p>
                </div>
              </div>
              
              {qrUrl && (
                <div className="flex flex-col items-center space-y-2 p-4 bg-secondary rounded-lg">
                  <img src={qrUrl} alt="QR Code" className="w-32 h-32 border border-border rounded" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = qrUrl;
                      link.download = `qr-${result?.email.split("@")[0]}.png`;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={copyToClipboard}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleGenerate}
                  variant="outline"
                  className="border-primary/30"
                >
                  Generate Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
