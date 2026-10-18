# Living Ink: user testing kit

For testing with classmates. About 10 minutes per person. Test 4 to 6 people if you can.

## Before you start

- Run the sketch in Chrome from a local server (see README). Full screen, good light, a plain background behind the hand.
- In `config.js` set `lifespan: 15` so people see a stroke dissolve without waiting too long. Press **D** to hide the debug text so it doesn't distract.
- Turn on screen recording for each session (with permission). Your own hand shouldn't be in the way of the camera.
- Sit the person about an arm's length from the webcam. Watch their hand, not the screen.
- **Don't explain the gestures.** The point is to see whether the screen explains itself.

## What to say

"This is a drawing tool that you control with your hand, no mouse or keyboard. I'm testing the tool, not you. Please think out loud, and tell me what you're expecting and what surprises you. I won't help unless you're really stuck."

## Tasks (read one at a time)

| # | Task | What I'm looking for |
|---|------|----------------------|
| 1 | "Make a mark on the screen." | Do they find the pinch from the instructions alone? How long until the first stroke? |
| 2 | "Draw something slowly, then something fast and big." | Do they notice that speed changes thickness and branching? |
| 3 | "Rub out part of what you drew." | Do they find the open palm? Do they accidentally erase? |
| 4 | "Stop everything where it is." | Do they find the fist? Do they notice the freeze border? |
| 5 | "Draw two lines close together, then wait and watch." | Do they notice branches meeting, and the particles landing and starting new growth? |
| 6 | "Take your hand away and just watch for a bit." | What do they say about the dissolve? Do they think it's broken? |

## Observation sheet (one per person)

**Name / date:** ______________  **Hand used:** L / R  **Experience with hand tracking:** ______

| Task | Done without help? (Y/N) | Seconds | Misreads / problems | What they said |
|------|--------------------------|---------|----------------------|----------------|
| 1 Draw | | | | |
| 2 Slow vs fast | | | | |
| 3 Erase | | | | |
| 4 Freeze | | | | |
| 5 Tangle and regrow | | | | |
| 6 Watch dissolve | | | | |

Tick when you see it:

- [ ] Pinch used while the other fingers were curled (and misread as a fist)
- [ ] Stroke started late, or the first bit was missing
- [ ] Hand lost at the edge of the camera view
- [ ] Erased something by accident with an open hand
- [ ] Thought the dissolve was a bug
- [ ] Didn't notice tangling or regrowth until it was pointed out
- [ ] Moved their whole arm instead of just their hand
- [ ] Got tired or complained about their arm

## Questions after (ask each one)

1. In your own words, what does this tool do?
2. Which gesture was easiest, and which was hardest?
3. Was there a moment you weren't sure what the screen was doing?
4. What did the drawing feel like: alive, or just animated? Why?
5. What would you change first?
6. Rate 1 to 5: easy to control / enjoyable / looks like ink.

## Things to flag in my notes

- Help text: is the bottom text enough to learn from?
- Delay between pinching and the line starting (about 5 frames).
- Tangling and regrowth are subtle. People may need two lines close together to see them.
- Fast zigzags aren't perfectly straight (the camera tracks about 30 to 40 times a second).
- Open palm erases, so resting an open hand in front of the camera can delete work.
- Different hand sizes and skin tones, glasses, sleeves and lighting can change tracking.

## After each person

Write the three most important things you noticed, and one change you would make. Then change one thing at a time in `config.js`, and test again with the next person.
