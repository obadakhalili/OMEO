# Omeo Brainstorm

# Game flow

The game can be in one of two modes:

- Single-player mode.
- Multi-player mode.

## Single-player mode

It consists of three levels

### Level 1

A simple start where the player has to survive the obstacles coming into his way by jumping or crouching.

### Level 2

A combination of level 1 + shooting flying objects to survive.

### Level 3

This will be the monster level. Where the player has to face a monster, and they have to shoot each other to death.

## Multi-player mode

This mode shall play out as follows:

- The game detects two players.
- A wall is inserted between them.
- In each player's turn, the other player gets frozen for a certain amount of time and has to throw objects at the frozen player, and the damage is determined based on the place of the hit.

# AI tasks and game features

## Pixel segmentation

Necessary to insert only the player's pixels into the game.

## Pixel classification into body parts

Necessary to determine the damage based on the place of the hit.

## Pose detection

Necessary for:

- Applying gun filters into the player’s hand.
- Shooting.
- Sound effects, upon player jump for example.

## Multi-person segmentation

Necessary for the multi-player mode.

## AI-based adversary

Necessary for the monster to do smarter moves.

# Theme

Most likely a Mario them, since it’s a theme with so many assets online. Or we can choose a different one if we decided to be better.

# Approach

It’s important to note that we are not aiming to strictly achieve all of the above. We will follow an iterative agile approach, where we will first implement the most minimal version of the game, then start adding features incrementally.
