
import React from 'react';
import VolleyballCourt from './components/VolleyballCourt';

const App: React.FC = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      <header className="absolute top-0 left-0 w-full p-4 z-10 text-center md:text-left">
        <h1 className="text-2xl md:text-4xl font-bold tracking-wider">
          3D Volleyball Court
        </h1>
        <p className="text-sm md:text-base text-gray-300">
          Drag to rotate, scroll to zoom, right-click to pan.
        </p>
      </header>
      <VolleyballCourt />
    </div>
  );
};

export default App;
