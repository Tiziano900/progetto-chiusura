import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const ChiusuraGenerator = ({ chiusuraService }) => {
  const MAX_AGENTI = 5;
  const TURNI = ["MATTINO", "POMERIGGIO", "SERALE"];
  
  // Funzione per determinare il turno in base all'ora corrente (fuso orario Roma)
  const getTurnoPerOraCorrente = () => {
    // Ottiene l'ora corrente nel fuso orario di Roma
    const now = new Date();
    const ore = now.getHours();
    const minuti = now.getMinutes();
    const oraDecimale = ore + minuti / 60;
    
    // Applica la logica dei turni
    if (oraDecimale >= 6 && oraDecimale < 13.33) { // 13.33 = 13:20 in decimale
      return "MATTINO";
    } else if (oraDecimale >= 13.33 && oraDecimale < 19.5) { // 19.5 = 19:30 in decimale
      return "POMERIGGIO";
    } else {
      return "SERALE";
    }
  };

  const createDefaultAgent = (index) => ({
    matricola: "00",
    radio: "00",
    palmare: "00",
    bodycam: "00000"
  });

  const defaultValues = {
    persone: "00",
    veicoli: "00",
    sanzioniCds: "00",
    extraCds: "00",
    veicoloId: "A00",
    kmIniziali: "0",
    kmFinali: "0",
    agenti: [createDefaultAgent(0), createDefaultAgent(1)]
  };

  const [values, setValues] = useState(defaultValues);
  const [notification, setNotification] = useState("");
  const [chiusuraText, setChiusuraText] = useState("");
  const [currentId, setCurrentId] = useState(null);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [turno, setTurno] = useState(getTurnoPerOraCorrente());
  const formRef = useRef(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [pattuglie, setPattuglie] = useState([]);
  const [pattuglia, setPattuglia] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Definisco resetForm prima del suo utilizzo in altri hook
  const resetForm = useCallback(() => {
    if (formRef.current) {
      setValues(defaultValues);
      setChiusuraText("");
      setCurrentId(null);
      formRef.current.reset();
      setShowResetConfirm(false);
      setNotification("Campi resettati con successo!");
      setTimeout(() => setNotification(""), 2000);
    }
  }, []);

  // Funzione per salvare i dati del form in localStorage
  const salvaInCache = useCallback((dati) => {
    try {
      // Se viene passato un currentId nell'oggetto dati, usalo
      const idDaSalvare = dati.currentId || currentId;
      
      localStorage.setItem('chiusuraFormData', JSON.stringify({
        values: dati.currentId ? dati : dati,
        data,
        turno,
        pattuglia,
        currentId: idDaSalvare
      }));
      
      console.log("Dati salvati in cache con ID:", idDaSalvare);
    } catch (error) {
      // Gestione silenziosa degli errori
      console.error("Errore nel salvataggio dei dati in cache:", error);
    }
  }, [data, turno, pattuglia, currentId]);

  // Funzione per caricare i dati del form da localStorage
  const caricaDaCache = useCallback(() => {
    try {
      const datiSalvati = localStorage.getItem('chiusuraFormData');
      if (datiSalvati) {
        const datiParsati = JSON.parse(datiSalvati);
        setValues(datiParsati.values);
        setData(datiParsati.data);
        setTurno(datiParsati.turno);
        // Mantieni il campo pattuglia vuoto se non c'è un dato salvato
        if (datiParsati.pattuglia && datiParsati.pattuglia.trim() !== "") {
          setPattuglia(datiParsati.pattuglia);
        }
        if (datiParsati.currentId) setCurrentId(datiParsati.currentId);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, []);

  // Carica i dati dalla cache all'inizializzazione del componente
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const datiCaricati = caricaDaCache();
        if (!datiCaricati) {
          // Se non ci sono dati in cache, carica dal DB
          try {
            const chiusuraTurno = await chiusuraService.caricaChiusuraPerTurno(data, turno);
            if (chiusuraTurno) {
              setCurrentId(chiusuraTurno.id);
              setValues({
                persone: chiusuraTurno.persone || "00",
                veicoli: chiusuraTurno.veicoli || "00",
                sanzioniCds: chiusuraTurno.sanzioniCds || "00",
                extraCds: chiusuraTurno.extraCds || "00",
                veicoloId: chiusuraTurno.veicoloId || "A00",
                kmIniziali: chiusuraTurno.kmIniziali || "0",
                kmFinali: chiusuraTurno.kmFinali || "0",
                agenti: [
                  {
                    matricola: chiusuraTurno.agente1?.matricola || "00",
                    radio: chiusuraTurno.agente1?.radio || "00",
                    palmare: chiusuraTurno.agente1?.palmare || "00",
                    bodycam: chiusuraTurno.agente1?.bodycam || "00000"
                  },
                  {
                    matricola: chiusuraTurno.agente2?.matricola || "00",
                    radio: chiusuraTurno.agente2?.radio || "00",
                    palmare: chiusuraTurno.agente2?.palmare || "00",
                    bodycam: chiusuraTurno.agente2?.bodycam || "00000"
                  }
                ]
              });
            } else {
              resetForm();
            }
          } catch (error) {
            console.error("Errore nel caricamento della chiusura:", error);
            resetForm();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [chiusuraService, caricaDaCache, resetForm, data, turno]);

  // Carica le pattuglie disponibili
  useEffect(() => {
    const caricaPattuglie = async () => {
      try {
        const pattuglieDaDB = await chiusuraService.ottieniPattuglie();
        setPattuglie(pattuglieDaDB);
      } catch (error) {
        console.error("Errore nel caricamento delle pattuglie:", error);
        setPattuglie([]);
      }
    };

    caricaPattuglie();
  }, [chiusuraService]);

  const aggiungiAgente = useCallback(() => {
    if (values.agenti.length >= MAX_AGENTI) {
      setNotification("Numero massimo di agenti raggiunto!");
      setTimeout(() => setNotification(""), 2000);
      return;
    }
    setValues(prev => ({
      ...prev,
      agenti: [...prev.agenti, createDefaultAgent(prev.agenti.length)]
    }));
  }, [values.agenti.length]);

  const rimuoviAgente = useCallback((index) => {
    if (values.agenti.length <= 2) {
      setNotification("Non è possibile rimuovere i primi due agenti!");
      setTimeout(() => setNotification(""), 2000);
      return;
    }
    setValues(prev => ({
      ...prev,
      agenti: prev.agenti.filter((_, i) => i !== index)
    }));
  }, [values.agenti.length]);

  const raccogliValori = useCallback(() => {
    const form = formRef.current;
    if (!form) return values;

    const nuoviValori = {
      persone: form.querySelector('[name="persone"]').value || "00",
      veicoli: form.querySelector('[name="veicoli"]').value || "00",
      sanzioniCds: form.querySelector('[name="sanzioniCds"]').value || "00",
      extraCds: form.querySelector('[name="extraCds"]').value || "00",
      veicoloId: form.querySelector('[name="veicoloId"]').value || "A00",
      kmIniziali: form.querySelector('[name="kmIniziali"]').value || "0",
      kmFinali: form.querySelector('[name="kmFinali"]').value || "0",
      agenti: values.agenti.map((_, index) => ({
        matricola: form.querySelector(`[name="agenti[${index}].matricola"]`)?.value || form.querySelector(`[name="agente${index}_matricola"]`)?.value || "00",
        radio: form.querySelector(`[name="agenti[${index}].radio"]`)?.value || form.querySelector(`[name="agente${index}_radio"]`)?.value || "00",
        palmare: form.querySelector(`[name="agenti[${index}].palmare"]`)?.value || form.querySelector(`[name="agente${index}_palmare"]`)?.value || "00",
        bodycam: form.querySelector(`[name="agenti[${index}].bodycam"]`)?.value || form.querySelector(`[name="agente${index}_bodycam"]`)?.value || "00000"
      }))
    };

    setValues(nuoviValori);
    return nuoviValori;
  }, [values.agenti]);

  const generaChiusura = useCallback(() => {
    const valoriAttuali = raccogliValori();
    const chiusura = chiusuraService.creaChiusura(
      {
        ...valoriAttuali,
        agente1: valoriAttuali.agenti[0] || createDefaultAgent(0),
        agente2: valoriAttuali.agenti[1] || createDefaultAgent(1)
      },
      data,
      turno,
      pattuglia
    );
    const nuovoTesto = chiusura.formattaChiusura();
    setChiusuraText(nuovoTesto);
    return nuovoTesto;
  }, [raccogliValori, chiusuraService, data, turno, pattuglia]);

  const copyToClipboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const testo = generaChiusura();
      await navigator.clipboard.writeText(testo);
      
      // Salva tutti i valori del form ma non il testo generato
      const valoriAttuali = raccogliValori();
      const datiDaSalvare = {
        ...valoriAttuali,
        agente1: valoriAttuali.agenti[0] || createDefaultAgent(0),
        agente2: valoriAttuali.agenti[1] || createDefaultAgent(1)
      };
      
      // Salva in Firestore e attendi l'ID
      console.log("Salvando chiusura con ID corrente:", currentId);
      const nuovoId = await chiusuraService.salvaChiusura(datiDaSalvare, data, turno, pattuglia, currentId);
      
      if (nuovoId && nuovoId !== currentId) {
        console.log("Nuovo ID assegnato:", nuovoId);
        setCurrentId(nuovoId);
        
        // Aggiorna la cache con il nuovo ID
        salvaInCache({
          ...datiDaSalvare,
          currentId: nuovoId
        });
      } else {
        // Anche se l'ID non è cambiato, aggiorna comunque la cache
        salvaInCache(datiDaSalvare);
      }
      
      setNotification("Testo copiato negli appunti e chiusura salvata!");
      setTimeout(() => setNotification(""), 2000);
    } catch (error) {
      console.error("Errore durante la copia negli appunti o il salvataggio:", error);
      setNotification("Errore durante il salvataggio o la copia. Riprova.");
      setTimeout(() => setNotification(""), 3000);
    } finally {
      setIsLoading(false);
    }
  }, [generaChiusura, raccogliValori, chiusuraService, data, turno, pattuglia, currentId, salvaInCache]);

  const handleChiudiClick = useCallback(() => {
    setShowLockConfirm(true);
  }, []);

  const kmPercorsi = useMemo(() => {
    const chiusura = chiusuraService.creaChiusura({
      ...values,
      agente1: values.agenti[0] || createDefaultAgent(0),
      agente2: values.agenti[1] || createDefaultAgent(1)
    });
    return chiusura.calcolaKmPercorsi();
  }, [values, chiusuraService]);

  const InputField = React.memo(({ label, field, defaultValue }) => {
    // Determina il pattern e il tipo di input in base al campo
    let pattern = null;
    let inputMode = "text";
    let onChange = null;
    
    // Configurazione specifica per ogni tipo di campo
    if (["persone", "veicoli", "sanzioniCds", "extraCds", "kmIniziali", "kmFinali"].includes(field)) {
      pattern = "[0-9]*"; // Solo numeri
      inputMode = "numeric";
      onChange = (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
      };
    } else if (field === "veicoloId") {
      // Per veicolo: deve iniziare con A seguita da numeri
      onChange = (e) => {
        let value = e.target.value;
        // Assicura che inizi sempre con A
        if (!value.startsWith('A')) {
          value = 'A' + value.replace(/[^0-9]/g, '');
        } else {
          // Mantiene la A iniziale e permette solo numeri dopo
          value = 'A' + value.substring(1).replace(/[^0-9]/g, '');
        }
        e.target.value = value;
      };
    }
    
    return (
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input
          type="text"
          name={field}
          defaultValue={defaultValue}
          pattern={pattern}
          inputMode={inputMode}
          onChange={onChange}
          className="mt-1 p-2 w-full border rounded-md"
          onClick={(e) => e.target.select()}
        />
      </div>
    );
  });

  const AgentField = React.memo(({ index }) => {
    const agente = values.agenti[index];
    const isFirstOrSecond = index < 2;
    
    // Validazione per accettare solo numeri
    const handleNumericInput = (e) => {
      const value = e.target.value;
      e.target.value = value.replace(/[^0-9]/g, '');
    };
    
    return (
      <div className="border p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">{`${index + 1}° Agente`}</h3>
          {!isFirstOrSecond && (
            <button
              type="button"
              onClick={() => rimuoviAgente(index)}
              className="text-red-500 hover:text-red-700"
              title="Rimuovi agente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Matricola</label>
            <input
              type="text"
              name={`agente${index}_matricola`}
              defaultValue={agente.matricola}
              pattern="[0-9]*"
              inputMode="numeric"
              onChange={handleNumericInput}
              className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.target.select()}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Radio</label>
            <input
              type="text"
              name={`agente${index}_radio`}
              defaultValue={agente.radio}
              pattern="[0-9]*"
              inputMode="numeric"
              onChange={handleNumericInput}
              className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.target.select()}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Palmare</label>
            <input
              type="text"
              name={`agente${index}_palmare`}
              defaultValue={agente.palmare}
              pattern="[0-9]*"
              inputMode="numeric"
              onChange={handleNumericInput}
              className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.target.select()}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Bodycam</label>
            <input
              type="text"
              name={`agente${index}_bodycam`}
              defaultValue={agente.bodycam}
              pattern="[0-9]*"
              inputMode="numeric"
              onChange={handleNumericInput}
              className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.target.select()}
            />
          </div>
        </div>
      </div>
    );
  });

  const AgentSection = React.memo(({ index, defaultValues }) => {
    // Configurazione per i campi che devono accettare solo numeri
    const numericFieldProps = {
      matricola: {
        pattern: "[0-9]*",
        inputMode: "numeric",
        onChange: (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
      },
      radio: {
        pattern: "[0-9]*",
        inputMode: "numeric",
        onChange: (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
      },
      palmare: {
        pattern: "[0-9]*",
        inputMode: "numeric",
        onChange: (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
      },
      bodycam: {
        pattern: "[0-9]*", 
        inputMode: "numeric",
        onChange: (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }
      }
    };

    return (
      <div className="border p-4 rounded-lg mb-4 bg-white">
        <h3 className="font-bold mb-2">Agente {index + 1}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">Matricola</label>
            <input
              type="text"
              name={`agenti[${index}].matricola`}
              defaultValue={defaultValues?.matricola || "00"}
              pattern={numericFieldProps.matricola.pattern}
              inputMode={numericFieldProps.matricola.inputMode}
              onChange={numericFieldProps.matricola.onChange}
              className="mt-1 p-2 w-full border rounded-md"
              onClick={(e) => e.target.select()}
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">Radio</label>
            <input
              type="text"
              name={`agenti[${index}].radio`}
              defaultValue={defaultValues?.radio || "00"}
              pattern={numericFieldProps.radio.pattern}
              inputMode={numericFieldProps.radio.inputMode}
              onChange={numericFieldProps.radio.onChange}
              className="mt-1 p-2 w-full border rounded-md"
              onClick={(e) => e.target.select()}
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">Palmare</label>
            <input
              type="text"
              name={`agenti[${index}].palmare`}
              defaultValue={defaultValues?.palmare || "00"}
              pattern={numericFieldProps.palmare.pattern}
              inputMode={numericFieldProps.palmare.inputMode}
              onChange={numericFieldProps.palmare.onChange}
              className="mt-1 p-2 w-full border rounded-md"
              onClick={(e) => e.target.select()}
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">Bodycam</label>
            <input
              type="text"
              name={`agenti[${index}].bodycam`}
              defaultValue={defaultValues?.bodycam || "00000"}
              pattern={numericFieldProps.bodycam.pattern}
              inputMode={numericFieldProps.bodycam.inputMode}
              onChange={numericFieldProps.bodycam.onChange}
              className="mt-1 p-2 w-full border rounded-md"
              onClick={(e) => e.target.select()}
            />
          </div>
        </div>
      </div>
    );
  });

  const chiudiTurno = useCallback(async () => {
    try {
      if (!currentId) {
        console.error("Errore: Tentativo di chiudere un turno senza ID valido");
        setNotification("Errore: ID turno non valido o mancante");
        setTimeout(() => setNotification(""), 2000);
        return;
      }
      
      console.log("Chiudendo turno con ID:", currentId);
      
      // Chiudi il turno
      const risultato = await chiusuraService.chiudiTurno(currentId);
      console.log("Risultato chiusura turno:", risultato);
      
      // Rimuovi i dati dalla localStorage
      localStorage.removeItem('chiusuraFormData');
      console.log("Dati rimossi da localStorage");
      
      // Esplicitamente azzera i campi
      setValues(defaultValues);
      setChiusuraText("");
      setCurrentId(null);
      
      // Reset della data all'oggi, pattuglia vuota e turno in base all'ora
      setData(new Date().toISOString().split('T')[0]);
      setPattuglia("");
      setTurno(getTurnoPerOraCorrente());
      
      if (formRef.current) {
        console.log("Reset del form in corso...");
        formRef.current.reset();
      }
      
      setShowLockConfirm(false);
      setNotification("Turno chiuso con successo!");
      setTimeout(() => setNotification(""), 2000);
      
      // Forza un aggiornamento completo della pagina, se necessario
      // window.location.reload();
    } catch (error) {
      console.error("Errore nella chiusura del turno:", error);
      setNotification("Errore nella chiusura del turno: " + (error.message || "Errore sconosciuto"));
      setTimeout(() => setNotification(""), 4000);
    }
  }, [currentId, chiusuraService, defaultValues, setData, setPattuglia, setTurno]);

  return (
    <form ref={formRef} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md" onSubmit={(e) => e.preventDefault()}>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={(e) => e.target.select()}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Pattuglia</label>
          <input
            type="text"
            value={pattuglia}
            onChange={(e) => setPattuglia(e.target.value)}
            className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={(e) => e.target.select()}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Turno</label>
          <select
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
            className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TURNI.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {notification && (
        <div className={`px-4 py-2 rounded mb-4 ${
          notification.includes("Errore")
            ? "bg-red-100 border border-red-400 text-red-700"
            : "bg-green-100 border border-green-400 text-green-700"
        }`}>
          {notification}
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">Anteprima:</h2>
        <pre className="font-mono text-sm break-words whitespace-pre-wrap">{chiusuraText}</pre>
        <div className="flex gap-2 mt-3 items-center">
          <button 
            type="button"
            onClick={copyToClipboard}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Genera
          </button>
          <a 
            href="https://laspezia.verbatel.it/newtouch/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            NewTouch
          </a>
          <button
            type="button"
            onClick={handleChiudiClick}
            className="bg-red-500 text-white py-2 px-5 rounded hover:bg-red-600 flex items-center justify-center"
            title="Chiudi turno"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Chiudi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="border p-4 rounded-lg">
          <h3 className="font-bold mb-3">Dati Generali</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InputField label="PERSONE" field="persone" defaultValue={values.persone} />
            <InputField label="VEICOLI" field="veicoli" defaultValue={values.veicoli} />
            <InputField label="SANZIONI CDS" field="sanzioniCds" defaultValue={values.sanzioniCds} />
            <InputField label="EXTRA CDS" field="extraCds" defaultValue={values.extraCds} />
          </div>
        </div>

        <div className="border p-4 rounded-lg">
          <h3 className="font-bold mb-3">Dati Veicolo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="VEICOLO" field="veicoloId" defaultValue={values.veicoloId} />
            <InputField label="KM INIZIALI" field="kmIniziali" defaultValue={values.kmIniziali} />
            <InputField label="KM FINALI" field="kmFinali" defaultValue={values.kmFinali} />
          </div>
          {kmPercorsi > 0 && (
            <div className="mt-3 bg-blue-50 p-2 rounded">
              <p className="text-sm">KM percorsi: <span className="font-bold">{kmPercorsi}</span></p>
            </div>
          )}
        </div>

        {values.agenti.map((_, index) => (
          <AgentField key={index} index={index} />
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={aggiungiAgente}
          disabled={values.agenti.length >= MAX_AGENTI}
          className={`py-2 px-4 rounded flex items-center gap-2 ${
            values.agenti.length >= MAX_AGENTI
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Aggiungi Agente {values.agenti.length >= MAX_AGENTI ? `(Max ${MAX_AGENTI})` : ""}
        </button>
      </div>

      {showLockConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Conferma Chiusura Turno</h3>
            <div className="text-gray-600 mb-6">
              <p className="mb-2">
                Sei sicuro di voler chiudere questo turno? 
                Questa azione non può essere annullata e comporterà:
              </p>
              <ul className="list-disc ml-5">
                <li>La chiusura definitiva del turno corrente</li>
                <li>Il reset di tutti i campi</li>
                <li>L'impossibilità di modificare ulteriormente questo turno</li>
              </ul>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLockConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={chiudiTurno}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Conferma Chiusura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mostra un indicatore di caricamento quando isLoading è true */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p className="text-lg">Caricamento in corso...</p>
          </div>
        </div>
      )}
    </form>
  );
};

export default ChiusuraGenerator; 