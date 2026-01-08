import React from 'react';

const LineWithDiamondDivider = () => {
  return (
    <div className="bg-white py-8">
      <div className="container mx-auto px-6 md:px-12">
        {/* Elegant Gradient Divider with Diamond */}
        <div className="flex items-center justify-center">
          <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-stone-200" />
          <div className="mx-6">
            <div className="w-1.5 h-1.5 rotate-45 border border-stone-300" />
          </div>
          <div className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-stone-200" />
        </div>
      </div>
    </div>
  );
};

export default LineWithDiamondDivider;
