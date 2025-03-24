import { Resoconto, Agente } from '../core/domain/Resoconto';

/**
 * Servizio per la gestione delle chiusure
 */
export default class ResocontoService {
  constructor(resocontoRepository, pattuglieRepository) {
    this.resocontoRepository = resocontoRepository;
    this.pattuglieRepository = pattuglieRepository;
    this.statisticheCache = {
      data: null,
      lastUpdate: null
    };
    this.STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minuti in ms
  }

  creaChiusura(dati, data = "", turno = "", pattuglia = "") {
    const agente1 = dati.agente1 instanceof Agente ? dati.agente1 : new Agente(
      dati.agente1?.matricola || "00",
      dati.agente1?.radio || "00",
      dati.agente1?.palmare || "00",
      dati.agente1?.bodycam || "00000"
    );

    const agente2 = dati.agente2 instanceof Agente ? dati.agente2 : new Agente(
      dati.agente2?.matricola || "00",
      dati.agente2?.radio || "00",
      dati.agente2?.palmare || "00",
      dati.agente2?.bodycam || "00000"
    );

    const resoconto = new Resoconto(
      dati.persone,
      dati.veicoli,
      dati.sanzioniCds,
      dati.extraCds,
      dati.veicoloId,
      dati.kmIniziali,
      dati.kmFinali,
      agente1,
      agente2,
      pattuglia,
      data,
      turno
    );

    return resoconto;
  }

  async salvaChiusura(dati, data, turno, pattuglia, currentId = null) {
    try {
      const resoconto = this.creaChiusura(dati);
      const id = await this.resocontoRepository.salvaChiusura(resoconto, data, turno, pattuglia, currentId);
      this._invalidateStatistiche();
      return id;
    } catch (error) {
      console.error("Errore durante il salvataggio della chiusura:", error);
      throw error;
    }
  }

  async salvaChiusureBatch(chiusure) {
    try {
      const chiusurePreparate = chiusure.map(({ dati, data, turno, pattuglia, id }) => ({
        resoconto: this.creaChiusura(dati),
        data,
        turno,
        pattuglia,
        id
      }));
      
      const ids = await this.resocontoRepository.salvaChiusureBatch(chiusurePreparate);
      this._invalidateStatistiche();
      return ids;
    } catch (error) {
      console.error("Errore durante il salvataggio batch delle chiusure:", error);
      throw error;
    }
  }

  async chiudiTurno(id) {
    try {
      console.log("ResocontoService.chiudiTurno chiamato con id:", id);
      const risultato = await this.resocontoRepository.chiudiTurno(id);
      this._invalidateStatistiche();
      return risultato;
    } catch (error) {
      console.error("Errore durante la chiusura del turno:", error);
      throw error;
    }
  }

  async caricaChiusuraPerTurno(data, turno) {
    try {
      return await this.resocontoRepository.caricaChiusuraPerTurno(data, turno);
    } catch (error) {
      console.error("Errore durante il caricamento della chiusura per turno:", error);
      return null;
    }
  }

  async ottieniChiusuraRecente() {
    try {
      return await this.resocontoRepository.caricaChiusuraRecente();
    } catch (error) {
      console.error("Errore durante il caricamento della chiusura recente:", error);
      return null;
    }
  }

  async ottieniTutteChiusure() {
    try {
      return await this.resocontoRepository.caricaChiusure();
    } catch (error) {
      console.error("Errore durante il caricamento di tutte le chiusure:", error);
      return [];
    }
  }

  async ottieniPattuglie() {
    try {
      return await this.pattuglieRepository.caricaPattuglie();
    } catch (error) {
      console.error("Errore durante il caricamento delle pattuglie:", error);
      return [];
    }
  }

  _invalidateStatistiche() {
    this.statisticheCache = {
      data: null,
      lastUpdate: null
    };
  }

  async ottieniStatistiche() {
    try {
      // Controlla se abbiamo statistiche valide in cache
      if (this.statisticheCache.data && 
          (Date.now() - this.statisticheCache.lastUpdate) < this.STATS_CACHE_TTL) {
        return this.statisticheCache.data;
      }

      const chiusure = await this.ottieniTutteChiusure();
      
      if (!chiusure || chiusure.length === 0) {
        return null;
      }

      const totPersone = chiusure.reduce((sum, r) => sum + parseInt(r.persone || 0), 0);
      const totVeicoli = chiusure.reduce((sum, r) => sum + parseInt(r.veicoli || 0), 0);
      const totSanzioni = chiusure.reduce((sum, r) => sum + parseInt(r.sanzioniCds || 0), 0);
      const totExtra = chiusure.reduce((sum, r) => sum + parseInt(r.extraCds || 0), 0);
      
      const statistiche = {
        totPersone,
        totVeicoli,
        totSanzioni,
        totExtra,
        numChiusure: chiusure.length
      };

      // Aggiorna la cache
      this.statisticheCache = {
        data: statistiche,
        lastUpdate: Date.now()
      };

      return statistiche;
    } catch (error) {
      console.error("Errore durante il calcolo delle statistiche:", error);
      return null;
    }
  }
} 