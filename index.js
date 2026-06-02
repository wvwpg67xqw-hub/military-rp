require("dotenv").config();
const fs = require("fs");

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
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// LOAD COMMANDS
client.commands = new Map();

const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
    const cmd = require(`./commands/${file}`);
    client.commands.set(cmd.name, cmd);
}

// AUTO DEPLOY
async function deployCommands(client) {

    const commands = [];

    for (const cmd of client.commands.values()) {
        commands.push({
            name: cmd.name,
            description: cmd.description
        });
    }

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    try {
        console.log("🔄 Deploying slash commands...");

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log("✅ Commands deployed.");
    } catch (err) {
        console.error("❌ Deploy error:", err);
    }
}

// READY
client.once(Events.ClientReady, async (c) => {
    console.log(`✅ Logged in as ${c.user.tag}`);
    await deployCommands(client);
});

// INTERACTIONS
client.on(Events.InteractionCreate, async (interaction) => {

    if (interaction.isChatInputCommand()) {

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        return command.execute(interaction);
    }

    // BUTTON
    if (interaction.isButton() && interaction.customId === "request_command") {

        const modal = new ModalBuilder()
            .setCustomId("command_request_modal")
            .setTitle("Request a Command");

        const name = new TextInputBuilder()
            .setCustomId("command_name")
            .setLabel("Command Name")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const desc = new TextInputBuilder()
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
            new ActionRowBuilder().addComponents(desc),
            new ActionRowBuilder().addComponents(reason)
        );

        return interaction.showModal(modal);
    }

    // MODAL
    if (interaction.isModalSubmit() && interaction.customId === "command_request_modal") {

        const owner = await client.users.fetch(process.env.OWNER_ID);

        const embed = new EmbedBuilder()
            .setTitle("📨 New Command Request")
            .addFields(
                { name: "User", value: interaction.user.tag },
                { name: "Server", value: interaction.guild.name },
                { name: "Command", value: interaction.fields.getTextInputValue("command_name") },
                { name: "Description", value: interaction.fields.getTextInputValue("description") },
                { name: "Reason", value: interaction.fields.getTextInputValue("reason") }
            )
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`accept_${interaction.user.id}`)
                .setLabel("✅ Accept")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(`deny_${interaction.user.id}`)
                .setLabel("❌ Deny")
                .setStyle(ButtonStyle.Danger)
        );

        try {
            await owner.send({ embeds: [embed], components: [row] });
        } catch {}

        return interaction.reply({
            content: "✅ Request sent.",
            ephemeral: true
        });
    }

    // ACCEPT / DENY
    if (interaction.isButton()) {

        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: "❌ Not allowed.",
                ephemeral: true
            });
        }

        if (interaction.customId.startsWith("accept_")) {

            const userId = interaction.customId.split("_")[1];
            const user = await client.users.fetch(userId);

            await user.send("✅ Your request was ACCEPTED!");

            return interaction.reply({ content: "Accepted.", ephemeral: true });
        }

        if (interaction.customId.startsWith("deny_")) {

            const userId = interaction.customId.split("_")[1];
            const user = await client.users.fetch(userId);

            await user.send("❌ Your request was DENIED.");

            return interaction.reply({ content: "Denied.", ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);