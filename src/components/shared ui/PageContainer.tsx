import React from 'react';

interface PageContainerProps {
  title: string;
  children: React.ReactNode;
}

const PageContainer = ({ title, children }: PageContainerProps) => {
  return (
    <div className="w-full h-full p-0 pt-6 "> 
      <div className="bg-white w-full min-h-[80vh] rounded-2xl p-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {title}
        </h1>       
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
