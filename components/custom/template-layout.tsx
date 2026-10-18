import { Providers } from './providers';
import { DerivWSProvider } from './deriv-ws-provider';
import { Toaster } from '@/components/ui/sonner';
import ViewportScaler from './ViewportScaler';
import { EnvCheck } from './env-check';
import { SplashScreen } from './splash-screen';

/**
 * Shared layout wrapper for all template apps.
 *
 * Composes theme provider, mobile viewport scaling, and toast notifications
 * in a single import. Template `app/layout.tsx` files should wrap their
 * children with this component instead of manually composing these pieces.
 */
export function TemplateLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <DerivWSProvider>
        <SplashScreen>
          <ViewportScaler>{children}</ViewportScaler>
        </SplashScreen>
      </DerivWSProvider>
      <Toaster position="top-right" />
      <EnvCheck />
    </Providers>
  );
}
