import { useState } from 'react';
import { Button, Card, Field, IconButton, Notice, RadioGroup, Select, Status, TextArea, TextInput } from './components.js';
export function Gallery() {
  const [theme, setTheme] = useState('light');
  const [text, setText] = useState('Synthetic example');
  return <main className="u-surface gallery" aria-label="Component gallery" data-theme={theme}>
    <h1>Component gallery</h1><p>Apple-inspired · synthetic examples</p>
    <RadioGroup label="Appearance" name="gallery-appearance" value={theme} onChange={setTheme} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
    <Card className="u-stack"><h2>Fields</h2>
      <Field id="example" label="Example label" help="Editable sample">{control => <TextInput {...control} value={text} onChange={event => setText(event.target.value)} />}</Field>
      <Field id="invalid" label="Invalid field" error="Enter a positive amount">{control => <TextInput {...control} defaultValue="0" />}</Field>
      <Field id="disabled" label="Disabled field">{control => <TextInput {...control} value="Unavailable" disabled />}</Field>
      <Field id="select" label="Example selection">{control => <Select {...control} defaultValue="one"><option value="one">First choice</option><option value="two">Second choice</option></Select>}</Field>
      <Field id="comment" label="Example comment">{control => <TextArea {...control} defaultValue="Safe multiline text" />}</Field>
    </Card>
    <div className="u-actions"><Button>Primary action</Button><Button variant="secondary">Secondary action</Button><Button variant="quiet">Back</Button><IconButton label="Options"><span aria-hidden="true">⚙</span></IconButton><Button loading>Saving…</Button></div>
    <span className="u-date">Today · Fri, 27 Nov 2026</span><span className="u-date u-date--past">Past date · Wed, 25 Nov 2026</span>
    <p className="u-help">Nov 2026 · 12,500.00 KZT already recorded</p>
    <Notice tone="warning">An existing entry needs review.</Notice><Notice tone="error">An example error.</Notice><Notice tone="success">A confirmed result.</Notice>
    <Status>{text}</Status>
  </main>;
}
