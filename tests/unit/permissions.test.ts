import { describe, it, expect } from 'vitest';
import {
  hasCapability,
  getCapabilities,
  canUseTool,
  getAllowedToolNames,
  getDashboardScope,
  getRoleDisplayName,
  buildRoleInstructions,
} from '@/lib/permissions';

describe('permissions', () => {
  describe('hasCapability', () => {
    it('staff has all capabilities', () => {
      expect(hasCapability('staff', 'view:all_cast')).toBe(true);
      expect(hasCapability('staff', 'write:schedule_scene')).toBe(true);
      expect(hasCapability('staff', 'write:manage_crew')).toBe(true);
      expect(hasCapability('staff', 'view:budget')).toBe(true);
    });

    it('ac has limited capabilities', () => {
      expect(hasCapability('ac', 'view:own_schedule')).toBe(true);
      expect(hasCapability('ac', 'write:mark_scene_shot')).toBe(true);
      expect(hasCapability('ac', 'write:mark_footage_picked_up')).toBe(true);
      // Should NOT have
      expect(hasCapability('ac', 'view:all_contracts')).toBe(false);
      expect(hasCapability('ac', 'write:schedule_scene')).toBe(false);
      expect(hasCapability('ac', 'write:mark_contract')).toBe(false);
      expect(hasCapability('ac', 'view:budget')).toBe(false);
    });

    it('coordinator can schedule but not manage contracts', () => {
      expect(hasCapability('coordinator', 'write:schedule_scene')).toBe(true);
      expect(hasCapability('coordinator', 'write:assign_crew')).toBe(true);
      expect(hasCapability('coordinator', 'write:mark_contract')).toBe(false);
    });

    it('editor has lifecycle access but not scheduling', () => {
      expect(hasCapability('editor', 'view:lifecycle')).toBe(true);
      expect(hasCapability('editor', 'write:advance_stage')).toBe(true);
      expect(hasCapability('editor', 'write:schedule_scene')).toBe(false);
    });
  });

  describe('canUseTool', () => {
    it('staff can use all tools', () => {
      expect(canUseTool('staff', 'schedule_scene')).toBe(true);
      expect(canUseTool('staff', 'mark_contract')).toBe(true);
      expect(canUseTool('staff', 'advance_asset_stage')).toBe(true);
    });

    it('ac cannot schedule scenes', () => {
      expect(canUseTool('ac', 'schedule_scene')).toBe(false);
    });

    it('ac can update own availability via fallback', () => {
      expect(canUseTool('ac', 'update_crew_availability')).toBe(true);
    });

    it('read-only tools are always allowed', () => {
      expect(canUseTool('ac', 'search_entities')).toBe(true);
      expect(canUseTool('editor', 'get_storyline')).toBe(true);
    });
  });

  describe('getAllowedToolNames', () => {
    it('staff gets all write tools', () => {
      const tools = getAllowedToolNames('staff');
      expect(tools).toContain('schedule_scene');
      expect(tools).toContain('assign_crew');
      expect(tools).toContain('mark_contract');
      expect(tools).toContain('advance_asset_stage');
      expect(tools).toContain('update_crew_availability');
    });

    it('ac gets minimal write tools', () => {
      const tools = getAllowedToolNames('ac');
      expect(tools).not.toContain('schedule_scene');
      expect(tools).not.toContain('assign_crew');
      expect(tools).not.toContain('mark_contract');
      expect(tools).toContain('update_crew_availability');
    });
  });

  describe('getDashboardScope', () => {
    it('staff sees full dashboard', () => {
      expect(getDashboardScope('staff')).toBe('full');
    });

    it('producer sees full dashboard', () => {
      expect(getDashboardScope('producer')).toBe('full');
    });

    it('coordinator sees production scope', () => {
      expect(getDashboardScope('coordinator')).toBe('production');
    });

    it('ac sees own assignments only', () => {
      expect(getDashboardScope('ac')).toBe('own_assignments');
    });
  });

  describe('getRoleDisplayName', () => {
    it('returns human-readable names', () => {
      expect(getRoleDisplayName('staff')).toBe('Executive Producer');
      expect(getRoleDisplayName('ac')).toBe('AC');
      expect(getRoleDisplayName('producer')).toBe('Producer');
      expect(getRoleDisplayName('coordinator')).toBe('Coordinator');
    });
  });

  describe('buildRoleInstructions', () => {
    it('includes role name and access level', () => {
      const instructions = buildRoleInstructions('Marcus', 'ac');
      expect(instructions).toContain('Marcus');
      expect(instructions).toContain('AC');
      expect(instructions).toContain('own_assignments');
    });

    it('lists restricted tools for limited roles', () => {
      const instructions = buildRoleInstructions('Marcus', 'ac');
      expect(instructions).toContain('Restricted Actions');
      expect(instructions).toContain('schedule_scene');
      expect(instructions).toContain('mark_contract');
    });

    it('has no restrictions for staff', () => {
      const instructions = buildRoleInstructions('Eddie', 'staff');
      expect(instructions).not.toContain('Restricted Actions');
    });

    it('includes behavioral note for editors', () => {
      const instructions = buildRoleInstructions('Alex', 'editor');
      expect(instructions).toContain('post-production');
    });
  });
});
