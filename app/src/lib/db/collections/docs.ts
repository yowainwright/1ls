import { localStorageCollectionOptions } from '@tanstack/db-collections'
import type { DocPage } from '../types'

export const docsCollectionOptions = localStorageCollectionOptions<DocPage>({
  storageKey: '1ls-docs',
  getKey: (item: DocPage) => item.id,
})
