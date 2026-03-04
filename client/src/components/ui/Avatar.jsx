const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export function Avatar({ src, name, size = 'md', className = '' }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-white dark:ring-gray-800 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-semibold ring-2 ring-white dark:ring-gray-800 select-none ${className}`}
    >
      {initials}
    </div>
  );
}
