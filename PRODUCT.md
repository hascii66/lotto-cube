# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Thai readers who inspect Thai government lottery results and historical statistics, often on a phone.

## Product Purpose

LottoCube helps people explore stored lottery results, compare number histories, and inspect how displayed statistics are calculated. The user's redesign goal is fast mobile analysis with fewer taps while keeping every existing workflow reachable.

## Positioning

No exclusive market position is confirmed. The current product combines a local result archive, historical analysis, and transparent heuristic scores in one Thai/English web app. Scores are not probabilities or guarantees.

## Operating Context

People use the app on phones and laptops to inspect past draws, explore two- and three-digit statistics, check numbers, and search or maintain the local archive. Thai and English are supported. Mobile is the redesign priority; all current workflows remain in scope.

## Capabilities and Constraints

- Shows stored first-prize, front-three, back-three, and last-two results.
- Provides two- and three-digit analysis, number scoring, historical lookup, and draw archive search.
- Supports manual result entry, JSON import/export, Thai/English, light/dark/system themes, and offline reopening as a web PWA.
- Preserve numeric strings and leading zeroes.
- Historical scores are heuristic rankings, not calibrated probabilities. Do not claim historical frequency or draw weekday predicts a future result.
- Keep the current app's workflows and data behavior intact through the redesign.

## Evidence on Hand

`data/lotto-history.json` contains the stored historical results. The app includes archive-source labels, but this file does not establish that every record is independently verified. Do not invent results, odds, prediction success, or official endorsement.

## Product Principles

- Put common mobile analysis within few taps.
- Keep every current workflow reachable.
- Show where each statistic comes from and what its score means.
- Preserve source data and numeric formatting.
