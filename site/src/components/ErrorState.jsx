// Error state shown when metadata.json fetch fails (UI-SPEC §5.7).
// Hebrew copy per UI-SPEC §6 copywriting contract.
import { Button } from '@/components/ui/button';

export default function ErrorState({ error }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center" role="alert">
      <div className="text-center space-y-4 p-8 max-w-md">
        <h1 className="text-[22px] font-semibold text-stone-800">
          לא ניתן לטעון את התמונות
        </h1>
        <p className="text-stone-500 text-base">
          אירעה שגיאה בטעינת האלבום. אפשר לנסות לרענן את הדף.
        </p>
        {error?.message && (
          <p className="text-stone-400 text-sm font-mono">{error.message}</p>
        )}
        <Button onClick={() => window.location.reload()}>רענן</Button>
      </div>
    </div>
  );
}
