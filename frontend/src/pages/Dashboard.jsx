import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [callerData, setCallerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCallers, setExpandedCallers] = useState({});

  useEffect(() => {
    const unsubscribers = [];

    try {
      // Subscribe to each caller's collection
      for (let i = 1; i <= 7; i++) {
        const callerRef = collection(db, `calls`);
        const q = query(callerRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const contacts = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.callerId === `caller${i}`) {
              contacts.push({
                id: doc.id,
                ...data
              });
            }
          });

          setCallerData(prev => {
            const newData = [...(prev || [])];
            newData[i-1] = {
              callerId: `Caller ${i}`,
              contacts
            };
            return newData;
          });
        }, (error) => {
          console.error(`Error in caller${i} subscription:`, error);
          setError(error.message);
        });

        unsubscribers.push(unsubscribe);
      }
    } catch (err) {
      console.error('Error setting up subscriptions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const toggleCaller = (callerId) => {
    setExpandedCallers(prev => ({
      ...prev,
      [callerId]: !prev[callerId]
    }));
  };

  const getCallerStats = (contacts) => {
    const total = contacts.length;
    const dialed = contacts.filter(c => c.dialStatus === 'dialed').length;
    const notDialed = total - dialed;
    return { total, dialed, notDialed };
  };

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
        
        {callerData.map((caller, index) => {
          if (!caller) return null;
          const stats = getCallerStats(caller.contacts);
          
          return (
            <div key={caller.callerId} className="mb-4">
              <button
                onClick={() => toggleCaller(caller.callerId)}
                className="w-full bg-white rounded-lg shadow p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-semibold">{caller.callerId}</h2>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-gray-600">Total: {stats.total}</span>
                    <span className="text-green-600">Dialed: {stats.dialed}</span>
                    <span className="text-yellow-600">Pending: {stats.notDialed}</span>
                  </div>
                </div>
                {expandedCallers[caller.callerId] ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
              
              {expandedCallers[caller.callerId] && (
                <div className="mt-2 bg-white rounded-lg shadow p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left">From Number</th>
                          <th className="px-4 py-2 text-left">To Number</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Created At</th>
                          <th className="px-4 py-2 text-left">Additional Info</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caller.contacts.map((contact) => (
                          <tr key={contact.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{contact.from_number}</td>
                            <td className="px-4 py-2">{contact.to_number}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-sm ${
                                contact.dialStatus === 'dialed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {contact.dialStatus === 'dialed' ? 'Dialed' : 'Not Dialed'}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              {new Date(contact.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  alert(JSON.stringify(contact, null, 2));
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;