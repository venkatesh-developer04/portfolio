# Venkatesh Seenu — 3D Portfolio

An interactive 3D portfolio built from `data/resume.json`. Next.js App Router,
React Three Fiber, Tailwind, Framer Motion, GSAP, Lenis.

```bash
npm install
npm run dev                  # http://localhost:3000 — for editing (SLOW, see below)
npm run build && npm start   # for judging speed / demoing
```

> **`npm run dev` is not representative of this site's speed.** Measured on this
> machine, first-contentful-paint was **48,884 ms in dev vs ~680 ms in a
> production build** — a ~70× difference. Dev compiles three.js + drei (2,583
> modules) on first request, ships unminified, and double-renders everything
> under StrictMode. None of that ships. Always demo the production build.

---

## The core idea

There is **one** `<Canvas>`, fixed behind all DOM content, containing **one**
scene. The 3D objects are laid out as a vertical corridor in world space and
the camera flies down it as you scroll:

```
 y    0   ▸  hero workspace    (x +2.2)   ← sections: hero, about
 y  -12   ▸  skills orbit      (x +3.6)   ← sections: skills, experience
 y  -24   ▸  project cards     (x +3.9)   ← sections: projects, contact
```

Every object is parked **right of centre**, which is why the copy sits left on
`hero` / `skills` / `projects` and right on `about` / `experience` — the camera
swings around each object rather than cutting to a new one. Two sections per
object, viewed from opposite sides.

This is why it's not a canvas-per-section: the *travel between* objects is the
effect. Separate canvases can only cross-fade.

## Tuning the framing

**All camera framing lives in one table** — `STOPS` in
`components/3d/CameraRig.jsx`, one row per section:

```js
{ pos: [0.0, 0.15, 7.6], look: [1.0, 0.0, 0] },   // hero
```

The rule: camera **left** of an object → object appears **right** of frame →
copy goes left. Camera **right** of it → object appears left → copy goes right.
Nudge a row to re-frame a section; nothing else needs to change.

Text legibility does **not** depend on getting this exactly right. Every copy
column carries `.text-scrim` (`app/globals.css`) — a soft radial darkening that
is invisible against the void but holds contrast if an object drifts behind a
paragraph.

## Architecture

```
app/          layout (fonts, metadata, JSON-LD), page, globals.css
components/   Shell, Scene, Nav, Cursor, Preloader, ShatterV, ProjectModal
  3d/         CameraRig, Rig (lighting), Workspace, SkillOrbit, ProjectCards, Particles
  sections/   Hero, About, Skills, Experience, Projects, Contact
  ui/         Reveal, SectionHeading
data/         resume.json  ← single source of truth
hooks/        useLenis, useQuality, usePointer, useMagnetic, useNearSection
lib/          store, scroll, sections, audio, cardTexture, glyph, utils
```

### The intro

`ShatterV` draws a "V" to an offscreen canvas, reads its alpha channel, and
turns every opaque pixel on a grid into a particle (`lib/glyph.js`) — a real
glyph silhouette from the font `next/font` already loaded, with no font binary
to parse and no SDF text in the 3D scene. ~1,500 particles. The V lights
bottom-to-top as the loading counter climbs, then bursts.

Two things there are load-bearing:

- **Scroll unlocks when the shatter *starts*, not when it ends.** The particles
  fly over an already-live, scrollable page while the backdrop fades, so the
  effect costs zero interactive time.
- **The hero hands off from the intro.** `entered` fires the V's shatter, the
  headline's masked reveal, *and* the workspace's assembly on the same frame —
  the V's particles fly outward as the desk scales up from zero and the laptop
  screen powers on late (`intro > 0.45`). The two effects answer each other
  rather than just happening in sequence.
- **The animation runs on accumulated *rendered* time, not wall-clock.**
  Mounting the WebGL scene blocks the main thread hard (measured: a ~1.7s long
  task, ~3.2s total). The first version faded on wall-clock elapsed while
  moving particles on a clamped delta — so a stall left the particles barely
  moved but jumped the fade straight to finished, and the whole shatter was
  skipped in a single frame. Sharing one clamped clock means jank can delay the
  animation but never eat it.

### The hero character (`components/3d/Workspace.jsx`)

A developer at a desk, built entirely from primitives — no `.glb`, no rig, no
asset to license or download. Curly hair is a shell of ~42 small icosahedra
placed on a Fibonacci sphere over the crown; positions derive from the index
rather than `Math.random()` so the silhouette is identical on every reload.
Typing is the forearms pivoting at the elbow, out of phase with each other.

Three things learned the hard way, all worth keeping:

- **It is chibi-proportioned, and the props must match it, not reality.** A
  correctly scaled 15" laptop beside a character with a 0.2-radius head is
  enormous — the first pass hid his chest, chin and left arm behind the lid.
- **The laptop faces him, not the camera.** A screen pointed at the viewer
  looks striking until you notice he'd be staring at the back of his own
  laptop. Turned around, the screen becomes a practical light throwing cool
  tones onto his face — a better shot anyway.
- **Cyan light on brown skin reads green.** The screen's colour is a soft blue
  (`#8FD4FF`, not the brand cyan) and a warm key holds the skin tone.

