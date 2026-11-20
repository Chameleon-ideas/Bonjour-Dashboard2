import { HubProvider } from "@/lib/store";
import { Shell } from "@/components/Shell";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <HubProvider>
      <Shell>{children}</Shell>
    </HubProvider>
  );
}
