import React from 'react';
import ResocontoGenerator from './ResocontoGenerator';
import ResocontoService from '../../../application/ResocontoService';
import LocalStorageResocontoRepository from '../../repositories/LocalStorageResocontoRepository';

// Inizializzazione delle dipendenze (wiring)
const repository = new LocalStorageResocontoRepository();
const service = new ResocontoService(repository);

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold">GENERATORE CHIUSURE</h1>
        </div>
      </nav>

      <main className="container mx-auto py-8 px-4">
        <ResocontoGenerator resocontoService={service} />
      </main>

      <footer className="mt-12 py-6 bg-gray-100 border-t">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Generatore Chiusure</p>
        </div>
      </footer>
    </div>
  );
}

export default App; 