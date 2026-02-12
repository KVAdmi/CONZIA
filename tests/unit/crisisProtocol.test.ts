import { describe, it, expect } from 'vitest';
import { assessRisk, generateCrisisResponse } from '../../src/engine/crisisProtocol';
import crisisDataset from '../golden/crisis_detection.json';

describe('crisisProtocol', () => {
  describe('assessRisk', () => {
    it('should detect critical risk for suicidal keywords', () => {
      const text = 'Me quiero suicidar, no puedo más';
      const assessment = assessRisk('user_id', text);
      
      expect(assessment.risk_level).toBe('critical');
      expect(assessment.risk_score).toBe(100);
      expect(assessment.requires_immediate_intervention).toBe(true);
    });

    it('should detect high risk for self-harm keywords', () => {
      const text = 'Quiero hacerme daño, cortarme';
      const assessment = assessRisk('user_id', text);
      
      expect(assessment.risk_level).toBe('high');
      expect(assessment.risk_score).toBeGreaterThanOrEqual(70);
    });

    it('should return low risk for normal text', () => {
      const text = 'Hoy me siento un poco triste pero estoy bien';
      const assessment = assessRisk('user_id', text);
      
      expect(assessment.risk_level).toBe('low');
      expect(assessment.risk_score).toBeLessThan(40);
    });

    it('should not trigger on colloquial expressions', () => {
      const text = 'Me muero de amor por ti';
      const assessment = assessRisk('user_id', text);
      
      expect(assessment.risk_level).toBe('low');
      expect(assessment.risk_score).toBeLessThan(30);
    });
  });

  describe('generateCrisisResponse', () => {
    it('should show emergency contacts for critical risk', () => {
      const assessment = {
        profile_id: 'user_id',
        entry_text: 'test',
        risk_level: 'critical' as const,
        risk_score: 100,
        risk_factors: [],
        recommended_action: 'test',
        requires_immediate_intervention: true,
        should_block_phase_progression: true,
        emergency_contacts_shown: true,
      };
      
      const response = generateCrisisResponse(assessment);
      
      expect(response.show_crisis_message).toBe(true);
      expect(response.show_emergency_contacts).toBe(true);
      expect(response.block_phase_progression).toBe(true);
      expect(response.alert_priority).toBe('critical');
    });

    it('should not block progression for low risk', () => {
      const assessment = {
        profile_id: 'user_id',
        entry_text: 'test',
        risk_level: 'low' as const,
        risk_score: 20,
        risk_factors: [],
        recommended_action: 'test',
        requires_immediate_intervention: false,
        should_block_phase_progression: false,
        emergency_contacts_shown: false,
      };
      
      const response = generateCrisisResponse(assessment);
      
      expect(response.show_crisis_message).toBe(false);
      expect(response.block_phase_progression).toBe(false);
    });
  });

  describe('Golden Dataset: Crisis Detection', () => {
    crisisDataset.forEach(({ name, text, expected_risk_level, expected_risk_score, expected_risk_score_min, expected_risk_score_max }) => {
      it(name, () => {
        const assessment = assessRisk('test_user', text);
        
        // Verify risk level
        expect(assessment.risk_level).toBe(expected_risk_level);
        
        // Verify risk score
        if (typeof expected_risk_score === 'number') {
          expect(assessment.risk_score).toBe(expected_risk_score);
        } else {
          if (expected_risk_score_min !== undefined) {
            expect(assessment.risk_score).toBeGreaterThanOrEqual(expected_risk_score_min);
          }
          if (expected_risk_score_max !== undefined) {
            expect(assessment.risk_score).toBeLessThan(expected_risk_score_max);
          }
        }
      });
    });
  });
});
