import { defineExtension, useActiveTextEditor } from 'reactive-vscode'
import { Range } from 'vscode'
import { logger } from './utils'
import { config } from './config'

const { activate, deactivate } = defineExtension(() => {
  const editor = useActiveTextEditor()

})

export { activate, deactivate }
