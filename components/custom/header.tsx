'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { LANGUAGE_LOCALES } from '@/lib/i18n';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { AppLogo } from '@/components/custom/app-logo';
import type { AuthState, DerivAccount } from '@deriv/core';

interface HeaderProps {
  authState: AuthState;
  accounts: DerivAccount[];
  activeAccount: DerivAccount | null;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;
  onSignUp?: () => Promise<void>;
  logoSrc?: string;
  appName?: string;
  showAppName?: boolean;
  actions?: React.ReactNode;
}

function formatBalance(balance: string, locale: string): string {
  return Number(balance).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function AccountLabel({ type }: { type: 'demo' | 'real' }) {
  return (
    <span
      className={cn(
        'text-[10px] font-medium whitespace-nowrap truncate',
        type === 'demo' ? 'text-orange-500' : 'text-[#722F37]'
      )}
    >
      {type === 'demo' ? 'Demo' : 'Real'}
    </span>
  );
}

function resolveHeaderAppName(appName?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_DERIV_APP_NAME?.trim();
  return appName?.trim() || fromEnv || 'Deriv Trading';
}

function resolveShowAppName(showAppName?: boolean): boolean {
  if (typeof showAppName === 'boolean') return showAppName;
  return process.env.NEXT_PUBLIC_DERIV_SHOW_APP_NAME !== 'false';
}

export function Header({
  authState,
  accounts,
  activeAccount,
  onLogin,
  onLogout,
  onSwitchAccount,
  onSignUp,
  logoSrc,
  appName,
  showAppName,
}: HeaderProps) {
  const { currentLang, localize } = useAppTranslations();
  const numberLocale = LANGUAGE_LOCALES[currentLang];
  const [logoError, setLogoError] = useState(false);
  const resolvedName = resolveHeaderAppName(appName);
  const shouldShowName = resolveShowAppName(showAppName);
  const logoLetter = resolvedName.charAt(0).toUpperCase() || 'D';
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const isAuthenticated = authState === 'authenticated';
  const isAuthenticating = authState === 'authenticating';

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-3 py-1.5 border-b bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2 shrink-0">
        {!logoSrc || logoError ? (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#722F37]/40 bg-white flex items-center justify-center shadow-sm">
            <AppLogo className="w-6 h-6" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#722F37]/40 bg-white flex items-center justify-center shadow-sm">
            <img
              src={logoSrc}
              alt={localize('App Logo')}
              className="h-full w-full object-cover"
              onError={() => setLogoError(true)}
            />
          </div>
        )}
        {shouldShowName && (
          <h1 className="text-xs font-semibold text-foreground truncate max-w-[120px] sm:max-w-none">
            {resolvedName}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isAuthenticated && activeAccount ? (
          <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2 py-0.5 border border-border">
            <Popover open={accountSwitcherOpen} onOpenChange={setAccountSwitcherOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-left cursor-pointer">
                  <div>
                    <AccountLabel type={activeAccount.account_type} />
                    <p className="text-xs font-bold text-foreground">
                      ${formatBalance(activeAccount.balance, numberLocale)}
                    </p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="z-[100] w-52 p-2">
                <div className="space-y-1">
                  {accounts.map((account) => (
                    <button
                      key={account.account_id}
                      onClick={() => {
                        onSwitchAccount(account.account_id);
                        setAccountSwitcherOpen(false);
                      }}
                      className={cn(
                        'w-full text-left rounded-lg px-2.5 py-2 transition-colors text-xs',
                        account.account_id === activeAccount.account_id
                          ? 'bg-muted font-semibold'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <AccountLabel type={account.account_type} />
                      <p className="text-xs font-bold text-foreground">
                        ${formatBalance(account.balance, numberLocale)} {account.currency}
                      </p>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <button
              type="button"
              onClick={onLogout}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onLogin}
              disabled={isAuthenticating}
              className="h-7 px-2.5 text-xs font-semibold"
            >
              {isAuthenticating ? 'Logging in...' : 'Log in'}
            </Button>
            {onSignUp && (
              <Button
                size="sm"
                onClick={onSignUp}
                disabled={isAuthenticating}
                className="h-7 px-2.5 text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-zinc-950 cursor-pointer"
              >
                Sign up
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
