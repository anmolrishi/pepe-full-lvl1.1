import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useCallerData = () => {
  const [callerData, setCallerData] = useState([]);

  useEffect(() => {
    const unsubscribers = [];
    
    for (let i = 1; i <= 7; i++) {
      const callerRef = collection(db, `caller${i}`);
      const unsubscribe = onSnapshot(callerRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCallerData(prev => {
          const newData = [...prev];
          newData[i-1] = {
            callerId: `caller${i}`,
            contacts: data
          };
          return newData;
        });
      }, (error) => {
        console.error(`Error fetching caller${i} data:`, error);
      });
      
      unsubscribers.push(unsubscribe);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  return callerData;
};