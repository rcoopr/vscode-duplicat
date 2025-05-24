import { parse } from 'node:path'
import { stat } from 'node:fs/promises'
import { useActiveTextEditor } from 'reactive-vscode'
import { Uri, window } from 'vscode'
import { logger } from './utils'
import type { UriDetail } from './types'

export async function gatherUrisToDuplicate(selectedUri?: Uri, allSelectecUris?: Uri[]): Promise<UriDetail[] | undefined> {
  const editor = useActiveTextEditor()
  const uris: Uri[] = allSelectecUris || [selectedUri || editor.value?.document.uri].filter(uri => uri instanceof Uri)
  logger.info(`Duplicate ${(uris.length)} files:`, uris.map(uri => JSON.stringify(uri.path)).join('\n'))

  if (!uris.length) {
    window.showErrorMessage('Nothing selected to duplicate')
    return
  }

  return await Promise.all(uris.map(async (uri) => {
    const path = parse(uri.fsPath)
    const stats = await stat(uri.fsPath)
    return { uri, path, stats }
  }))
}
