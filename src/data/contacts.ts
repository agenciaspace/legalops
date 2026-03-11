export type ContactStatus =
  | 'identified'
  | 'connected'
  | 'engaged'
  | 'meeting'
  | 'partner';

export const pipelineStages: ContactStatus[] = [
  'identified',
  'connected',
  'engaged',
  'meeting',
  'partner',
];

export interface Contact {
  id: string;
  name: string;
  company: string;
  status: ContactStatus;
  score: number;
  sector: string;
}

export const initialContacts: Contact[] = [
  { id: '1', name: 'Maria Silva', company: 'TechCorp', status: 'identified', score: 7, sector: 'Technology' },
  { id: '2', name: 'João Santos', company: 'FinBank', status: 'identified', score: 5, sector: 'Finance' },
  { id: '3', name: 'Ana Costa', company: 'MedLife', status: 'connected', score: 8, sector: 'Healthcare' },
  { id: '4', name: 'Carlos Oliveira', company: 'BuildMax', status: 'connected', score: 6, sector: 'Manufacturing' },
  { id: '5', name: 'Paula Rodrigues', company: 'GreenEnergy', status: 'engaged', score: 9, sector: 'Energy' },
  { id: '6', name: 'Ricardo Lima', company: 'UrbanDev', status: 'engaged', score: 7, sector: 'Real Estate' },
  { id: '7', name: 'Fernanda Almeida', company: 'StratCo', status: 'meeting', score: 8, sector: 'Consulting' },
  { id: '8', name: 'Bruno Ferreira', company: 'LexPartners', status: 'partner', score: 10, sector: 'Law' },
];
