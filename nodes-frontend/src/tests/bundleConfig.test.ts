import { describe, it, expect } from 'vitest';
import packageJson from '../../package.json' with { type: 'json' };

describe('Bundle Configuration', () => {
  it('should have sideEffects set to false in package.json to enable tree shaking', () => {
    expect(packageJson.sideEffects).toBe(false);
  });
});


