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
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 p-4 sm:p-6 transition-all duration-500 hover:border-primary/70 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:shadow-primary/30 hover:-translate-y-2 active:translate-y-0 active:scale-[0.97] will-change-transform"
      disabled={!hasStock}
      style={{
        cursor: hasStock ? 'pointer' : 'not-allowed',
      }}
    >
      {/* Animated background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/8 group-hover:via-primary/15 group-hover:to-primary/8 transition-all duration-700 ease-out" />
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute -inset-full top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
      </div>
      
      {/* Glow effect on hover */}
      <div className="absolute -inset-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 rounded-2xl" />
      
      <div className="relative z-10">
        {/* Icon with better animations */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center text-4xl sm:text-5xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 ease-out overflow-hidden shadow-lg group-hover:shadow-primary/50 relative">
          {/* Icon glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-500 blur-md" />
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
        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-foreground group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500 line-clamp-2">
          {category.name}
        </h3>
        
        {/* Enhanced Stock Badge */}
        <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-500 ${
          hasStock 
            ? "bg-green-500/10 text-green-400 border border-green-500/30 group-hover:bg-green-500/25 group-hover:border-green-500/70 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-green-500/20" 
            : "bg-red-500/10 text-red-400 border border-red-500/30 opacity-60"
        }`}>
          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${
            hasStock ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`} />
          <span className="whitespace-nowrap">
            {category.stock || 0} in stock
          </span>
        </div>
        
        {/* Click indicator */}
        {hasStock && (
          <div className="mt-2 sm:mt-3 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-1 flex items-center justify-center gap-1">
            <span>Click to generate</span>
            <span className="group-hover:translate-x-1 transition-transform duration-500">→</span>
          </div>
        )}
      </div>
    </button>
  );
};
