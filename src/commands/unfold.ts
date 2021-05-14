import { makeCommand } from "../util/handler";

import { setUnfoldEnabled, getUnfoldEnabled } from "../store/methods/unfold";

const USAGE = "unfold [enable|disable|on|off|true|false]";

export default makeCommand(
  {
    name: "unfold",
    description: "toggle unfolding videos in tweets",
    usage: USAGE,
  },
  async ({ message, store }): Promise<string> => {
    if (message.length === 0) {
      const enabled = await getUnfoldEnabled(store);
      return `unfolding is currently **${enabled ? "enabled" : "disabled"}**.`;
    }

    const trimmed = message.trim();
    if (trimmed === "enabled" || trimmed === "on" || trimmed === "true") {
      await setUnfoldEnabled(store, true);
      return `unfolding is now **enabled**.`;
    }
    if (trimmed === "disabled" || trimmed === "off" || trimmed === "false") {
      await setUnfoldEnabled(store, false);
      return `unfolding is now **disabled**.`;
    }

    return `unknown argument '${message}'.\n\nusage: ${USAGE}`;
  }
);
