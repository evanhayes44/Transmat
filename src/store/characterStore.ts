import { create } from "zustand";
import type { DestinyCharacter, CharacterState } from "../types/bungie.types";

interface CharacterStore extends CharacterState {
  setCharacters: (characters: Record<string, DestinyCharacter> | null) => void;
  setMembershipType: (membershipType: number | null) => void;
  setDestinyMembershipId: (destinyMembershipId: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  characters: null,
  membershipType: null,
  destinyMembershipId: null,
  isLoading: false,
  error: null,
  setCharacters: (characters) => set({ characters }),
  setMembershipType: (membershipType) => set({ membershipType }),
  setDestinyMembershipId: (destinyMembershipId) => set({ destinyMembershipId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
