const NativeSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

type Callback = (transcript: string) => void;

export class VoiceTyping {
  static Supported = !!NativeSpeechRecognition;

  private recognition: SpeechRecognition | undefined;

  public enable(callback: Callback) {
    if (!VoiceTyping.Supported) {
      return;
    }

    this.recognition = this.recognition || new NativeSpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      const chunks: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        chunks.push(this.replaceEndingPunctuation(event.results[i][0].transcript));
      }
      callback(this.replaceInnerPunctuation(chunks.join(" ")));
    };

    this.recognition.start();
  }

  public disable() {
    this.recognition?.stop();
  }

  public replaceEndingPunctuation(text: string) {
    return text
      .trim()
      .replace(/[ \t]+/g, " ") // start with normalizing all multiple spaces into one space
      .replace(/\bperiod$/i, ".")
      .replace(/\s+([.])/g, "$1")
  }

  public replaceInnerPunctuation(text: string) {
    return text
      .trim()
      .replace(/[ \t]+/g, " ") // start with normalizing all multiple spaces into one space
      .replace(/\bquestion mark\b/gi, "?")
      .replace(/\bexclamation point\b/gi, "!")
      .replace(/\bcomma\b/gi, ",")
      .replace(/\bsemicolon\b/gi, ";")
      .replace(/\bcolon\b/gi, ":")
      .replace(/\b(hyphen|dash)\b/gi, "-")
      .replace(/\b(ellipsis|ellipses)\b/gi, "...")
      .replace(/\b(apostrophe|single quotes|single quote)\b/gi, "'")
      .replace(/\b(quotation mark|double quotes|double quote|start quote|end quote|quote)\b/gi, '"')
      .replace(/\b(newline|new line)\b/gi, "\n")
      .replace(/\bnew paragraph\b/gi, "\n\n")
      .replace(/\bsmiley face\b/gi, "😃")
      .replace(/\s+([.?!,;:])/g, "$1")
      .replace(/\s+([-])\s+/g, "$1")
      .replace(/\s+\.\.\./g, "...")
      .replace(/\s+(['])\s+/g, "$1")
      .replace(/(")(\s*[^"]*)(")?/g, (match, p1, p2, p3) => [p1, p2.trim(), p3||""].join(""))
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]+/g, " ") // end with normalizing all multiple spaces into one space again
      ;
  }
}
