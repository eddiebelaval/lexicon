/**
 * Three Musketeers - Seed Data
 *
 * Prototype universe with characters, locations, factions, objects, and events
 * from Alexandre Dumas' classic novel.
 *
 * Run with: npm run seed
 */

// Load environment variables from .env.local before importing neo4j
import { config } from 'dotenv';
config({ path: '.env.local' });

import { writeQuery, closeDriver } from '../lib/neo4j';
import { generateId } from '../lib/utils';
import type {
  EntityType,
  RelationshipType,
  CreateEntityInput,
  CreateRelationshipInput,
} from '../types';

// Static UUID for the Three Musketeers demo universe
// This matches what we'll create in Supabase for the universe metadata
const UNIVERSE_ID = '11111111-1111-1111-1111-111111111111';

// ============================================
// Entities
// ============================================

interface SeedEntity extends Omit<CreateEntityInput, 'universeId'> {
  id: string;
}

const characters: SeedEntity[] = [
  {
    id: 'char-dartagnan',
    type: 'character',
    name: "d'Artagnan",
    aliases: ["Charles d'Artagnan", 'the Gascon'],
    description:
      'Young Gascon nobleman who travels to Paris to join the Musketeers. Brave, impetuous, and deeply loyal to his friends. Falls in love with Constance Bonacieux.',
    status: 'active',
  },
  {
    id: 'char-athos',
    type: 'character',
    name: 'Athos',
    aliases: ['Comte de la Fère'],
    description:
      'The eldest and most noble of the three musketeers. Carries a dark secret from his past involving Milady. Melancholic but fiercely honorable.',
    status: 'active',
  },
  {
    id: 'char-porthos',
    type: 'character',
    name: 'Porthos',
    aliases: ['M. du Vallon'],
    description:
      'The largest and strongest of the musketeers. Vain about his appearance and strength, but good-natured and utterly reliable in a fight.',
    status: 'active',
  },
  {
    id: 'char-aramis',
    type: 'character',
    name: 'Aramis',
    aliases: ["René d'Herblay"],
    description:
      'The most refined of the musketeers. Torn between his calling as a soldier and his desire to become a priest. Maintains several romantic entanglements.',
    status: 'active',
  },
  {
    id: 'char-milady',
    type: 'character',
    name: 'Milady de Winter',
    aliases: ['Anne de Breuil', 'Charlotte Backson', 'Countess de la Fère'],
    description:
      "The novel's primary antagonist. A beautiful and ruthless spy working for Cardinal Richelieu. Was once secretly married to Athos. Bears a fleur-de-lis brand marking her as a criminal.",
    status: 'deceased',
  },
  {
    id: 'char-richelieu',
    type: 'character',
    name: 'Cardinal Richelieu',
    aliases: ['Armand Jean du Plessis', 'His Eminence'],
    description:
      "The powerful chief minister of France. Manipulates events from behind the scenes. Not truly evil, but ruthless in pursuing France's interests and his own power.",
    status: 'active',
  },
  {
    id: 'char-louis',
    type: 'character',
    name: 'King Louis XIII',
    aliases: ['Louis the Just'],
    description:
      'The King of France. Well-meaning but weak, often manipulated by Richelieu. Suspicious of his wife but ultimately devoted to the crown.',
    status: 'active',
  },
  {
    id: 'char-anne',
    type: 'character',
    name: 'Queen Anne',
    aliases: ['Anne of Austria'],
    description:
      "Queen of France, wife of Louis XIII. Secretly in love with the Duke of Buckingham. Her affair with Buckingham and the diamond studs creates the novel's central conflict.",
    status: 'active',
  },
  {
    id: 'char-buckingham',
    type: 'character',
    name: 'Duke of Buckingham',
    aliases: ['George Villiers'],
    description:
      "The most powerful nobleman in England. Passionately in love with Queen Anne. His romantic feelings lead to war between England and France. Assassinated by Felton.",
    status: 'deceased',
  },
  {
    id: 'char-constance',
    type: 'character',
    name: 'Constance Bonacieux',
    aliases: [],
    description:
      "d'Artagnan's love interest. Seamstress to the Queen and her confidante. Brave and resourceful in helping the Queen. Murdered by Milady.",
    status: 'deceased',
  },
  {
    id: 'char-bonacieux',
    type: 'character',
    name: 'Monsieur Bonacieux',
    aliases: ['Jacques-Michel Bonacieux'],
    description:
      "Constance's husband. A cowardly landlord who betrays his wife to the Cardinal for money and status.",
    status: 'active',
  },
  {
    id: 'char-rochefort',
    type: 'character',
    name: 'Count de Rochefort',
    aliases: ['The Man from Meung'],
    description:
      "The Cardinal's most trusted agent. Duels with d'Artagnan multiple times throughout the story. Scarred face makes him recognizable.",
    status: 'active',
  },
  {
    id: 'char-planchet',
    type: 'character',
    name: 'Planchet',
    aliases: [],
    description:
      "d'Artagnan's loyal servant. Brave despite his humble position. Proves crucial in delivering messages and participating in adventures.",
    status: 'active',
  },
  {
    id: 'char-treville',
    type: 'character',
    name: 'Captain de Tréville',
    aliases: ['Jean-Armand du Peyrer'],
    description:
      "Captain of the King's Musketeers. A Gascon like d'Artagnan, he serves as mentor and protector to the four friends.",
    status: 'active',
  },
  {
    id: 'char-winter',
    type: 'character',
    name: 'Lord de Winter',
    aliases: [],
    description:
      "Milady's brother-in-law. Becomes her enemy after discovering her true nature. Imprisons her but she escapes.",
    status: 'active',
  },
];

