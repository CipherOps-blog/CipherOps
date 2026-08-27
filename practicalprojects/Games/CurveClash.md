# Curve Clash

I built a small game called Curve Clash and wanted to share it [here](https://cipherops-blog.github.io/CurveClash/). I made this mostly for my own amusement and figured others might enjoy trying it too. 

The core mechanic is that each player fires by typing the right-hand side of a function. The interface supplies the `f(x) =` part; the player only enters expressions such as `x^2 - 1`, `0.5 * x`, `2 * sin(x / 1.5)`, `2 * ln(x + 1)`, or `exp(x / 3) - 1`. Expressions must cross `y = 0` somewhere in the playable range, so functions like `x^2 + 1` are rejected, along with `min()`, `max()`, `abs()`, anything using `y`, and implicit equations like `x^2 + y^2 = 1`.

Turn order is fixed: the human player fires first, then bots in a shuffled but constant order for the rest of the match. Bots come in two behaviors. Competitive bots pick a surviving target at random and plan a terrain-aware route toward it, adjusted by a difficulty setting. Peaceful bots never fire; they still occupy the arena, block or absorb shots, and can be eliminated for their normal score value.

Each match includes one buried shield and one buried beam power-up, hidden deep enough inside obstacles that a single crater cannot expose them; uncovering one requires at least two separate shots. The shield blocks one hit before disappearing; the beam persists for its owner and widens as it travels, though its centerline still stops at the first obstacle it meets.

Scoring is distance-based: a kill's base value is the straight-line distance from shooter to target, with any portion of that line passing through obstacles counted twice. Multi-kills sort their base values from smallest to largest and apply increasing multipliers. Final ranking is decided by score, then kills, then survival, then turn order.
