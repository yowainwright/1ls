import type { Format, FormatConfig, DetectionResult } from "./types"

export interface ExpressionSuggestion {
  label: string
  expression: string
}

export interface ExtendedFormatConfig extends FormatConfig {
  suggestions: ExpressionSuggestion[]
}

export const FORMAT_CONFIGS: Record<Format, ExtendedFormatConfig> = {
  json: {
    label: "JSON",
    language: "json",
    placeholder: `{
  "spotify": {
    "playlists": [
      { "name": "Chill Vibes", "tracks": 42, "hours": 2.8, "public": true },
      { "name": "Workout Mix", "tracks": 85, "hours": 5.2, "public": true },
      { "name": "Late Night Coding", "tracks": 128, "hours": 8.4, "public": false },
      { "name": "Road Trip", "tracks": 64, "hours": 4.1, "public": true },
      { "name": "Focus Mode", "tracks": 96, "hours": 6.3, "public": false }
    ],
    "stats": {
      "totalPlays": 12847,
      "topGenre": "electronic",
      "premiumUser": true
    }
  }
}`,
    suggestions: [
      { label: "Public playlists", expression: ".spotify.playlists.filter(p => p.public)" },
      { label: "Playlist names", expression: ".spotify.playlists.map(p => p.name)" },
      { label: "Total tracks", expression: ".spotify.playlists.reduce((sum, p) => sum + p.tracks, 0)" },
      { label: "Longest playlist", expression: ".spotify.playlists.sort((a, b) => b.hours - a.hours)[0]" },
    ],
  },
  yaml: {
    label: "YAML",
    language: "yaml",
    placeholder: `pokemon:
  - name: Pikachu
    type: electric
    level: 25
    hp: 35
    attack: 55
    moves:
      - Thunder Shock
      - Quick Attack
      - Iron Tail
  - name: Charizard
    type: fire
    level: 50
    hp: 78
    attack: 84
    moves:
      - Flamethrower
      - Fly
      - Dragon Claw
  - name: Blastoise
    type: water
    level: 45
    hp: 79
    attack: 83
    moves:
      - Hydro Pump
      - Surf
      - Ice Beam
  - name: Gengar
    type: ghost
    level: 40
    hp: 60
    attack: 65
    moves:
      - Shadow Ball
      - Dream Eater
  - name: Dragonite
    type: dragon
    level: 55
    hp: 91
    attack: 134
    moves:
      - Hyper Beam
      - Dragon Rush`,
    suggestions: [
      { label: "All names", expression: ".pokemon.map(p => p.name)" },
      { label: "High level", expression: ".pokemon.filter(p => p.level >= 45)" },
      { label: "All moves", expression: ".pokemon.map(p => p.moves)" },
      { label: "By attack", expression: ".pokemon.sort((a, b) => b.attack - a.attack).map(p => p.name)" },
    ],
  },
  csv: {
    label: "CSV",
    language: "csv",
    placeholder: `movie,year,rating,boxOffice,genre
The Dark Knight,2008,9.0,1004,action
Inception,2010,8.8,836,scifi
Interstellar,2014,8.6,677,scifi
Parasite,2019,8.5,263,thriller
Everything Everywhere,2022,8.1,141,scifi
Oppenheimer,2023,8.9,952,drama
Barbie,2023,7.0,1442,comedy
Spider-Verse,2023,8.7,690,animation`,
    suggestions: [
      { label: "Top rated", expression: ".filter(m => m.rating >= 8.5)" },
      { label: "Sci-fi films", expression: ".filter(m => m.genre === 'scifi')" },
      { label: "Billion club", expression: ".filter(m => m.boxOffice >= 1000).map(m => m.movie)" },
      { label: "By rating", expression: ".sort((a, b) => b.rating - a.rating).map(m => m.movie)" },
    ],
  },
  toml: {
    label: "TOML",
    language: "toml",
    placeholder: `[game]
title = "Zelda: Tears of the Kingdom"
platform = "Switch"
hours_played = 156
completion = 87

[achievements]
shrines = 120
korok_seeds = 421
bosses_defeated = 8

[inventory]
hearts = 30
stamina = 14
rupees = 84350
arrows = 999`,
    suggestions: [
      { label: "Game info", expression: ".game" },
      { label: "Achievements", expression: ".achievements" },
      { label: "All stats", expression: ".{entries}" },
      { label: "Inventory", expression: ".inventory" },
    ],
  },
  text: {
    label: "Text",
    language: "text",
    placeholder: `🎮 PLAYER_JOINED: xX_DragonSlayer_Xx entered the game
💀 KILL: NoobMaster69 eliminated by xX_DragonSlayer_Xx
🏆 ACHIEVEMENT: xX_DragonSlayer_Xx unlocked "First Blood"
🎮 PLAYER_JOINED: SneakyNinja2000 entered the game
💬 CHAT: NoobMaster69: "nice shot!"
💀 KILL: SneakyNinja2000 eliminated by NoobMaster69
🎮 PLAYER_LEFT: xX_DragonSlayer_Xx disconnected
💀 KILL: NoobMaster69 eliminated by SneakyNinja2000
🏆 ACHIEVEMENT: SneakyNinja2000 unlocked "Revenge!"
💬 CHAT: SneakyNinja2000: "gg"`,
    suggestions: [
      { label: "Kill events", expression: ".filter(l => l.includes('KILL'))" },
      { label: "Chat messages", expression: ".filter(l => l.includes('CHAT'))" },
      { label: "Player joins", expression: ".filter(l => l.includes('PLAYER_JOINED'))" },
      { label: "Line count", expression: ".{length}" },
    ],
  },
}

export const DEFAULT_EXPRESSION = ".spotify.playlists.filter(p => p.public).map(p => p.name)"

export const FORMATS: Format[] = ["json", "yaml", "csv", "toml", "text"]

export const TEXT_FALLBACK: DetectionResult = { format: "text", confidence: 0.5, reason: "Plain text" }

export const EMPTY_RESULT: DetectionResult = { format: "text", confidence: 1.0, reason: "Empty content" }

export const SANDBOX_STARTER: Record<Format, { data: string; expression: string }> = {
  json: {
    data: `{
  "users": [
    { "name": "Alice", "age": 30, "active": true },
    { "name": "Bob", "age": 25, "active": false },
    { "name": "Charlie", "age": 35, "active": true }
  ]
}`,
    expression: ".users.filter(u => u.active).map(u => u.name)",
  },
  yaml: {
    data: `users:
  - name: Alice
    age: 30
    active: true
  - name: Bob
    age: 25
    active: false
  - name: Charlie
    age: 35
    active: true`,
    expression: ".users.filter(u => u.active).map(u => u.name)",
  },
  csv: {
    data: `name,age,active
Alice,30,true
Bob,25,false
Charlie,35,true`,
    expression: ".filter(u => u.active).map(u => u.name)",
  },
  toml: {
    data: `[user]
name = "Alice"
age = 30
active = true

[settings]
theme = "dark"
notifications = true`,
    expression: ".user.name",
  },
  text: {
    data: `INFO: User Alice logged in
ERROR: Connection failed
INFO: User Bob logged in
WARN: Low memory
INFO: User Charlie logged in`,
    expression: ".filter(line => line.includes('INFO'))",
  },
}
