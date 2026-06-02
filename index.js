require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    REST,
    Routes
} = require("discord.js");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// =====================
// AUTO DEPLOY COMMANDS
// =====================
async function deployCommands(client) {
    const commands = [
        {
            name: "setup-requests",
            description: "Create command request panel"
        }
    ];

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    try {
        console.log("🔄 Deploying slash commands...");

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log("✅ Slash commands deployed.");
    } catch (err) {
        console.error("❌ Command deploy error:", err);
    }
}

// =====================
// READY EVENT
// =====================
client.once(Events.ClientReady, async (c) => {
    console.log(`✅ Logged in as ${c.user.tag}`);

    await deployCommands(client);
});

// =====================
// INTERACTIONS
// =====================
client.on(Events.InteractionCreate, async (interaction) => {

    // =====================
    // SLASH COMMAND
    // =====================
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === "setup-requests") {

            const button = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("request_command")
                    .setLabel("💡 Request a Command")
                    .setStyle(ButtonStyle.Primary)
            );

            const embed = new EmbedBuilder()
                .setTitle("💡 Command Requests")
                .setDescription("Click the button below to request a new command.");

            await interaction.channel.send({
                embeds: [embed],
                components: [button]
            });

            return interaction.reply({
                content: "✅ Panel created.",
                ephemeral: true
            });
        }
    }

    // =====================
    // BUTTON CLICK
    // =====================
    if (interaction.isButton() && interaction.customId === "request_command") {

        const modal = new ModalBuilder()
            .setCustomId("command_request_modal")
            .setTitle("Request a Command");

        const name = new TextInputBuilder()
            .setCustomId("command_name")
            .setLabel("Command Name")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const description = new TextInputBuilder()
            .setCustomId("description")
            .setLabel("What should it do?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const reason = new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Why should it be added?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(name),
            new ActionRowBuilder().addComponents(description),
            new ActionRowBuilder().addComponents(reason)
        );

        return interaction.showModal(modal);
    }

    // =====================
    // MODAL SUBMIT
    // =====================
    if (interaction.isModalSubmit() && interaction.customId === "command_request_modal") {

        const commandName = interaction.fields.getTextInputValue("command_name");
        const description = interaction.fields.getTextInputValue("description");
        const reason = interaction.fields.getTextInputValue("reason");

        const owner = await client.users.fetch(process.env.OWNER_ID);

        const embed = new EmbedBuilder()
            .setTitle("📨 New Command Request")
            .addFields(
                { name: "User", value: interaction.user.tag },
                { name: "Server", value: interaction.guild.name },
                { name: "Command", value: commandName },
                { name: "Description", value: description },
                { name: "Reason", value: reason }
            )
            .setTimestamp();

        try {
            await owner.send({ embeds: [embed] });
        } catch (err) {
            console.log("❌ Couldn't DM owner.");
        }

        await interaction.reply({
            content: "✅ Request submitted!",
            ephemeral: true
        });
    }
});

// =====================
// LOGIN
// =====================
client.login(process.env.TOKEN);