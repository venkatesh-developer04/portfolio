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
 y    0   ▸  (empty)           — hero/about: the hero is a DOM photo plate;
                                 only the ember particle field is here
 y  -12   ▸  skills orbit      (x +3.6)   ← sections: skills, experience
 y  -24   ▸  project cards     (x +3.9)   ← sections: projects, contact
```

Every object is parked **right of centre**, which is why the copy sits left on
`skills` / `projects` and right on `experience` — the camera swings around each
object rather than cutting to a new one. Two sections per object, viewed from
opposite sides. The hero and about stops are kept even though nothing lives
there any more, so the corridor still *begins* above the orbit and the drop
into it is a travelled move rather than a jump cut.

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
components/   Shell, Scene, Nav, Cursor, Preloader, ProjectModal
  3d/         CameraRig, Rig (lighting), SkillOrbit, ProjectCards, Particles
  sections/   Hero, About, Skills, Experience, Projects, Contact
  ui/         Reveal, SectionHeading
data/         resume.json  ← single source of truth
hooks/        useLenis, useQuality, usePointer, useMagnetic, useNearSection
lib/          store, scroll, sections, audio, cardTexture, utils
public/       hero-portrait.png (the plate), intro video
```

(`components/ShatterV.jsx` and `lib/glyph.js` still exist on disk but nothing
imports them — they belonged to the retired particle intro below and are kept
only until their deletion is signed off.)

### The intro (`components/Preloader.jsx`)

A ~10s cinematic video plays full-screen, then the intro ends on the video's
**`ended` event** — not on a timer, and not on scene readiness. When it ends,
the video dissolves to flat black and the black parts as two halves sliding
left and right ("doors"), with an ember seam down the opening edge. The hero's
own entrance is gated on `entered`, which fires as the doors *start* moving,
so the copy and the plate rise into the widening gap.

Since a video that never ends would strand the reader, everything else in the
file is a failure bound, not a timing choice:

- a rejected `play()` promise (autoplay refused) bails to the site immediately;
- a 3s start guard catches a dead asset (404, bad codec, no decodable frame);
- a 25s hard ceiling catches a video that stalls forever mid-play — generous
  enough that ordinary rebuffering is never guillotined;
- `Skip intro` / Esc / Enter always work; reduced motion skips the video
  entirely (a 10s forced video is exactly what that preference asks not to
  get).

The loading counter reads the video's own playhead (`currentTime/duration`),
so it is a real readout of the wait rather than a number racing a timer.

### The hero plate (`components/sections/Hero.jsx`)

A full-bleed photographic plate (`public/hero-portrait.png`) sits behind the
hero copy at 25% opacity, with a **torch**: a ~300px soft radial reveal that
follows the pointer and shows the image at full strength. It is two stacked
copies of the image — opacity cannot be applied to *part* of an element, so
the top copy is full-strength behind a moving `mask-image` radial gradient.
Both copies emit identical `next/image` srcsets, so the bytes are fetched
once.

Pointer coords go through a ref and one rAF (`--mx`/`--my` CSS vars on the
plate), never React state. Three cases get a flat 55% plate with no torch,
because a torch that can never be summoned reads as a broken image: touch
(`pointer: coarse`), reduced motion / quality `off` (`.plate--flat`), and the
moment before the pointer first enters (`.is-lit` gate).

The name/details columns flank a reserved centre column so text never lands on
the subject's face. The centre column is capped in **px, not vw** — the shell
is capped at 1152px, so a vw-sized column keeps growing with the monitor while
the grid it lives in does not, and it crushed the name below its min-content
width (an unwrappable "Venkatesh") on every desktop width.

### The smoke (`.atmo` in `app/globals.css`)

Two pseudo-element layers sample the smoke either side of the subject in the
hero plate and screen-blend it over the WebGL canvas on every section, with a
slow two-period "beat" (7s / 10.5s, deliberately out of phase). Three details
are load-bearing:

- It sits **above** the canvas: the canvas is opaque (`gl.alpha:false`), so a
  layer behind it would never be seen — and making the canvas transparent
  would break the fog dissolve, which works by matching the background colour
  exactly. `screen` blending is what lets the 3D read through it.
- The CSS `url()` points at the **`/_next/image` optimizer endpoint**, not the
  raw file — a plain URL would bypass next/image and ship the 1.5MB source
  PNG (the optimized fetch is ~42KB).
- The base opacity/transform on the layers are the *resting frame*: the global
  reduced-motion override collapses animations with no fill-mode, so elements
  fall back to base styles — without them, reduced-motion users would get
  full-strength unmirrored smoke. The nav's own "Reduce animation" toggle is
  handled separately (`.atmo--still`), because a store write is invisible to a
  media query.

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
> `getStore()` from inside `useFrame` instead. Subscribing
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
- `low` — mobile/weak GPU: particle field only on a held camera, no orbit or
  cards, DPR 1.25
- `off` — reduced motion: **no WebGL context at all**, CSS forge-glow backdrop;
  the smoke layer stays but its beat is frozen

> The scene no longer uses `MeshTransmissionMaterial` anywhere. Replacing the
> crystal with the workspace removed it, and with it the single most expensive
> shader on the page — it rendered the scene to a backbuffer every frame and
> dominated the ~1.7s main-thread stall on mount. Everything now runs on plain
> `meshStandardMaterial`. If you reintroduce transmission, expect that cost
> back.

The DOM content is identical across all three. The user can force `off` via the
nav toggle; the choice persists in `localStorage`.

### Measured numbers (Intel Iris Xe, production build)

> Measured on the earlier design, before the 3D workspace was replaced by the
> DOM photo plate — the hero/about draw-call figures can only have gone *down*
> since (that geometry no longer exists), but they have not been re-measured.

| | |
|---|---|
| First contentful paint | ~680 ms (median of 5) |
| First Load JS | ~200 kB (three/drei code-split out of it) |
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

**Netlify** — a `netlify.toml` is already in the repo (build `npm run build`,
publish `.next`, Node 20 pinned). No `[[plugins]]` block on purpose: Netlify
detects Next.js and installs its runtime itself, and naming the plugin as well
is a second source of truth that can pin a stale major.

> **Static export (`output: 'export'`) no longer works.** It used to — but the
> hero plate and the `.atmo` smoke both resolve through `/_next/image`, which
> does not exist in an export. The smoke would silently vanish and next/image
> would need `unoptimized: true`, shipping the raw 1.5MB PNG in place of a
> ~42KB WebP. This site now requires a host that runs the image optimizer.

## Editing content

Everything is in `data/resume.json`. Two notes on what I extracted:

- The resume lists **two different LinkedIn URLs** — `linkedin.com/in/iamvnki`
  in the header and `linkedin.com/in/venkateshseenu` under "Follow me". I used
  the header one. Fix `socials[0].url` if the other is correct.
- `meta.available` drives the pulsing "Available for work" dot. Set it `false`
  when that stops being true.
