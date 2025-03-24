/**
 * Modello di dominio per il resoconto
 */
class Resoconto {
  constructor(
    persone,
    veicoli,
    sanzioniCds,
    extraCds,
    veicoloId,
    kmIniziali,
    kmFinali,
    agente1,
    agente2
  ) {
    this.persone = persone;
    this.veicoli = veicoli;
    this.sanzioniCds = sanzioniCds;
    this.extraCds = extraCds;
    this.veicoloId = veicoloId;
    this.kmIniziali = kmIniziali;
    this.kmFinali = kmFinali;
    this.agente1 = agente1;
    this.agente2 = agente2;
  }

  formattaResoconto() {
    const datiGenerali = `[RESOCONTO]: PERSONE_${this.persone} - VEICOLI_${this.veicoli} - SANZIONI_CDS_${this.sanzioniCds} - EXTRA_CDS_${this.extraCds}`;
    const datiVeicolo = `[VEICOLO_${this.veicoloId}]: KM INIZIALI_${this.kmIniziali} - KM_FINALI_${this.kmFinali}`;
    
    const formattaAgente = (agente) => {
      if (!agente || !agente.matricola) return '';
      return `[MATRICOLA_${agente.matricola}]: RADIO_${agente.radio} - PALMARE_${agente.palmare} - BODYCAM_${agente.bodycam}`;
    };

    const agenti = [
      formattaAgente(this.agente1),
      formattaAgente(this.agente2)
    ].filter(Boolean).join(' - ');

    return `${datiGenerali} - ${datiVeicolo} - ${agenti}`;
  }

  calcolaKmPercorsi() {
    return parseInt(this.kmFinali) - parseInt(this.kmIniziali);
  }
}

class Agente {
  constructor(matricola, radio, palmare, bodycam) {
    this.matricola = matricola;
    this.radio = radio;
    this.palmare = palmare;
    this.bodycam = bodycam;
  }
}

export { Resoconto, Agente }; 