const locations: SeedEntity[] = [
  {
    id: 'loc-paris',
    type: 'location',
    name: 'Paris',
    aliases: [],
    description:
      'The capital of France and primary setting of the novel. Home to the Musketeers, the Louvre, and countless intrigues.',
    status: 'active',
  },
  {
    id: 'loc-larochelle',
    type: 'location',
    name: 'La Rochelle',
    aliases: [],
    description:
      'Huguenot stronghold besieged by the royal army. The siege provides backdrop for much of the action and Milady\'s schemes.',
    status: 'active',
  },
  {
    id: 'loc-england',
    type: 'location',
    name: 'England',
    aliases: ['Britain'],
    description:
      "The Duke of Buckingham's realm. d'Artagnan must travel there to retrieve the Queen's diamond studs.",
    status: 'active',
  },
  {
    id: 'loc-louvre',
    type: 'location',
    name: 'The Louvre',
    aliases: ['Louvre Palace'],
    description:
      'The royal palace in Paris. Site of court intrigue and the fateful ball where the diamond studs were needed.',
    status: 'active',
  },
  {
    id: 'loc-palais-cardinal',
    type: 'location',
    name: 'Palais-Cardinal',
    aliases: ['Palais Royal'],
    description:
      "Cardinal Richelieu's residence in Paris. Center of his political machinations.",
    status: 'active',
  },
  {
    id: 'loc-meung',
    type: 'location',
    name: 'Meung',
    aliases: ['Meung-sur-Loire'],
    description:
      "Small town where d'Artagnan first encounters Rochefort and Milady, setting the story in motion.",
    status: 'active',
  },
  {
    id: 'loc-calais',
    type: 'location',
    name: 'Calais',
    aliases: [],
    description:
      "French port town on the English Channel. Crucial crossing point for journeys to England.",
    status: 'active',
  },
  {
    id: 'loc-bethune',
    type: 'location',
    name: 'Béthune',
    aliases: [],
    description:
      "Town in northern France where Constance is hidden in a convent, and where Milady finds and poisons her.",
    status: 'active',
  },
];

const factions: SeedEntity[] = [
  {
    id: 'fac-musketeers',
    type: 'faction',
    name: "The King's Musketeers",
    aliases: ['Mousquetaires du Roi', 'Musketeers'],
    description:
      "Elite military company serving King Louis XIII directly. Rivals of the Cardinal's Guards. Known for their skill, bravery, and distinctive blue cloaks.",
    status: 'active',
  },
  {
    id: 'fac-cardinals-guards',
    type: 'faction',
    name: "Cardinal's Guards",
    aliases: ["Gardes du Cardinal", "Richelieu's Guards"],
    description:
      "Private military force serving Cardinal Richelieu. Constantly clash with the Musketeers in street duels.",
    status: 'active',
  },
  {
    id: 'fac-french-crown',
    type: 'faction',
    name: 'French Crown',
    aliases: ['Royal Court', 'House of Bourbon'],
    description:
      'The ruling monarchy of France under King Louis XIII. Includes the royal court and its various factions.',
    status: 'active',
  },
  {
    id: 'fac-english-crown',
    type: 'faction',
    name: 'English Crown',
    aliases: ['Court of St. James'],
    description:
      "The English monarchy and court, currently in conflict with France. The Duke of Buckingham's domain.",
    status: 'active',
  },
];

