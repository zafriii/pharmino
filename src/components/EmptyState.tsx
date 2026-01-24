import React from 'react';

interface EmptyStateProps {
  message?: string; 
}

function EmptyState({ message}: EmptyStateProps) {
  return (
    <div className="text-center py-10">
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

export default EmptyState;
