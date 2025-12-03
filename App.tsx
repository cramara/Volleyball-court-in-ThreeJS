
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
        <p className="text-xs md:text-sm text-gray-400 mt-1">
          Press <kbd className="px-1 py-0.5 bg-gray-800 rounded">V</kbd> to toggle first-person view. 
          Left/Right arrows or keys 1-9 to switch players. 
          In first-person view, move the mouse to look around (click on the canvas if needed).
        </p>
      </header>
      <VolleyballCourt />
    </div>
  );
};

export default App;
