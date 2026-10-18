# Living Ink: journal notes

Short, first-person notes from each build stage, to rewrite in InDesign.
Items in *(italics)* are for you to add from your own testing or user testing.

## How this maps to the marking

| Criterion | Where to show it |
|-----------|------------------|
| Specialist knowledge | Hand tracking (ml5 handPose), gesture detection from landmarks, smoothing, recursive branching (Shiffman, Nature of Code ch. 8), flow field particles (ch. 6), spatial grid for neighbours |
| Design resolution | The iteration log below. Each row is a problem I found by testing, a change, and a result |
| Designer role | The decisions I made: what felt right, what I rejected, and why (list below) |
| Clarity of presentation | One strong before/after image per stage, plus a short screen recording of the full life of a stroke |

## The idea in one paragraph

Living Ink is an air-drawing tool. A webcam tracks my hand, and a pinch draws strokes that behave like living things. They grow branches like a fractal tree, age, then dissolve into particles that drift away. How fast I move changes the result: fast, big movements make thick strokes that branch a lot, and slow ones make thin strokes that grow gently. Nearby strokes tangle, and the particles of a dying stroke can start new growth in a living one.

## Stage by stage

### Stage 1: Webcam and hand tracking
**What I built and why:** A mirrored webcam feed, ml5 handPose, and a dot on my index fingertip. Everything depends on the tracking, so I proved it first.
**What I tested:** The dot followed my fingertip correctly and the frame rate was good.
**Screenshot:** the raw dot next to the camera preview with hand landmarks.

### Stage 2: Gestures
**What I built and why:** Pinch (draw), open palm (erase) and fist (freeze), measured relative to hand size so they work at any distance. A pinch buffer and a short hold delay stop the label flickering.
**What I tested and what went wrong:** Both of my hands were read well, at different angles, and a classmate's hand worked too. There was slight flicker when holding still, probably because no one can hold their hand perfectly still.
**What I changed:** I moved on to smoothing the position in Stage 3.
**Screenshot:** each gesture with its label; the pinch-gap number changing.

### Stage 3: Drawing and smoothing
**What I built and why:** A pen tip that eases toward my hand, heavy smoothing when slow and light when fast. It sits where thumb and finger meet.
**What I tested and what went wrong:**
- Slow and fast circles, loops and all four corners worked, at about 60 fps.
- The eraser removed a whole stroke at once, which felt blunt, and the line was too thin to build branches from.
- Fast drawing came out crooked. The tracker only updates about 30 to 40 times a second, and my smoothing lagged.
- After I sped up the catch-up, slow drawing felt less steady.
**What I changed and why:**
- Precision eraser: it cuts only the part it touches and splits a stroke where needed.
- A thicker, paint-like stroke.
- Strokes drawn as curves through the points, with an adjustable curve setting.
- A gradual catch-up so slow drawing stays steady. I decided slow, careful drawing matters more than perfect fast zigzags.
**Screenshot:** the orange raw dot vs the smoothed pen; the same zigzag at different curve settings.

### Stage 4: Branching linked to speed
**What I built and why:** Branches that grow off the stroke and fork into smaller branches, like Shiffman's recursive tree. Hand speed sets thickness, how many branches, how long, how deep, and how quickly they grow.
**What I tested and what went wrong:**
- It felt alive, and the frame rate was fine.
- Slow lines had too few branches, and branches reached too far from the line.
- Branches came out evenly spaced on alternating sides every centimetre, which looked mechanical.
- Fast lines needed more, longer, straighter branches.
**What I changed and why:**
- More branches on slow lines, with deeper forks so bigger branches grow smaller ones.
- Random spacing and sides, and a built-in curl, so it looks like natural growth.
- Shorter first branches that stay close to the line.
- Fast lines: denser, longer and straighter (stick-like).
**Screenshot:** slow vs fast stroke side by side; a time-lapse of one stroke growing; the before/after of the "even" branches.

### Stage 5: Fading and particles
**What I built and why:** Strokes age and then dissolve into chunks that shed particles drifting on a noise flow field.
**What I tested and what went wrong:**
- The fist froze everything and the frame rate was fine.
- The dissolve began too late and was too short.
- The dissolve was in random patches, with no connection to how I drew.
- Branches popped off all at once.
**What I changed and why:**
- Lifespan from 20s down to 10s, and the dissolve from 8s up to 12s.
- It now dissolves along the line from where I started drawing, so the ink un-draws itself in the order I made it.
- Branches dissolve from the drawn line outward to their tips, one generation after another.
- A slightly slower branch dissolve, for visual effect.
**Screenshot:** a mid-dissolve frame (gap in the line, particles at the front); a recording of one stroke from drawing to nothing.

### Stage 6: Interaction and polish
**What I built and why:** Branches from nearby strokes bend toward each other, curl round and tie a knot. Particles from a dying stroke can land on a living one and start new growth. I also added help text and error messages for first-time users.
**What I tested and what went wrong:**
- My first version cut nearby strokes' branches by about 85% (they stopped forking when they tangled), made hundreds of knots, and made about 60 regrown branches from one stroke. These were found in simulation, before testing.
- In use, tangling and regrowth worked.
- The "hold your hand up" prompt appeared while I was watching a drawing dissolve, with my hand out of view.
**What I changed and why:**
- Knotted branches keep forking, each stroke ties at most 8 knots, and regrowth is rarer and rate-limited.
- The prompt now appears only before the first stroke.
**Screenshot:** two strokes tangled with a knot; the ring flash where a particle lands; a final composition.

## Decisions I made as the designer

- Dark background with glowing blue ink, to read well on a projector and suit the particles.
- Speed, not pressure, drives the look, because an air drawing has no pressure.
- I kept the eraser as a precise palm, not whole-stroke delete, because rubbing out part of a line felt more human.
- I chose that ink dissolves in the order it was made, so a drawing fades like a memory.
- I accepted imperfect fast zigzags in exchange for steady slow lines, because slow, careful drawing is how people will use it.
- I limited the number of branches, particles and knots so the piece stays at 60 fps and doesn't get messy.

## What I'd say about limits (honest, and marks well)

- The tracker updates about 30 to 40 times a second, which limits fast, sharp drawing.
- A pinch with the other fingers curled can be read as a fist.
- Open palm erases, so resting an open hand in front of the camera can delete work.
- Tangling and regrowth are subtle, so people may need to be shown them.

## User testing summary (fill in after testing)

- *Who and how many I tested:*
- *Top three things people struggled with:*
- *Top three things people liked:*
- *The change I made because of it:*
- *Quotes worth using:*

## Presentation ideas

- Open with a 20-second screen recording of one stroke living and dying.
- Show the iteration log as a before/after strip (Stage 3 smoothing, Stage 4 branches, Stage 5 dissolve).
- Close with a live demo, and a recording as backup in case the camera fails in the room.
