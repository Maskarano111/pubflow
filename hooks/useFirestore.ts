import { useState, useEffect } from 'react';
import { useDb } from '../context/FirebaseContext';
import { collection, query, onSnapshot, orderBy, Query } from 'firebase/firestore';

type OrderByOptions = {
  field: string;
  direction: 'asc' | 'desc';
};

export const useCollection = <T>(collectionName: string, orderByOptions?: OrderByOptions) => {
  const db = useDb(); // Get DB instance from context
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // The effect will re-run if db instance changes, though it shouldn't.
    if (!db) return; 

    try {
      let q: Query = collection(db, collectionName);
      
      if (orderByOptions) {
        q = query(q, orderBy(orderByOptions.field, orderByOptions.direction));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const results: T[] = [];
        snapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as unknown as T);
        });
        setData(results);
        setLoading(false);
      }, (err) => {
        console.error(`Error fetching collection ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      });

      return () => unsubscribe();

    } catch (err) {
      console.error(`Error setting up listener for ${collectionName}:`, err);
      setError(err as Error);
      setLoading(false);
    }
  }, [db, collectionName, orderByOptions?.field, orderByOptions?.direction]);

  return { data, loading, error };
};
