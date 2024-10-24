import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [callerData, setCallerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribers = [];

    try {
      for (let i = 1; i <= 7; i++) {
        const callerRef = collection(db, `caller${i}`);
        const q = query(callerRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const contacts = [];
          querySnapshot.forEach((doc) => {
            contacts.push({
              id: doc.id,
              ...doc.data()
            });
          });

          setCallerData(prev => {
            const newData = [...(prev || [])];
            newData[i-1] = {
              callerId: `Caller ${i}`,
              contacts
            };
            return newData;
          });
        });

        unsubscribers.push(unsubscribe);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        {callerData.map((caller, index) => (
          caller && (
            <div key={caller.callerId} className="mb-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-4">{caller.callerId}</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2">From Number</th>
                      <th className="px-4 py-2">To Number</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caller.contacts.map((contact) => (
                      <tr key={contact.id} className="border-b">
                        <td className="px-4 py-2">{contact.from_number}</td>
                        <td className="px-4 py-2">{contact.to_number}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            contact.dialed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {contact.dialed ? 'Dialed' : 'Not Dialed'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {contact.created_at?.toDate?.() 
                            ? new Date(contact.created_at.toDate()).toLocaleString() 
                            : new Date(contact.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default Dashboard;