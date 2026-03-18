/**
 * Role-Based Access Control for Lexicon
 *
 * Each crew role has different capabilities — what they can see and do.
 * This maps to both Lexi's behavior (what tools she'll execute) and
 * the dashboard UI (what data to show).
 *
 * Hierarchy:
 *   EP > PM > Field Producer > Coordinator > AC
 *
 * Philosophy: EP sees all, does all. Everyone else sees what they need
 * to do their job. No information overload. No accidental changes.
 */

import type { CrewRole } from '@/types';

// ============================================
// Capability Types
// ============================================

export type Capability =
  // Read capabilities
  | 'view:all_cast'
  | 'view:all_crew'
  | 'view:all_scenes'
  | 'view:all_contracts'
  | 'view:budget'
  | 'view:activity_log'
  | 'view:alerts'
  | 'view:own_schedule'
  | 'view:own_assignments'
  | 'view:call_sheets'
  | 'view:lifecycle'
  // Write capabilities
  | 'write:schedule_scene'
  | 'write:assign_crew'
  | 'write:mark_contract'
  | 'write:advance_stage'
  | 'write:update_availability'
  | 'write:update_own_availability'
  | 'write:mark_scene_shot'
  | 'write:mark_footage_picked_up'
  | 'write:update_notes'
  | 'write:create_cast'
  | 'write:manage_crew'
  | 'write:generate_call_sheet'
  | 'write:create_crew'
  | 'write:delete_scene'
  | 'write:create_contract'
  | 'write:delete_contract'
  | 'write:get_alerts'
  | 'write:update_production'
  | 'write:update_crew_member'
  // Email capabilities
  | 'write:email_call_sheet'
  | 'write:email_production_report'
  | 'write:email_contract_summary';

// ============================================
// Role → Capability Mapping
// ============================================

const ROLE_CAPABILITIES: Record<CrewRole, Capability[]> = {
  // EP sees everything, does everything
  // This is Eddie's role — full production control
  staff: [
    'view:all_cast', 'view:all_crew', 'view:all_scenes', 'view:all_contracts',
    'view:budget', 'view:activity_log', 'view:alerts', 'view:own_schedule',
    'view:own_assignments', 'view:call_sheets', 'view:lifecycle',
    'write:schedule_scene', 'write:assign_crew', 'write:mark_contract',
    'write:advance_stage', 'write:update_availability', 'write:update_own_availability',
    'write:mark_scene_shot', 'write:mark_footage_picked_up', 'write:update_notes',
    'write:create_cast', 'write:manage_crew', 'write:generate_call_sheet',
    'write:create_crew', 'write:delete_scene', 'write:create_contract',
    'write:delete_contract', 'write:get_alerts', 'write:update_production',
    'write:update_crew_member',
    'write:email_call_sheet', 'write:email_production_report', 'write:email_contract_summary',
  ],

  // Producer — production-level access, can schedule and assign
  producer: [
    'view:all_cast', 'view:all_crew', 'view:all_scenes', 'view:all_contracts',
    'view:activity_log', 'view:alerts', 'view:own_schedule',
    'view:own_assignments', 'view:call_sheets', 'view:lifecycle',
    'write:schedule_scene', 'write:assign_crew', 'write:mark_contract',
    'write:advance_stage', 'write:update_availability', 'write:update_own_availability',
    'write:mark_scene_shot', 'write:mark_footage_picked_up', 'write:update_notes',
    'write:generate_call_sheet',
    'write:create_crew', 'write:delete_scene', 'write:create_contract',
    'write:get_alerts', 'write:update_crew_member',
    'write:email_call_sheet', 'write:email_production_report', 'write:email_contract_summary',
  ],

  // Coordinator — logistics, scheduling, call sheets
  coordinator: [
    'view:all_cast', 'view:all_crew', 'view:all_scenes', 'view:all_contracts',
    'view:activity_log', 'view:alerts', 'view:own_schedule',
    'view:own_assignments', 'view:call_sheets',
    'write:schedule_scene', 'write:assign_crew',
    'write:update_availability', 'write:update_own_availability',
    'write:mark_footage_picked_up', 'write:update_notes',
    'write:generate_call_sheet',
    'write:create_crew', 'write:get_alerts', 'write:update_crew_member',
    'write:email_call_sheet',
  ],

  // Fixer — local logistics, limited scheduling
  fixer: [
    'view:all_cast', 'view:all_scenes', 'view:own_schedule',
    'view:own_assignments', 'view:call_sheets',
    'write:update_own_availability', 'write:update_notes',
    'write:mark_footage_picked_up',
    'write:generate_call_sheet',
  ],

  // AC — their schedule, their assignments, footage pickups
  ac: [
    'view:own_schedule', 'view:own_assignments', 'view:call_sheets',
    'write:update_own_availability',
    'write:mark_scene_shot', 'write:mark_footage_picked_up',
    'write:update_notes',
  ],

  // Editor — post-production focus, read-mostly
  editor: [
    'view:all_scenes', 'view:own_schedule', 'view:own_assignments',
    'view:lifecycle',
    'write:advance_stage', 'write:update_notes',
    'write:update_own_availability',
    'write:get_alerts',
  ],

  // Field Producer — assigned to specific cast in the field
  field_producer: [
    'view:all_cast', 'view:all_crew', 'view:all_scenes', 'view:all_contracts',
    'view:activity_log', 'view:alerts', 'view:own_schedule',
    'view:own_assignments', 'view:call_sheets',
    'write:schedule_scene', 'write:assign_crew',
    'write:update_availability', 'write:update_own_availability',
    'write:mark_footage_picked_up', 'write:update_notes',
    'write:generate_call_sheet',
    'write:create_crew', 'write:get_alerts', 'write:update_crew_member',
    'write:mark_scene_shot',
  ],

  // Post Supervisor — oversees post-production
  post_supervisor: [
    'view:all_scenes', 'view:own_schedule', 'view:own_assignments',
    'view:lifecycle', 'view:activity_log',
    'write:advance_stage', 'write:update_notes',
    'write:update_own_availability',
    'write:get_alerts',
  ],
};

