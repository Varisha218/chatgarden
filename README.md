# ChatGarden

ChatGarden is an anonymous Twitch chat garden for OBS. Chatters plant a flower on their first message, and later messages water it (at most once per chatter every 10 seconds). Growth persists between streams: seed (0–2 waterings), sprout (3–9), bud (10–29), and bloom (30+). A busy chat can trigger 30 seconds of sunshine, which doubles each watering's growth.

Species are selected from each chatter's most-used Twitch emote observed during the current run. If the chatter has not used an emote, a stable username hash selects the species. Runtime emote counts and rate timestamps are discarded when the process exits. `data/garden.json` stores only usernames, watering counts, and species; chat message text is never stored.

The overlay includes a live community snapshot, species diversity count, progress toward shared watering milestones, growth progress rings, animated butterflies, and brief planting and growth celebrations.

## Requirements

- Node.js 20 or newer
- A Twitch channel name (the channel owner does not need to grant OAuth or provide credentials)

## Install and run

```sh
npm install
npm test
npm start -- --channel your_channel
```

Open `http://localhost:30001/overlay` to preview. To use a different port, pass `--port 4000` or set `PORT`.

To test without Twitch, run:

```sh
npm start -- --simulate
```

Simulation mode generates fake chatter locally and does not connect to Twitch. It uses a sample garden that is still saved to `data/garden.json`.

## OBS setup

1. Add a **Browser** source to your scene.
2. Set its URL to `http://localhost:30001/overlay`.
3. Set width to **1920** and height to **1080**.
4. Leave **Shutdown source when not visible** unchecked if you want it to stay connected in the background.

The page background is transparent; place it above your gameplay or camera sources. Keep the Node server running while the Browser source is in use.

## Chat commands

- `!plant` resets the chatter's flower to a seed.
- `!forget` deletes the chatter's plant and runtime watering/emote tracking.

## Privacy and Twitch connection

The Twitch client connects using an anonymous `justinfan` identity and the public anonymous IRC password expected by Twitch chat. There is no OAuth flow, token, API key, or secret configuration. The client listens to one public channel, does not log or persist message bodies, and uses message emote metadata only to choose a species.

## Tests

Run `npm test` for unit tests covering growth thresholds, emote-based species choice and fallback, and chat-spike detection.