const objects: SeedEntity[] = [
  {
    id: 'obj-studs',
    type: 'object',
    name: 'The Diamond Studs',
    aliases: ['Diamond Tags', "Queen's Diamonds"],
    description:
      "Twelve diamond studs given by Louis XIII to Queen Anne. She secretly gave them to Buckingham. Their retrieval forms the novel's central quest.",
    status: 'active',
  },
  {
    id: 'obj-execution-order',
    type: 'object',
    name: 'The Order of Execution',
    aliases: ["Cardinal's Pass", 'Safe Conduct'],
    description:
      "A signed letter from the Cardinal giving the bearer permission to act in his name. Milady possesses one, which d'Artagnan eventually obtains.",
    status: 'active',
  },
  {
    id: 'obj-brand',
    type: 'object',
    name: "Milady's Brand",
    aliases: ['Fleur-de-lis Brand'],
    description:
      "A fleur-de-lis branded on Milady's shoulder, marking her as a convicted criminal. This mark leads to Athos's discovery of her true nature.",
    status: 'active',
  },
];

const events: SeedEntity[] = [
  {
    id: 'evt-studs-affair',
    type: 'event',
    name: 'The Diamond Studs Affair',
    aliases: ["The Queen's Diamonds"],
    description:
      "The central plot: Queen Anne gives her diamond studs to Buckingham. Richelieu discovers this and plots to expose her. d'Artagnan and the musketeers race to England to retrieve them before the royal ball.",
    status: 'active',
  },
  {
    id: 'evt-siege',
    type: 'event',
    name: 'Siege of La Rochelle',
    aliases: ['La Rochelle Campaign'],
    description:
      "Major military operation against the Huguenot stronghold. The musketeers serve in the siege while Milady carries out her schemes. Backdrop for the Bastion Saint-Gervais wager.",
    status: 'active',
  },
  {
    id: 'evt-execution',
    type: 'event',
    name: 'Execution of Milady',
    aliases: ["Milady's Death"],
    description:
      "The climax: After Milady murders Constance, the four friends, Lord de Winter, and an executioner capture and behead her near Béthune.",
    status: 'active',
  },
  {
    id: 'evt-joins-musketeers',
    type: 'event',
    name: "d'Artagnan Joins the Musketeers",
    aliases: [],
    description:
      "d'Artagnan officially becomes a musketeer after his heroic actions during the diamond studs affair and the siege of La Rochelle.",
    status: 'active',
  },
  {
    id: 'evt-assassination',
    type: 'event',
    name: 'Assassination of Buckingham',
    aliases: ["Buckingham's Death"],
    description:
      "The Duke of Buckingham is stabbed by John Felton, a Puritan officer manipulated by Milady. Dies professing his love for Queen Anne.",
    status: 'active',
  },
];

// ============================================
// Relationships
// ============================================

interface SeedRelationship {
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  context: string;
  strength: 1 | 2 | 3 | 4 | 5;
  ongoing: boolean;
}

