const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  name: "setup-requests",
  description: "Create command request panel",

  async execute(interaction) {

      const button = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
              .setCustomId("request_command")
              .setLabel("💡 Request a Command")
              .setStyle(ButtonStyle.Primary)
      );

      const embed = new EmbedBuilder()
          .setTitle("💡 Command Requests")
          .setDescription("Click the button below to request a command.");

      await interaction.channel.send({
          embeds: [embed],
          components: [button]
      });

      return interaction.reply({
          content: "✅ Panel created.",
          ephemeral: true
      });
  }
};