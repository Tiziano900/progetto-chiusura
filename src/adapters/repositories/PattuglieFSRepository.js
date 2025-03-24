import { getFirestore, collection, getDocs } from "firebase/firestore";
import { db } from './FirestoreConfig';

class PattuglieFSRepository {
  constructor() {
    this.collection = collection(db, "pattuglie");
    this.cache = {
      pattuglie: null,
      lastFetch: null
    };
    this.CACHE_TTL = 30 * 60 * 1000; // 30 minuti in millisecondi - più lungo perché le pattuglie cambiano raramente
  }

  // Metodo per verificare la validità della cache
  _isCacheValid() {
    return this.cache.lastFetch && (Date.now() - this.cache.lastFetch) < this.CACHE_TTL;
  }

  // Metodo per invalidare la cache
  _invalidateCache() {
    this.cache.pattuglie = null;
    this.cache.lastFetch = null;
  }

  async caricaPattuglie() {
    try {
      // Verifica se i dati sono già in cache e sono ancora validi
      if (this._isCacheValid() && this.cache.pattuglie) {
        console.log("Restituendo pattuglie dalla cache");
        return this.cache.pattuglie;
      }

      console.log("Caricando pattuglie dal database");
      const querySnapshot = await getDocs(this.collection);
      const risultati = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Aggiorna la cache con i risultati e il timestamp
      this.cache.pattuglie = risultati;
      this.cache.lastFetch = Date.now();
      
      return risultati;
    } catch (error) {
      console.error("Errore nel caricamento delle pattuglie:", error);
      return [];
    }
  }
}

export default PattuglieFSRepository; 