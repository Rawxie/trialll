import { create } from 'zustand';

export interface StartupData {
  fullName: string;
  mobileNumber: string;
  email: string;
  startupIdea: string;
}

interface StartupStore {
  startupData: StartupData | null;
  setStartupData: (data: StartupData) => void;
  clearStartupData: () => void;
  hasStartupData: () => boolean;
  getContextString: () => string;
}

export const useStartupContext = create<StartupStore>((set, get) => ({
  startupData: null,
  
  setStartupData: (data: StartupData) => set({ startupData: data }),
  
  clearStartupData: () => set({ startupData: null }),
  
  hasStartupData: () => Boolean(get().startupData),
  
  getContextString: () => {
    const data = get().startupData;
    if (!data) return '';
    
    return `[User Context - Name: ${data.fullName}, Email: ${data.email}, Mobile: ${data.mobileNumber}. Startup Idea: ${data.startupIdea}]`;
  }
}));