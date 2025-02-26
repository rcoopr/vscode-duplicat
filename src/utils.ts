import { useLogger } from 'reactive-vscode'

export const logger = useLogger('DupliCat')

export function pluralise(string: string, count: number) {
  return count === 1 ? string : `${string}s`
}
