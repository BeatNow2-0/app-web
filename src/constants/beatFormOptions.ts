export interface SelectOption {
  value: string;
  label: string;
}

export const instrumentsList: SelectOption[] = [
  { value: 'guitar', label: 'Guitar' },
  { value: 'bass', label: 'Bass' },
  { value: 'flute', label: 'Flute' },
  { value: 'drums', label: 'Drums' },
  { value: 'piano', label: 'Piano' },
  { value: 'synth', label: 'Synth' },
  { value: 'vocals', label: 'Vocals' },
  { value: 'strings', label: 'Strings' },
  { value: 'brass', label: 'Brass' },
  { value: 'harp', label: 'Harp' },
];

export const moodsList: SelectOption[] = [
  { value: 'happy', label: 'Happy' },
  { value: 'sad', label: 'Sad' },
  { value: 'aggressive', label: 'Aggressive' },
  { value: 'calm', label: 'Calm' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'excited', label: 'Excited' },
  { value: 'melancholic', label: 'Melancholic' },
  { value: 'romantic', label: 'Romantic' },
  { value: 'nostalgic', label: 'Nostalgic' },
];

export const genresList: SelectOption[] = [
  { value: 'trap', label: 'Trap' },
  { value: 'hiphop', label: 'Hip-Hop' },
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'reggae', label: 'Reggae' },
  { value: 'rnb', label: 'R&B' },
  { value: 'country', label: 'Country' },
  { value: 'blues', label: 'Blues' },
  { value: 'metal', label: 'Metal' },
];
