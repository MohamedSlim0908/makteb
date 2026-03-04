export function CategoryFilters({ categories, activeCategory, onCategoryChange }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategoryChange(category.value)}
          className={`h-9 px-3.5 rounded-full border text-sm whitespace-nowrap transition-colors ${
            activeCategory === category.value
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
