import type { QuickPickItem, Uri } from 'vscode'
import { QuickPickItemKind, window } from 'vscode'
import type { Template } from './templates'
import { logger } from './utils'

export function duplicateUri(uri: Uri, templates: Template[] = []) {
  const suggestedOptions: QuickPickItem[] = templates?.map((template) => {
    const match = uri.path.match(template.regex)
    if (!match)
      return undefined

    return {
      label: template.label,
      description: template.replacement,
      detail: match[0],
    }
  }).filter(Boolean) as QuickPickItem[]

  if (suggestedOptions.length > 0) {
    suggestedOptions.push({ label: 'Templates above', kind: QuickPickItemKind.Separator })
  }
  suggestedOptions.push({
    label: 'Custom filename',
    alwaysShow: true,
  })

  const quickPick = window.createQuickPick()
  quickPick.items = suggestedOptions
  quickPick.placeholder = 'Select a filename or type a custom filename to use'
  quickPick.matchOnDescription = true
  quickPick.matchOnDetail = true
  quickPick.show()

  quickPick.onDidAccept(() => {
    const selected = quickPick.selectedItems[0]
    logger.info('Seleted:', JSON.stringify(selected))
    quickPick.hide()
  })

  quickPick.onDidHide(() => {
    quickPick.dispose()
  })
}
