/**
 * A buyer's mark: their uploaded logo, or their initials when there is none.
 *
 * Only the company's own `logo` is ever shown here — never a design image,
 * which belongs to a sample or order.
 */
const SIZES = {
  md: 'h-11 w-11 rounded-xl text-sm',
  lg: 'h-16 w-16 rounded-2xl text-lg',
};

export default function CompanyLogo({ company, size = 'md' }) {
  const box = SIZES[size] ?? SIZES.md;

  if (company?.logo?.url) {
    return (
      <img
        src={company.logo.url}
        alt={`${company.name} logo`}
        className={`${box} shrink-0 bg-white object-contain p-1 ring-1 ring-brand-ink/8`}
      />
    );
  }

  const initials = (company?.name || '?').trim().slice(0, 2).toUpperCase();

  return (
    <span
      aria-hidden
      className={`${box} grid shrink-0 place-items-center bg-brand-pink/12 font-display font-bold text-brand-pink`}
    >
      {initials}
    </span>
  );
}
