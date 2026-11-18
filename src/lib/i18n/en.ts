export const en = {
  product: "Tether",
  skip: "Skip to content",
  control: "You are in control of anything you create here.",
  nav: {
    home: "Home",
    tasks: "Tasks",
    settings: "Settings",
  },
  home: {
    eyebrow: "Help, without handing over a password",
    title: "Stay in charge while someone you trust helps.",
    lede: "Make a checklist, invite one person, and keep the password to yourself. They can suggest. You mark what is done.",
    primary: "Start a checklist",
    returning: "Welcome back",
    returningBody: "Your name is saved on this server for this browser.",
    change: "Change your name",
    stepsTitle: "What the checklist will do",
    steps: [
      { title: "You make a short list", body: "A video call, a document, or something you write yourself." },
      { title: "You invite one person", body: "They get a link that expires. They do not get your password." },
      { title: "You mark what is done", body: "A helper cannot mark a step done. Approving a suggestion comes next." },
    ],
    limitsTitle: "What Tether does not do",
    limits: [
      "It does not collect passwords or sign in to other websites.",
      "It does not move money or submit forms for someone else.",
      "It does not make medical decisions.",
      "It does not send email. Nothing on this screen pretends otherwise.",
    ],
  },
  settings: {
    title: "Settings",
    intro: "Saving a name creates a private session for this browser. It is stored in Tether’s database. It is not a password and it is not an account on another website.",
    nameLabel: "What should we call you?",
    nameHint: "This is the name a helper would see later. Use the name your family already uses.",
    save: "Save name",
    saved: "Saved on this server. Refresh the page and the name is still here.",
    error: "Enter a name people will recognize. Use 60 characters or fewer.",
    disabledTitle: "Not available",
    disabledIntro: "These are turned off because no outside service is connected. Tether will not invent a result for them.",
    disabled: [
      { name: "Email delivery", detail: "Invitation links are not sent. You would copy a link yourself." },
      { name: "Sign-in with Google, Apple, or anyone else", detail: "There is no OAuth connection." },
      { name: "Password reset", detail: "There is no mailer to send a reset." },
      { name: "Payments", detail: "Tether does not charge anyone and has no payment provider." },
      { name: "Other websites", detail: "Tether cannot open, fill, or submit a page on another site." },
    ],
  },
  footer: {
    line: "Tether keeps help on a checklist you can see. It does not take over an account.",
  },
  notFound: {
    code: "404",
    title: "That page is not in Tether",
    body: "The address does not match a screen Tether serves. Nothing was invented to fill it.",
    home: "Back to the start",
  },
  error: {
    title: "Something went wrong on this screen",
    body: "Tether did not finish loading this view. Your saved name is still in the database. Try again.",
    retry: "Try again",
    home: "Back to the start",
  },
  loading: "Loading Tether",
};

export type Messages = typeof en;
