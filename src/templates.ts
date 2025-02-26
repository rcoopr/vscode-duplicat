import type { ParsedPath } from 'node:path'
import { join, parse } from 'node:path'
import type { QuickPickItem } from 'vscode'
import { window } from 'vscode'
import type { config } from './config'
import { logger } from './utils'
import type { UriDetail, UriDetailWithReplacement } from './types'

type TemplateConfig = typeof config['templates'][number]

export interface Template extends TemplateConfig {
  regex: RegExp
}

export function validateTemplates(templates: TemplateConfig[]): Template[] {
  const validTemplates: Template[] = []
  for (const template of templates) {
    try {
      if (template.label === 'Custom filename') {
        throw new Error('Reserved label name: Custom filename')
      }
      const regex = new RegExp(template.matches)
      logger.info('RegExp', template.matches, typeof regex, regex)
      if (!isTemplateConfig(template)) {
        throw new TypeError('Template value must be an object with:\n - label: string\n  - matches: string | string[]\n - replacement: string')
      }
      validTemplates.push({ regex, ...template })
    }
    catch (e) {
      if (e instanceof Error) {
        logger.error(`Invalid template: ${template.label} - ${e.message}`)
      }
      else {
        logger.error(`Unknown error for template: ${template.label} - ${JSON.stringify(e)}`)
      }
    }
  }
  return validTemplates
}

function isTemplateConfig(template: unknown): template is TemplateConfig {
  return typeof template === 'object' && template !== null && 'label' in template && 'matches' in template && 'replacement' in template
}
