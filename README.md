# Generatore di Resoconti

Un'applicazione web per generare e salvare resoconti formattati, sviluppata con React e struttura esagonale (Hexagonal Architecture).

## Caratteristiche

- Generazione di resoconti formattati
- Copia del testo negli appunti
- Salvataggio dei resoconti in localStorage
- Visualizzazione delle statistiche globali
- Calcolo automatico dei chilometri percorsi

## Architettura esagonale

Il progetto è strutturato secondo l'architettura esagonale (o ports and adapters):

- **Core/Domain**: Contiene la logica di business e le entità del dominio
- **Core/Ports**: Interfacce per comunicare con il mondo esterno
- **Adapters**: Implementazioni concrete delle porte
- **Application**: Servizi che orchestrano la logica di business

## Come iniziare

1. Clona il repository
2. Installa le dipendenze con `npm install`
3. Avvia l'applicazione con `npm start`

## Tecnologie utilizzate

- React
- TailwindCSS
- Architettura esagonale (Hexagonal Architecture) # progetto-chiusura
