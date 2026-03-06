export function CreatorCard({ creator, isPreview = false }) {
  return (
    <article
      className={`overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-card transition-all duration-300 ${
        isPreview
          ? 'shadow-[0_16px_40px_rgba(15,23,42,0.12)]'
          : 'shadow-[0_24px_55px_rgba(15,23,42,0.14)]'
      }`}
      style={{ borderTopColor: creator.accentColor, borderTopWidth: 4 }}
    >
      <div className={`${isPreview ? 'h-40 sm:h-44' : 'h-52 sm:h-60'} relative overflow-hidden bg-gray-100`}>
        <img
          src={creator.courseImage}
          alt={creator.title}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/80">Featured Creator Program</p>
          <h3 className={`${isPreview ? 'text-xl' : 'text-2xl sm:text-[1.9rem]'} mt-1 font-bold text-white`}>
            {creator.title}
          </h3>
        </div>
      </div>

      <div className={`${isPreview ? 'p-4' : 'p-5 sm:p-6'}`}>
        <div className="flex items-center gap-3">
          <img
            src={creator.creatorAvatar}
            alt={creator.creatorName}
            className={`${isPreview ? 'h-10 w-10' : 'h-12 w-12'} rounded-full border border-gray-200 object-cover`}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{creator.creatorName}</p>
            <p className="text-xs text-gray-500">Creator</p>
          </div>
        </div>

        <p className={`${isPreview ? 'text-sm line-clamp-2' : 'text-[15px]'} mt-4 text-gray-700 leading-relaxed`}>
          {creator.subtitle}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {creator.highlights.map((highlight) => (
            <span
              key={`${creator.id}-${highlight}`}
              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600"
            >
              {highlight}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
