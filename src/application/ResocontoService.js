import { Resoconto, Agente } from '../core/domain/Resoconto';

/**
 * Servizio per la gestione dei resoconti
 */
export default class ResocontoService {
  constructor(resocontoRepository) {
    this.resocontoRepository = resocontoRepository;
  }

  creaResoconto(dati) {
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
      agente2
    );

    return resoconto;
  }

  salvaResoconto(dati) {
    const resoconto = this.creaResoconto(dati);
    return this.resocontoRepository.salvaResoconto(resoconto);
  }

  ottieniResocontoRecente() {
    return this.resocontoRepository.caricaResocontoRecente();
  }

  ottieniTuttiResoconti() {
    return this.resocontoRepository.caricaResoconti();
  }

  ottieniStatistiche() {
    const resoconti = this.ottieniTuttiResoconti();
    
    if (resoconti.length === 0) {
      return null;
    }

    const totPersone = resoconti.reduce((sum, r) => sum + parseInt(r.persone || 0), 0);
    const totVeicoli = resoconti.reduce((sum, r) => sum + parseInt(r.veicoli || 0), 0);
    const totSanzioni = resoconti.reduce((sum, r) => sum + parseInt(r.sanzioniCds || 0), 0);
    const totExtra = resoconti.reduce((sum, r) => sum + parseInt(r.extraCds || 0), 0);
    
    return {
      totPersone,
      totVeicoli,
      totSanzioni,
      totExtra,
      numResoconti: resoconti.length
    };
  }
} 