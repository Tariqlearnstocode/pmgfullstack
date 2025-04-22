import { createContext, useContext, ReactNode } from 'react';
import * as api from '../lib/api';

// Create context for API services
export const ApiContext = createContext<typeof api | undefined>(undefined);

// Provider component
export const ApiProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ApiContext.Provider value={api}>
      {children}
    </ApiContext.Provider>
  );
};

// Hook for using the API services
export const useApiServices = () => {
  const context = useContext(ApiContext);
  
  if (context === undefined) {
    throw new Error('useApiServices must be used within an ApiProvider');
  }
  
  return context;
};