Swapping in a real avatar later: drop a `.glb` in `public/`, load it with
drei's `useGLTF`, and replace the `<group ref={model}>` contents. The intro
gate, culling, pointer lean and camera framing all stay as they are.

### State is deliberately split in two

| | file | read by | re-renders? |
|---|---|---|---|
| Frame-loop values | `lib/scroll.js` | `useFrame` | **never** — plain mutable object |
| UI state | `lib/store.js` | React | yes — tiny `useSyncExternalStore` store |

Scroll progress, pointer position and velocity update ~60×/sec and only ever
drive imperative camera math. Routing them through React would re-render the
tree every frame. Things that genuinely need a render (nav highlight, open
modal, quality tier) live in the store — which is ~40 lines and needs no
dependency.

> **Never call `useStore` inside the `<Canvas>`.** Read store values with
> `getStore()` from inside `useFrame` instead (see `Workspace.jsx`). Subscribing
> re-renders the component inside R3F's reconciler, which recreates its
> material and recompiles the shader — mid-flight. Doing this in the hero object
> locked the main thread permanently and hung the page. Writes (`setStore`) are
> fine: `SkillOrbit` and `ProjectCards` push hover/selection out to the DOM
> that way. The rule is subscribe in the DOM, read in the frame loop.

### Everything reads from `data/resume.json`

Skills, projects, experience, nav sections, JSON-LD and the 3D orbit rings are
all generated from it. Adding a skill category adds an orbit ring. Adding a
project adds a 3D card. Nothing is hardcoded in a component.

## Performance

**Quality tiers** (`hooks/useQuality.js`), auto-detected from
`prefers-reduced-motion`, pointer type, viewport, `hardwareConcurrency` and
`deviceMemory`:

- `high` — full scene, scroll camera, DPR capped at 1.5
- `low` — mobile/weak GPU: hero workspace only on a held camera, fewer hair
  curls, no desk props, no orbit or cards, DPR 1.25
- `off` — reduced motion: **no WebGL context at all**, CSS aurora backdrop

> The scene no longer uses `MeshTransmissionMaterial` anywhere. Replacing the
> crystal with the workspace removed it, and with it the single most expensive
> shader on the page — it rendered the scene to a backbuffer every frame and
> dominated the ~1.7s main-thread stall on mount. Everything now runs on plain
> `meshStandardMaterial`. If you reintroduce transmission, expect that cost
> back.

The DOM content is identical across all three. The user can force `off` via the
nav toggle; the choice persists in `localStorage`.

### Measured numbers (Intel Iris Xe, production build)

| | |
|---|---|
| First contentful paint | ~680 ms (median of 5) |
| First Load JS | 196 kB (three/drei code-split out of it) |
| Draw calls / frame | 13 (hero) · 25 (skills) · 9 (projects) · **3** (contact) |
| Triangles / frame | 6.2k · 8.6k · 2.6k · 4 |

Those draw-call counts are the useful ones: **this scene is nowhere near
geometry-bound**, so the cost is fill rate (fragment shading), not objects. That
is why the levers that matter here are DPR and shader cost — not mesh count or
instancing. The contact figure (3 calls) is the culling working.

Frame-rate numbers are deliberately not quoted: repeated runs of an identical
build on a busy machine ranged from 3 to 51 fps for the same section, so any
fps delta measured here would be noise. Profile in a real browser tab with
devtools if you need to tune further.

Other deliberate choices:

- **No CDN assets.** Lighting is procedural `<Lightformer>` shapes, not drei's
  HDRI presets (which fetch multi-MB `.hdr` files at runtime). Sounds are
  synthesized with WebAudio. Card faces are drawn to a canvas rather than using
  troika `<Text>`, which fetches a font from `fonts.gstatic.com` at runtime.
  The only network dependency is the self-hosted Inter subset from `next/font`.
- **Off-screen culling** (`useNearSection`) — groups the camera has flown away
  from stop rendering entirely. Fog hides them; this stops paying for them.
- **The scene is `dynamic({ ssr: false })`** — three + drei is most of the JS
  and renders nothing on the server, so it never blocks first paint.
- **Env map baked once** (`frames={1}`) — nothing in it moves.

## Accessibility

Canvas meshes are invisible to keyboards and screen readers, so the 3D cards
are never the *only* way to reach anything. The Projects section always renders
a real `<button>` list opening the same modal — a parallel control, not a
fallback. Beyond that: skip link, focus trap + focus restore in the modal,
visible focus rings that survive the design, `prefers-reduced-motion` honoured
at the tier level, and word-level (not character-level) headline reveals so
`aria-label` stays readable.

## Deploy

**Vercel** — push to GitHub, import the repo, accept the defaults. Zero config.

```bash
npx vercel        # or: npx vercel --prod
```

**Netlify** — `npm i -D @netlify/plugin-nextjs`, then `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Static export (`output: 'export'`) also works — there are no server routes.

## Editing content

Everything is in `data/resume.json`. Two notes on what I extracted:

- The resume lists **two different LinkedIn URLs** — `linkedin.com/in/iamvnki`
  in the header and `linkedin.com/in/venkateshseenu` under "Follow me". I used
  the header one. Fix `socials[0].url` if the other is correct.
- `meta.available` drives the pulsing "Available for work" dot. Set it `false`
  when that stops being true.
