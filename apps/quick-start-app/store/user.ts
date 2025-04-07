/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import type { IUserInfo } from '~types/user.types';

export interface UserState {
  user: IUserInfo | null;
}
export interface UserActions {
  updateUser: (user: IUserInfo | null) => void;
  reset: () => void;
}

// define the initial state
const initialState: UserState = {
  user: null,
};

const useUserStore = create<UserState & UserActions>((set) => ({
  ...initialState,
  updateUser: (user) => set({ user }),
  reset: () => {
    set(initialState);
  },
}));

export default useUserStore;
export { useUserStore };
