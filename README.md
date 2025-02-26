<p align="center">
<img src="https://github.com/rcoopr/vscode-duplicat/blob/main/res/icon.png?raw=true" height="150">
</p>

<h1 align="center">DupliCat - VS Code</h1>

<p align="center">
<a href="https://kermanx.github.io/reactive-vscode/" target="__blank"><img src="https://img.shields.io/badge/made_with-reactive--vscode-%23eee?style=flat"  alt="Made with reactive-vscode" /></a>
</p>

<p align="center">
Duplicate files and folders and automatically rename them according to user-defined templates.
</p>

<p align="center">
<img width="825" alt="Example usage" src="https://github.com/rcoopr/vscode-duplicat/blob/main/res/example.png?raw=true">
</p>

## Commands

- `Duplicate (duplicat.duplicate)`: Opens a QuickPick menu showing matching templates and custom filename option
- `Quick Duplicate (duplicat.quickDuplicate)`: Automatically applies the first matching template without showing the menu

Both are available via the command palette or right click context menu

## Config

| Name                          | Description                                                                                                                  | Default     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `duplicat.openDuplicatedFile` | Immediately open the file after duplication (opens the last duplicated file when duplicating multiple files/folders at once) | `true`      |
| `duplicat.notifySuccess`      | Show a notification summarising all successful duplicated files/folders                                                      | `true`      |
| `duplicate.templates`         | Rules to provide quick options for common workflows                                                                          | _See below_ |

### Templates

Templates in DupliCat allow you to define rules for automatic/suggestion-based file renaming. The default configuration for duplicate.templates is:

```json
[{
  "label": "Create test file",
  "matches": "^(?!.*(test|spec)).*$",
  "replacement": "${basename}.spec.${ext}",
  "icon": "disassembly-editor-label-icon"
}]
```

Each template has four key components:

1. `label`: The text displayed in the QuickPick menu when selecting a template
2. `matches`: A regular expression pattern that determines which files/folders the template applies to
3. `replacement`: The naming pattern used when duplicating matching files/folders
4. `icon`: Visual identifier shown in the QuickPick menu (optional, found [here](https://code.visualstudio.com/api/references/icons-in-labels#icon-listing))

When you run the `Duplicate (duplicat.duplicate)` command, DupliCat tests each selected file/folder name against all defined templates. Any matching templates appear as options in the QuickPick menu.

#### Variables in Replacement Patterns

You can use these variables in your replacement patterns:

- ${basename}: The original file/folder name without extension
- ${ext}: The file extension (ignored for folders)

#### Examples

The default template matches any file that doesn't contain "test" or "spec" in its name and adds ".spec" before the extension:

`example.js` → `example.spec.js`
`utils.ts` → `utils.spec.ts`

#### Custom Filenames

You can type directly in the QuickPick menu to:

- Filter available templates by typing part of their label
- Create a completely custom filename by selecting the "Custom filename" option

### Overwrites

Any potential overwrite will show a prompt to confirm/cancel the overwrite. In the case of duplicating multiple files/folders, only the 1 entry is cancelled and you can continue after answering the prompt.

### Caveats

- Currently doesn't support using `{capture}` in the `replacement` field of templates, but it will likely get added soon
- Using the `Duplicate` command with multiple files only works using the right click context menu.
- Currently it's not possible to match against parent dirs, but I am open to exploring the idea.

## License

[MIT](./LICENSE) License © 2025 [Ross Cooper](https://github.com/rcoopr)
