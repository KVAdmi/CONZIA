import { describe, it, expect } from 'vitest';
import {
  calculateInitialScores,
  recalculateScores,
  determineArchetypes,
  calculateBalanceIndex,
} from '../../src/engine/archetypeEngine';

describe('archetypeEngine', () => {
  describe('calculateInitialScores', () => {
    it('should calculate scores from 20 answers', () => {
      const answers = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
      const scores = calculateInitialScores(answers);
      
      expect(scores.guerrero).toBe(100);
      expect(scores.rey).toBe(100);
      expect(scores.amante).toBe(100);
      expect(scores.mago).toBe(100);
    });

    it('should normalize scores to 0-100 range', () => {
      const answers = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      const scores = calculateInitialScores(answers);
      
      expect(scores.guerrero).toBe(0);
      expect(scores.rey).toBe(0);
      expect(scores.amante).toBe(0);
      expect(scores.mago).toBe(0);
    });

    it('should throw error if answers length !== 20', () => {
      const answers = [5, 5, 5];
      expect(() => calculateInitialScores(answers)).toThrow();
    });

    it('should handle mixed scores correctly', () => {
      // Guerrero: Q1-5 (5,5,5,5,5) = 25/25 = 100
      // Rey: Q6-10 (3,3,3,3,3) = 15/25 = 60
      // Amante: Q11-15 (1,1,1,1,1) = 5/25 = 20
      // Mago: Q16-20 (4,4,4,4,4) = 20/25 = 80
      const answers = [
        5, 5, 5, 5, 5, // Guerrero
        3, 3, 3, 3, 3, // Rey
        1, 1, 1, 1, 1, // Amante
        4, 4, 4, 4, 4, // Mago
      ];
      const scores = calculateInitialScores(answers);
      
      expect(scores.guerrero).toBeCloseTo(100, 0);
      expect(scores.rey).toBeCloseTo(50, 0);
      expect(scores.amante).toBeCloseTo(0, 0);
      expect(scores.mago).toBeCloseTo(75, 0);
    });
  });

  describe('determineArchetypes', () => {
    it('should determine dominant and shadow archetypes', () => {
      const scores = { guerrero: 80, rey: 60, amante: 50, mago: 30 };
      const result = determineArchetypes(scores);
      
      expect(result.dominant).toBe('guerrero');
      expect(result.shadow).toBe('mago');
    });

    it('should handle tie for dominant archetype', () => {
      const scores = { guerrero: 80, rey: 80, amante: 50, mago: 30 };
      const result = determineArchetypes(scores);
      
      // Should pick first one alphabetically or by order
      expect(['guerrero', 'rey']).toContain(result.dominant);
      expect(result.shadow).toBe('mago');
    });

    it('should handle all equal scores', () => {
      const scores = { guerrero: 50, rey: 50, amante: 50, mago: 50 };
      const result = determineArchetypes(scores);
      
      expect(result.dominant).toBeDefined();
      expect(result.shadow).toBeDefined();
      expect(result.dominant).not.toBe(result.shadow);
    });
  });

  describe('calculateBalanceIndex', () => {
    it('should return 100 for perfectly balanced scores', () => {
      const scores = { guerrero: 50, rey: 50, amante: 50, mago: 50 };
      const balance = calculateBalanceIndex(scores);
      
      expect(balance).toBe(100);
    });

    it('should return low value for unbalanced scores', () => {
      const scores = { guerrero: 100, rey: 0, amante: 0, mago: 0 };
      const balance = calculateBalanceIndex(scores);
      
      expect(balance).toBeLessThan(20);
    });

    it('should return medium value for moderately balanced scores', () => {
      const scores = { guerrero: 70, rey: 60, amante: 40, mago: 30 };
      const balance = calculateBalanceIndex(scores);
      
      expect(balance).toBeGreaterThan(40);
      expect(balance).toBeLessThan(80);
    });

    it('should be between 0 and 100', () => {
      const scores = { guerrero: 90, rey: 10, amante: 50, mago: 50 };
      const balance = calculateBalanceIndex(scores);
      
      expect(balance).toBeGreaterThanOrEqual(0);
      expect(balance).toBeLessThanOrEqual(100);
    });
  });

  describe('recalculateScores', () => {
    it('should adjust scores based on shadow traits', () => {
      const currentScores = { guerrero: 50, rey: 50, amante: 50, mago: 50 };
      const shadowTraits = [
        { archetype: 'guerrero', intensity: 'high' },
        { archetype: 'guerrero', intensity: 'medium' },
      ];
      const completedChallenges = [];
      
      const newScores = recalculateScores(currentScores, shadowTraits, completedChallenges);
      
      // Guerrero should decrease due to shadow traits
      expect(newScores.guerrero).toBeLessThan(currentScores.guerrero);
    });

    it('should adjust scores based on completed challenges', () => {
      const currentScores = { guerrero: 50, rey: 50, amante: 50, mago: 30 };
      const shadowTraits = [];
      const completedChallenges = [
        { shadow_archetype: 'mago' },
        { shadow_archetype: 'mago' },
      ];
      
      const newScores = recalculateScores(currentScores, shadowTraits, completedChallenges);
      
      // Mago should increase due to completed challenges
      expect(newScores.mago).toBeGreaterThan(currentScores.mago);
    });

    it('should normalize scores to maintain sum', () => {
      const currentScores = { guerrero: 50, rey: 50, amante: 50, mago: 50 };
      const shadowTraits = [{ archetype: 'guerrero', intensity: 'high' }];
      const completedChallenges = [{ shadow_archetype: 'mago' }];
      
      const newScores = recalculateScores(currentScores, shadowTraits, completedChallenges);
      
      // Sum should remain constant (200 in this case)
      const sum = newScores.guerrero + newScores.rey + newScores.amante + newScores.mago;
      expect(sum).toBeCloseTo(200, 0);
    });
  });
});
