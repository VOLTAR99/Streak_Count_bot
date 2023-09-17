const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const prefix = '!';
const GENERAL_CHANNEL_ID = 'main channel ID where the commands will execute';
//const DAILY_CHALLENGES_CHANNEL_NAME = '1151207862966681671';

const streaks = new Map();
const lastActivity = new Map();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'activity' || command === 'topstreaks' || command ==='checkstreak') {
      if (message.channel.id !== GENERAL_CHANNEL_ID) {
        message.reply(`You can\'t use this command here! This command can only be used in <#${GENERAL_CHANNEL_ID}>`);
        return;
      }

      if (command === 'activity') {
        const userId = message.author.id;
        const now = new Date();
        const lastActivityDate = lastActivity.get(userId);

        if (!lastActivityDate || !isSameDay(now, lastActivityDate)) {
          if (!streaks.has(userId)) {
            streaks.set(userId, 1);
          } else {
            const currentStreak = streaks.get(userId);
            streaks.set(userId, currentStreak + 1);
          }

          lastActivity.set(userId, now);

          const newStreak = streaks.get(userId);
          message.reply(`Your activity streak: ${newStreak}`);

          const member = message.guild.members.cache.get(userId);
          if (member) {
            if (newStreak >= 100) {
            const role = message.guild.roles.cache.find((r) => r.name === '100 Days Challenge');
            if (role) {
              member.roles.add(role);
              message.guild.channels.cache.get('anouncement channel').send(`<@${userId}> has completed the 100 Days Challenge and earned the "100 Days Challenge" role! Congrats, everyone!`);
            }
          } else if (newStreak >= 50) {
            const role = message.guild.roles.cache.find((r) => r.name === '50 Days Challenge');
            if (role) {
              member.roles.add(role);
              message.guild.channels.cache.get('anouncement channel').send(`<@${userId}> has completed the 50 Days Challenge and earned the "50 Days Challenge" role! Congrats, everyone!`);
            }
          } else if (newStreak >= 30) {
            const role = message.guild.roles.cache.find((r) => r.name === '30 Days Challenge');
            if (role) {
              member.roles.add(role);
              message.guild.channels.cache.get('anouncement channel').send(`<@${userId}> has completed the 30 Days Challenge and earned the "30 Days Challenge" role! Congrats, everyone!`);
            }
          }
          }
        } else {
          message.reply('You have already updated your streak today.');
        }
      } 
        
        else if (command === 'checkstreak') { // New command to check streak
          const userId = message.mentions.users.first()?.id || message.author.id;
              const userStreak = streaks.get(userId);

                   if (userStreak !== undefined) {
                       message.reply(`User's streak: ${userStreak}`);
                  } else {
                message.reply('No streak recorded for this user.');
            }
          }
        else if (command === 'topstreaks') {
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

function scheduleWeeklyTopStreaks() {
  const dayOfWeek = 0; 
  const now = new Date();
  const daysUntilSunday = (dayOfWeek + 7 - now.getDay()) % 7;

  
  const nextSunday = new Date(now.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000);

  const millisecondsUntilSunday = nextSunday.getTime() - now.getTime();

  setTimeout(() => {
    updateWeeklyTopStreaks();
    setInterval(updateWeeklyTopStreaks, 7 * 24 * 60 * 60 * 1000); 
  }, millisecondsUntilSunday);
}

function updateWeeklyTopStreaks() {
  const guild = client.guilds.cache.get('1018481452234588251'); 
  const challengeCompletionChannel = guild.channels.cache.find(channel => channel.name === CHALLENGE_COMPLETION_CHANNEL_NAME);

  if (challengeCompletionChannel) {
    const topStreaks = Array.from(streaks.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

    if (topStreaks.length > 0) {
      const topStreaksMessage = topStreaks.map(([userId, streak], index) => {
        const member = guild.members.cache.get(userId);
        return `${index + 1}. ${member ? member.user.tag : 'Unknown User'}: ${streak} days`;
      }).join('\n');

      challengeCompletionChannel.send(`Top 3 Streaks This Week:\n${topStreaksMessage}`);
    } else {
      challengeCompletionChannel.send('No streaks recorded yet this week.');
    }
  }
}


client.login('bot token');