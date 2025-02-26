import type { Stats } from 'node:fs'
import { stat } from 'node:fs/promises'
import type { TextDocument, TextEditor } from 'vscode'
import { window, workspace } from 'vscode'

export async function openFile(filepath: string): Promise<TextEditor> {
  const document = await (workspace.openTextDocument(filepath) as Promise<TextDocument>)

  return window.showTextDocument(document)
}

export async function statExists(filepath: string): Promise<Stats | undefined> {
  try {
    return await stat(filepath)
  }
  catch (e) {
    void e
    return undefined
  }
}
