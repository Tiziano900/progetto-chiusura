import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const ResocontoGenerator = ({ resocontoService }) => {
  const MAX_AGENTI = 5;
  
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
  const [resocontoText, setResocontoText] = useState("");
  const formRef = useRef(null);

  // Carica i dati dal resoconto più recente se disponibile
  useEffect(() => {
    const resocontoRecente = resocontoService.ottieniResocontoRecente();
    if (resocontoRecente) {
      setValues({
        persone: resocontoRecente.persone,
        veicoli: resocontoRecente.veicoli,
        sanzioniCds: resocontoRecente.sanzioniCds,
        extraCds: resocontoRecente.extraCds,
        veicoloId: resocontoRecente.veicoloId,
        kmIniziali: resocontoRecente.kmIniziali,
        kmFinali: resocontoRecente.kmFinali,
        agenti: [
          {
            matricola: resocontoRecente.agente1.matricola,
            radio: resocontoRecente.agente1.radio,
            palmare: resocontoRecente.agente1.palmare,
            bodycam: resocontoRecente.agente1.bodycam
          },
          {
            matricola: resocontoRecente.agente2.matricola,
            radio: resocontoRecente.agente2.radio,
            palmare: resocontoRecente.agente2.palmare,
            bodycam: resocontoRecente.agente2.bodycam
          }
        ]
      });
    }
  }, [resocontoService]);

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
        matricola: form.querySelector(`[name="agente${index}_matricola"]`).value || "00",
        radio: form.querySelector(`[name="agente${index}_radio"]`).value || "00",
        palmare: form.querySelector(`[name="agente${index}_palmare"]`).value || "00",
        bodycam: form.querySelector(`[name="agente${index}_bodycam"]`).value || "00000"
      }))
    };

    setValues(nuoviValori);
    return nuoviValori;
  }, [values.agenti.length]);

  const generaResoconto = useCallback(() => {
    const valoriAttuali = raccogliValori();
    const resoconto = resocontoService.creaResoconto({
      ...valoriAttuali,
      agente1: valoriAttuali.agenti[0] || createDefaultAgent(0),
      agente2: valoriAttuali.agenti[1] || createDefaultAgent(1)
    });
    const nuovoTesto = resoconto.formattaResoconto();
    setResocontoText(nuovoTesto);
    return nuovoTesto;
  }, [raccogliValori, resocontoService]);

  const copyToClipboard = useCallback(() => {
    const testo = generaResoconto();
    navigator.clipboard.writeText(testo);
    // Salva il resoconto automaticamente
    const valoriAttuali = raccogliValori();
    resocontoService.salvaResoconto({
      ...valoriAttuali,
      agente1: valoriAttuali.agenti[0] || createDefaultAgent(0),
      agente2: valoriAttuali.agenti[1] || createDefaultAgent(1)
    });
    setNotification("Testo generato, copiato e salvato!");
    setTimeout(() => setNotification(""), 2000);
  }, [generaResoconto, raccogliValori, resocontoService]);

  const kmPercorsi = useMemo(() => {
    const resoconto = resocontoService.creaResoconto({
      ...values,
      agente1: values.agenti[0] || createDefaultAgent(0),
      agente2: values.agenti[1] || createDefaultAgent(1)
    });
    return resoconto.calcolaKmPercorsi();
  }, [values, resocontoService]);

  const InputField = React.memo(({ label, field, defaultValue }) => (
    <div className="flex flex-col mb-2">
      <label className="text-sm text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        name={field}
        defaultValue={defaultValue}
        className="border rounded p-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  ));

  const AgentField = React.memo(({ index }) => {
    const agente = values.agenti[index];
    const isFirstOrSecond = index < 2;
    
    return (
      <div className="border p-4 rounded-lg lg:col-span-2 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold">{`${index + 1}° Agente - Matr.`}</h3>
            <input
              type="text"
              name={`agente${index}_matricola`}
              defaultValue={agente.matricola}
              className="border rounded p-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col mb-2">
            <label className="text-sm text-gray-600 mb-1">RADIO</label>
            <input
              type="text"
              name={`agente${index}_radio`}
              defaultValue={agente.radio}
              className="border rounded p-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col mb-2">
            <label className="text-sm text-gray-600 mb-1">PALMARE</label>
            <input
              type="text"
              name={`agente${index}_palmare`}
              defaultValue={agente.palmare}
              className="border rounded p-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col mb-2">
            <label className="text-sm text-gray-600 mb-1">BODYCAM</label>
            <input
              type="text"
              name={`agente${index}_bodycam`}
              defaultValue={agente.bodycam}
              className="border rounded p-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  });

  return (
    <form ref={formRef} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md" onSubmit={(e) => e.preventDefault()}>
      {notification && (
        <div className={`px-4 py-2 rounded mb-4 ${
          notification.includes("massimo") || notification.includes("primi due")
            ? "bg-yellow-100 border border-yellow-400 text-yellow-700"
            : "bg-green-100 border border-green-400 text-green-700"
        }`}>
          {notification}
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-2">Anteprima:</h2>
        <p className="font-mono text-sm break-words">{resocontoText}</p>
        <div className="flex gap-2 mt-3">
          <button 
            type="button"
            onClick={copyToClipboard}
            className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600"
          >
            Genera e Copia
          </button>
          <a 
            href="https://laspezia.verbatel.it/newtouch/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600"
          >
            NewTouch
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border p-4 rounded-lg lg:col-span-4">
          <h3 className="font-bold mb-3">Dati Generali</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InputField label="PERSONE" field="persone" defaultValue={values.persone} />
            <InputField label="VEICOLI" field="veicoli" defaultValue={values.veicoli} />
            <InputField label="SANZIONI_CDS" field="sanzioniCds" defaultValue={values.sanzioniCds} />
            <InputField label="EXTRA_CDS" field="extraCds" defaultValue={values.extraCds} />
          </div>
        </div>

        <div className="border p-4 rounded-lg lg:col-span-4">
          <h3 className="font-bold mb-3">Dati Veicolo</h3>
          <div className="flex flex-wrap gap-2">
            <InputField label="VEICOLO ID" field="veicoloId" defaultValue={values.veicoloId} />
            <InputField label="KM_INIZIALI" field="kmIniziali" defaultValue={values.kmIniziali} />
            <InputField label="KM_FINALI" field="kmFinali" defaultValue={values.kmFinali} />
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
    </form>
  );
};

export default ResocontoGenerator; 