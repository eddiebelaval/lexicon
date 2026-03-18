/**
 * Onboarding State Machine Engine
 *
 * Drives the Lexi-as-onboarding conversation. Each state defines:
 * - What Lexi says (message template)
 * - What input the user provides (widget type)
 * - How to validate the response
 * - What state to transition to next
 *
 * This is a deterministic state machine — no LLM calls.
 * Lexi's conversational personality comes from the message templates.
 */

import type { CrewRole } from '@/types';
import { generateId } from '@/lib/utils';

// ============================================
// State Types
// ============================================

export type OnboardingStateId =
  | 'greeting'
  | 'show_type'
  | 'show_name'
  | 'show_season'
  | 'show_dates'
  | 'data_import'
  | 'import_preview'
  | 'manual_cast_prompt'
  | 'manual_cast_loop'
  | 'cast_review'
  | 'crew_prompt'
  | 'manual_crew_loop'
  | 'crew_review'
  | 'user_role'
  | 'ready_to_launch'
  | 'launching'
  | 'complete';

export type InputType =
  | 'none'        // Lexi is speaking, auto-advance
  | 'choice'      // Multiple choice buttons
  | 'text'        // Free text input
  | 'file'        // File upload (.xlsx, .csv)
  | 'date_range'  // Start + end date pickers
  | 'confirm'     // Yes/No or Confirm/Edit
  | 'cast_entry'  // Name + location mini-form
  | 'crew_entry'  // Name + role + contact mini-form
  | 'launch'      // Launch button

export interface ChoiceOption {
  label: string;
  value: string;
  description?: string;
}

export interface OnboardingMessage {
  id: string;
  sender: 'lexi' | 'user';
  content: string;
  timestamp: number;
  inputType?: InputType;
  choices?: ChoiceOption[];
}

// ============================================
// Collected Data
// ============================================

export interface OnboardingData {
  showType: string;
  showName: string;
  season: string;
  startDate: string;
  endDate: string;
  cast: CastDraft[];
  crew: CrewDraft[];
  userRole: string;
  importedFile: ImportedFileData | null;
}

export interface CastDraft {
  name: string;
  location: string;
  description: string;
}

export interface CrewDraft {
  name: string;
  role: CrewRole;
  contactEmail: string;
  contactPhone: string;
}

export interface ImportedFileData {
  fileName: string;
  cast: CastDraft[];
  crew: CrewDraft[];
  scenes: ImportedScene[];
  rawHeaders: string[];
  totalRows: number;
}

export interface ImportedScene {
  title: string;
  date: string;
  location: string;
  castNames: string[];
}

// ============================================
// Shared Crew Role Options
// ============================================

export const CREW_ROLE_OPTIONS: { value: CrewRole; label: string }[] = [
  { value: 'staff', label: 'Executive Producer' },
  { value: 'producer', label: 'Producer' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'field_producer', label: 'Field Producer' },
  { value: 'post_supervisor', label: 'Post Supervisor' },
  { value: 'editor', label: 'Editor' },
  { value: 'ac', label: 'AC' },
  { value: 'fixer', label: 'Fixer' },
];

// ============================================
// State Machine
// ============================================

export interface OnboardingState {
  currentStateId: OnboardingStateId;
  messages: OnboardingMessage[];
  data: OnboardingData;
}

export function createInitialState(): OnboardingState {
  return {
    currentStateId: 'greeting',
    messages: [],
    data: {
      showType: '',
      showName: '',
      season: '',
      startDate: '',
      endDate: '',
      cast: [],
      crew: [],
      userRole: '',
      importedFile: null,
    },
  };
}

// ============================================
// State Definitions
// ============================================

interface StateDefinition {
  getMessage: (data: OnboardingData) => string;
  inputType: InputType;
  getChoices?: (data: OnboardingData) => ChoiceOption[];
  processInput: (input: string | Record<string, unknown>, data: OnboardingData) => {
    nextState: OnboardingStateId;
    updatedData: Partial<OnboardingData>;
    userMessage: string;
  };
}

const SHOW_TYPE_CHOICES: ChoiceOption[] = [
  { label: 'Unscripted / Reality', value: 'unscripted', description: 'Reality TV, docuseries, competition' },
  { label: 'Documentary', value: 'documentary', description: 'Feature doc, limited series' },
  { label: 'Scripted', value: 'scripted', description: 'Drama, comedy, limited series' },
  { label: 'Other', value: 'other', description: 'Something else entirely' },
];

