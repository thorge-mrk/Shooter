# APEX ARMOR — Three.js Multiplayer FPS & Tank Arena

CS2-inspired first-person tactical shooter with drivable tanks, bouncing frag grenades, Google Firebase login & real-time 2–5 player free-for-all rooms, and Venge.io-style smart input detection for **iPad (30–60 FPS)** and **Desktop**.

## Features
- **CS2-Style First-Person Gunplay**: Detailed procedural 3D viewmodels for `M4A1 Tactical`, `M1014 Shotgun`, `AWP Tactical` (with sniper scope), `USP-S Sidearm`, and `HE-67 Frag Grenades`.
- **Drivable Tanks (Chase Camera)**: 2 neutral armored tanks spawn on each map. Press `E` (or tap **DRIVE**) to enter, steer with `WASD`, aim the independent 360° turret, fire `120mm` HE shells (Left Click / Fire) and coaxial MG (Right Click / ADS).
- **2–5 Player Free-For-All Multiplayer**: Google Sign-In (`GoogleAuthProvider` with automatic `signInWithRedirect` fallback for iPad Safari), room codes, live room browser, host-configurable kill limits (10 / 15 / 20) and timers.
- **Instant Solo Bot Practice**: Play 1v1 up to 5-player FFA against AI bots (who strafe, shoot, throw grenades, and drive tanks) immediately without Firebase keys.
- **iPad 30–60 FPS Performance**: Procedural Canvas PBR textures (zero external asset stall), tight shadow frustums, capped particle pooling, Graphics Presets (`High`, `Balanced`, `Fast`), and an **Auto FPS Scaler**.
- **Smart Input Detection (Venge.io Style)**:
  - **Desktop / Mouse**: Touch controls automatically hidden; Pointer Lock + `WASD`.
  - **iPad Keyboard + Touch**: Left virtual joystick automatically hides when keyboard is used; move with `WASD` and aim/fire directly on the display.
  - **iPad Touch-Only**: Full dual-stick touch UI.
- **3 Selectable Arenas**:
  1. `Sunlit Military Compound` (Primary)
  2. `Industrial Cargo Yard`
  3. `Alpine Night Ops Outpost`

## Quick Start

```bash
npm install
npm run dev
```

Open the printed local URL on your computer or iPad (same Wi-Fi network) to play.

## Setting Up Google Firebase Multiplayer

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication → Sign-in method → Google**.
   - Under **Authorized domains**, add your deployment domain (e.g., `your-app.web.app`, `localhost`, or your local LAN IP if testing on iPad).
3. Enable **Realtime Database** (start in test mode or deploy `database.rules.json`).
4. Copy your Web App config from **Project Settings → Your Apps** and either:
   - Copy `.env.example` to `.env` and fill in the `VITE_FIREBASE_*` variables, **or**
   - Click **Configure Firebase Keys** directly inside the game's Main Menu and paste the JSON config.

## Controls

| Action | Desktop (Mouse + KB) | iPad Keyboard + Touch | iPad Touch-Only |
| :--- | :--- | :--- | :--- |
| Move / Drive Tank | `W A S D` | `W A S D` | Left Virtual Stick |
| Aim / Turret | Mouse | Right Touch Drag | Right Touch Drag |
| Fire / Tank Cannon | Left Click | `FIRE` Touch Button | `FIRE` Touch Button |
| ADS / Scope / Coax MG | Right Click | `ADS` Touch Button | `ADS` Touch Button |
| Jump | `Space` | `Space` / `JUMP` | `JUMP` Button |
| Switch Weapon | `1`–`5` | `1`–`5` / HUD Strip | HUD Weapon Strip |
| Quick Frag Grenade | `G` | `G` / `FRAG` Button | `FRAG` Button |
| Enter / Exit Tank | `E` | `E` / `TANK` Button | `TANK` Button |
| Reload | `R` | `R` / `RELOAD` | `RELOAD` Button |
| Scoreboard / Menu | `Tab` / `Esc` | `Tab` / `MENU` | `SCORE` / `MENU` |
