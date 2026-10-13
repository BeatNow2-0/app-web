import type { Beat } from '../types/api';
export const licenses: Record<NonNullable<Beat['license_type']>, { label: string; terms: string }> = {
  unavailable: { label: 'Listening only', terms: 'Listening and private writing only. No recording release, redistribution, commercial use or ownership transfer is granted.' },
  free_noncommercial: { label: 'Free · noncommercial', terms: 'You may record vocals and share the resulting song for noncommercial use with credit to the producer. No monetization, resale, standalone beat redistribution or ownership transfer. Contact the producer for commercial permission.' },
  contact: { label: 'Contact producer', terms: 'No recording release or commercial license is granted here. Request permission directly from the producer before using the beat beyond private listening and writing.' },
};
export const licenseFor = (beat: Beat) => licenses[beat.license_type || 'unavailable'] || licenses.unavailable;
