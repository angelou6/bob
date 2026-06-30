import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getStore, userAndBotInSameVC } from "../../utils/store.ts";
import { UserNotInSameVCError } from "../../errors/errors.ts";
import { AudioPlayerStatus } from "@discordjs/voice";

export default {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Re ordenar aleatoriamente la lista de reproducción."),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!(await userAndBotInSameVC(interaction))) {
      throw new UserNotInSameVCError();
    }

    const store = getStore(interaction);
    if (store.player.state.status === AudioPlayerStatus.Playing) {
      store.list.semiShuffle();
    } else {
      store.list.fullShuffle();
    }
    await interaction.reply(store.list.display());
  },
};