// ============================================
// Permission Checks
// ============================================

/**
 * Check if a role has a specific capability.
 */
export function hasCapability(role: CrewRole, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

/**
 * Get all capabilities for a role.
 */
export function getCapabilities(role: CrewRole): Capability[] {
  return ROLE_CAPABILITIES[role] || [];
}

/**
 * Check if a role can use a specific Lexi tool.
 */
export function canUseTool(role: CrewRole, toolName: string): boolean {
  const toolCapabilityMap: Record<string, Capability> = {
    schedule_scene: 'write:schedule_scene',
    assign_crew: 'write:assign_crew',
    mark_contract: 'write:mark_contract',
    advance_asset_stage: 'write:advance_stage',
    update_crew_availability: 'write:update_availability',
    create_crew_member: 'write:create_crew',
    update_crew_member: 'write:update_crew_member',
    delete_scene: 'write:delete_scene',
    create_cast_contract: 'write:create_contract',
    delete_cast_contract: 'write:delete_contract',
    generate_call_sheet: 'write:generate_call_sheet',
    get_production_alerts: 'write:get_alerts',
    update_production: 'write:update_production',
    email_call_sheet: 'write:email_call_sheet',
    email_production_report: 'write:email_production_report',
    email_contract_summary: 'write:email_contract_summary',
  };

  const required = toolCapabilityMap[toolName];
  if (!required) return true; // Read-only tools are always allowed

  // Special case: update_crew_availability with own-only permission
  if (toolName === 'update_crew_availability' && !hasCapability(role, 'write:update_availability')) {
    return hasCapability(role, 'write:update_own_availability');
  }

  return hasCapability(role, required);
}

/**
 * Get the list of Lexi tools available for a role.
 * Used to filter tools before passing to Claude.
 */
export function getAllowedToolNames(role: CrewRole): string[] {
  const allTools = [
    'schedule_scene', 'assign_crew', 'mark_contract',
    'advance_asset_stage', 'update_crew_availability',
    'create_crew_member', 'update_crew_member', 'delete_scene',
    'create_cast_contract', 'delete_cast_contract', 'generate_call_sheet',
    'get_production_alerts', 'update_production',
    'email_call_sheet', 'email_production_report', 'email_contract_summary',
  ];

  return allTools.filter((tool) => canUseTool(role, tool));
}

// ============================================
// Dashboard Data Scoping
// ============================================

export type DashboardScope = 'full' | 'production' | 'own_assignments';

/**
 * Determine the dashboard data scope for a role.
 * Controls what the UI fetches and displays.
 */
export function getDashboardScope(role: CrewRole): DashboardScope {
  if (role === 'staff' || role === 'producer') return 'full';
  if (role === 'coordinator' || role === 'field_producer' || role === 'post_supervisor') return 'production';
  return 'own_assignments';
}

/**
 * Get role display name for UI.
 */
export function getRoleDisplayName(role: CrewRole): string {
  const names: Record<CrewRole, string> = {
    staff: 'Executive Producer',
    producer: 'Producer',
    coordinator: 'Coordinator',
    fixer: 'Fixer',
    ac: 'AC',
    editor: 'Editor',
    field_producer: 'Field Producer',
    post_supervisor: 'Post Supervisor',
  };
  return names[role] || role;
}

// ============================================
// Lexi System Prompt — Role-Aware Instructions
// ============================================

/**
 * Generate role-specific instructions for Lexi's system prompt.
 * Tells Lexi what the crew member can and can't do.
 */
export function buildRoleInstructions(name: string, role: CrewRole): string {
  const displayRole = getRoleDisplayName(role);
  const allowedTools = getAllowedToolNames(role);
  const scope = getDashboardScope(role);

  const lines = [
    `## Current User`,
    `Name: ${name}`,
    `Role: ${displayRole}`,
    `Access level: ${scope}`,
    '',
  ];

  if (allowedTools.length > 0) {
    lines.push(`## Allowed Actions for ${displayRole}`);
    lines.push(`You may execute these tools on behalf of ${name}:`);
    for (const tool of allowedTools) {
      lines.push(`- ${tool}`);
    }
    lines.push('');
  }

  // Role-specific behavioral instructions
  if (role === 'ac') {
    lines.push(
      `## Behavioral Note`,
      `${name} is an AC (camera operator). They primarily need their schedule, assigned scenes, and the ability to mark footage as picked up or shot. Keep responses focused on their immediate assignments. Don't overwhelm with production-wide data unless asked.`,
    );
  } else if (role === 'editor') {
    lines.push(
      `## Behavioral Note`,
      `${name} is an editor focused on post-production. They need to know which assets are ready for editing, advance lifecycle stages, and track delivery status. Production scheduling details are secondary.`,
    );
  } else if (role === 'coordinator') {
    lines.push(
      `## Behavioral Note`,
      `${name} is a coordinator managing logistics. They need the full picture of scheduling, crew assignments, and call sheets. They can schedule scenes and assign crew but cannot modify contracts.`,
    );
  } else if (role === 'field_producer') {
    lines.push(
      `## Behavioral Note`,
      `${name} is a field producer assigned to specific cast members in the field. They need their cast's schedule, can mark scenes, and update field notes.`,
    );
  } else if (role === 'post_supervisor') {
    lines.push(
      `## Behavioral Note`,
      `${name} is a post supervisor who oversees post-production. They need lifecycle stage visibility, delivery tracking, and editor coordination.`,
    );
  } else if (role === 'staff' || role === 'producer') {
    lines.push(
      `## Behavioral Note`,
      `${name} has full production access. Show comprehensive data, flag alerts proactively, and execute any requested action.`,
    );
  }

  // Tool restrictions
  const restrictedTools = [
    'schedule_scene', 'assign_crew', 'mark_contract', 'advance_asset_stage',
    'update_crew_availability', 'create_crew_member', 'update_crew_member',
    'delete_scene', 'create_cast_contract', 'delete_cast_contract',
    'generate_call_sheet', 'get_production_alerts', 'update_production',
  ].filter((t) => !canUseTool(role, t));

  if (restrictedTools.length > 0) {
    lines.push('');
    lines.push(`## Restricted Actions`);
    lines.push(`Do NOT execute these tools for ${name} — they are above their access level:`);
    for (const tool of restrictedTools) {
      lines.push(`- ${tool}`);
    }
    lines.push(`If ${name} asks for a restricted action, explain that their role doesn't have permission and suggest they contact their coordinator or producer.`);
  }

  return lines.join('\n');
}
