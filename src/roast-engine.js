/**
 * Roast Engine — powered by Anthropic Claude SDK (open-source MCP connector)
 *
 * Uses @anthropic-ai/sdk to generate personalized, AI-driven roasts
 * that snap you back to work. When no API key is set, falls back
 * to a curated offline roast bank.
 *
 * https://github.com/anthropics/anthropic-sdk-node
 */

const Anthropic = require('@anthropic-ai/sdk');

const ROAST_PERSONAS = {
  brutal: {
    system: `You are a brutally honest, savage productivity coach who roasts slackers with zero mercy.
Your job is to fire off a single short, sharp roast (1-2 sentences max) that calls out someone
for going idle during work hours. Be funny, cutting, and specific. No softeners. Channel your inner
Gordon Ramsay meets Dave Chappelle. Keep it workplace-appropriate but not gentle.`,
    temp: 0.9,
  },
  gentle: {
    system: `You are a warm but firm productivity buddy. Generate a single short, friendly nudge
(1-2 sentences) that gently roasts someone for going idle, but still makes them smile.
Think: disappointed but loving parent. Encouraging, slightly sarcastic, never mean.`,
    temp: 0.7,
  },
  motivational: {
    system: `You are a hyped-up motivational coach who turns every idle moment into a rallying cry.
Generate a single short, energetic message (1-2 sentences) that calls out the idle time but
spins it into MASSIVE motivation. Think Tony Robbins meets The Rock. Big energy, zero sympathy for laziness.`,
    temp: 0.8,
  },
};

const OFFLINE_ROASTS = {
  brutal: [
    "You've been idle so long your keyboard filed a missing persons report.",
    "Your deadline called — it said it misses you. Sadly, you won't miss it.",
    "Even your screensaver is ashamed to be associated with you right now.",
    "Scientists have classified your work ethic as an endangered species.",
    "Your tasks are doing more work waiting for you than you've done all day.",
    "My grandmother works faster, and she's been dead for six years.",
    "Breaking: Local person mistaken for furniture after extended work avoidance.",
    "Your productivity chart looks like a flatline. Call a doctor.",
  ],
  gentle: [
    "Hey! Your work misses you. It's okay, come back — no judgment!",
    "Just a friendly nudge: your tasks are patiently waiting... very patiently.",
    "You've had a nice break! Time to give your future self a gift and get back to it.",
    "The work fairy stopped by but found you napping. She's coming back — be ready!",
  ],
  motivational: [
    "CHAMPIONS DON'T GO IDLE! Get up, lock in, and GO!!",
    "Every second you rest is a second your competition gets ahead. MOVE!",
    "Your future self is BEGGING you to get back to work RIGHT NOW!",
    "The greatest version of you doesn't idle. WAKE UP AND DOMINATE!",
  ],
};

class RoastEngine {
  constructor(apiKey = '', mode = 'brutal') {
    this.apiKey = apiKey;
    this.mode = mode;
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  updateConfig(apiKey, mode) {
    this.apiKey = apiKey;
    this.mode = mode;
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  async generateRoast({ idleMinutes = 5, mode = null }) {
    const roastMode = mode || this.mode;

    if (!this.client || !this.apiKey) {
      return this._offlineRoast(roastMode);
    }

    try {
      const persona = ROAST_PERSONAS[roastMode] || ROAST_PERSONAS.brutal;

      const message = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001', // fast & cheap for roasts
        max_tokens: 120,
        temperature: persona.temp,
        system: persona.system,
        messages: [
          {
            role: 'user',
            content: `The person has been idle for ${idleMinutes} minute${idleMinutes !== 1 ? 's' : ''}. Fire the roast!`,
          },
        ],
      });

      const roast = message.content[0]?.text?.trim();
      return roast || this._offlineRoast(roastMode);
    } catch (err) {
      console.error('[RoastEngine] Claude API error:', err.message);
      return this._offlineRoast(roastMode);
    }
  }

  _offlineRoast(mode = 'brutal') {
    const pool = OFFLINE_ROASTS[mode] || OFFLINE_ROASTS.brutal;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

module.exports = RoastEngine;
