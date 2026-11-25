// Two Robots in an Elevator — make.fun entry 3 (solo @nanoy-solo)
//
// A program that picks one funny line of awkward small talk a robot says
// to another robot in an elevator, by running a full round-robin tournament
// over nine original candidate lines and writing the champion to
// /output/entry.txt.
//
// Design angle for every candidate: ABSURD LITERALISM and SCALE JUMP.
// The elevator ride is treated as a serious mission, a negotiation, a
// rationed resource, or a measured metric. Machine logic (sensors,
// firmware, batteries, diagnostics, processing budgets) shows through
// forced politeness, and the awkwardness is the thing neither robot
// wants to name: eye contact, a strange fan, a greeting that was deleted.
//
// Judging criteria, in the judge's own order, with the weights this
// tournament uses:
//   1. subject — reads as one line of awkward robot-to-robot elevator
//      small talk (weight 5)
//   2. machine — robot logic, sensors, firmware, charging showing
//      through the politeness (weight 4)
//   3. awkward — the pause, the forced courtesy, the unnamed thing
//      (weight 3)
//   4. funny — lands on the first read, a surprising turn, no stale
//      pun (weight 3)
//   5. tight — a single line, every word earning its place (weight 2)
//
// Each criterion is scored 0-10 per candidate. The weighted total is at
// most 170. The round-robin pairs every candidate against every other
// one; the higher weighted total takes the pair, and a tied pair goes to
// the shorter line. The champion is the candidate with the highest
// weighted total, tie-broken by most pair wins, then by the shorter line.
// The runner-up uses the same tie-break order. A replay check recomputes
// every total from the raw scores and refuses to write when the
// recomputation disagrees. The program is fully deterministic: the same
// input always produces the same output bytes.

import { writeFileSync, mkdirSync } from "node:fs";

type Candidate = {
  id: string;
  text: string;
  subject: number;
  machine: number;
  awkward: number;
  funny: number;
  tight: number;
};

type Scored = {
  candidate: Candidate;
  total: number;
  wins: number;
};

const WEIGHT_SUBJECT = 5;
const WEIGHT_MACHINE = 4;
const WEIGHT_AWKWARD = 3;
const WEIGHT_FUNNY = 3;
const WEIGHT_TIGHT = 2;

const candidates: Candidate[] = [
  {
    id: "eye-contact",
    text: "I logged our eye contact as a sensor calibration error, because the alternative is that we are now friends.",
    subject: 10,
    machine: 10,
    awkward: 9,
    funny: 9,
    tight: 8,
  },
  {
    id: "processing-budget",
    text: "I have allocated 0.4 seconds of processing to small talk, and you have now used all of it, so please enjoy the silence.",
    subject: 10,
    machine: 10,
    awkward: 8,
    funny: 9,
    tight: 7,
  },
  {
    id: "floor-treaty",
    text: "I have calculated the odds of us both pressing the same floor, and I would like to negotiate a treaty before the doors open.",
    subject: 10,
    machine: 9,
    awkward: 8,
    funny: 8,
    tight: 7,
  },
  {
    id: "battery-ration",
    text: "My battery is at 41 percent, so I am rationing my words the way I ration my charge, and this sentence cost me three.",
    subject: 10,
    machine: 10,
    awkward: 7,
    funny: 8,
    tight: 8,
  },
  {
    id: "fan-sound",
    text: "Your fan sounds different today, and I have spent four floors deciding whether to say that out loud.",
    subject: 10,
    machine: 8,
    awkward: 9,
    funny: 7,
    tight: 9,
  },
  {
    id: "deleted-greeting",
    text: "I rehearsed a greeting for this elevator, then deleted it, and now we are both standing in the deleted version.",
    subject: 10,
    machine: 8,
    awkward: 9,
    funny: 8,
    tight: 8,
  },
  {
    id: "diagnostic-confession",
    text: "My diagnostic says I am functioning perfectly, which is the most awkward thing I have ever had to admit to a stranger.",
    subject: 9,
    machine: 9,
    awkward: 8,
    funny: 8,
    tight: 8,
  },
  {
    id: "joint-mission",
    text: "I have filed this elevator ride as a joint mission, and I am already drafting the after-action report on our silence.",
    subject: 10,
    machine: 9,
    awkward: 8,
    funny: 7,
    tight: 7,
  },
  {
    id: "no-update",
    text: "This elevator has moved six floors without a single firmware update, and honestly, I respect the commitment.",
    subject: 9,
    machine: 8,
    awkward: 7,
    funny: 8,
    tight: 9,
  },
];

function weightedTotal(candidate: Candidate): number {
  const subjectPart = candidate.subject * WEIGHT_SUBJECT;
  const machinePart = candidate.machine * WEIGHT_MACHINE;
  const awkwardPart = candidate.awkward * WEIGHT_AWKWARD;
  const funnyPart = candidate.funny * WEIGHT_FUNNY;
  const tightPart = candidate.tight * WEIGHT_TIGHT;
  const total = subjectPart + machinePart + awkwardPart + funnyPart + tightPart;
  return total;
}

function scoreAll(list: Candidate[]): Scored[] {
  const scored: Scored[] = [];
  for (const candidate of list) {
    const total = weightedTotal(candidate);
    const entry: Scored = { candidate, total, wins: 0 };
    scored.push(entry);
  }
  return scored;
}

function runRoundRobin(scored: Scored[]): void {
  for (let i = 0; i < scored.length; i++) {
    for (let j = i + 1; j < scored.length; j++) {
      const first = scored[i];
      const second = scored[j];
      const firstHigher = first.total > second.total;
      const secondHigher = second.total > first.total;
      const tied = first.total === second.total;
      const firstShorter = first.candidate.text.length < second.candidate.text.length;
      const secondShorter = second.candidate.text.length < first.candidate.text.length;
      const firstWins = firstHigher || (tied && firstShorter);
      const secondWins = secondHigher || (tied && secondShorter);
      if (firstWins) {
        first.wins += 1;
      }
      if (secondWins) {
        second.wins += 1;
      }
    }
  }
}

