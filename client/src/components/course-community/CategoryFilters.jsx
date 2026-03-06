export function CategoryFilters({ categories, activeCategory, onCategoryChange }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategoryChange(category.value)}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            activeCategory === category.value
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
