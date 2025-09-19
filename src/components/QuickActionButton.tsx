import { useState } from 'react';
import { Plus, Lightbulb, BarChart3, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCreditSystem } from '@/hooks/useCreditSystem';
const quickActions = [{
  id: 'validate',
  title: 'Bizzy',
  description: 'Business strategist, guides in growth and market expansion',
  icon: Lightbulb,
  path: '/validate',
  color: 'text-blue-400'
}, {
  id: 'research',
  title: 'Artie',
  description: 'Creative designer, assists with visuals and branding',
  icon: BarChart3,
  path: '/market-research',
  color: 'text-green-400'
}, {
  id: 'pmf',
  title: 'Mak',
  description: 'Social media handler, automates posts and generates captions',
  icon: Target,
  path: '/pmf',
  color: 'text-purple-400'
}, {
  id: 'all-in-one',
  title: 'Vira',
  description: 'Virtual Co-Founder, helps in making business decisions',
  icon: Sparkles,
  path: '/',
  color: 'text-primary'
}];
export function QuickActionButton() {
  const [showActions, setShowActions] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    credits,
    isLoggedIn,
    isDemoUser,
    deductCredit,
    showOutOfCreditsModal
  } = useCreditSystem();
  const handleActionSelect = async (action: typeof quickActions[0]) => {
    if (!isLoggedIn && !isDemoUser) {
      // This would need to trigger login modal - for now just return
      return;
    }
    if (credits <= 0) {
      showOutOfCreditsModal();
      return;
    }

    // Only deduct credit if navigating to a different module
    if (action.path !== location.pathname) {
      const success = await deductCredit(`Quick Action: ${action.title}`, action.title);
      if (success) {
        navigate(action.path);
      }
    }
    setShowActions(false);
  };
  return <>
      

      <Dialog open={showActions} onOpenChange={setShowActions}>
        <DialogContent className="max-w-md bg-card border-border mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Quick Actions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {quickActions.map(action => <button key={action.id} onClick={() => handleActionSelect(action)} className="w-full p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors text-left group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
              </button>)}
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Each analysis uses 1 credit • {credits} credits remaining
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>;
}