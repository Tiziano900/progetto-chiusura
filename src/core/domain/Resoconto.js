/**
 * Modello di dominio per la chiusura
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
    agente2,
    pattuglia = "",
    data = "",
    turno = ""
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
    this.pattuglia = pattuglia;
    this.data = data;
    this.turno = turno;
    this._testoChiusura = "";
  }

  formattaChiusura() {
    // Formato: [CHIUSURA PATTUGLIA TT1 DEL 2025-03-24 MATINO]
    const intestazione = `[CHIUSURA PATTUGLIA ${this.pattuglia ? this.pattuglia : ""} DEL ${this.data ? this.data : ""} ${this.turno ? this.turno : ""}]:`;
    
    // Costruisce la sezione dati generali solo con campi non vuoti
    const datiPersone = this.persone && this.persone !== "00" ? `PERSONE_${this.persone}` : "";
    const datiVeicoli = this.veicoli && this.veicoli !== "00" ? `VEICOLI_${this.veicoli}` : "";
    const datiSanzioni = this.sanzioniCds && this.sanzioniCds !== "00" ? `SANZIONI_CDS_${this.sanzioniCds}` : "";
    const datiExtra = this.extraCds && this.extraCds !== "00" ? `EXTRA_CDS_${this.extraCds}` : "";
    
    // Filtra i campi vuoti e unisce quelli rimasti
    const partiDatiGenerali = [datiPersone, datiVeicoli, datiSanzioni, datiExtra].filter(Boolean);
    const datiGenerali = partiDatiGenerali.length > 0 ? `${intestazione} ${partiDatiGenerali.join(" - ")}` : intestazione;
    
    // Verifica se i dati veicolo sono vuoti
    const kmInizialiVuoto = !this.kmIniziali || this.kmIniziali === "0";
    const kmFinaliVuoto = !this.kmFinali || this.kmFinali === "0";
    
    // Costruisce la sezione veicolo solo se almeno uno dei campi non è vuoto
    let datiVeicolo = "";
    if (!kmInizialiVuoto || !kmFinaliVuoto) {
      const partiVeicolo = [];
      if (!kmInizialiVuoto) partiVeicolo.push(`KM_INIZIALI_${this.kmIniziali}`);
      if (!kmFinaliVuoto) partiVeicolo.push(`KM_FINALI_${this.kmFinali}`);
      
      datiVeicolo = `[VEICOLO_${this.veicoloId}]: ${partiVeicolo.join(" - ")}`;
    }
    
    const formattaAgente = (agente, index) => {
      if (!agente) return '';
      
      const partiAgente = [];
      if (agente.radio && agente.radio !== "00") partiAgente.push(`RADIO_${agente.radio}`);
      if (agente.palmare && agente.palmare !== "00") partiAgente.push(`PALMARE_${agente.palmare}`);
      if (agente.bodycam && agente.bodycam !== "00000") partiAgente.push(`BODYCAM_${agente.bodycam}`);
      
      if (partiAgente.length === 0) return '';
      
      // Includi l'agente anche se la matricola è "00"
      const matricola = agente.matricola || "00";
      return `[MATRICOLA_${matricola}]: ${partiAgente.join(" - ")}`;
    };

    // Raccogli dati di tutti gli agenti, anche quelli con matricola "00"
    const agenti = [
      formattaAgente(this.agente1, 0),
      formattaAgente(this.agente2, 1)
    ].filter(Boolean);

    // Unisce tutte le parti con il separatore specificato
    const parti = [datiGenerali];
    if (datiVeicolo) parti.push(datiVeicolo);
    parti.push(...agenti);
    
    return parti.join(" || ");
  }

  calcolaKmPercorsi() {
    return parseInt(this.kmFinali) - parseInt(this.kmIniziali);
  }

  // Getter e setter per testoChiusura
  get testoChiusura() {
    return this._testoChiusura;
  }
  
  set testoChiusura(testo) {
    this._testoChiusura = testo;
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