import { join } from 'node:path'
import { copyFile, cp } from 'node:fs/promises'
import { defineExtension, ref, useCommands, watchEffect } from 'reactive-vscode'
import type { Uri } from 'vscode'
import { window } from 'vscode'
import { logger, pluralise } from './utils'
import { config } from './config'
import { commands } from './generated/meta'
import type { Template } from './templates'
import { validateTemplates } from './templates'
import { openFile, statExists } from './fs'
import { getQuickpickItems, getReplacedPath, overwrite, promptFilenames } from './prompt'
import { gatherUrisToDuplicate } from './editor'
import type { UriDetailWithReplacement } from './types'

export const { activate, deactivate } = defineExtension(() => {
  logger.info('DupliCat activated')

  const templates = ref<Template[]>(validateTemplates(config.templates))
  watchEffect(() => {
    templates.value = validateTemplates(config.templates)
    logger.info(`Templates updated: ${config.templates.length} templates found, ${templates.value.length} valid`)
  })

  useCommands({
    [commands.duplicate]: async (selectedUri?: Uri, allSelectecUris?: Uri[]) => {
      const urisToDuplicate = await gatherUrisToDuplicate(selectedUri, allSelectecUris) || []
      const quickpickItems = urisToDuplicate.map(uri => getQuickpickItems(uri, templates.value, 'all'))
      const selectedFilenames = await promptFilenames(urisToDuplicate, quickpickItems, templates.value)
      await executeDuplications(selectedFilenames)
    },

    [commands.quickDuplicate]: async (selectedUri?: Uri, allSelectecUris?: Uri[]) => {
      const urisToDuplicate = await gatherUrisToDuplicate(selectedUri, allSelectecUris) || []
      const uriDetailsWithReplacements = urisToDuplicate.map((uri) => {
        const template = getQuickpickItems(uri, templates.value, 'first')
        logger.info('Template:', JSON.stringify(template, null, 2))
        const replacedPath = getReplacedPath(uri, templates.value, template)
        return replacedPath ? { ...uri, replacedPath } : undefined
      }).filter(v => !!v)
      await executeDuplications(uriDetailsWithReplacements)
    },
  })
})

async function executeDuplications(uris: UriDetailWithReplacement[] | undefined) {
  logger.info('Duplications:', JSON.stringify(uris, null, 2))
  if (!uris)
    return

  const successfulCopies = {
    files: [] as string[],
    folders: [] as string[],
  }

  for (const { uri, path, stats, replacedPath } of uris) {
    if (!replacedPath)
      return
    if (path.base === replacedPath.base && path.dir === replacedPath.dir) {
      logger.info(`No changes to file: ${path.base}`)
      window.showErrorMessage('You must change the filename to duplicate the file')
      return
    }

    const newPath = join(replacedPath.dir, replacedPath.base)
    const newStats = await statExists(newPath)
    if (newStats) {
      logger.info(`File already exists: ${replacedPath.base}`)
      const shouldOverwrite = await overwrite(newPath, newStats.isDirectory())
      if (!shouldOverwrite) {
        logger.info(`Cancelled duplicate: ${replacedPath.base}`)
        continue
      }
      logger.info(`Overwriting file: ${replacedPath.base}`)
    }

    try {
      if (stats.isDirectory()) {
        await cp(uri.fsPath, newPath, { recursive: true })
        successfulCopies.folders.push(newPath)
      }
      else {
        await copyFile(uri.fsPath, newPath)
        successfulCopies.files.push(newPath)
      }
      if (newStats)
        logger.info('File overwritten successfully')
    }
    catch (e) {
      window.showErrorMessage(`Unable to copy file: ${newPath}`)
      if (e instanceof Error) {
        logger.error(`Error duplicating file: ${path.base} - ${e.message}`)
      }
      else {
        logger.error(`Error duplicating file (unknown error): ${path.base} - ${JSON.stringify(e, null, 2)}`)
      }
    }
  }

  const lastSuccessfulCopy = successfulCopies.files[successfulCopies.files.length - 1]
  try {
    if (lastSuccessfulCopy && config.openDuplicatedFile) {
      await openFile(lastSuccessfulCopy)
    }
  }
  catch (e) {
    window.showErrorMessage(`Unable to open file: ${lastSuccessfulCopy}`)
    if (e instanceof Error) {
      logger.error(`Error opening duplicated file: ${lastSuccessfulCopy} - ${e.message}`)
    }
    else {
      logger.error(`Error opening duplicated file (unknown error): ${lastSuccessfulCopy} - ${JSON.stringify(e, null, 2)}`)
    }
  }

  if (config.notifySuccess && (successfulCopies.files.length || successfulCopies.folders.length)) {
    const { files, folders } = successfulCopies
    const message = [
      files.length ? `Duplicated ${files.length} ${pluralise('file', files.length)}:` : '',
      ...files.map(file => `\n\t${file}`),
      folders.length ? `Duplicated ${folders.length} ${pluralise('folder', folders.length)}:` : '',
      ...folders.map(folder => `\n\t${folder}`),
    ].join('')

    window.showInformationMessage(message)
  }
}
