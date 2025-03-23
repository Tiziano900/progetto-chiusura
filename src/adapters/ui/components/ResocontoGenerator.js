import React, { useState, useEffect } from 'react';

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

  const handleChange = (field, value, agentIndex = null) => {
    if (agentIndex !== null) {
      const newAgenti = [...values.agenti];
      newAgenti[agentIndex] = { ...newAgenti[agentIndex], [field]: value };
      setValues({ ...values, agenti: newAgenti });
    } else {
      setValues({ ...values, [field]: value });
    }
  };

  const aggiungiAgente = () => {
    if (values.agenti.length >= MAX_AGENTI) {
      setNotification("Numero massimo di agenti raggiunto!");
      setTimeout(() => setNotification(""), 2000);
      return;
    }
    setValues({
      ...values,
      agenti: [...values.agenti, createDefaultAgent(values.agenti.length)]
    });
  };

  const rimuoviAgente = (index) => {
    if (values.agenti.length <= 2) {
      setNotification("Non è possibile rimuovere i primi due agenti!");
      setTimeout(() => setNotification(""), 2000);
      return;
    }
    const newAgenti = values.agenti.filter((_, i) => i !== index);
    setValues({
      ...values,
      agenti: newAgenti
    });
  };

  const resoconto = resocontoService.creaResoconto({
    ...values,
    agente1: values.agenti[0] || createDefaultAgent(0),
    agente2: values.agenti[1] || createDefaultAgent(1)
  });
  const resocontoText = resoconto.formattaResoconto();
  const kmPercorsi = resoconto.calcolaKmPercorsi();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resocontoText);
    setNotification("Testo copiato negli appunti!");
    setTimeout(() => setNotification(""), 2000);
  };

  const salvaResoconto = () => {
    resocontoService.salvaResoconto({
      ...values,
      agente1: values.agenti[0] || createDefaultAgent(0),
      agente2: values.agenti[1] || createDefaultAgent(1)
    });
    setNotification("Resoconto salvato con successo!");
    setTimeout(() => setNotification(""), 2000);
  };

  const InputField = ({ label, field, value }) => (
    <div className="flex flex-col mb-2">
      <label className="text-sm text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(field, e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        className="border rounded p-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  const AgentField = ({ index }) => {
    const agente = values.agenti[index];
    const isFirstOrSecond = index < 2;
    
    return (
      <div className="border p-4 rounded-lg lg:col-span-2 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold">{`${index + 1}° Agente - Matr.`}</h3>
            <input
              type="text"
              value={agente.matricola}
              onChange={(e) => handleChange('matricola', e.target.value, index)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
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
              value={agente.radio}
              onChange={(e) => handleChange('radio', e.target.value, index)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              className="border rounded p-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col mb-2">
            <label className="text-sm text-gray-600 mb-1">PALMARE</label>
            <input
              type="text"
              value={agente.palmare}
              onChange={(e) => handleChange('palmare', e.target.value, index)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              className="border rounded p-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col mb-2">
            <label className="text-sm text-gray-600 mb-1">BODYCAM</label>
            <input
              type="text"
              value={agente.bodycam}
              onChange={(e) => handleChange('bodycam', e.target.value, index)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              className="border rounded p-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
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
            onClick={copyToClipboard}
            className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600"
          >
            Copia negli appunti
          </button>
          <button 
            onClick={salvaResoconto}
            className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600"
          >
            Salva resoconto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border p-4 rounded-lg lg:col-span-4">
          <h3 className="font-bold mb-3">Dati Generali</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InputField label="PERSONE" field="persone" value={values.persone} />
            <InputField label="VEICOLI" field="veicoli" value={values.veicoli} />
            <InputField label="SANZIONI_CDS" field="sanzioniCds" value={values.sanzioniCds} />
            <InputField label="EXTRA_CDS" field="extraCds" value={values.extraCds} />
          </div>
        </div>

        <div className="border p-4 rounded-lg lg:col-span-4">
          <h3 className="font-bold mb-3">Dati Veicolo</h3>
          <div className="flex flex-wrap gap-2">
            <InputField label="VEICOLO ID" field="veicoloId" value={values.veicoloId} />
            <InputField label="KM_INIZIALI" field="kmIniziali" value={values.kmIniziali} />
            <InputField label="KM_FINALI" field="kmFinali" value={values.kmFinali} />
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