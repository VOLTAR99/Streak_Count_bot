const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const prefix = '!';
const GENERAL_CHANNEL_ID = 'Channel ID';  //bot will reads command in this channel only
const DAILY_CHALLENGES_CHANNEL_NAME = 'Channel ID';  //any announcements made by the bot will be shown in this channel

const streaks = new Map();
const lastActivity = new Map();
const cron = require('node-cron');

// Function to announce top 3 streak users and reset streaks
function announceTopStreaksAndReset() {
  const topStreaks = Array.from(streaks.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

  if (topStreaks.length > 0) {
    const topStreaksMessage = topStreaks.map(([userId, streak], index) => {
      const member = client.guilds.cache.get('Server ID').members.cache.get(userId);
      return `${index + 1}. ${member ? member.user.tag : 'Unknown User'}: ${streak} days`;
    }).join('\n');

    const challengeCompletionChannel = client.channels.cache.find(channel => channel.name === 'challenge-complition'); // Change this to the correct channel name
    if (challengeCompletionChannel) {
      challengeCompletionChannel.send(`Congratulations to the top 3 streak users of the week!\n${topStreaksMessage}`);
    }
  } else {
    console.log('No streaks recorded yet.');
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Schedule the function to run every Sunday at midnight (00:00)
  cron.schedule('0 0 * * 0', () => {
    announceTopStreaksAndReset();
  });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'activity' || command === 'topstreaks' || command === 'checkstreak' || command === 'resetstreak') {
      if (message.channel.id !== GENERAL_CHANNEL_ID) {
        message.reply(`You can't use this command here! This command can only be used in <#${GENERAL_CHANNEL_ID}>`);
        return;
      }

     if (command === 'activity') {
  const userId = message.author.id;
  const now = new Date();
  const lastActivityDate = lastActivity.get(userId);
  
  let currentStreak = streaks.get(userId) || 0;

  if (!lastActivityDate || !isSameDay(now, lastActivityDate)) {
    if (lastActivityDate && !isSameDay(now, lastActivityDate)) {
      // Check if the user used the command yesterday
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStreak = streaks.get(userId);

      if (yesterdayStreak && isSameDay(yesterday, lastActivityDate)) {
        currentStreak = yesterdayStreak + 1;
      } else {
        currentStreak = 1;
      }
    } else {
      // User is using the command for the first time today
      if (currentStreak === 0) {
        currentStreak = 1;
      }
    }
  

  streaks.set(userId, currentStreak);
  lastActivity.set(userId, now);

  const newStreak = streaks.get(userId);
  message.reply(`Your activity streak: ${newStreak}`);

          const member = message.guild.members.cache.get(userId);
          if (member) {
            const currentRoles = member.roles.cache;

            if (newStreak >= 100) {
              const role100 = message.guild.roles.cache.find((r) => r.name === '100 Days Challenge');
              if (role100) {
                member.roles.add(role100);
                message.guild.channels.cache.get(DAILY_CHALLENGES_CHANNEL_NAME).send(`<@${userId}> has completed the 100 Days Challenge and earned the "100 Days Challenge" role! Congrats, everyone!`);
              }

              // Remove lower-level roles if they exist
              const role30 = message.guild.roles.cache.find((r) => r.name === '30 Days Challenge');
              const role50 = message.guild.roles.cache.find((r) => r.name === '50 Days Challenge');

              if (role30 && currentRoles.has(role30.id)) {
                member.roles.remove(role30);
              }
              if (role50 && currentRoles.has(role50.id)) {
                member.roles.remove(role50);
              }
            } else if (newStreak >= 50) {
              const role50 = message.guild.roles.cache.find((r) => r.name === '50 Days Challenge');
              if (role50) {
                member.roles.add(role50);
                message.guild.channels.cache.get(DAILY_CHALLENGES_CHANNEL_NAME).send(`<@${userId}> has completed the 50 Days Challenge and earned the "50 Days Challenge" role! Congrats, everyone!`);
              }

              // Remove lower-level role if it exists
              const role30 = message.guild.roles.cache.find((r) => r.name === '30 Days Challenge');
              if (role30 && currentRoles.has(role30.id)) {
                member.roles.remove(role30);
              }
            } else if (newStreak >= 30) {
              const role30 = message.guild.roles.cache.find((r) => r.name === '30 Days Challenge');
              if (role30) {
                member.roles.add(role30);
                message.guild.channels.cache.get(DAILY_CHALLENGES_CHANNEL_NAME).send(`<@${userId}> has completed the 30 Days Challenge and earned the "30 Days Challenge" role! Congrats, everyone!`);
              }

              // Remove higher-level roles if they exist
              const role50 = message.guild.roles.cache.find((r) => r.name === '50 Days Challenge');
              const role100 = message.guild.roles.cache.find((r) => r.name === '100 Days Challenge');

              if (role50 && currentRoles.has(role50.id)) {
                member.roles.remove(role50);
              }
              if (role100 && currentRoles.has(role100.id)) {
                member.roles.remove(role100);
              }
            }
          } 
        }
          else {
            message.reply('You have already updated your streak today.');
          }
      } else if (command === 'checkstreak') { // New command to check streak
        const userId = message.mentions.users.first()?.id || message.author.id;
        const userStreak = streaks.get(userId);

        if (userStreak !== undefined) {
          message.reply(`User's streak: ${userStreak}`);
        } else {
          message.reply('No streak recorded for this user.');
        }
      } else if (command === 'resetstreak') {
        if (!message.member.roles.cache.some(role => role.name === 'Moderator')) {
          message.reply('You do not have permission to use this command.');
          return;
        }

        const mentionedUser = message.mentions.users.first();

        if (!mentionedUser) {
          message.reply('Please mention a user to reset their streak.');
          return;
        }

        const userIdToReset = mentionedUser.id;

        if (streaks.has(userIdToReset)) {
          streaks.delete(userIdToReset);
          lastActivity.delete(userIdToReset);
          message.reply(`Streak for <@${userIdToReset}> has been reset.`);
        } else {
          message.reply(`No streak recorded for <@${userIdToReset}>.`);
        }
      } else if (command === 'topstreaks') {
        const topStreaks = Array.from(streaks.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

        if (topStreaks.length > 0) {
          const topStreaksMessage = topStreaks.map(([userId, streak], index) => {
            const member = message.guild.members.cache.get(userId);
            return `${index + 1}. ${member ? member.user.tag : 'Unknown User'}: ${streak} days`;
          }).join('\n');

          message.channel.send(`Top 3 Streaks:\n${topStreaksMessage}`);
        } else {
          message.channel.send('No streaks recorded yet.');
        }
      }
    }
  }
});

function isSameDay(date1, date2) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

client.on('channelCreate', async (channel) => {
  if (channel.name === DAILY_CHALLENGES_CHANNEL_NAME) {
    const members = await channel.members.fetch();
    members.forEach((member) => {
      lastActivity.set(member.id, new Date(0));
      channel.send(`Welcome to the Daily Challenges, ${member}! Start completing the challenges and gain the UNIQUE role as a reward. Use the command "!activity" to check your current streak`);
    });
  }
});




client.login('bot token');
