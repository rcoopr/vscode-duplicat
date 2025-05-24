import type { ParsedPath } from 'node:path'
import { join, parse } from 'node:path'
import type { QuickPickItem } from 'vscode'
import { QuickPickItemKind, ThemeIcon, window } from 'vscode'
import type { Template } from './templates'
import { logger } from './utils'
import type { UriDetail, UriDetailWithReplacement } from './types'

export function overwrite(filepath: string, isDirectory: boolean) {
  const statType = isDirectory ? 'directory' : 'file'

  return window.showWarningMessage(
    `The ${statType} ${filepath} already exists. Do you want to overwrite the existing ${statType}?`,
    {
      title: 'OK',
      isCloseAffordance: false,
    },
  )
}

export function getQuickpickItems(uri: UriDetail, templates: Template[], matchType: 'first'): QuickPickItem | undefined
export function getQuickpickItems(uri: UriDetail, templates: Template[], matchType: 'all'): QuickPickItem[]
export function getQuickpickItems(uri: UriDetail, templates: Template[], matchType: 'first' | 'all'): QuickPickItem | QuickPickItem[] | undefined {
  const findMatch = (template: Template) => {
    const match = uri.path.base.match(template.regex)
    logger.info('Match:', JSON.stringify(match, null, 2), JSON.stringify(uri.path), 'tested on', template.regex, '\n\n', JSON.stringify({ template }, null, 2))
    return match
  }

  const createQuickPickItem = (template: Template): QuickPickItem => {
    return {
      label: getReplacedFilename(uri.path, template, uri.stats.isDirectory()),
      description: template.label,
      // detail: `${uri.path.replace(path.base, newFilename)}`,
      iconPath: template.icon ? new ThemeIcon(template.icon) : undefined,
    }
  }

  if (matchType === 'first') {
    const match = templates.find(findMatch)
    return match ? createQuickPickItem(match) : undefined
  }

  const items = templates.filter(findMatch).map(createQuickPickItem)
  if (items.length) {
    items.push({ kind: QuickPickItemKind.Separator, label: '' })
  }
  items.push({
    label: 'Custom filename',
    alwaysShow: true,
  })

  return items
}

export async function promptFilenames(
  uriDetails: UriDetail[],
  quickpickItems: QuickPickItem[][],
  templates: Template[],
): Promise<UriDetailWithReplacement[] | undefined> {
  const uriDetailsWithReplacements = uriDetails.slice() as UriDetailWithReplacement[]
  return new Promise<UriDetailWithReplacement[] | undefined>((resolve) => {
    const quickpick = window.createQuickPick()
    if (uriDetails.length > 1)
      quickpick.totalSteps = uriDetailsWithReplacements.length

    let step = 0
    function updateQuickPick() {
      const detail = uriDetailsWithReplacements[step]
      if (uriDetails.length > 1)
        quickpick.step = step + 1

      quickpick.items = quickpickItems[step]
      quickpick.title = `Renaming ${detail.path.base}`
    }

    quickpick.placeholder = 'Select a template or type a custom filename to use instead'
    quickpick.matchOnDescription = true
    quickpick.matchOnDetail = true
    updateQuickPick()

    quickpick.onDidHide(() => {
      logger.info('QuickPick closed')
      quickpick.dispose()
      resolve(undefined)
    })

    quickpick.onDidAccept(() => {
      const detail = uriDetailsWithReplacements[step]
      const selectedItem = quickpick.selectedItems[0]
      const replacedPath = getReplacedPath(detail, templates, selectedItem, quickpick.value)
      if (!replacedPath) {
        quickpick.hide()
        return
      }

      detail.replacedPath = replacedPath

      quickpick.value = ''

      step++
      if (!uriDetailsWithReplacements[step]) {
        quickpick.hide()
        resolve(uriDetailsWithReplacements)
        return
      }

      updateQuickPick()
    })

    quickpick.show()
  })
}

export function getReplacedPath(
  detail: UriDetail,
  templates: Template[],
  quickpickItem?: QuickPickItem,
  quickpickValue = '',
): ParsedPath | undefined {
  logger.info('Selected quickpick item: ', JSON.stringify(quickpickItem))

  if (!quickpickItem) {
    const newBase = detail.path.base.replace(detail.path.name, `${detail.path.name}-copy`)
    return parse(join(detail.path.dir, newBase))
  }

  if (quickpickItem.label === 'Custom filename') {
    const newFilename = quickpickValue.includes('.') ? quickpickValue : detail.stats.isDirectory() ? quickpickValue : `${quickpickValue}${detail.path.ext}`
    return parse(join(detail.path.dir, newFilename))
  }
  else {
    // This matches the selected item to the saved template from a users config
    const selectedTemplate = templates.find(template => template.label === quickpickItem.description)
    if (!selectedTemplate) {
      const error = 'No template matched. Check the logs for more info'
      logger.error('No template matched:', JSON.stringify(quickpickItem, null, 2))
      window.showErrorMessage(error)
      return
    }

    const newFilename = getReplacedFilename(detail.path, selectedTemplate, detail.stats.isDirectory())
    return parse(join(detail.path.dir, newFilename))
  }
}

export function getReplacedFilename(path: ParsedPath, template: Template, isDirectory: boolean) {
  if (isDirectory) {
    // eslint-disable-next-line no-template-curly-in-string
    return template.replacement.replaceAll('${basename}', path.name)
  }
  // eslint-disable-next-line no-template-curly-in-string
  return template.replacement.replaceAll('${basename}', path.name).replaceAll('${ext}', path.ext.slice(1))
}
