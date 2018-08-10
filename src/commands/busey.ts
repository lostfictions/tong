import { makeCommand } from "../util/handler";
import { randomInArray } from "../util";
import { maybeTraced } from "../components/trace";

export default makeCommand(
  {
    name: "busey",
    aliases: ["acro", "acronym"],
    description: "make buseyisms"
  },
  async ({ message: rawMessage, store }) => {
    const { message, prefix } = await maybeTraced(rawMessage, store);

    const wb = await store.get("wordBank");

    const letters = message
      .toLowerCase()
      .split("")
      .filter(char => /[A-Za-z]/.test(char));

    const acro: string[] = [];

    let lastWord: string | null = null;
    for (const l of letters) {
      let candidates: string[] | null = null;

      // First, try to find something that follows from our previous word
      if (lastWord) {
        const nexts: { [word: string]: number } | undefined = wb[lastWord];
        if (nexts != null) {
          candidates = Object.keys(nexts).filter(
            word => word != null && word.startsWith(l)
          );
        }
      }

      // Otherwise, just grab a random word that matches our letter
      if (candidates == null || candidates.length === 0) {
        candidates = Object.keys(wb).filter(
          word => word != null && word.startsWith(l)
        );
      }

      if (candidates != null && candidates.length > 0) {
        lastWord = randomInArray(candidates);
        acro.push(lastWord);
      }
    }

    // Capitalize each word and join them into a string.
    if (acro.length > 0) {
      return (
        prefix +
        acro.map(word => word[0].toUpperCase() + word.slice(1)).join(" ")
      );
    }
    return prefix + "Please Inspect Senseless Sentences";
  }
);