// Role choices for the "what's your role" question (subset of CREW_ROLE_OPTIONS)
const ROLE_CHOICES: ChoiceOption[] = CREW_ROLE_OPTIONS
  .filter((r) => ['staff', 'producer', 'coordinator', 'field_producer', 'post_supervisor', 'editor'].includes(r.value))
  .map((r) => ({ label: r.label, value: r.value }));

// Shared helper: extract and append a cast entry
function processCastEntry(
  input: Record<string, unknown>,
  data: OnboardingData,
  doneState: OnboardingStateId,
  loopState: OnboardingStateId,
) {
  const name = (input.name as string || '').trim();
  if (!name || input.done === true) {
    return {
      nextState: doneState,
      updatedData: {},
      userMessage: data.cast.length > 0 ? "That's everyone" : 'Skip cast for now',
    };
  }
  return {
    nextState: loopState,
    updatedData: {
      cast: [
        ...data.cast,
        {
          name,
          location: (input.location as string || '').trim(),
          description: (input.description as string || '').trim(),
        },
      ],
    },
    userMessage: name,
  };
}

// Shared helper: extract and append a crew entry
function processCrewEntry(
  input: Record<string, unknown>,
  data: OnboardingData,
  doneState: OnboardingStateId,
  loopState: OnboardingStateId,
) {
  const name = (input.name as string || '').trim();
  if (!name || input.skip === true || input.done === true) {
    return {
      nextState: doneState,
      updatedData: {},
      userMessage: data.crew.length > 0 ? 'Move on' : 'Skip crew for now',
    };
  }
  return {
    nextState: loopState,
    updatedData: {
      crew: [
        ...data.crew,
        {
          name,
          role: (input.role as CrewRole) || 'ac',
          contactEmail: (input.contactEmail as string || '').trim(),
          contactPhone: (input.contactPhone as string || '').trim(),
        },
      ],
    },
    userMessage: `${name} (${input.role || 'AC'})`,
  };
}

