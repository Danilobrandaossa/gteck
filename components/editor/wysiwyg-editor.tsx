'use client'

import { useState, useRef, useEffect } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Link, Image, Code, Quote, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

interface WysiwygEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export function WysiwygEditor({ content, onChange, placeholder = 'Digite seu conteúdo...', className = '' }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content
    }
  }, [content])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const insertLink = () => {
    const url = prompt('Digite a URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const insertImage = () => {
    const url = prompt('Digite a URL da imagem:')
    if (url) {
      execCommand('insertImage', url)
    }
  }

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: 'Negrito' },
    { icon: Italic, command: 'italic', title: 'Itálico' },
    { icon: Underline, command: 'underline', title: 'Sublinhado' },
    { icon: Code, command: 'code', title: 'Código' },
    { icon: List, command: 'insertUnorderedList', title: 'Lista com marcadores' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Lista numerada' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Citação' },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Alinhar à esquerda' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Centralizar' },
    { icon: AlignRight, command: 'justifyRight', title: 'Alinhar à direita' },
  ]

  return (
    <div className={`cms-wysiwyg-editor ${className}`} style={{ border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.25rem', 
        padding: '0.75rem', 
        backgroundColor: 'var(--gray-50)', 
        borderBottom: '1px solid var(--gray-200)',
        flexWrap: 'wrap'
      }}>
        {toolbarButtons.map((button) => (
          <button
            key={button.command}
            type="button"
            onClick={() => execCommand(button.command, button.value)}
            title={button.title}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              border: 'none',
              backgroundColor: 'transparent',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              color: 'var(--gray-600)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-200)'
              e.currentTarget.style.color = 'var(--gray-900)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--gray-600)'
            }}
          >
            <button.icon style={{ width: '1rem', height: '1rem' }} />
          </button>
        ))}
        
        <div style={{ width: '1px', height: '1.5rem', backgroundColor: 'var(--gray-300)', margin: '0 0.5rem' }} />
        
        <button
          type="button"
          onClick={insertLink}
          title="Inserir link"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2rem',
            height: '2rem',
            border: 'none',
            backgroundColor: 'transparent',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            color: 'var(--gray-600)',
            transition: 'all 0.2s'
          }}
        >
          <Link style={{ width: '1rem', height: '1rem' }} />
        </button>
        
        <button
          type="button"
          onClick={insertImage}
          title="Inserir imagem"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2rem',
            height: '2rem',
            border: 'none',
            backgroundColor: 'transparent',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            color: 'var(--gray-600)',
            transition: 'all 0.2s'
          }}
        >
          <Image style={{ width: '1rem', height: '1rem' }} />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          minHeight: '300px',
          padding: '1rem',
          fontSize: '0.875rem',
          lineHeight: '1.6',
          outline: 'none',
          backgroundColor: 'var(--white)',
          color: 'var(--gray-900)',
          border: isFocused ? '2px solid var(--primary)' : 'none',
          borderRadius: isFocused ? 'var(--radius-lg)' : '0'
        }}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Placeholder */}
      {!content && (
        <div style={{
          position: 'absolute',
          top: '4.5rem',
          left: '1rem',
          color: 'var(--gray-400)',
          pointerEvents: 'none',
          fontSize: '0.875rem'
        }}>
          {placeholder}
        </div>
      )}
    </div>
  )
}

