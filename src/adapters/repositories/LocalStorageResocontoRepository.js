import ResocontoRepository from '../../core/ports/ResocontoRepository';
import { Resoconto, Agente } from '../../core/domain/Resoconto';

/**
 * Implementazione del repository del resoconto utilizzando localStorage
 */
export default class LocalStorageResocontoRepository extends ResocontoRepository {
  constructor() {
    super();
    this.STORAGE_KEY = 'resoconti';
  }

  salvaResoconto(resoconto) {
    const resocontiSalvati = this.caricaResoconti();
    const nuoviResoconti = [...resocontiSalvati, this._serializzaResoconto(resoconto)];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(nuoviResoconti));
    return true;
  }

  caricaResoconti() {
    const resocontiJson = localStorage.getItem(this.STORAGE_KEY);
    if (!resocontiJson) {
      return [];
    }
    try {
      const resocontiSalvati = JSON.parse(resocontiJson);
      return resocontiSalvati.map(this._deserializzaResoconto);
    } catch (e) {
      console.error('Errore nel caricamento dei resoconti:', e);
      return [];
    }
  }

  caricaResocontoRecente() {
    const resoconti = this.caricaResoconti();
    if (resoconti.length === 0) {
      return null;
    }
    return resoconti[resoconti.length - 1];
  }

  _serializzaResoconto(resoconto) {
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
      dataCreazione: new Date().toISOString()
    };
  }

  _deserializzaResoconto(resocontoData) {
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

    return new Resoconto(
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
  }
} 