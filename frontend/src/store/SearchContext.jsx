import { createContext, useContext, useState } from 'react'

const SearchContext = createContext(null)

export function SearchProvider({ children }) {
  const [tripType, setTripType] = useState('round')

  return (
    <SearchContext.Provider value={{ tripType, setTripType }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  return useContext(SearchContext)
}
