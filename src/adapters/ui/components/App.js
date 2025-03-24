import React, { useMemo } from 'react';
import ResocontoService from '../../../application/ResocontoService';
import FirestoreResocontoRepository from '../../repositories/FirestoreResocontoRepository';
import PattuglieFSRepository from '../../repositories/PattuglieFSRepository';
import ChiusuraGenerator from './ChiusuraGenerator';

function App() {
  // Inizializza le dipendenze una sola volta usando useMemo
  const chiusuraService = useMemo(() => {
    const resocontoRepository = new FirestoreResocontoRepository();
    const pattuglieRepository = new PattuglieFSRepository();
    return new ResocontoService(resocontoRepository, pattuglieRepository);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Generatore di Chiusure</h1>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        <ChiusuraGenerator chiusuraService={chiusuraService} />
      </main>
      <footer className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>©2025 Novecento</p>
        </div>
      </footer>
    </div>
  );
}

export default App; 