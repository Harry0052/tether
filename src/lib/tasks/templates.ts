export const TEMPLATE_IDS = [
  "video_call",
  "find_document",
  "update_contact",
  "learn_app",
  "custom",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export type TaskTemplate = {
  id: TemplateId;
  title: string;
  summary: string;
  steps: string[];
};

export const TEMPLATES: TaskTemplate[] = [
  {
    id: "video_call",
    title: "Set up a video call",
    summary: "A list you follow together. Tether does not open the calling app or join the call.",
    steps: [
      "Write down who you want to see",
      "Pick a day and a time",
      "Open the calling app on your own phone",
      "Check the camera and the sound",
      "End the call when you are both ready",
    ],
  },
  {
    id: "find_document",
    title: "Find a document",
    summary: "Look for a paper or a file together. Do not send identity documents through Tether.",
    steps: [
      "Name the document you need",
      "Look in the usual folder or drawer",
      "Set it aside when you find it",
      "Say out loud where it is",
    ],
  },
  {
    id: "update_contact",
    title: "Update a phone number",
    summary: "You type the number on your own phone. Nobody else gets the password to that phone.",
    steps: [
      "Read the name you want to update",
      "Check the new number together",
      "Update the number on your own phone",
      "Read the saved number back",
    ],
  },
  {
    id: "learn_app",
    title: "Try one thing in an app",
    summary: "You stay on your own device. Stop whenever you want.",
    steps: [
      "Name the app",
      "Open it on your own device",
      "Try one small action you choose",
      "Stop when you want to stop",
    ],
  },
  {
    id: "custom",
    title: "A list you write",
    summary: "Write the steps in your own words. Keep it to something you can do together.",
    steps: [],
  },
];

export function templateById(id: string) {
  return TEMPLATES.find((template) => template.id === id) ?? null;
}

export function parseCustomSteps(value: string) {
  const steps = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (steps.length < 1) return { ok: false as const, message: "Write at least one step, on its own line." };
  if (steps.length > 8) return { ok: false as const, message: "Use 8 steps or fewer." };
  if (steps.some((step) => step.length > 200)) {
    return { ok: false as const, message: "Each step needs 200 characters or fewer." };
  }
  return { ok: true as const, steps };
}
