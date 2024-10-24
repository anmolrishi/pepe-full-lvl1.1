import React from 'react';
import CallerTable from './CallerTable';

const CallerCard = ({ caller }) => {
  return (
    <div className="mb-8 bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">{caller.callerId}</h2>
      <CallerTable contacts={caller.contacts} />
    </div>
  );
};

export default CallerCard;