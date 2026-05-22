import { createContext, useContext, useState } from 'react';

const LayoutContext = createContext({
  navbarRightSlot: null,
  setNavbarRightSlot: () => {}
});

export function LayoutProvider({ children }) {
  const [navbarRightSlot, setNavbarRightSlot] = useState(null);

  return (
    <LayoutContext.Provider value={{ navbarRightSlot, setNavbarRightSlot }}>
      {children}
    </LayoutContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLayout() {
  return useContext(LayoutContext);
}
