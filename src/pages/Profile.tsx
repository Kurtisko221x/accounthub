import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Crown, Gift, ExternalLink, Check, X, Loader2 } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<'free' | 'vip'>('free');
  const [userEmail, setUserEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/");
        return;
      }

      setIsLoggedIn(true);
      setUserEmail(session.user.email || "");

      // Get user profile
      const { data } = await supabase
        .from("users_profile")
        .select("plan")
        .eq("user_id", session.user.id)
        .single();

      if (data) {
        setUserPlan(data.plan as 'free' | 'vip');
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemPromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }

    setRedeeming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Not Authenticated",
          description: "Please log in to redeem codes",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.rpc("redeem_promo_code", {
        p_code: promoCode.trim().toUpperCase(),
        p_user_id: session.user.id,
      });

      if (error) throw error;

      const response = data as { success: boolean; plan?: string; error?: string };

      if (response.success && response.plan) {
        setUserPlan(response.plan as 'free' | 'vip');
        setPromoCode("");
        toast({
          title: "Success!",
          description: `Promo code redeemed! Your plan is now ${response.plan.toUpperCase()}.`,
        });
      } else {
        toast({
          title: "Invalid Code",
          description: response.error || "Promo code is invalid or expired",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error redeeming code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to redeem promo code",
        variant: "destructive",
      });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
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
              <h1 className="text-xl font-bold text-foreground">User Profile</h1>
              <p className="text-xs text-muted-foreground">Manage your account and plan</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/")} className="border-primary/30">
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-6">
          {/* Current Plan Card */}
          <Card className="border-2 border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {userPlan === 'vip' ? (
                  <>
                    <Crown className="w-6 h-6 text-yellow-500" />
                    VIP Plan
                  </>
                ) : (
                  <>
                    <Gift className="w-6 h-6 text-blue-500" />
                    FREE Plan
                  </>
                )}
                <Badge variant={userPlan === 'vip' ? 'default' : 'secondary'} className="ml-auto">
                  {userPlan.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{userEmail}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Success Rate</p>
                  <div className="flex items-center gap-2">
                    <div className="h-3 bg-secondary rounded-full flex-1 overflow-hidden">
                      <div
                        className={`h-full ${
                          userPlan === 'vip' ? 'bg-yellow-500' : 'bg-blue-500'
                        } rounded-full transition-all`}
                        style={{ width: `${userPlan === 'vip' ? 90 : 10}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">
                      {userPlan === 'vip' ? '90%' : '10%'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Account Quality</p>
                  <Badge variant={userPlan === 'vip' ? 'default' : 'secondary'}>
                    {userPlan === 'vip' ? 'Premium Accounts' : 'Basic Accounts'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Redeem Promo Code Card */}
          <Card>
            <CardHeader>
              <CardTitle>Redeem Promo Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleRedeemPromoCode()}
                  disabled={redeeming}
                />
                <Button
                  onClick={handleRedeemPromoCode}
                  disabled={redeeming || !promoCode.trim()}
                  className="min-w-[120px]"
                >
                  {redeeming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Redeem
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter a valid promo code to upgrade your plan to VIP
              </p>
            </CardContent>
          </Card>

          {/* Upgrade to VIP Card */}
          {userPlan === 'free' && (
            <Card className="border-2 border-yellow-500/50 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  Upgrade to VIP
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lifetime Access</span>
                    <span className="text-2xl font-bold text-yellow-500">€5</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      90% Success Rate
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Premium Quality Accounts
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Priority Support
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Unlimited Generations
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={() => window.open('https://discord.gg/A3mtwPTj6Q', '_blank')}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Get VIP Now - €5 Lifetime
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Discord Banner */}
          <Card className="border-2 border-purple-500/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Want Promo Code?</h3>
                    <p className="text-sm text-muted-foreground">
                      Join our Discord server and buy or win giveaway!
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => window.open('https://discord.gg/A3mtwPTj6Q', '_blank')}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  Join Discord
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
