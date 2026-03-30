---
title: Detailed Explanation of the “Extended Action Range” Module
---

The “Extended Action Range” module allows actions to be executed beyond their original maximum range.
The most common misconception about this mechanic is that the server strictly and continuously checks the exact distance between the player character and the target in real time, and that any action immediately becomes invalid the moment it exceeds the original range. In reality, that is not how it works.

Final Fantasy XIV uses a relatively old remote-call architecture, and the server’s validation frequency is limited. Because of that, it is difficult to perform strict, continuous, high-precision real-time range checks.
If the validation were too strict, even minor latency or network fluctuation could cause a large number of false negatives. For example, the client may show the character already within range, while the server is still validating against the previous recorded position, which remains out of range, causing the action to “snap back” and fail. To avoid this, the server actually uses a relatively lenient elastic validation model with a certain tolerance built in.

That does not mean action range can be extended without limit. Although the server allows some degree of out-of-range execution, that tolerance always has an upper bound, and it is not fixed.
The extra distance allowed varies depending on the size of the target’s hitbox. In general, the larger the target’s hitbox, the larger the tolerance tends to be. Therefore, this mechanic is better understood as a limited floating buffer rather than a complete removal of range restrictions. Trying to completely bypass range checks by massively enlarging the target’s hitbox is not realistic.

Using a standard striking dummy as an example, the additional distance normally tolerated by the server is about 2 meters.
In other words, when using an action on a standard dummy, you can usually exceed the original range by roughly 2 meters without the action snapping back; once you go beyond that, snapback will occur. In the current M1S to M4S raid environment, an extension of around 2.3 to 2.4 meters is already sufficient to handle all relevant situations, including mechanics such as circular AoE attack and cross-shaped AoE attack, giving it clear practical value in real combat.

One important point is that, for melee jobs, this mechanic should not be understood simply as giving you a larger safe damage window. Melee auto-attacks have a fixed check range of 2 meters, while normal weapon skills have a maximum attack range of 3 meters, so there is already a built-in 1-meter gap between the two.
Extending action range does not change auto-attack validation, because auto-attack range is entirely controlled by the server. In other words, even if your action can still hit, once your character is beyond 2 meters, auto-attacks will still be lost.

And auto-attacks account for a very large portion of a melee job’s total output, often serving as one of its most important damage sources.
From a value perspective, losing a single auto-attack is often equivalent to losing the damage value of two to three positional steps. Therefore, for melee jobs, playing purely at the maximum extended action range is usually not worth it. In actual positioning decisions, whether you are still within maximum auto-attack range (2 meters) should take priority over whether your action barely still connects.

To help judge distance, plugins such as Avarice or Line can display the maximum range of melee skills (3 meters) and auto-attacks (2 meters).
However, these plugins cannot reflect the actual validated range after modification by the module. They can only be used as a reference for the original range, not as an accurate indicator of the adjusted range.

Area-of-effect actions need to be discussed separately by type:

* **Targeted AoE actions**
  What actually gets extended is only the distance requirement for selecting the target and successfully executing the action, not the damage radius of the action itself. As long as the selected target is within the selectable, non-snapback range, that target will definitely be hit. However, hit checks for all other units are still calculated using the action’s original AoE radius.
  For example, suppose an AoE action has an original effect radius of 15 meters, and the module extends its usable targeting distance by 2 meters. In that case, you may select the target and cast the action from as far as 17 meters away. The selected target will still be hit normally, but other units will only be affected if they are within the original 15-meter radius. Units located between 15 and 17 meters will not be included.

* **Untargeted AoE actions**
  These actions generally gain little to no benefit from this mechanic, because there is no “extended target selection distance” involved in the first place.

Overall, the real effect of the “Extended Action Range” module is fairly limited. It mainly affects the execution validation of single-target actions, and the amount of additional usable range has a clear upper limit, far from enough to fundamentally alter the game’s original range rules.
For melee jobs in particular, this mechanic cannot replace careful control of auto-attack distance. The most stable and highest-value approach is still to keep positioning within maximum auto-attack range (2 meters) whenever possible. In most cases, the extra room gained by stepping outside that range does not compensate for the overall damage lost as a result.

**Author:** @*marcus_tullius_cicero*