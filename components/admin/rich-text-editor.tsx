'use client';

import { useEffect, useRef } from 'react';
import { AlignCenter, AlignLeft, Bold, Italic, Link, List, ListOrdered, Quote, Underline } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize-html';

const toolbar = [
  { command: 'bold', label: 'Gras', icon: Bold },
  { command: 'italic', label: 'Italique', icon: Italic },
  { command: 'underline', label: 'Souligné', icon: Underline },
  { command: 'formatBlock:h2', label: 'Titre', icon: Quote },
  { command: 'insertUnorderedList', label: 'Liste à puces', icon: List },
  { command: 'insertOrderedList', label: 'Liste numérotée', icon: ListOrdered },
  { command: 'justifyLeft', label: 'Aligner à gauche', icon: AlignLeft },
  { command: 'justifyCenter', label: 'Centrer', icon: AlignCenter },
];

export function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== sanitizeHtml(value)) {
      editorRef.current.innerHTML = sanitizeHtml(value);
    }
  }, [value]);

  const execute = (command: string) => {
    editorRef.current?.focus();
    if (command.startsWith('formatBlock:')) {
      document.execCommand('formatBlock', false, command.split(':')[1]);
    } else if (command === 'createLink') {
      const url = window.prompt('URL du lien');
      if (url && /^https?:\/\//i.test(url)) document.execCommand(command, false, url);
    } else {
      document.execCommand(command, false);
    }
    onChange(sanitizeHtml(editorRef.current?.innerHTML || ''));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-2">
        {toolbar.map(({ command, label, icon: Icon }) => (
          <button key={command} type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={() => execute(command)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white hover:text-foreground">
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <button type="button" title="Lien" aria-label="Lien" onMouseDown={(event) => event.preventDefault()} onClick={() => execute('createLink')} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white hover:text-foreground"><Link className="h-4 w-4" /></button>
      </div>
      <div ref={editorRef} contentEditable role="textbox" aria-multiline="true" data-placeholder="Décrivez le produit, ses caractéristiques et ses informations importantes..." onInput={(event) => onChange(sanitizeHtml(event.currentTarget.innerHTML))} className="rich-editor min-h-36 px-4 py-3 text-sm outline-none" />
    </div>
  );
}
