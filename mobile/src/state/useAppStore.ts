import { create } from 'zustand';
import { Domain, DOMAINS } from '../config/domains';

export type UploadState = 'idle' | 'selecting' | 'uploading' | 'success' | 'error';

export interface AppState {
  domains: Domain[];
  selectedDomain: Domain | null;
  credits: number;
  uploadState: UploadState;
  selectedImageUri: string | null;
  lastResponse: Record<string, unknown> | null;
  error: string | null;
  actions: {
    selectDomain: (domain: Domain) => void;
    setCredits: (credits: number) => void;
    setUploadState: (state: UploadState) => void;
    setSelectedImageUri: (uri: string | null) => void;
    setResponse: (response: Record<string, unknown> | null) => void;
    setError: (message: string | null) => void;
    resetFlow: () => void;
  };
}

export const useAppStore = create<AppState>((set) => ({
  domains: DOMAINS,
  selectedDomain: null,
  credits: 10,
  uploadState: 'idle',
  selectedImageUri: null,
  lastResponse: null,
  error: null,
  actions: {
    selectDomain: (domain) =>
      set({ selectedDomain: domain, uploadState: 'idle', selectedImageUri: null, lastResponse: null, error: null }),
    setCredits: (credits) => set({ credits }),
    setUploadState: (state) => set({ uploadState: state }),
    setSelectedImageUri: (uri) => set({ selectedImageUri: uri }),
    setResponse: (response) => set({ lastResponse: response }),
    setError: (message) => set({ error: message }),
    resetFlow: () =>
      set({ uploadState: 'idle', selectedImageUri: null, lastResponse: null, error: null })
  }
}));
