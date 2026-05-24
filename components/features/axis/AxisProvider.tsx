import * as React from 'react';
import { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';

export type AxisState = 'idle' | 'guiding' | 'action' | 'progression' | 'success' | 'warning' | 'inactive';

export interface AxisAction {
  label: string;
  action: () => void;
  secondaryLabel?: string;
  secondaryAction?: () => void;
  isPremium?: boolean;
}

export type AxisPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center-modal' | 'top-center' | 'smart';

interface AxisContextType {
  axisState: AxisState;
  axisMessage: string | ReactNode | null;
  axisAction: AxisAction | null;
  axisPosition: AxisPosition;
  setAxisState: (state: AxisState) => void;
  triggerAxisMessage: (message: string | ReactNode, state?: AxisState, duration?: number, action?: AxisAction, position?: AxisPosition) => void;
  hideAxis: () => void;
  isVisible: boolean;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isChatUnlocked: boolean;
  setChatUnlocked: (unlocked: boolean) => void;
  isDisabled: boolean;
  setIsDisabled: (disabled: boolean) => void;
}

const AxisContext = createContext<AxisContextType | undefined>(undefined);

export function AxisProvider({ children }: { children: ReactNode }) {
  const [axisState, setAxisState] = useState<AxisState>('inactive');
  const [axisMessage, setAxisMessage] = useState<string | ReactNode | null>(null);
  const [axisAction, setAxisAction] = useState<AxisAction | null>(null);
  const [axisPosition, setAxisPosition] = useState<AxisPosition>('bottom-right');
  const [isVisible, setIsVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatUnlocked, setChatUnlocked] = useState(() => localStorage.getItem('mz_axis_chat_introduced') === 'true');
  const [isDisabled, setIsDisabled] = useState(() => sessionStorage.getItem('mz_axis_disabled') === 'true');

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAxisMessage = useCallback((message: string | ReactNode, state: AxisState = 'guiding', duration = 5000, action?: AxisAction, position: AxisPosition = 'bottom-right') => {
    if (sessionStorage.getItem('mz_axis_disabled') === 'true') return;
    setAxisState(state);
    setAxisMessage(message);
    setAxisAction(action || null);
    setAxisPosition(position);
    setIsVisible(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        setAxisMessage(null);
        setAxisAction(null);
        setAxisState('inactive');
        setIsVisible(false);
      }, duration);
    }
  }, []);

  const hideAxis = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setAxisMessage(null);
    setAxisAction(null);
    setAxisState('inactive');
  }, []);

  const toggleDisabled = useCallback((disabled: boolean) => {
    setIsDisabled(disabled);
    sessionStorage.setItem('mz_axis_disabled', disabled.toString());
    if (disabled) hideAxis();
  }, [hideAxis]);

  return (
    <AxisContext.Provider value={{
      axisState,
      axisMessage,
      axisAction,
      axisPosition,
      setAxisState,
      triggerAxisMessage,
      hideAxis,
      isVisible,
      isChatOpen,
      setIsChatOpen,
      isChatUnlocked,
      setChatUnlocked,
      isDisabled,
      setIsDisabled: toggleDisabled
    }}>
      {children}
    </AxisContext.Provider>
  );
}

export function useAxis() {
  const context = useContext(AxisContext);
  if (context === undefined) {
    throw new Error('useAxis must be used within an AxisProvider');
  }
  return context;
}
