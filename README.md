# Generatore di Chiusure

Un'applicazione web per generare e salvare resoconti formattati, sviluppata con React e struttura esagonale (Hexagonal Architecture).

## Caratteristiche

- Generazione di resoconti formattati
- Supporto fino a 5 agenti
- Copia del testo negli appunti
- Salvataggio dei resoconti in localStorage
- Visualizzazione delle statistiche globali
- Calcolo automatico dei chilometri percorsi
- Interfaccia responsive e user-friendly

## Funzionalità

- **Dati Generali**: Gestione di persone, veicoli, sanzioni CDS ed extra CDS
- **Dati Veicolo**: Tracciamento ID veicolo e chilometri percorsi
- **Gestione Agenti**: 
  - Minimo 2 agenti
  - Possibilità di aggiungere fino a 5 agenti
  - Gestione di matricola, radio, palmare e bodycam per ogni agente
  - Rimozione agenti aggiuntivi

## Architettura esagonale

Il progetto è strutturato secondo l'architettura esagonale (o ports and adapters):

- **Core/Domain**: Contiene la logica di business e le entità del dominio
- **Core/Ports**: Interfacce per comunicare con il mondo esterno
- **Adapters**: Implementazioni concrete delle porte
- **Application**: Servizi che orchestrano la logica di business

## Tecnologie utilizzate

- React
- TailwindCSS
- Architettura esagonale (Hexagonal Architecture)
- LocalStorage per la persistenza dei dati

## Come iniziare

1. Clona il repository
```bash
git clone https://github.com/Tiziano900/progetto-chiusura.git
```

2. Installa le dipendenze
```bash
cd progetto-chiusura
npm install
```

3. Avvia l'applicazione in modalità sviluppo
```bash
npm start
```

L'applicazione sarà disponibile all'indirizzo [http://localhost:3000](http://localhost:3000)

## Build per la produzione

Per creare una build ottimizzata per la produzione:

```bash
npm run build
```

I file di build saranno nella cartella `build/`.
