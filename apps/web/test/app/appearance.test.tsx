import { render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import App from '../../src/app/App.js';
afterEach(()=>{window.localStorage.removeItem('expences-record.appearance');delete document.documentElement.dataset.theme;});
test('the saved appearance also applies before login instead of reverting to the device theme',async()=>{
  window.localStorage.setItem('expences-record.appearance','dark');
  render(<App client={{session:async()=>({state:'signed-out'}),logout:async()=> 'signed-out'}} />);
  await screen.findByRole('link',{name:'Sign in with Google'});
  expect(document.documentElement).toHaveAttribute('data-theme','dark');
});
