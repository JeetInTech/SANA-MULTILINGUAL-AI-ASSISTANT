
export enum ButlerState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  SPEAKING = 'SPEAKING',
  THINKING = 'THINKING'
}

export interface TranscriptionEntry {
  text: string;
  role: 'user' | 'butler';
  timestamp: number;
}
