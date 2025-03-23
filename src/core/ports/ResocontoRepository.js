/**
 * Interfaccia per il repository del resoconto (port)
 */
export default class ResocontoRepository {
  salvaResoconto(resoconto) {
    throw new Error('Il metodo deve essere implementato');
  }

  caricaResoconti() {
    throw new Error('Il metodo deve essere implementato');
  }

  caricaResocontoRecente() {
    throw new Error('Il metodo deve essere implementato');
  }
} 