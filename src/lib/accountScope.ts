import { createContext } from 'react'

// Reminder preferences belong to the signed-in account on this browser, not the data snapshot.
export const AccountScope = createContext('guest')
