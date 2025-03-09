import { Hono } from 'hono'
import { REST, Client, GatewayIntentBits, Routes, ApplicationCommandType, SlashCommandBuilder, } from 'discord.js'

const app = new Hono()

if (process.env.DISCORD_TOKEN === undefined) {
  throw new Error('DISCORD_TOKEN must be set')
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const roleCommand = new SlashCommandBuilder()
  .setName('recruit')
  .setDescription('募集するゲームを選択してメッセージを送信する')
  .addRoleOption(option => 
    option
      .setName('ゲーム')
      .setDescription('募集するゲームを選択 -- Choose the game you want to recruit')
      .setRequired(true)
  )
  .addNumberOption(option =>
    option
      .setName('募集人数')
      .setDescription('募集する人数を選択 -- Choose the number of people you want to recruit')
      .setRequired(true)
  )

client.once('ready', async () => {
  if (process.env.DISCORD_SERVER_ID === undefined) {
    throw new Error('DISCORD_TOKEN and DISCORD_SERVER_ID must be set')
  }

  console.log(`Logged in `)
  
  client.application?.commands.set([roleCommand], process.env.DISCORD_SERVER_ID)
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return

  if (interaction.commandName === 'recruit') {
    const guild = interaction.guild
    const selectedRole = interaction.options.get('ゲーム')?.role
    const selectedNumber = interaction.options.get('募集人数')?.value
    console.log(selectedNumber)
    if (!selectedRole) {
      await interaction.reply('ロールが選択されていません。')
      return
    }

    // ボットのロールや@everyoneを除外
    if (
      selectedRole.managed || 
      guild?.members.cache.some(member => member.user.bot && member.roles.cache.has(selectedRole.id)) || 
      selectedRole.name === '@everyone'
    ) {
      await interaction.reply({
        content: 'このロールは選択できません。',
        ephemeral: true // エラーメッセージは実行者にのみ表示
      })
      return
    }

    // ロールメンション + メッセージを送信
    await interaction.reply({
      content: `<@&${selectedRole.id}> @${selectedNumber} 募集!`,
      allowedMentions: {
        roles: [selectedRole.id]
      }
    })
  }
})

client.login(process.env.DISCORD_TOKEN)

app.get('/', async (c) => {
  return c.json('Hello Hono!')
})

export default app
