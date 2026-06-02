const {
  EmbedBuilder,
  PermissionsBitField
} = require("discord.js");

module.exports = {
  name: "members",
  description: "List all server members",

  async execute(interaction) {

      const guild = interaction.guild;

      // Fetch all members (important)
      await guild.members.fetch();

      const members = guild.members.cache.map(m => {
          return `• ${m.user.tag}`;
      });

      // Discord message limit safety
      const chunks = [];
      const chunkSize = 20;

      for (let i = 0; i < members.length; i += chunkSize) {
          chunks.push(members.slice(i, i + chunkSize).join("\n"));
      }

      const embed = new EmbedBuilder()
          .setTitle(`👥 Server Members (${guild.memberCount})`)
          .setColor("Blue")
          .setDescription(chunks[0] || "No members found");

      await interaction.reply({
          embeds: [embed],
          ephemeral: true
      });

      // Send extra pages if needed
      for (let i = 1; i < chunks.length; i++) {
          await interaction.followUp({
              embeds: [
                  new EmbedBuilder()
                      .setTitle(`👥 Members Page ${i + 1}`)
                      .setDescription(chunks[i])
                      .setColor("Blue")
              ],
              ephemeral: true
          });
      }
  }
};