const relationships: SeedRelationship[] = [
  // d'Artagnan's relationships
  {
    sourceId: 'char-dartagnan',
    targetId: 'char-constance',
    type: 'loves',
    context: "True love that motivates d'Artagnan throughout the story",
    strength: 5,
    ongoing: false, // She dies
  },
  {
    sourceId: 'char-dartagnan',
    targetId: 'fac-musketeers',
    type: 'member_of',
    context: 'Aspires to join, eventually becomes full member',
    strength: 5,
    ongoing: true,
  },
  {
    sourceId: 'char-dartagnan',
    targetId: 'char-athos',
    type: 'knows',
    context: 'Best friends and brothers-in-arms. Athos serves as mentor.',
    strength: 5,
    ongoing: true,
  },
  {
    sourceId: 'char-dartagnan',
    targetId: 'char-porthos',
    type: 'knows',
    context: 'Close friends and fellow adventurers',
    strength: 5,
    ongoing: true,
  },
  {
    sourceId: 'char-dartagnan',
    targetId: 'char-aramis',
    type: 'knows',
    context: 'Close friends, share many adventures together',
    strength: 5,
    ongoing: true,
  },
  {
    sourceId: 'char-dartagnan',
    targetId: 'char-rochefort',
    type: 'opposes',
    context: 'Sworn enemies from their first meeting in Meung',
    strength: 4,
    ongoing: true,
  },

  // Athos and Milady
  {
    sourceId: 'char-athos',
    targetId: 'char-milady',
    type: 'family_of',
    context: 'Secret marriage before the story begins. He believed he killed her.',
    strength: 5,
    ongoing: false,
  },
  {
    sourceId: 'char-athos',
    targetId: 'char-milady',
    type: 'opposes',
    context: 'Becomes her enemy after discovering she survived',
    strength: 5,
    ongoing: false,
  },

  // Milady's machinations
  {
    sourceId: 'char-milady',
    targetId: 'char-richelieu',
    type: 'works_for',
    context: 'Primary spy and assassin for the Cardinal',
    strength: 5,
    ongoing: false,
  },
  {
    sourceId: 'char-milady',
    targetId: 'char-dartagnan',
    type: 'opposes',
    context: "Tries to seduce then kill him after he discovers her secret",
    strength: 5,
    ongoing: false,
  },
  {
    sourceId: 'char-milady',
    targetId: 'char-constance',
    type: 'opposes',
    context: 'Poisons Constance in revenge against d\'Artagnan',
    strength: 5,
    ongoing: false,
  },
  {
    sourceId: 'char-milady',
    targetId: 'char-buckingham',
    type: 'loves',
    context: 'Former affair, now turned to hatred',
    strength: 3,
    ongoing: false,
  },

  // Cardinal Richelieu
  {
    sourceId: 'char-richelieu',
    targetId: 'char-louis',
    type: 'works_for',
    context: 'Chief Minister to the King, but often manipulates him',
    strength: 4,
    ongoing: true,
  },
  {
    sourceId: 'char-richelieu',
    targetId: 'char-anne',
    type: 'opposes',
    context: 'Seeks to expose her affair and reduce her influence',
    strength: 4,
    ongoing: true,
  },
  {
    sourceId: 'char-richelieu',
    targetId: 'char-buckingham',
    type: 'opposes',
    context: 'Political enemies, leads France against England',
    strength: 5,
    ongoing: false,
  },

  // Royal relationships
  {
    sourceId: 'char-anne',
    targetId: 'char-buckingham',
    type: 'loves',
    context: 'Secret, forbidden love that endangers both nations',
    strength: 5,
    ongoing: false,
  },
  {
    sourceId: 'char-anne',
    targetId: 'char-louis',
    type: 'family_of',
    context: 'Royal marriage, strained by politics and suspicion',
    strength: 3,
    ongoing: true,
  },
  {
    sourceId: 'char-anne',
    targetId: 'obj-studs',
    type: 'possesses',
    context: 'Gift from King, secretly gave to Buckingham',
    strength: 5,
    ongoing: false,
  },

  // Faction rivalries
  {
    sourceId: 'fac-musketeers',
    targetId: 'fac-cardinals-guards',
    type: 'opposes',
    context: 'Constant rivalry, frequent street duels',
    strength: 5,
    ongoing: true,
  },

  // Constance
  {
    sourceId: 'char-constance',
    targetId: 'char-anne',
    type: 'works_for',
    context: "Queen's seamstress and confidante",
    strength: 4,
    ongoing: false,
  },
  {
    sourceId: 'char-constance',
    targetId: 'char-bonacieux',
    type: 'family_of',
    context: 'Unhappy marriage',
    strength: 2,
    ongoing: false,
  },

  // Rochefort
  {
    sourceId: 'char-rochefort',
    targetId: 'char-richelieu',
    type: 'works_for',
    context: "The Cardinal's most trusted agent",
    strength: 5,
    ongoing: true,
  },

  // Servants
  {
    sourceId: 'char-planchet',
    targetId: 'char-dartagnan',
    type: 'works_for',
    context: "Loyal valet to d'Artagnan",
    strength: 5,
    ongoing: true,
  },

  // Captain de Tréville
  {
    sourceId: 'char-treville',
    targetId: 'fac-musketeers',
    type: 'member_of',
    context: 'Captain and commander of the Musketeers',
    strength: 5,
    ongoing: true,
  },
  {
    sourceId: 'char-treville',
    targetId: 'char-dartagnan',
    type: 'knows',
    context: 'Mentor and protector, fellow Gascon',
    strength: 4,
    ongoing: true,
  },

  // Lord de Winter
  {
    sourceId: 'char-winter',
    targetId: 'char-milady',
    type: 'family_of',
    context: 'Brother-in-law, she married his brother',
    strength: 3,
    ongoing: false,
  },
  {
    sourceId: 'char-winter',
    targetId: 'char-milady',
    type: 'opposes',
    context: 'Discovers her true nature, tries to imprison her',
    strength: 5,
    ongoing: false,
  },

  // Events participation
  {
    sourceId: 'char-dartagnan',
    targetId: 'evt-studs-affair',
    type: 'participated_in',
    context: 'Led the mission to retrieve the diamond studs',
    strength: 5,
    ongoing: false,
  },
  {
    sourceId: 'char-athos',
    targetId: 'evt-execution',
    type: 'participated_in',
    context: 'Led the tribunal that condemned Milady',
    strength: 5,
    ongoing: false,
  },
  {
    sourceId: 'char-milady',
    targetId: 'evt-assassination',
    type: 'participated_in',
    context: 'Manipulated Felton into killing Buckingham',
    strength: 5,
    ongoing: false,
  },

  // Location associations
  {
    sourceId: 'fac-musketeers',
    targetId: 'loc-paris',
    type: 'located_at',
    context: 'Based in Paris, serving the King',
    strength: 5,
    ongoing: true,
  },
  {
    sourceId: 'char-buckingham',
    targetId: 'loc-england',
    type: 'located_at',
    context: 'Most powerful noble in England',
    strength: 5,
    ongoing: false,
  },
  {
    sourceId: 'evt-siege',
    targetId: 'loc-larochelle',
    type: 'located_at',
    context: 'The siege took place at La Rochelle',
    strength: 5,
    ongoing: false,
  },
];

