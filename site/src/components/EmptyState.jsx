// Empty gallery state — shown when all phase sections are empty after filtering (UI-SPEC §5.8).
// Hebrew copy per UI-SPEC §6 copywriting contract.
export default function EmptyState() {
  return (
    <div className="py-24 text-center text-stone-400 text-lg">
      אין תמונות התואמות לסינון הנוכחי
    </div>
  );
}
