import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '#/hooks/useAuth';
import { signOutFn, clearAuthCache } from '#/server/auth';
import { useIdleTimeout } from '#/hooks/useIdleTimeout';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '#/components/ui/dialog';
import { Button } from '#/components/ui/button';

export function SessionTimeoutModal() {
  const { user, setUserState, refreshAuth } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const timeoutMs = 30 * 60 * 1000;
  const warningMs = 25 * 60 * 1000;

  const handleSignOut = useCallback(async () => {
    setOpen(false);
    clearAuthCache();
    setUserState(null, null);
    await signOutFn();
    await refreshAuth();
    await router.invalidate();
    toast.success('Session expired due to inactivity');
    router.navigate({ to: '/auth/sign-in' });
  }, [router, setUserState, refreshAuth]);

  const { resetTimer } = useIdleTimeout({
    timeoutMs,
    warningMs,
    enabled: !!user,
    onWarning: () => {
      setOpen(true);
      setTimeLeft(Math.floor((timeoutMs - warningMs) / 1000));
    },
    onTimeout: () => {
      handleSignOut();
    },
  });

  useEffect(() => {
    if (!open) return;

    if (timeLeft <= 0) {
      handleSignOut();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [open, timeLeft, handleSignOut]);

  const handleStaySignedIn = () => {
    setOpen(false);
    resetTimer();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // If user dismisses the dialog (clicks outside or hits escape), treat as stay signed in
      if (!isOpen) handleStaySignedIn();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Clock className="w-5 h-5" />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription>
            Your session will expire due to inactivity. Would you like to stay signed in?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className="text-4xl font-bold tabular-nums text-foreground">
            {formatTime(timeLeft)}
          </div>
        </div>

        <DialogFooter className="sm:justify-between flex-row gap-2">
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out Now
          </Button>
          <Button
            variant="default"
            className="w-full"
            onClick={handleStaySignedIn}
          >
            Stay Signed In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
