import { expect, test, vi } from 'vitest';
import { createAppearanceSetting } from '../../../src/features/options/appearance.js';
test('an explicit appearance choice is the only value saved and restored',()=>{
 const storage={getItem:vi.fn().mockReturnValue('dark'),setItem:vi.fn()};const setting=createAppearanceSetting(storage,()=>false);
 expect(setting.read()).toBe('dark');expect(setting.save('light')).toBe(true);expect(storage.setItem).toHaveBeenCalledExactlyOnceWith('expences-record.appearance','light');
});
test('missing or invalid stored choices use the device default without subscribing or writing',()=>{
 const storage={getItem:vi.fn().mockReturnValue('invented'),setItem:vi.fn()};const setting=createAppearanceSetting(storage,()=>true);
 expect(setting.read()).toBe('dark');expect(storage.setItem).not.toHaveBeenCalled();
});
test('blocked storage uses a safe default and reports a temporary choice',()=>{
 const storage={getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('blocked');}};
 const setting=createAppearanceSetting(storage,()=>true);expect(setting.read()).toBe('dark');expect(setting.save('light')).toBe(false);
});
