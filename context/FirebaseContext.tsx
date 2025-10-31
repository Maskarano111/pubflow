import React, { createContext, useContext, ReactNode } from 'react';
import { Firestore } from 'firebase/firestore';

// Define the shape of the context
interface FirebaseContextType {
  db: Firestore | null;
}

// Create the context with a default value of null
const FirebaseContext = createContext<FirebaseContextType>({ db: null });

// Custom hook to easily access the db instance
export const useDb = () => {
  const context = useContext(FirebaseContext);
  if (!context || !context.db) {
    throw new Error("useDb must be used within a FirebaseProvider and after the db has been initialized.");
  }
  return context.db;
};

// Provider component to wrap the application
interface FirebaseProviderProps {
  children: ReactNode;
  db: Firestore;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children, db }) => {
  return (
    <FirebaseContext.Provider value={{ db }}>
      {children}
    </FirebaseContext.Provider>
  );
};