// ============================================
// Seed Functions
// ============================================

async function clearUniverse() {
  console.log('Clearing existing universe data...');
  await writeQuery(
    `
    MATCH (e:Entity {universeId: $universeId})
    DETACH DELETE e
    `,
    { universeId: UNIVERSE_ID }
  );
}

async function seedEntities() {
  console.log('Seeding entities...');

  const allEntities = [
    ...characters,
    ...locations,
    ...factions,
    ...objects,
    ...events,
  ];

  for (const entity of allEntities) {
    await writeQuery(
      `
      CREATE (e:Entity {
        id: $id,
        type: $type,
        name: $name,
        aliases: $aliases,
        description: $description,
        status: $status,
        universeId: $universeId,
        metadata: $metadata,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      `,
      {
        ...entity,
        aliases: entity.aliases || [],
        metadata: JSON.stringify(entity.metadata || {}),
        universeId: UNIVERSE_ID,
      }
    );
  }

  console.log(`Created ${allEntities.length} entities`);
}

async function seedRelationships() {
  console.log('Seeding relationships...');

  for (const rel of relationships) {
    await writeQuery(
      `
      MATCH (source:Entity {id: $sourceId})
      MATCH (target:Entity {id: $targetId})
      CREATE (source)-[r:${rel.type.toUpperCase()} {
        id: $id,
        type: $type,
        context: $context,
        strength: $strength,
        ongoing: $ongoing
      }]->(target)
      `,
      {
        sourceId: rel.sourceId,
        targetId: rel.targetId,
        id: generateId(),
        type: rel.type,
        context: rel.context,
        strength: rel.strength,
        ongoing: rel.ongoing,
      }
    );
  }

  console.log(`Created ${relationships.length} relationships`);
}

async function main() {
  console.log('\n🗡️  Three Musketeers Seed Script\n');
  console.log('================================\n');

  try {
    await clearUniverse();
    await seedEntities();
    await seedRelationships();

    console.log('\n✅ Seeding complete!\n');
    console.log('Summary:');
    console.log(`  - Characters: ${characters.length}`);
    console.log(`  - Locations: ${locations.length}`);
    console.log(`  - Factions: ${factions.length}`);
    console.log(`  - Objects: ${objects.length}`);
    console.log(`  - Events: ${events.length}`);
    console.log(`  - Relationships: ${relationships.length}`);
    console.log('\n"All for one, and one for all!" 🗡️\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await closeDriver();
  }
}

main();