export const STATE_DEFINITIONS: Record<OnboardingStateId, StateDefinition> = {
  greeting: {
    getMessage: () =>
      "Hey, I'm Lexi. I manage productions. Tell me about your show and I'll get everything set up.",
    inputType: 'none',
    processInput: () => ({
      nextState: 'show_type',
      updatedData: {},
      userMessage: '',
    }),
  },

  show_type: {
    getMessage: () => 'What kind of show are we working on?',
    inputType: 'choice',
    getChoices: () => SHOW_TYPE_CHOICES,
    processInput: (input) => ({
      nextState: 'show_name',
      updatedData: { showType: input as string },
      userMessage: SHOW_TYPE_CHOICES.find((c) => c.value === input)?.label || (input as string),
    }),
  },

  show_name: {
    getMessage: (data) => {
      const type = SHOW_TYPE_CHOICES.find((c) => c.value === data.showType)?.label || 'show';
      return `${type}. What's it called?`;
    },
    inputType: 'text',
    processInput: (input) => ({
      nextState: 'show_season',
      updatedData: { showName: (input as string).trim() },
      userMessage: input as string,
    }),
  },

  show_season: {
    getMessage: (data) =>
      `"${data.showName}" — got it. What season or cycle is this?`,
    inputType: 'text',
    processInput: (input) => ({
      nextState: 'show_dates',
      updatedData: { season: (input as string).trim() },
      userMessage: input as string,
    }),
  },

  show_dates: {
    getMessage: () =>
      "When does production run? Rough dates are fine — we can dial this in later.",
    inputType: 'date_range',
    processInput: (input) => {
      const dates = input as Record<string, unknown>;
      return {
        nextState: 'data_import',
        updatedData: {
          startDate: (dates.startDate as string) || '',
          endDate: (dates.endDate as string) || '',
        },
        userMessage: dates.startDate && dates.endDate
          ? `${dates.startDate} to ${dates.endDate}`
          : dates.startDate
            ? `Starting ${dates.startDate}`
            : "We'll figure it out later",
      };
    },
  },

  data_import: {
    getMessage: (data) =>
      `Good. "${data.showName}" Season ${data.season} is locked in.\n\nDo you have an existing spreadsheet with your cast, crew, or schedule? I can pull everything in from Excel or CSV.`,
    inputType: 'choice',
    getChoices: () => [
      { label: 'Upload a spreadsheet', value: 'upload' },
      { label: "I'll add everything manually", value: 'manual' },
    ],
    // "upload" is handled by the UI triggering file input + processFileImport
    // This processInput only handles "manual"
    processInput: (_input) => ({
      nextState: 'manual_cast_prompt',
      updatedData: {},
      userMessage: "I'll add everything manually",
    }),
  },

  import_preview: {
    getMessage: (data) => {
      if (!data.importedFile) return 'Processing your file...';
      const f = data.importedFile;
      const parts: string[] = [];
      if (f.cast.length > 0) parts.push(`${f.cast.length} cast member${f.cast.length !== 1 ? 's' : ''}`);
      if (f.crew.length > 0) parts.push(`${f.crew.length} crew member${f.crew.length !== 1 ? 's' : ''}`);
      if (f.scenes.length > 0) parts.push(`${f.scenes.length} scene${f.scenes.length !== 1 ? 's' : ''}`);
      return `I found ${parts.join(', ')} in "${f.fileName}". Look right?`;
    },
    inputType: 'confirm',
    getChoices: () => [
      { label: 'Looks good', value: 'confirm' },
      { label: 'Try a different file', value: 'retry' },
    ],
    processInput: (input, data) => {
      if (input === 'confirm') {
        return {
          nextState: 'crew_prompt',
          updatedData: {
            cast: data.importedFile?.cast || [],
            crew: data.importedFile?.crew || [],
          },
          userMessage: 'Looks good',
        };
      }
      return {
        nextState: 'data_import',
        updatedData: { importedFile: null },
        userMessage: 'Try a different file',
      };
    },
  },

  manual_cast_prompt: {
    getMessage: () =>
      "Let's start with your cast. Who's your first cast member?",
    inputType: 'cast_entry',
    processInput: (input, data) =>
      processCastEntry(input as Record<string, unknown>, data, 'crew_prompt', 'manual_cast_loop'),
  },

  manual_cast_loop: {
    getMessage: (data) =>
      `Added ${data.cast[data.cast.length - 1]?.name || 'them'}. Anyone else?`,
    inputType: 'cast_entry',
    processInput: (input, data) =>
      processCastEntry(input as Record<string, unknown>, data, 'cast_review', 'manual_cast_loop'),
  },

  cast_review: {
    getMessage: (data) => {
      if (data.cast.length === 0) return "No cast added. We can add them later from the dashboard.";
      const names = data.cast.map((c) => c.name).join(', ');
      return `Cast roster: ${names}. ${data.cast.length} total.`;
    },
    inputType: 'none',
    processInput: () => ({
      nextState: 'crew_prompt',
      updatedData: {},
      userMessage: '',
    }),
  },

  crew_prompt: {
    getMessage: (data) => {
      if (data.crew.length > 0) {
        return `I already have ${data.crew.length} crew from the import. Want to add more, or move on?`;
      }
      return "Now let's set up your crew. Who's on the team?";
    },
    inputType: 'crew_entry',
    processInput: (input, data) =>
      processCrewEntry(input as Record<string, unknown>, data, 'crew_review', 'manual_crew_loop'),
  },

  manual_crew_loop: {
    getMessage: (data) =>
      `Added ${data.crew[data.crew.length - 1]?.name || 'them'}. Who else?`,
    inputType: 'crew_entry',
    processInput: (input, data) =>
      processCrewEntry(input as Record<string, unknown>, data, 'crew_review', 'manual_crew_loop'),
  },

  crew_review: {
    getMessage: (data) => {
      if (data.crew.length === 0) return 'No crew added yet. You can invite them later.';
      const summary = data.crew.map((c) => `${c.name} (${c.role})`).join(', ');
      return `Crew: ${summary}. ${data.crew.length} total.`;
    },
    inputType: 'none',
    processInput: () => ({
      nextState: 'user_role',
      updatedData: {},
      userMessage: '',
    }),
  },

  user_role: {
    getMessage: () => "What's your role on this production?",
    inputType: 'choice',
    getChoices: () => ROLE_CHOICES,
    processInput: (input) => ({
      nextState: 'ready_to_launch',
      updatedData: { userRole: input as string },
      userMessage: ROLE_CHOICES.find((c) => c.value === input)?.label || (input as string),
    }),
  },

  ready_to_launch: {
    getMessage: (data) => {
      const parts: string[] = [
        `"${data.showName}" Season ${data.season}`,
      ];
      if (data.cast.length > 0) parts.push(`${data.cast.length} cast`);
      if (data.crew.length > 0) parts.push(`${data.crew.length} crew`);
      return `Here's what I'm setting up:\n\n${parts.join(' / ')}\n\nReady to launch?`;
    },
    inputType: 'launch',
    processInput: () => ({
      nextState: 'launching',
      updatedData: {},
      userMessage: 'Launch it',
    }),
  },

  launching: {
    getMessage: () => 'Setting everything up...',
    inputType: 'none',
    processInput: () => ({
      nextState: 'complete',
      updatedData: {},
      userMessage: '',
    }),
  },

  complete: {
    getMessage: (data) =>
      `Your production is live. "${data.showName}" is ready to go.\n\nHeading to your dashboard now.`,
    inputType: 'none',
    processInput: () => ({
      nextState: 'complete',
      updatedData: {},
      userMessage: '',
    }),
  },
};

