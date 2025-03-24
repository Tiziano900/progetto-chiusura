import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, limit, where, getDoc, writeBatch } from "firebase/firestore";
import ResocontoRepository from '../../core/ports/ResocontoRepository';
import { Resoconto, Agente } from '../../core/domain/Resoconto';
import { db } from './FirestoreConfig';

class FirestoreResocontoRepository extends ResocontoRepository {
  constructor() {
    super();
    this.collection = collection(db, "CHIUSURE");
    this.cache = {
      chiusure: null,
      lastFetch: null,
      chiusurePerTurno: {}
    };
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minuti in millisecondi
  }

  // Metodo per verificare la validità della cache
  _isCacheValid() {
    return this.cache.lastFetch && (Date.now() - this.cache.lastFetch) < this.CACHE_TTL;
  }

  // Metodo per invalidare la cache
  _invalidateCache() {
    this.cache.chiusure = null;
    this.cache.lastFetch = null;
    this.cache.chiusurePerTurno = {};
  }

  async salvaChiusura(resoconto, data, turno, pattuglia, currentId = null) {
    try {
      const datiDaSalvare = {
        ...this._serializzaChiusura(resoconto),
        data: data,
        turno: turno,
        pattuglia: pattuglia,
        lastUpdate: new Date()
      };

      if (currentId) {
        // Aggiorna il documento esistente
        const docRef = doc(this.collection, currentId);
        await updateDoc(docRef, datiDaSalvare);
        this._invalidateCache(); // Invalida la cache dopo l'aggiornamento
        return currentId;
      } else {
        // Verifica se esiste già un documento non chiuso per questa data e turno
        const chiaveCache = `${data}_${turno}`;
        let esistente = this.cache.chiusurePerTurno[chiaveCache];
        
        if (!esistente) {
          // Se non è in cache, carica dal database
          const q = query(
            this.collection, 
            where("data", "==", data),
            where("turno", "==", turno),
            where("chiuso", "==", false)
          );
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            esistente = {
              id: doc.id,
              ...this._deserializzaChiusura(doc.data()),
              chiuso: doc.data().chiuso,
              data: doc.data().data,
              turno: doc.data().turno
            };
            // Salva in cache
            this.cache.chiusurePerTurno[chiaveCache] = esistente;
          }
        }

        if (esistente) {
          // Aggiorna il documento esistente
          const docRef = doc(this.collection, esistente.id);
          await updateDoc(docRef, datiDaSalvare);
          this._invalidateCache(); // Invalida la cache dopo l'aggiornamento
          return esistente.id;
        } else {
          // Crea un nuovo documento
          const docRef = await addDoc(this.collection, {
            ...datiDaSalvare,
            chiuso: false,
            timestamp: new Date()
          });
          this._invalidateCache(); // Invalida la cache dopo l'inserimento
          return docRef.id;
        }
      }
    } catch (error) {
      console.error("Errore durante il salvataggio della chiusura:", error);
      throw error;
    }
  }

  async salvaChiusureBatch(chiusure) {
    try {
      const batch = writeBatch(db);
      const ids = [];

      for (const chiusura of chiusure) {
        const { resoconto, data, turno, pattuglia, id } = chiusura;
        const datiDaSalvare = {
          ...this._serializzaChiusura(resoconto),
          data: data,
          turno: turno,
          pattuglia: pattuglia,
          lastUpdate: new Date()
        };

        if (id) {
          // Aggiorna il documento esistente
          const docRef = doc(this.collection, id);
          batch.update(docRef, datiDaSalvare);
          ids.push(id);
        } else {
          // Crea un nuovo documento
          const docRef = doc(this.collection);
          batch.set(docRef, {
            ...datiDaSalvare,
            chiuso: false,
            timestamp: new Date()
          });
          ids.push(docRef.id);
        }
      }

      await batch.commit();
      this._invalidateCache(); // Invalida la cache dopo l'operazione batch
      return ids;
    } catch (error) {
      console.error("Errore durante il salvataggio batch delle chiusure:", error);
      throw error;
    }
  }

  async chiudiTurno(id) {
    try {
      console.log("[FirestoreResocontoRepository] Chiudendo turno con ID:", id);
      const docRef = doc(this.collection, id);
      
      // Verifica che il documento esista prima di tentare di aggiornarlo
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        console.error("[FirestoreResocontoRepository] Documento non trovato per ID:", id);
        throw new Error(`Documento con ID ${id} non trovato`);
      }
      
      console.log("[FirestoreResocontoRepository] Documento trovato, aggiornamento in corso...");
      await updateDoc(docRef, {
        chiuso: true,
        dataChiusura: new Date()
      });
      
      console.log("[FirestoreResocontoRepository] Documento aggiornato con successo, chiuso=true");
      
      // Controlla che l'aggiornamento sia stato effettivamente applicato
      const docSnapAfterUpdate = await getDoc(docRef);
      console.log("[FirestoreResocontoRepository] Stato documento dopo aggiornamento:", 
        docSnapAfterUpdate.data().chiuso ? "Chiuso" : "Non chiuso");
      
      this._invalidateCache(); // Invalida la cache dopo la chiusura
      return true;
    } catch (error) {
      console.error("[FirestoreResocontoRepository] Errore nella chiusura del turno:", error);
      throw error;
    }
  }

  async caricaChiusuraPerTurno(data, turno) {
    try {
      // Verifica se il risultato è in cache
      const chiaveCache = `${data}_${turno}`;
      if (this.cache.chiusurePerTurno[chiaveCache]) {
        return this.cache.chiusurePerTurno[chiaveCache];
      }

      const q = query(
        this.collection, 
        where("data", "==", data),
        where("turno", "==", turno),
        where("chiuso", "==", false)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const risultato = {
        id: doc.id,
        ...this._deserializzaChiusura(doc.data()),
        chiuso: doc.data().chiuso,
        data: doc.data().data,
        turno: doc.data().turno
      };

      // Salva in cache
      this.cache.chiusurePerTurno[chiaveCache] = risultato;
      
      return risultato;
    } catch (error) {
      console.error("Errore durante il caricamento della chiusura per turno:", error);
      throw error;
    }
  }

  async caricaChiusure() {
    try {
      // Verifica se i dati sono già in cache e sono ancora validi
      if (this._isCacheValid() && this.cache.chiusure) {
        return this.cache.chiusure;
      }

      const querySnapshot = await getDocs(this.collection);
      const risultati = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...this._deserializzaChiusura(doc.data()),
        chiuso: doc.data().chiuso,
        data: doc.data().data,
        turno: doc.data().turno
      }));

      // Aggiorna la cache con i risultati e il timestamp
      this.cache.chiusure = risultati;
      this.cache.lastFetch = Date.now();
      
      return risultati;
    } catch (error) {
      console.error("Errore durante il caricamento delle chiusure:", error);
      throw error;
    }
  }

  async caricaChiusuraRecente() {
    try {
      const q = query(this.collection, orderBy("timestamp", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...this._deserializzaChiusura(doc.data()),
        chiuso: doc.data().chiuso,
        data: doc.data().data,
        turno: doc.data().turno
      };
    } catch (error) {
      console.error("Errore durante il caricamento della chiusura recente:", error);
      throw error;
    }
  }

  _serializzaChiusura(resoconto) {
    // Estrae il testo della chiusura se presente
    let testoChiusura = "";
    if (resoconto.testoChiusura) {
      testoChiusura = resoconto.testoChiusura;
    }
    
    return {
      persone: resoconto.persone,
      veicoli: resoconto.veicoli,
      sanzioniCds: resoconto.sanzioniCds,
      extraCds: resoconto.extraCds,
      veicoloId: resoconto.veicoloId,
      kmIniziali: resoconto.kmIniziali,
      kmFinali: resoconto.kmFinali,
      agente1: {
        matricola: resoconto.agente1.matricola,
        radio: resoconto.agente1.radio,
        palmare: resoconto.agente1.palmare,
        bodycam: resoconto.agente1.bodycam
      },
      agente2: {
        matricola: resoconto.agente2.matricola,
        radio: resoconto.agente2.radio,
        palmare: resoconto.agente2.palmare,
        bodycam: resoconto.agente2.bodycam
      },
      testoChiusura: testoChiusura,
      timestamp: new Date(),
      lastUpdate: new Date()
    };
  }

  _deserializzaChiusura(resocontoData) {
    const agente1 = new Agente(
      resocontoData.agente1.matricola,
      resocontoData.agente1.radio,
      resocontoData.agente1.palmare,
      resocontoData.agente1.bodycam
    );

    const agente2 = new Agente(
      resocontoData.agente2.matricola,
      resocontoData.agente2.radio,
      resocontoData.agente2.palmare,
      resocontoData.agente2.bodycam
    );

    const resoconto = new Resoconto(
      resocontoData.persone,
      resocontoData.veicoli,
      resocontoData.sanzioniCds,
      resocontoData.extraCds,
      resocontoData.veicoloId,
      resocontoData.kmIniziali,
      resocontoData.kmFinali,
      agente1,
      agente2
    );
    
    // Aggiungiamo il testo della chiusura se presente
    if (resocontoData.testoChiusura) {
      resoconto.testoChiusura = resocontoData.testoChiusura;
    }
    
    return resoconto;
  }
}

export default FirestoreResocontoRepository; 