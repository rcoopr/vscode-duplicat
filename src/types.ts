import type { Stats } from 'node:fs'
import type { ParsedPath } from 'node:path'
import type { Uri } from 'vscode'

export interface UriDetail {
  uri: Uri
  path: ParsedPath
  stats: Stats
}

export interface UriDetailWithReplacement extends UriDetail {
  replacedPath: ParsedPath
}
