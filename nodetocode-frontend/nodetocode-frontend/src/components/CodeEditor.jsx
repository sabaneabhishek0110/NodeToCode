import React from 'react'
import Editor, { loader } from '@monaco-editor/react'

loader.init().then((monaco) => {
  monaco.editor.defineTheme('pure-black', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#000000',
      'editor.lineHighlightBackground': '#0d0d0d',
      'editorLineNumber.foreground': '#404040',
      'editorLineNumber.activeForeground': '#888888',
      'editorGutter.background': '#000000',
      'minimap.background': '#000000',
      'scrollbar.shadow': '#000000',
      'editorWidget.background': '#0d0d0d',
      'editorSuggestWidget.background': '#0d0d0d',
      'editorSuggestWidget.border': '#222222',
    },
  })
})

const EDITOR_OPTIONS = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 14,
  fontLigatures: true,
}

export default function CodeEditor({ language, value, onChange, height = '100%', disablePaste = false }) {
  const monacoLang = language === 'cpp' ? 'cpp' : language
  const editorRef = React.useRef(null)
  const isExternalUpdate = React.useRef(false)

  const handleMount = (editor) => {
    editorRef.current = editor

    // Block paste when in arena / test mode
    if (disablePaste) {
      editor.onDidPaste?.(() => {})
      // Intercept the paste command itself
      editor.addCommand(
        // Ctrl+V / Cmd+V
        /* eslint-disable no-bitwise */
        window.monaco
          ? window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KeyV
          : 2048 | 52,
        () => { /* swallow */ }
      )
      // Also intercept Ctrl+Shift+V
      if (window.monaco) {
        editor.addCommand(
          window.monaco.KeyMod.CtrlCmd | window.monaco.KeyMod.Shift | window.monaco.KeyCode.KeyV,
          () => {}
        )
      }
      // Disable context-menu paste by making the editor's DOM swallow paste events
      editor.getDomNode()?.addEventListener('paste', (e) => e.preventDefault(), true)
    }
  }

  // Push external value changes (e.g. language switch, loaded code) into the editor
  // without going through the controlled `value` prop which resets cursor position.
  React.useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const model = editor.getModel()
    if (!model) return
    const currentValue = model.getValue()
    if (value !== currentValue) {
      isExternalUpdate.current = true
      // Preserve cursor position when possible
      const position = editor.getPosition()
      model.setValue(value)
      if (position) {
        editor.setPosition(position)
      }
      isExternalUpdate.current = false
    }
  }, [value])

  const handleChange = (newValue) => {
    if (!isExternalUpdate.current && onChange) {
      onChange(newValue)
    }
  }

  return (
    <Editor
      height={height}
      theme="pure-black"
      language={monacoLang}
      defaultValue={value}
      onMount={handleMount}
      onChange={handleChange}
      options={EDITOR_OPTIONS}
    />
  )
}
