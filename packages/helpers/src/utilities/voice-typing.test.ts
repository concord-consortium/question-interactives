import { VoiceTyping } from "./voice-typing";

const endingReplacements: Record<string,string> = {
  "": "",
  "Hello period": "Hello.",
  "Hello   Period": "Hello.",
};

const innerReplacements: Record<string,string> = {
  "": "",
  "test": "test",
  "test ": "test",
  "test  ": "test",
  "test   ": "test",
  "test   test": "test test",
  "Hello question mark": "Hello?",
  "Hello   Question mark": "Hello?",
  "Hello exclamation point": "Hello!",
  "Hello   Exclamation point": "Hello!",
  "Hello comma world": "Hello, world",
  "Hello   Comma world": "Hello, world",
  "Hello semicolon world": "Hello; world",
  "Hello   Semicolon world": "Hello; world",
  "Hello colon world": "Hello: world",
  "Hello   Colon world": "Hello: world",
  "Hello hyphen world": "Hello-world",
  "Hello   Hyphen world": "Hello-world",
  "Hello dash world": "Hello-world",
  "Hello   Dash world": "Hello-world",
  "Hello   ellipsis": "Hello...",
  "Hello   Ellipsis": "Hello...",
  "Hello   ellipses": "Hello...",
  "Hello   Ellipses": "Hello...",
  "Hello   apostrophe s": "Hello's",
  "Hello   Apostrophe s": "Hello's",
  "Hello   single quotes s": "Hello's",
  "Hello   Single quotes s": "Hello's",
  "Hello   single quote s": "Hello's",
  "Hello   Single quote s": "Hello's",
  "Hello   quotation mark world": "Hello \"world",
  "Hello   quotation mark world quotation mark": "Hello \"world\"",
  "Hello   quotation mark world quotation mark and quotation mark universe quotation mark": "Hello \"world\" and \"universe\"",
  "Hello   Quotation mark world": "Hello \"world",
  "Hello   double quotes world": "Hello \"world",
  "Hello   Double quotes world": "Hello \"world",
  "Hello   double quote world": "Hello \"world",
  "Hello   Double quote world": "Hello \"world",
  "Hello   start quote world": "Hello \"world",
  "Hello   Start quote world": "Hello \"world",
  "Hello   end quote world": "Hello \"world",
  "Hello   End quote world": "Hello \"world",
  "Hello   quote world": "Hello \"world",
  "Hello   Quote world": "Hello \"world",
  "Hello   newline world": "Hello\nworld",
  "Hello   Newline world": "Hello\nworld",
  "Hello   new line world": "Hello\nworld",
  "Hello   New line world": "Hello\nworld",
  "Hello   new paragraph world": "Hello\n\nworld",
  "Hello   New paragraph world": "Hello\n\nworld",
  "Hello   smiley face": "Hello 😃",
  "Hello   Smiley face": "Hello 😃",
};

describe("VoiceTyping", () => {
  it("replaces ending punctuation and spacing", () => {
    const vt = new VoiceTyping();

    for (const key in endingReplacements) {
      expect(vt.replaceEndingPunctuation(key)).toBe(endingReplacements[key]);
    }
  });

  it("replaces inner punctuation and spacing", () => {
    const vt = new VoiceTyping();

    for (const key in innerReplacements) {
      expect(vt.replaceInnerPunctuation(key)).toBe(innerReplacements[key]);
    }
  });
});