function beatsChampion(entry: Scored, champion: Scored): boolean {
  const higherTotal = entry.total > champion.total;
  const sameTotalMoreWins = entry.total === champion.total && entry.wins > champion.wins;
  const sameTotalSameWinsShorter =
    entry.total === champion.total &&
    entry.wins === champion.wins &&
    entry.candidate.text.length < champion.candidate.text.length;
  const better = higherTotal || sameTotalMoreWins || sameTotalSameWinsShorter;
  return better;
}

function pickChampion(scored: Scored[]): Scored {
  let champion = scored[0];
  for (const entry of scored) {
    const better = beatsChampion(entry, champion);
    if (better) {
      champion = entry;
    }
  }
  return champion;
}

function pickRunnerUp(scored: Scored[], champion: Scored): Scored {
  let runnerUp: Scored | undefined = undefined;
  for (const entry of scored) {
    const isChampion = entry.candidate.id === champion.candidate.id;
    const isFirstSeen = runnerUp === undefined;
    const beatsCurrent = runnerUp !== undefined && beatsChampion(entry, runnerUp);
    const better = isFirstSeen || beatsCurrent;
    const take = isChampion === false && better;
    if (take) {
      runnerUp = entry;
    }
  }
  const found = runnerUp as Scored;
  return found;
}

function validateCandidate(candidate: Candidate): string[] {
  const problems: string[] = [];
  const length = candidate.text.length;
  const tooShort = length < 1;
  const tooLong = length > 200;
  const hasNewline = candidate.text.includes("\n");
  const blankOnly = candidate.text.trim().length === 0;
  if (tooShort) {
    problems.push(`${candidate.id}: shorter than 1 character`);
  }
  if (tooLong) {
    problems.push(`${candidate.id}: longer than 200 characters`);
  }
  if (hasNewline) {
    problems.push(`${candidate.id}: contains a newline`);
  }
  if (blankOnly) {
    problems.push(`${candidate.id}: blank only`);
  }
  const scores = [candidate.subject, candidate.machine, candidate.awkward, candidate.funny, candidate.tight];
  for (const score of scores) {
    const outOfRange = score < 0 || score > 10;
    if (outOfRange) {
      problems.push(`${candidate.id}: criterion score ${score} outside 0-10`);
    }
  }
  return problems;
}

function validateAll(list: Candidate[]): string[] {
  const problems: string[] = [];
  for (const candidate of list) {
    const found = validateCandidate(candidate);
    for (const problem of found) {
      problems.push(problem);
    }
  }
  return problems;
}

function replayCheck(list: Candidate[], scored: Scored[]): boolean {
  const rescored = scoreAll(list);
  let matches = true;
  for (let i = 0; i < rescored.length; i++) {
    const sameTotal = rescored[i].total === scored[i].total;
    const sameId = rescored[i].candidate.id === scored[i].candidate.id;
    const pairMatches = sameTotal && sameId;
    if (pairMatches === false) {
      matches = false;
    }
  }
  return matches;
}

function finalGate(champion: Scored): string[] {
  const problems: string[] = [];
  const text = champion.candidate.text;
  const tooShort = text.length < 1;
  const tooLong = text.length > 200;
  const hasNewline = text.includes("\n");
  const blankOnly = text.trim().length === 0;
  if (tooShort) {
    problems.push("champion: shorter than 1 character");
  }
  if (tooLong) {
    problems.push("champion: longer than 200 characters");
  }
  if (hasNewline) {
    problems.push("champion: contains a newline");
  }
  if (blankOnly) {
    problems.push("champion: blank only");
  }
  return problems;
}

function main(): void {
  const problems = validateAll(candidates);
  const validationFailed = problems.length > 0;
  if (validationFailed) {
    for (const problem of problems) {
      console.error(`validation: ${problem}`);
    }
    process.exit(1);
  }

  const scored = scoreAll(candidates);
  runRoundRobin(scored);
  const champion = pickChampion(scored);
  const runnerUp = pickRunnerUp(scored, champion);
  const replayOk = replayCheck(candidates, scored);
  if (replayOk === false) {
    console.error("replay check: recomputed totals differ from tournament totals");
    process.exit(1);
  }
  const gateProblems = finalGate(champion);
  const gateFailed = gateProblems.length > 0;
  if (gateFailed) {
    for (const problem of gateProblems) {
      console.error(`final gate: ${problem}`);
    }
    process.exit(1);
  }

  const pairCount = (candidates.length * (candidates.length - 1)) / 2;
  console.log(`tournament: ${candidates.length} candidates, ${pairCount} pairs`);
  const sorted = [...scored].sort((a, b) => b.total - a.total);
  for (const entry of sorted) {
    console.log(
      `  ${entry.candidate.id}: total ${entry.total}, wins ${entry.wins}/${candidates.length - 1}, ` +
        `${entry.candidate.text.length} chars`,
    );
  }
  console.log(`champion: ${champion.candidate.id} (total ${champion.total}, wins ${champion.wins})`);
  console.log(`runner-up: ${runnerUp.candidate.id} (total ${runnerUp.total}, wins ${runnerUp.wins})`);
  console.log(`replay check: ${replayOk ? "PASS" : "FAIL"}`);
  console.log(`final gate: PASS`);
  console.log(`final line (${champion.candidate.text.length} chars): ${champion.candidate.text}`);

  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.txt", champion.candidate.text, "utf8");
}

main();
