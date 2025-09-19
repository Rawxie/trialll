import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useStartupContext, StartupData } from "@/hooks/useStartupContext";
import { toast } from "sonner";

interface StartupFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartupFormModal({ open, onOpenChange }: StartupFormModalProps) {
  const { setStartupData, startupData } = useStartupContext();
  const [formData, setFormData] = useState<StartupData>({
    fullName: startupData?.fullName || '',
    mobileNumber: startupData?.mobileNumber || '',
    email: startupData?.email || '',
    startupIdea: startupData?.startupIdea || ''
  });
  
  const [errors, setErrors] = useState<Partial<StartupData>>({});

  const validateForm = () => {
    const newErrors: Partial<StartupData> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.startupIdea.trim()) {
      newErrors.startupIdea = 'Startup idea is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setStartupData(formData);
    toast.success("Startup details saved! This context will now be used in all your conversations.");
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof StartupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">My Startup</DialogTitle>
          <DialogDescription className="text-text-muted">
            Tell us about your startup. This information will be used as context for all your conversations with our AI agents.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-card-foreground">
              Full Name *
            </Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full name"
              className={`bg-input border-input-border focus:border-input-focus ${
                errors.fullName ? 'border-destructive' : ''
              }`}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mobileNumber" className="text-card-foreground">
              Mobile Number *
            </Label>
            <Input
              id="mobileNumber"
              type="text"
              value={formData.mobileNumber}
              onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
              placeholder="Enter your mobile number"
              className={`bg-input border-input-border focus:border-input-focus ${
                errors.mobileNumber ? 'border-destructive' : ''
              }`}
            />
            {errors.mobileNumber && (
              <p className="text-sm text-destructive">{errors.mobileNumber}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-card-foreground">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              className={`bg-input border-input-border focus:border-input-focus ${
                errors.email ? 'border-destructive' : ''
              }`}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startupIdea" className="text-card-foreground">
              Startup Idea *
            </Label>
            <Textarea
              id="startupIdea"
              value={formData.startupIdea}
              onChange={(e) => handleInputChange('startupIdea', e.target.value)}
              placeholder="Describe your startup idea in detail..."
              rows={4}
              className={`bg-input border-input-border focus:border-input-focus resize-none ${
                errors.startupIdea ? 'border-destructive' : ''
              }`}
            />
            {errors.startupIdea && (
              <p className="text-sm text-destructive">{errors.startupIdea}</p>
            )}
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              Save Details
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}