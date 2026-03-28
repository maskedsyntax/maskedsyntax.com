---
title: "Op-amp layout: aspect ratio as a DRC conversation"
date: "2025-10-30"
tags: ["ml", "vlsi", "layout"]
summary: "No repo for this one: it is notes from a university layout lab. The through line is that manufacturability beats pretty symmetry on paper."
reading_time: "5 min"
---

Analog layout looks like drawing until the design rule check deck fires. My first op-amp floorplan had mirrored shapes that looked balanced in the editor and failed spacing rules the moment I ran the real PDK. This post is not tied to a single open source file. It is what I wish I had written **before** I spent a night nudging polysilicon by hand.

## Rules, aspect ratio, and symmetry that survives the fab

Minimum width and spacing rules exist because fabs have measurable tolerances. A line that is 0.13 microns wide on screen might print as a broken strip. A via that barely encloses metal might open under etch variation. The deck encodes that as thousands of checks. A clean report is the only definition of "done," not how the screenshot looks.

```text
width(poly)   >= minimum from PDK
space(metal1) >= minimum from PDK
via enclosure >= enclosure on all sides
```

Think of violations like compiler errors: you do not argue with `M1.S.1 : spacing 0.12 um < 0.14 um required at (x, y)`. You move geometry, re-run, repeat. Eyeballing distances on screen is a poor substitute for the deck because snapping grids lie.

Long skinny resistors are not aesthetic choices. Sheet resistance times length over width sets value. When you need tens of kiloohms in a small cell, you meander. Matching pairs want the same orientation, the same surroundings, and often interdigitation so process gradients affect both sides equally. Two rectangles that mirror in the viewer but sit over different well gradients are not a matched pair in silicon. "Asymmetric surroundings" means one device sees more metal fill on the left because you routed a fat bus past it. That changes capacitance to substrate and to neighbors. Simulation with ideal models will miss it until you extract parasitics from the real layout.

I sketch matching devices before I touch the tool: same width, same length, same neighbor density on three sides. Capacitor arrays and current mirrors need the same attention as diff pairs. A via stack that shifts one side changes matching as much as width tweaks. Antenna rules on floating poly fragments were another surprise: tiny slivers you cannot see without zoom carry real yield risk. Density fill steps need planning so dummy metal does not break matching. Instructors shared photos of rounded corners and necking where poly narrowed below minimum width. Those photos stuck more than rule tables.

## Schematic dreams versus extracted reality

Schematic simulation with ideal op-amps proves topology. Layout plus extraction proves bandwidth and stability margins once parasitic capacitors appear on sensitive nodes. If the layout ignores fringe capacitance on the input pair, phase margin in your head is fiction. We ran AC sweeps on extracted netlists after layout. Bandwidth shifted by tens of percent versus schematic-only estimates. That single lab justified the boring via rules.

## Lab habits that still help

Start from PDK defaults for layers and grids. Run DRC early and often, not only at tapeout. Review with someone else: your eyes stop seeing notch violations after hours. A classmate caught a notch I stared past for an hour. Second pairs of eyes are not optional on dense analog cells. Document which rule deck version you used. I screenshot DRC clean reports and attach them to lab submissions so when a rule regresses later, you have proof it once passed.

DRC proves geometry. LVS proves connectivity. Passing DRC but failing LVS still ships broken silicon. We used commercial layout editors with PDK techfiles from the department; export to GDSII matched what teaching assistants ran. Open-source PDKs such as SkyWater exist now; the checklist is the same when layer names change.

Outside the PDK I used Python notebooks to plot resistor ratios against drawn length. The notebook is not in this workspace, but the habit stuck: **measure geometry, do not guess**.

## After the course

I am still early in analog layout. The mindset shift was to stop treating the canvas as graphic design. It is constrained geometry under physics. Aspect ratio is one knob among many, and the fab rules are the hard boundary.

Tapeout stories from industry guests landed harder than any slide deck: the cost of a metal short versus the cost of a missed timing closure. School labs compress that into DRC counts, but the emotional lesson is the same. Clean decks are how you sleep.

I keep old GDS exports in cold storage not for nostalgia but because comparing layer counts between semesters shows how fast PDK revisions move. The vocabulary stays stable even when the numbers change.
