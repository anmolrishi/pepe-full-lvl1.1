import React from 'react';

const CallerTable = ({ contacts }) => {
  return (
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
          {contacts.map((contact) => (
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
                {contact.created_at?.toDate ? 
                  new Date(contact.created_at.toDate()).toLocaleString() : 
                  'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CallerTable;