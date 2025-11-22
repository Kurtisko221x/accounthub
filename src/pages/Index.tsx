import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CategoryCard } from "@/components/CategoryCard";
import { GenerateModal } from "@/components/GenerateModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogIn, User, Crown, Gift, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  image_url: string | null;
  stock?: number;
  freeStock?: number;
  vipStock?: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedGeneratorType, setSelectedGeneratorType] = useState<'free' | 'vip'>('free');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<'free' | 'vip'>('free');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [categoriesVisible, setCategoriesVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      await checkUserPlan();
      // Load categories after user plan is checked (or default to 'free')
      await loadCategories();
    };
    init();
  }, []);

  useEffect(() => {
    // Reload categories when user plan changes
    if (userPlan) {
      loadCategories();
    }
  }, [userPlan]);

  const checkUserPlan = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        const { data } = await supabase
          .from("users_profile")
          .select("plan")
          .eq("user_id", session.user.id)
          .single();
        if (data) {
          setUserPlan(data.plan as 'free' | 'vip');
        }
      }
    } catch (error) {
      console.error("Error checking user plan:", error);
    }
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      setCategoriesVisible(false); // Reset visibility for animation
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (data) {
        // Load stock count for both FREE and VIP accounts for each category
        const categoriesWithStock = await Promise.all(
          data.map(async (category) => {
            try {
              // Get FREE stock count
              const { data: freeStock, error: freeError } = await supabase.rpc("get_category_stock_count", {
                p_category_id: category.id,
                p_user_plan: 'free',
              });
              
              // Get VIP stock count
              const { data: vipStock, error: vipError } = await supabase.rpc("get_category_stock_count", {
                p_category_id: category.id,
                p_user_plan: 'vip',
              });
              
              if (freeError) {
                console.error(`Error getting FREE stock for ${category.name}:`, freeError);
              }
              
              if (vipError) {
                console.error(`Error getting VIP stock for ${category.name}:`, vipError);
              }
              
              // Set stock based on user plan
              const currentStock = userPlan === 'vip' ? (vipStock || 0) : (freeStock || 0);
              
              return {
                ...category,
                stock: currentStock,
                freeStock: freeStock || 0,
                vipStock: vipStock || 0,
              };
            } catch (err) {
              console.error(`Error processing category ${category.name}:`, err);
              return {
                ...category,
                stock: 0,
                freeStock: 0,
                vipStock: 0,
              };
            }
          })
        );
        setCategories(categoriesWithStock);
        // Trigger animation after categories are loaded
        setTimeout(() => {
          setCategoriesVisible(true);
        }, 100);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    // Check stock based on user plan
    const stock = userPlan === 'vip' ? (category.vipStock || 0) : (category.freeStock || 0);
    if (stock > 0) {
      setSelectedCategory({ ...category, stock });
      setModalOpen(true);
    } else {
      toast({
        title: "No Accounts Available",
        description: userPlan === 'vip' 
          ? "No VIP accounts available for this service. Try another category or contact support."
          : "No free accounts available for this service. Try again later or upgrade to VIP for better accounts.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background" style={{ scrollBehavior: 'smooth' }}>
      {/* Enhanced Header */}
      <header className="border-b border-border/50 sticky top-0 z-10 backdrop-blur-md bg-background/90 shadow-lg shadow-black/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-accent/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              <img 
                src="https://cdn.discordapp.com/attachments/1441466120631488754/1441474372614492232/acchub.png"
                alt="Acc Hub Logo"
                className="w-full h-full object-cover rounded-xl relative z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-2xl font-bold relative z-10">⚡</span>';
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 drop-shadow-lg">
                Acc Hub
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Account Generator Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <Button
                variant="outline"
                onClick={() => navigate("/profile")}
                className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/admin")}
              className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary/5 to-accent/5"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Admin Panel
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Enhanced VIP/FREE Banner - Top Notice */}
        <div className="mb-6 sm:mb-8 relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-gradient-to-r from-yellow-500/50 via-purple-500/50 to-blue-500/50 bg-gradient-to-br from-yellow-500/10 via-purple-500/10 to-blue-500/10 p-4 sm:p-6 lg:p-8 shadow-2xl shadow-black/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-purple-500/5 to-blue-500/5 animate-pulse"></div>
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-purple-500/20 to-blue-500/20 blur-xl opacity-50 animate-pulse-glow"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div className="text-center w-full sm:w-auto">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" />
                  <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(250,204,21,0.6)] animate-pulse">
                    VIP GENERATOR
                  </span>
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" />
                </div>
                <p className="text-sm text-yellow-300/90 font-medium">
                  <span className="text-yellow-400 font-bold">90% Success Rate</span> - Premium quality accounts with high success chance
                </p>
                <p className="text-xs text-yellow-400/70 mt-1">
                  💎 Gold Accounts • 🏆 Verified • ✨ Top Quality
                </p>
              </div>
              
              <div className="hidden sm:block h-12 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
              <div className="block sm:hidden w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent my-2"></div>
              
              <div className="text-center w-full sm:w-auto">
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]">
                    FREE GENERATOR
                  </span>
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                </div>
                <p className="text-sm text-blue-300/90 font-medium">
                  <span className="text-blue-400 font-bold">10% Success Rate</span> - Basic free accounts for everyone
                </p>
                <p className="text-xs text-blue-400/70 mt-1">
                  🎁 Free • 📦 Basic Accounts • ⚡ Instant Access
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-center text-sm text-white/80">
                <span className="font-bold text-yellow-400">VIP accounts</span> have{' '}
                <span className="font-bold text-yellow-300">9x higher chance</span> of success than{' '}
                <span className="font-bold text-blue-400">FREE accounts</span>
              </p>
            </div>
          </div>
        </div>

        {/* Generator Info Section */}
        <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {/* FREE Generator */}
            <Card className="border-2 border-blue-500/50 bg-blue-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">FREE Generator</h3>
                    <p className="text-sm text-muted-foreground">10% Success Rate</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate free accounts with basic quality. Limited success rate but always available.
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-blue-500 rounded-full" style={{ width: '10%' }}></div>
                  <span className="text-xs text-muted-foreground">10%</span>
                </div>
              </CardContent>
            </Card>

            {/* VIP Generator */}
            <Card className={`border-2 ${userPlan === 'vip' ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">VIP Generator</h3>
                    <p className="text-sm text-muted-foreground">90% Success Rate</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Premium accounts with high quality. Excellent success rate for verified accounts.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-2 bg-yellow-500 rounded-full" style={{ width: '90%' }}></div>
                    <span className="text-xs text-muted-foreground">90%</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-500">€5</p>
                    <p className="text-xs text-muted-foreground">Lifetime</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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

          {/* Profile Link */}
          {isLoggedIn && (
            <Card className="border-2 border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      {userPlan === 'vip' ? (
                        <Crown className="w-5 h-5 text-white" />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Current Plan: <span className="uppercase font-bold text-primary">{userPlan}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userPlan === 'vip' ? '90% Success Rate' : '10% Success Rate'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/profile')}
                    variant="outline"
                    className="border-primary/30"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Manage Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* VIP Generator Indicator */}
        {userPlan === 'vip' && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-pink-500/20 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20">
              <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" />
              <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]">
                👑 VIP GENERÁTOR AKTÍVNY - 90% Success Rate
              </span>
              <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" />
            </div>
            <p className="mt-2 text-sm text-yellow-300/80 font-medium">
              Máte prístup k prémiovým VIP účtom s vysokou šancou na úspech
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-12">
            {/* Skeleton loaders for FREE section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-muted animate-pulse"></div>
                <div className="h-8 w-48 rounded-lg bg-muted animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`skeleton-free-${i}`}
                    className="rounded-2xl border border-border/50 p-6 space-y-4 animate-pulse"
                  >
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-muted animate-skeleton"></div>
                    <div className="h-6 w-3/4 mx-auto rounded bg-muted animate-skeleton"></div>
                    <div className="h-8 w-24 mx-auto rounded-full bg-muted animate-skeleton"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Skeleton loaders for VIP section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-muted animate-pulse"></div>
                <div className="h-8 w-48 rounded-lg bg-muted animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`skeleton-vip-${i}`}
                    className="rounded-2xl border border-border/50 p-6 space-y-4 animate-pulse"
                  >
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-muted animate-skeleton"></div>
                    <div className="h-6 w-3/4 mx-auto rounded bg-muted animate-skeleton"></div>
                    <div className="h-8 w-24 mx-auto rounded-full bg-muted animate-skeleton"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg mb-4">
              No categories available yet
            </p>
            <p className="text-sm text-muted-foreground">
              Add categories in the admin panel to get started
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* FREE Generator Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Gift className="w-8 h-8 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]">
                  FREE Generator
                </h2>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                  10% Success Rate
                </Badge>
              </div>
              <p className="text-muted-foreground mb-6 text-sm">
                Basic accounts for free for everyone. Limited success rate, but always available.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories
                  .filter((category) => (category.freeStock || 0) > 0)
                  .map((category, index) => (
                    <div
                      key={`free-${category.id}`}
                      className={`${categoriesVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'}`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'both',
                      }}
                    >
                      <CategoryCard
                        category={{ ...category, stock: category.freeStock }}
                        onClick={() => {
                          if (category.freeStock && category.freeStock > 0) {
                            setSelectedCategory({ ...category, stock: category.freeStock });
                            setSelectedGeneratorType('free'); // Set to FREE generator
                            setModalOpen(true);
                          }
                        }}
                      />
                    </div>
                  ))}
                {categories.filter((category) => (category.freeStock || 0) > 0).length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No FREE accounts are currently available</p>
                  </div>
                )}
              </div>
            </div>

            {/* VIP Generator Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Crown className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(250,204,21,0.6)] animate-pulse">
                  VIP Generator
                </h2>
                <Badge variant="default" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                  90% Success Rate
                </Badge>
              </div>
              <p className="text-muted-foreground mb-6 text-sm">
                Premium accounts with high quality. Excellent success rate for verified accounts.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories
                  .filter((category) => (category.vipStock || 0) > 0)
                  .map((category, index) => (
                    <div
                      key={`vip-${category.id}`}
                      className={`${categoriesVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'}`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'both',
                      }}
                    >
                      <CategoryCard
                        category={{ ...category, stock: category.vipStock }}
                        onClick={() => {
                          if (category.vipStock && category.vipStock > 0) {
                            setSelectedCategory({ ...category, stock: category.vipStock });
                            setSelectedGeneratorType('vip'); // Set to VIP generator
                            setModalOpen(true);
                          }
                        }}
                      />
                    </div>
                  ))}
                {categories.filter((category) => (category.vipStock || 0) > 0).length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No VIP accounts are currently available</p>
                    <p className="text-sm mt-2">Upgrade to VIP plan for access to premium accounts</p>
                  </div>
                )}
              </div>
            </div>
      </div>
        )}
      </main>

      {/* Generate Modal */}
      {selectedCategory && (
        <GenerateModal
          category={selectedCategory}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedCategory(null);
            setSelectedGeneratorType('free');
            // Reload categories to update stock counts
            loadCategories();
          }}
          userPlan={selectedGeneratorType} // Use selected generator type instead of user plan
        />
      )}
    </div>
  );
};

export default Index;
