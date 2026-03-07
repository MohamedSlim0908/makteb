export function RichContent({ content, className = '', preview = false }) {
  if (!content) return null;

  const contentClassName = [
    'rich-content text-sm leading-relaxed text-gray-700',
    '[&_a]:font-medium [&_a]:text-primary-600 [&_a]:underline hover:[&_a]:text-primary-700',
    '[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600',
    '[&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em]',
    '[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900',
    '[&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900',
    '[&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900',
    '[&_hr]:my-4 [&_hr]:border-gray-200',
    '[&_img]:my-4 [&_img]:w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-gray-200 [&_img]:object-cover',
    '[&_li]:mb-1',
    '[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5',
    '[&_p]:mb-3 [&_p:last-child]:mb-0',
    '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-gray-950 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-gray-100',
    '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit',
    '[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5',
    preview ? 'max-h-56 overflow-hidden' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (!preview) {
    return <div className={contentClassName} dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return (
    <div className="relative">
      <div className={contentClassName} dangerouslySetInnerHTML={{ __html: content }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}
