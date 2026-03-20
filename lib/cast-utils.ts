/**
 * Cast Name Utilities
 *
 * Resolves cast entity IDs to human-readable display names.
 * Fallback chain: castName (DB) > parsed entityId > raw entityId
 */

/**
 * Get display name with fallback chain: castName > parsed entityId
 */
export function getCastDisplayName(contract: { castName?: string | null; castEntityId: string }): string {
  if (contract.castName) return contract.castName;
  return entityIdToDisplayName(contract.castEntityId);
}

/**
 * Parse entity ID slug to display name.
 * "cast-chantel+ashley" -> "Chantel Ashley"
 * "cast-alliya" -> "Alliya"
 */
/**
 * Generate stable entity ID from cast name.
 * "Kara & Guillermo" -> "cast-kara+guillermo"
 */
export function castNameToEntityId(name: string): string {
  return 'cast-' + name
    .toLowerCase()
    .replace(/\s*&\s*/g, '+')
    .replace(/[^a-z0-9+]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function entityIdToDisplayName(entityId: string): string {
  return entityId
    .replace(/^cast-/, '')
    .replace(/\+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
