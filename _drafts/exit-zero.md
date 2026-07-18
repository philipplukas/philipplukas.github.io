---
title: "Your tool exited 0. It did nothing."
subtitle: "What a misbehaving RGB controller taught me about designing tools for language models."
series: "Harness engineering"
date: 2026-07-21
description: "A CLI that reports success without doing anything is the most dangerous kind of tool — for a shell script, and much more so for an agent."
---

<!--
DRAFT — structure and technical claims are accurate to ~/.config/argb, but the
voice is a first pass. Edit freely before publishing. To preview locally:
    bundle exec jekyll serve --drafts
Move to _posts/2026-07-21-exit-zero.md when you're happy with it.
-->

Last month I spent an evening debugging RGB lighting on my desktop. This is not a serious problem, and I want to be clear that I knew that at the time. But the bug turned out to be the exact bug I keep meeting in production LLM systems, wearing a different hat, and it explained something I had been struggling to articulate about tool design for agents.

The setup: a workstation with addressable RGB across the motherboard headers, RAM, and an AIO cooler. I wanted the colours driven from my wallpaper, so a script derives a palette and pushes it to every controller. Straightforward.

Except the lighting kept coming out wrong, and every command I ran reported success.

## The CLI that always succeeded

Here is the comment I eventually left at the top of the rewritten script, after I understood what had been happening:

> Replaces the old `apply.sh`, which could never have worked: it drove zone 3 (the WiFi antenna, not a fan header), in 'static' mode (single-colour-only), at 40 LEDs (the chain is 45), through the CLI (which exits 0 without doing anything). All four were wrong, and none of them reported an error.

Four independent bugs. Zero error messages. The script had been "working" for weeks in the sense that it ran to completion every time.

The root cause is a tool contract problem. The `openrgb` CLI exits 0 whether or not it did anything — an unknown device name, a zone that never got resized, a mode that does not support per-LED colour, all of these "succeed" silently. The tool's return value carried no information about whether the tool had done its job.

There was a second, nastier layer underneath. OpenRGB's own zone map for this motherboard is wrong: in its Gigabyte driver, the fourth addressable header and the single-LED WiFi antenna share a header id, a genuine upstream collision. So writing per-LED colour to the zone named `ARGB_V2_4` lights up the WiFi antenna and never touches a fan. The name describes something that isn't there.

A tool that lies about *what it did*, on top of a map that lies about *what exists*. I was reasoning confidently from both.

## The same bug, one abstraction up

Swap the actors and this is a story about an agent.

A language model calling a tool is in a strictly worse epistemic position than I was that evening. It cannot see the fans. It has no peripheral vision, no "hm, the case still looks blue." All it has is the string your tool returned. If that string says `success`, the model will believe it, incorporate it into its state, and build every subsequent decision on top of it.

This is why the most dangerous tool in a harness is not the one that errors. It's the one that returns success without doing anything. An error is information — the model can retry, escalate, route around. A false success is *corruption*, and it propagates: the model reports completion to the user, moves to the next step, and the transcript now contains a confident claim that something happened when it did not.

I've seen the production version of this more than once. A search tool that returns an empty result set identically whether the index is empty, the query was malformed, or the backend timed out. A file writer that silently no-ops on a path outside its sandbox. A database tool that swallows a constraint violation and returns `{"status": "ok"}`. In each case the model does exactly what I did with `apply.sh` — reasons fluently and at length from a premise that was never true.

## What the rewrite actually changed

The fix wasn't cleverer code. It was refusing to trust the tool's own account of itself. Four changes, all of which have direct analogues in agent harness design.

**Speak the real protocol, not the convenience wrapper.** I dropped the CLI and talked to the OpenRGB SDK socket directly, because the socket protocol lets you read state back and the CLI does not. In harness terms: prefer the interface that can tell you what happened over the one that's easier to call. Ergonomics that cost you observability are a bad trade.

**Verify preconditions before acting.** Every device is now checked present before anything is written to it. A tool that assumes its target exists will report success against a target that doesn't. For an agent, this means tools should fail loudly on a missing resource rather than treating absence as a no-op.

**Read the state back.** `apply.py --verify` applies the palette, then reads the hardware state and prints it. The tool's return value is derived from observed state, not from the fact that a write didn't throw. This is the single highest-leverage change you can make to an agent tool: return what is *now true*, not what you *attempted*.

**Ground the map in measurement.** The zone map in `hardware.py` carries a warning to future me: every number was established empirically, and none of them should be "fixed" from a datasheet. The datasheet is what the hardware was supposed to be. For agents, the equivalent is that your tool descriptions should describe what the system actually does, including its known lies, not what the API documentation claims.

There's a fifth property that came along for free and matters more than I expected. The whole thing is idempotent and one-shot: it reconciles full state rather than applying deltas. That's why recovering from suspend is a three-line systemd unit that just runs the same script again — OpenRGB devices lose their state across suspend, the cooler generally doesn't, and reapplying everything is cheap enough that keeping the two halves from drifting apart isn't worth being clever about.

Agent harnesses need this badly, because retries are the normal case rather than the exception. A model will call your tool twice. It will call it again after a timeout that actually succeeded. If your tool is idempotent and reconciles toward a declared state, none of that matters. If it appends, increments, or sends, all of it matters a great deal.

## Where this series is going

I've spent the last few years building evaluation infrastructure and data pipelines for LLM systems, and the failure modes that actually cost me time were almost never in the model. They were in the layer around it: what the model can see, what it's allowed to do, what it's told happened, and what it does when something goes wrong.

That layer doesn't have a settled name yet. I've been calling it the harness. It's the agent loop and its termination conditions, the tool schemas, the context that survives compaction, the sandbox, the evals that tell you whether a change helped, and the telemetry that lets you reconstruct a run after it goes sideways.

I want to work through it the way you'd work through any other system: bottom-up, one layer at a time, paying attention to what breaks. Next: the bare API call, and the surprising number of things you have to decide before you have a loop at all.

<!-- Repo for the series goes here once it exists:
     link it in front matter as `repo:` and it'll render in the post meta line. -->
