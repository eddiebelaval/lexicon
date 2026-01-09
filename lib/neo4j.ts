/**
 * Neo4j Database Connection and Helpers
 *
 * This module provides:
 * - Connection management to Neo4j Aura
 * - Type-safe query execution
 * - Common query patterns for entities and relationships
 */

import neo4j, { Driver, Record as Neo4jRecord } from 'neo4j-driver';

// Singleton driver instance
let driver: Driver | null = null;

/**
 * Get or create the Neo4j driver instance
 */
export function getDriver(): Driver {
  if (!driver) {
    // Trim whitespace from env vars - Vercel can accidentally include newlines
    const uri = process.env.NEO4J_URI?.trim();
    const username = process.env.NEO4J_USERNAME?.trim();
    const password = process.env.NEO4J_PASSWORD?.trim();

    if (!uri || !username || !password) {
      throw new Error(
        'Missing Neo4j environment variables. Check NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD'
      );
    }

    driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
    });
  }

  return driver;
}

/**
 * Execute a read query
 */
export async function readQuery<T>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.READ });

  try {
    const result = await session.run(cypher, params);
    return result.records.map((record: Neo4jRecord) => recordToObject<T>(record));
  } finally {
    await session.close();
  }
}

/**
 * Execute a write query
 */
export async function writeQuery<T>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.WRITE });

  try {
    const result = await session.run(cypher, params);
    return result.records.map((record: Neo4jRecord) => recordToObject<T>(record));
  } finally {
    await session.close();
  }
}

/**
 * Convert Neo4j record to plain object
 */
function recordToObject<T>(record: Neo4jRecord): T {
  const obj: Record<string, unknown> = {};

  record.keys.forEach((key) => {
    const value = record.get(key);
    obj[key as string] = neo4jValueToJs(value);
  });

  return obj as T;
}

/**
 * Convert Neo4j values to JavaScript types
 */
function neo4jValueToJs(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle Neo4j integers
  if (neo4j.isInt(value)) {
    const intValue = value as { toNumber(): number };
    return intValue.toNumber();
  }

  // Handle Neo4j nodes
  if (typeof value === 'object' && 'properties' in value) {
    const node = value as { properties: Record<string, unknown> };
    return Object.fromEntries(
      Object.entries(node.properties).map(([k, v]) => [k, neo4jValueToJs(v)])
    );
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(neo4jValueToJs);
  }

  return value;
}

/**
 * Close the driver connection (for cleanup)
 */
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

/**
 * Health check for Neo4j connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const driver = getDriver();
    const session = driver.session();
    const result = await session.run('RETURN 1 as test');
    await session.close();
    return result.records.length > 0;
  } catch (error) {
    // Log error for debugging but still return false
    console.error('Neo4j health check failed:', error);
    throw error; // Re-throw so the API route can capture it
  }
}
