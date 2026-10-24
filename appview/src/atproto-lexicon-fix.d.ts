import { LexiconDoc as OriginalLexiconDoc } from "@atproto/lexicon";

declare module "@atproto/lexicon" {
  type LexiconDoc = {
    $type?: "com.atproto.lexicon.schema";
  } & OriginalLexiconDoc;
}
