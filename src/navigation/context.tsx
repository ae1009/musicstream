import React, { createContext, useContext, ReactNode } from 'react';

export interface NavContextType {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  push: (screen: string, params?: any) => void;
  setOptions: (opts: any) => void;
  route: { params: any };
}

const noop = () => {};

export const NavContext = createContext<NavContextType>({
  navigate: noop,
  goBack: noop,
  push: noop,
  setOptions: noop,
  route: { params: {} },
});

export function useNavigation<T = NavContextType>(): T {
  return useContext(NavContext) as unknown as T;
}

export function useRoute() {
  return useContext(NavContext).route;
}
