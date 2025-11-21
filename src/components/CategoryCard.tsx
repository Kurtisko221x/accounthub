import { getCategoryIcon } from "@/lib/categoryIcons";

interface Category {
  id: string;
  name: string;
  image_url: string | null;
  stock?: number;
}

interface CategoryCardProps {
  category: Category;
  onClick: () => void;
}

export const CategoryCard = ({ category, onClick }: CategoryCardProps) => {
  const categoryIcon = getCategoryIcon(category.name);
  const hasValidImageUrl = category.image_url && category.image_url.startsWith('http');
  const hasStock = (category.stock || 0) > 0;
  
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-primary/20 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
      disabled={!hasStock}
    >
      {/* Animated background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 transition-all duration-500" />
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute -inset-full top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shimmer" />
      </div>
      
      <div className="relative z-10">
        {/* Icon with better animations */}
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center text-5xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 overflow-hidden shadow-lg">
          {hasValidImageUrl ? (
            <img 
              src={category.image_url || ''} 
              alt={category.name}
              className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent && !parent.textContent?.includes(categoryIcon)) {
                  parent.textContent = categoryIcon;
                }
              }}
            />
          ) : (
            <span className="drop-shadow-lg">{categoryIcon}</span>
          )}
        </div>
        
        {/* Name with gradient effect */}
        <h3 className="text-xl font-bold mb-3 text-foreground group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
          {category.name}
        </h3>
        
        {/* Enhanced Stock Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
          hasStock 
            ? "bg-green-500/10 text-green-400 border border-green-500/30 group-hover:bg-green-500/20 group-hover:border-green-500/50" 
            : "bg-red-500/10 text-red-400 border border-red-500/30 opacity-60"
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            hasStock ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`} />
          <span>
            {category.stock || 0} in stock
          </span>
        </div>
        
        {/* Click indicator */}
        {hasStock && (
          <div className="mt-3 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Click to generate →
          </div>
        )}
      </div>
    </button>
  );
};
