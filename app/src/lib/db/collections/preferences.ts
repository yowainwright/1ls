import { localStorageCollectionOptions } from '@tanstack/db-collections'
import type { Preference } from '../types'

export const preferencesCollectionOptions = localStorageCollectionOptions<Preference>({
  storageKey: '1ls-preferences',
  getKey: (item: Preference) => item.id,
})
