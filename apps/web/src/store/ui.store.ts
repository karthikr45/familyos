import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  selectedChildId: string | null;
  toggleSidebar: () => void;
  setSelectedChild: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  selectedChildId: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSelectedChild: (id) => set({ selectedChildId: id }),
}));
