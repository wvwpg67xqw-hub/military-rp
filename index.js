require('dotenv').config();
const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Events,
    EmbedBuilder
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {

    // Button Click
    if (interaction.isButton() && interaction.customId === 'request_command') {

        const modal = new ModalBuilder()
            .setCustomId('command_request_modal')
            .setTitle('Request a Command');

        const commandName = new TextInputBuilder()
            .setCustomId('command_name')
            .setLabel('Command Name')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const description = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('What should it do?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const reason = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Why should it be added?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(commandName),
            new ActionRowBuilder().addComponents(description),
            new ActionRowBuilder().addComponents(reason)
        );

        return interaction.showModal(modal);
    }

    // Modal Submit
    if (
        interaction.isModalSubmit() &&
        interaction.customId === 'command_request_modal'
    ) {

        const commandName =
            interaction.fields.getTextInputValue('command_name');

        const description =
            interaction.fields.getTextInputValue('description');

        const reason =
            interaction.fields.getTextInputValue('reason');

        const owner = await client.users.fetch(process.env.OWNER_ID);

        const embed = new EmbedBuilder()
            .setTitle('📨 New Command Request')
            .addFields(
                { name: 'User', value: `${interaction.user.tag}` },
                { name: 'Server', value: interaction.guild.name },
                { name: 'Command', value: commandName },
                { name: 'Description', value: description },
                { name: 'Reason', value: reason }
            )
            .setTimestamp();

        await owner.send({ embeds: [embed] });

        await interaction.reply({
            content: '✅ Your command request has been submitted!',
            ephemeral: true
        });
    }
});

client.login(process.env.TOKEN);