// ============================================
// Engine Functions
// ============================================

function createMessage(
  sender: 'lexi' | 'user',
  content: string,
  inputType?: InputType,
  choices?: ChoiceOption[],
): OnboardingMessage {
  return {
    id: generateId(),
    sender,
    content,
    timestamp: Date.now(),
    inputType,
    choices,
  };
}

export function initConversation(): OnboardingState {
  const state = createInitialState();
  const def = STATE_DEFINITIONS.greeting;
  const greeting = createMessage('lexi', def.getMessage(state.data), 'none');

  return {
    ...state,
    messages: [greeting],
  };
}

export function advanceToNextState(state: OnboardingState): OnboardingState {
  const def = STATE_DEFINITIONS[state.currentStateId];
  if (!def) return state;

  if (def.inputType === 'none') {
    const result = def.processInput('', state.data);
    const nextDef = STATE_DEFINITIONS[result.nextState];
    if (!nextDef) return state;

    const nextMessage = createMessage(
      'lexi',
      nextDef.getMessage({ ...state.data, ...result.updatedData }),
      nextDef.inputType,
      nextDef.getChoices?.({ ...state.data, ...result.updatedData }),
    );

    return {
      ...state,
      currentStateId: result.nextState,
      data: { ...state.data, ...result.updatedData },
      messages: [...state.messages, nextMessage],
    };
  }

  return state;
}

export function processUserInput(
  state: OnboardingState,
  input: string | Record<string, unknown>,
): OnboardingState {
  const def = STATE_DEFINITIONS[state.currentStateId];
  if (!def) return state;

  const result = def.processInput(input, state.data);
  const updatedData = { ...state.data, ...result.updatedData };

  const userMsg = createMessage('user', result.userMessage);

  const nextDef = STATE_DEFINITIONS[result.nextState];
  if (!nextDef) {
    return {
      ...state,
      data: updatedData,
      messages: [...state.messages, userMsg],
    };
  }

  const lexiMsg = createMessage(
    'lexi',
    nextDef.getMessage(updatedData),
    nextDef.inputType,
    nextDef.getChoices?.(updatedData),
  );

  return {
    ...state,
    currentStateId: result.nextState,
    data: updatedData,
    messages: [...state.messages, userMsg, lexiMsg],
  };
}

export function processFileImport(
  state: OnboardingState,
  fileData: ImportedFileData,
): OnboardingState {
  const updatedData = { ...state.data, importedFile: fileData };

  const userMsg = createMessage('user', `Uploaded ${fileData.fileName}`);
  const nextDef = STATE_DEFINITIONS.import_preview;
  const lexiMsg = createMessage(
    'lexi',
    nextDef.getMessage(updatedData),
    nextDef.inputType,
    nextDef.getChoices?.(updatedData),
  );

  return {
    ...state,
    currentStateId: 'import_preview',
    data: updatedData,
    messages: [...state.messages, userMsg, lexiMsg],
  };
}

// ============================================
// LocalStorage Persistence
// ============================================

const STORAGE_KEY = 'lexicon-onboarding-state';

export function saveState(state: OnboardingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function loadState(): OnboardingState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
