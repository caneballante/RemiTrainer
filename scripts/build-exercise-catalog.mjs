import { mkdir, writeFile } from "node:fs/promises";

const SOURCE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const SOURCE_IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const OUTPUT_URL = new URL("../data/exercise-catalog.draft.json", import.meta.url);
const NOTES_URL = new URL("../data/exercise-catalog.sources.md", import.meta.url);
const TARGET_COUNT = Number(process.env.CATALOG_TARGET || 150);

const movementOrder = [
  "squat",
  "hinge",
  "lunge",
  "horizontal_push",
  "vertical_push",
  "horizontal_pull",
  "scapular_control",
  "core_anti_extension",
  "core_anti_rotation",
  "carry",
  "conditioning",
  "mobility_hips",
  "mobility_spine",
  "rehab_knee",
  "rehab_shoulder",
];

const targetQuotas = {
  squat: 14,
  hinge: 14,
  lunge: 12,
  horizontal_push: 16,
  vertical_push: 12,
  horizontal_pull: 14,
  scapular_control: 12,
  core_anti_extension: 16,
  core_anti_rotation: 10,
  carry: 6,
  conditioning: 8,
  mobility_hips: 14,
  mobility_spine: 10,
  rehab_knee: 6,
  rehab_shoulder: 6,
};

const disallowedNameFragments = [
  "atlas",
  "advanced",
  "axle",
  "behind head",
  "car deadlift",
  "chain",
  "circus",
  "clean",
  "clean and jerk",
  "decline",
  "depth jump",
  "drag",
  "flye",
  "flyes",
  "handstand",
  "hanging",
  "hurdle",
  "janda",
  "jerk",
  "keg",
  "kipping",
  "log lift",
  "mountain climbers",
  "muscle up",
  "neck",
  "neck resistance",
  "olympic",
  "plate neck",
  "prowler",
  "snatch",
  "sled",
  "stone",
  "tuck jump",
  "turkish",
  "two kettlebells",
  "upright row",
  "windmill",
  "physioball",
];

const source = await fetchSource();
const candidates = source
  .map(transformExercise)
  .filter(Boolean)
  .sort((a, b) => b.selection_score - a.selection_score || a.name.localeCompare(b.name));

const selected = selectBalancedCatalog(candidates, TARGET_COUNT);
const catalog = selected
  .map(({ selection_score: _selectionScore, ...exercise }) => exercise)
  .sort((a, b) => movementOrder.indexOf(a.movement_pattern) - movementOrder.indexOf(b.movement_pattern) || a.name.localeCompare(b.name));

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(OUTPUT_URL, `${JSON.stringify(catalog, null, 2)}\n`);
await writeFile(NOTES_URL, buildNotes(catalog));

console.log(`Wrote ${catalog.length} exercises to ${OUTPUT_URL.pathname}`);
console.log(formatCounts("movement patterns", countBy(catalog, "movement_pattern")));
console.log(formatCounts("equipment", countEquipment(catalog)));

async function fetchSource() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Could not fetch free-exercise-db: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("free-exercise-db response was not an array.");
  }

  return data;
}

function transformExercise(record) {
  const name = cleanText(record.name);
  const sourceId = cleanText(record.id || record.name);
  if (!name || shouldSkip(record, name)) return null;

  const requiredEquipment = normalizeEquipment(record, name);
  if (!requiredEquipment.length) return null;

  const movementPattern = inferMovementPattern(record, name);
  if (!movementPattern) return null;

  const sourceImages = Array.isArray(record.images)
    ? record.images.map((imagePath) => `${SOURCE_IMAGE_BASE}${imagePath}`)
    : [];
  const steps = cleanInstructions(record.instructions);
  const difficulty = normalizeDifficulty(record);

  return {
    id: slug(sourceId),
    source: "free-exercise-db",
    source_id: sourceId,
    source_license: "Unlicense",
    source_url: `https://github.com/yuhonas/free-exercise-db/blob/main/exercises/${encodeURIComponent(record.id)}.json`,
    name,
    movement_pattern: movementPattern,
    focus_tags: inferFocusTags(record, movementPattern),
    required_equipment: requiredEquipment,
    difficulty,
    avoid_if: inferAvoidIf(record, movementPattern, name),
    steps,
    easier_version: easierVersion(requiredEquipment, movementPattern),
    harder_version: harderVersion(requiredEquipment, movementPattern),
    common_mistakes: commonMistakes(movementPattern),
    safety_notes: safetyNotes(record, movementPattern, name),
    image_prompt: imagePrompt(name, movementPattern),
    instruction_image_url: "",
    source_image_urls: sourceImages,
    progression_group: inferProgressionGroup(name, movementPattern, record),
    source_fields: {
      category: record.category || "",
      force: record.force || "",
      mechanic: record.mechanic || "",
      level: record.level || "",
      primary_muscles: record.primaryMuscles || [],
      secondary_muscles: record.secondaryMuscles || [],
      equipment: record.equipment || "",
    },
    selection_score: scoreExercise(record, requiredEquipment, movementPattern, name),
  };
}

function shouldSkip(record, name) {
  const lower = name.toLowerCase();
  const category = String(record.category || "").toLowerCase();
  const equipment = String(record.equipment || "").toLowerCase();

  if (record.level === "expert") return true;
  if (category === "strongman" && !lower.includes("farmer")) return true;
  if (category === "olympic weightlifting" || category === "powerlifting") return true;
  if (equipment === "machine" && !/treadmill|bike|bicycling/.test(lower)) return true;
  if (["barbell", "cable", "e-z curl bar", "exercise ball", "medicine ball", "foam roll"].includes(equipment)) return true;
  if (disallowedNameFragments.some((fragment) => lower.includes(fragment))) return true;
  if (/\b(chin|pull)-?up\b/.test(lower)) return true;
  if (lower.includes("dips") || lower.includes("dip -")) return true;

  return false;
}

function normalizeEquipment(record, name) {
  const lower = name.toLowerCase();
  const equipment = String(record.equipment || "").toLowerCase();
  const category = String(record.category || "").toLowerCase();
  const result = new Set();

  if (equipment === "body only" || !equipment) result.add("bodyweight");
  if (equipment === "dumbbell") result.add("dumbbells");
  if (equipment === "bands") result.add("resistance-bands");
  if (equipment === "kettlebells") result.add("kettlebell");

  if (equipment === "machine" && lower.includes("treadmill")) result.add("treadmill");
  if (equipment === "machine" && (lower.includes("bike") || lower.includes("bicycling"))) result.add("bike");

  if (equipment === "other") {
    if (lower.includes("bicycling") || lower.includes("bike")) result.add("bike");
    else if (lower.includes("chair")) result.add("chair");
    else if (lower.includes("bench")) result.add("bench");
    else if (lower.includes("box") || lower.includes("step")) result.add("step");
    else if (lower.includes("farmer")) result.add("dumbbells");
    else if (category === "stretching" || category === "cardio") result.add("bodyweight");
  }

  if (/floor|lying|prone|supine|kneeling|stretch|crunch|sit-up|plank|bridge/.test(lower)) result.add("mat");
  if (/bench|incline|decline/.test(lower)) result.add("bench");
  if (/chair/.test(lower)) result.add("chair");
  if (/step-up|step up|box/.test(lower)) result.add("step");

  return [...result].filter(Boolean).sort();
}

function inferMovementPattern(record, name) {
  const lower = name.toLowerCase();
  const category = String(record.category || "").toLowerCase();
  const muscles = [...(record.primaryMuscles || []), ...(record.secondaryMuscles || [])].map((item) => String(item).toLowerCase());
  const primary = String(record.primaryMuscles?.[0] || "").toLowerCase();

  if (/lunge|step up|step-up|split squat/.test(lower)) return "lunge";
  if (/monster walk|hip abduction|hip adduction|hip flexion|calf raise/.test(lower)) return "rehab_knee";
  if (/farmer|suitcase|carry/.test(lower)) return "carry";
  if (category === "cardio" || /running|bicycling|bike|skating|treadmill|step mill|stair|trail running/.test(lower)) return "conditioning";
  if (category === "stretching") {
    if (/shoulder|chest|arm|wrist|forearm|scap|upper/.test(lower) || muscles.some((muscle) => ["shoulders", "chest", "forearms", "traps"].includes(muscle))) {
      return "rehab_shoulder";
    }
    if (/back|spine|cat|child|thoracic|neck/.test(lower) || muscles.some((muscle) => ["lower back", "middle back", "lats"].includes(muscle))) {
      return "mobility_spine";
    }
    return "mobility_hips";
  }

  if (/row|flye|fly|pull apart|pull-apart|pullover/.test(lower) || ["middle back", "lats"].includes(primary)) return "horizontal_pull";
  if (/external rotation|internal rotation|scaption|rear delt|raise|pull apart|pull-apart|shrug/.test(lower)) return "scapular_control";
  if (/shoulder press|military press|arnold|overhead|upright row/.test(lower) || primary === "shoulders") return "vertical_push";
  if (/push-up|pushup|press|chest|flye|fly/.test(lower) || primary === "chest" || primary === "triceps") return "horizontal_push";
  if (/squat|sit squat/.test(lower) || primary === "quadriceps") return "squat";
  if (/deadlift|good morning|bridge|hip lift|hip extension|glute|hamstring|leg curl|kickback/.test(lower) || ["hamstrings", "glutes"].includes(primary)) return "hinge";
  if (/twist|rotation|oblique|side bend|windmill|wiper/.test(lower)) return "core_anti_rotation";
  if (/plank|bug|crunch|sit-up|leg raise|knee raise|ab|core|cocoon|butt-up|jackknife/.test(lower) || primary === "abdominals") return "core_anti_extension";
  if (/quad/.test(lower)) return "rehab_knee";

  return null;
}

function normalizeDifficulty(record) {
  const category = String(record.category || "").toLowerCase();
  if (record.level === "beginner") return category === "plyometrics" ? 2 : 1;
  if (record.level === "intermediate") return 2;
  return 3;
}

function inferFocusTags(record, movementPattern) {
  const tags = new Set();
  const category = String(record.category || "").toLowerCase();

  if (["squat", "hinge", "lunge", "carry", "conditioning"].includes(movementPattern)) tags.add("full-body");
  if (["squat", "hinge", "lunge", "mobility_hips", "rehab_knee", "conditioning"].includes(movementPattern)) tags.add("lower-body");
  if (["horizontal_push", "vertical_push", "horizontal_pull", "scapular_control", "rehab_shoulder"].includes(movementPattern)) tags.add("upper-body");
  if (["horizontal_push", "vertical_push"].includes(movementPattern)) tags.add("push");
  if (["horizontal_pull", "scapular_control", "carry"].includes(movementPattern)) tags.add("pull");
  if (["core_anti_extension", "core_anti_rotation", "carry"].includes(movementPattern)) tags.add("core");
  if (category === "stretching" || movementPattern.startsWith("mobility")) tags.add("mobility");
  if (movementPattern.startsWith("rehab")) tags.add("pt-recovery");
  if (movementPattern === "conditioning") tags.add("cardio");

  return [...tags];
}

function inferAvoidIf(record, movementPattern, name) {
  const lower = name.toLowerCase();
  const avoid = new Set();

  if (["horizontal_push", "vertical_push", "scapular_control", "rehab_shoulder"].includes(movementPattern)) avoid.add("shoulder pain");
  if (/push-up|plank|hands|wrist|forearm/.test(lower)) avoid.add("wrist pain");
  if (["squat", "lunge", "conditioning", "rehab_knee"].includes(movementPattern)) avoid.add("knee pain");
  if (["hinge", "core_anti_extension", "core_anti_rotation", "carry"].includes(movementPattern)) avoid.add("low back pain");
  if (/balance|single-leg|one-legged|step/.test(lower)) avoid.add("balance issues");
  if (/bound|jump|hop|run|rope|skating|skipping/.test(lower)) avoid.add("ankle pain");

  return [...avoid];
}

function easierVersion(equipment, movementPattern) {
  if (equipment.includes("dumbbells") || equipment.includes("kettlebell")) return "Use a lighter weight and a smaller range of motion.";
  if (equipment.includes("resistance-bands")) return "Use a lighter band or stand closer to the anchor point.";
  if (movementPattern.startsWith("mobility") || movementPattern.startsWith("rehab")) return "Use a smaller, slower, pain-free range.";
  if (movementPattern === "conditioning") return "Slow the pace and shorten the work interval.";
  return "Use support, shorten the range, or slow the tempo.";
}

function harderVersion(equipment, movementPattern) {
  if (equipment.includes("dumbbells") || equipment.includes("kettlebell")) return "Use a slightly heavier load, add a pause, or slow the lowering phase.";
  if (equipment.includes("resistance-bands")) return "Use a stronger band, step farther from the anchor, or add a pause.";
  if (movementPattern.startsWith("mobility") || movementPattern.startsWith("rehab")) return "Add a longer pause while keeping the movement calm and pain-free.";
  if (movementPattern === "conditioning") return "Increase pace slightly or extend the work interval.";
  return "Add a slow lowering phase, pause, or slightly more range while keeping form steady.";
}

function commonMistakes(movementPattern) {
  const map = {
    squat: ["Rushing depth", "Knees collapsing inward", "Losing whole-foot pressure"],
    hinge: ["Rounding the low back", "Turning it into a squat", "Letting the load drift away"],
    lunge: ["Dropping too fast", "Front knee diving inward", "Pushing mostly from the back foot"],
    horizontal_push: ["Shrugging shoulders", "Flaring elbows too wide", "Letting the ribs flare"],
    vertical_push: ["Arching the low back", "Pressing forward instead of up", "Shrugging near the ears"],
    horizontal_pull: ["Twisting through the torso", "Pulling with the neck", "Letting shoulders roll forward"],
    scapular_control: ["Using momentum", "Shrugging", "Moving through a pinchy range"],
    core_anti_extension: ["Arching the low back", "Holding breath", "Moving too quickly"],
    core_anti_rotation: ["Rotating through the hips", "Holding breath", "Letting shoulders hike"],
    carry: ["Leaning to one side", "Rushing steps", "Holding breath"],
    conditioning: ["Letting form collapse", "Going too hard too soon", "Holding breath"],
    mobility_hips: ["Forcing end range", "Rushing the motion", "Collapsing posture"],
    mobility_spine: ["Forcing end range", "Moving only through the neck", "Holding breath"],
    rehab_knee: ["Forcing range", "Letting the knee twist", "Ignoring discomfort changes"],
    rehab_shoulder: ["Shrugging", "Forcing painful range", "Moving too fast"],
  };

  return map[movementPattern] || ["Moving too quickly", "Using more range than control allows", "Holding breath"];
}

function safetyNotes(record, movementPattern, name) {
  const notes = new Set(["Use a controlled, pain-free range and stop if discomfort increases."]);
  const lower = name.toLowerCase();

  if (movementPattern === "conditioning") notes.add("Keep the effort sustainable; this should not turn into punishment.");
  if (["squat", "lunge", "rehab_knee"].includes(movementPattern)) notes.add("Reduce depth or use support if knees feel irritated.");
  if (["horizontal_push", "vertical_push", "rehab_shoulder", "scapular_control"].includes(movementPattern)) notes.add("Avoid pinching or sharp shoulder sensations.");
  if (["hinge", "core_anti_extension", "core_anti_rotation", "carry"].includes(movementPattern)) notes.add("Keep the trunk steady and stop before low-back compensation.");
  if (lower.includes("band")) notes.add("Check the band and anchor before starting.");

  return [...notes];
}

function imagePrompt(name, movementPattern) {
  const label = movementPattern.replace(/_/g, " ");
  return `Clean instructional fitness illustration for ${name}, ${label} movement, neutral background, show safe start and finish positions, no text.`;
}

function inferProgressionGroup(name, movementPattern, record) {
  const lower = name.toLowerCase();
  if (lower.includes("push")) return "pushup_press";
  if (lower.includes("row")) return "row";
  if (lower.includes("squat")) return "squat";
  if (lower.includes("lunge")) return "lunge";
  if (lower.includes("deadlift") || lower.includes("good morning")) return "hinge_deadlift";
  if (lower.includes("bridge") || lower.includes("hip")) return "hip_bridge";
  if (lower.includes("plank")) return "plank";
  if (lower.includes("crunch") || lower.includes("sit-up")) return "trunk_flexion";
  if (lower.includes("curl")) return "curl";
  if (lower.includes("stretch")) return "mobility";
  return `${movementPattern}_${slug(record.primaryMuscles?.[0] || "general")}`;
}

function scoreExercise(record, equipment, movementPattern, name) {
  const lower = name.toLowerCase();
  const category = String(record.category || "").toLowerCase();
  let score = 0;

  if (record.level === "beginner") score += 12;
  if (record.level === "intermediate") score += 12;
  if (equipment.includes("bodyweight")) score += 12;
  if (equipment.includes("mat")) score += 8;
  if (equipment.includes("dumbbells")) score += 7;
  if (equipment.includes("resistance-bands")) score += 8;
  if (category === "stretching") score += 8;
  if (movementPattern.startsWith("rehab") || movementPattern.startsWith("mobility")) score += 8;
  if (["squat", "hinge", "lunge", "horizontal_push", "horizontal_pull", "core_anti_extension"].includes(movementPattern)) score += 6;
  if (/bench|incline|floor|standing|seated|bodyweight|band|dumbbell|walking|stretch/.test(lower)) score += 4;
  if (/jump|hop|sprint|explosive|plyo/.test(lower)) score -= 3;
  if (/behind neck|behind the neck|upright row|flyes/.test(lower)) score -= 5;
  if (String(record.mechanic || "") === "compound") score += 2;

  return score;
}

function selectBalancedCatalog(candidates, targetCount) {
  const selected = [];
  const selectedIds = new Set();
  const byPattern = new Map(movementOrder.map((pattern) => [pattern, []]));

  candidates.forEach((candidate) => {
    byPattern.get(candidate.movement_pattern)?.push(candidate);
  });

  movementOrder.forEach((pattern) => {
    const quota = targetQuotas[pattern] || 0;
    const bucket = byPattern.get(pattern) || [];
    for (const candidate of bucket.slice(0, quota)) {
      if (selected.length >= targetCount) break;
      selected.push(candidate);
      selectedIds.add(candidate.id);
    }
  });

  for (const candidate of candidates) {
    if (selected.length >= targetCount) break;
    if (selectedIds.has(candidate.id)) continue;
    selected.push(candidate);
    selectedIds.add(candidate.id);
  }

  return selected;
}

function cleanInstructions(instructions) {
  const cleaned = Array.isArray(instructions) ? instructions.map(cleanInstructionText).filter(Boolean) : [];
  return cleaned.length ? cleaned : ["Set up with control.", "Move through a comfortable range.", "Return slowly.", "Repeat with steady breathing."];
}

function cleanInstructionText(value) {
  return cleanText(value)
    .replace(/\b[Ee]xplosively\b/g, "with control")
    .replace(/\b[Qq]uickly reverse\b/g, "smoothly reverse")
    .replace(/,and\b/g, ", and")
    .replace(/\bas fast as possible\b/gi, "at a controlled pace")
    .replace(/\bmaximum speed\b/gi, "a controlled pace")
    .replace(/\bblast\b/gi, "move")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/¾/g, "3/4")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value) {
  return cleanText(value)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function countEquipment(items) {
  return items.reduce((counts, item) => {
    item.required_equipment.forEach((equipment) => {
      counts[equipment] = (counts[equipment] || 0) + 1;
    });
    return counts;
  }, {});
}

function formatCounts(title, counts) {
  const body = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
  return `${title}: ${body}`;
}

function buildNotes(catalog) {
  const patternCounts = countBy(catalog, "movement_pattern");
  const lowPatternNotes = movementOrder
    .filter((pattern) => (patternCounts[pattern] || 0) < 5)
    .map((pattern) => {
      const count = patternCounts[pattern] || 0;
      return `- ${pattern}: ${count} ${count === 1 ? "record" : "records"}`;
    });
  const lines = [
    "# RemiTrainer Draft Exercise Catalog",
    "",
    `Generated from ${SOURCE_URL}.`,
    "",
    "Source license: free-exercise-db is published under the Unlicense/public-domain dedication. Keep this note with the generated catalog so the source stays traceable.",
    "",
    "This is a deterministic draft. It is intentionally not wired into the live workout generator yet.",
    "",
    "Next curation passes:",
    "- Review exercises that feel too gym-specific or too technical.",
    "- Add or edit PT/recovery movements that the source dataset does not cover well.",
    "- Optionally run a one-time AI enrichment pass for cleaner regressions, progressions, contraindications, and image prompts.",
    "- Seed the approved catalog into Neon or move it into a shared server-side module.",
    "",
    "Known source-data gaps to supplement manually or with AI:",
    ...(lowPatternNotes.length ? lowPatternNotes : ["- No movement pattern is below 5 records."]),
    "",
    formatCounts("Movement pattern counts", patternCounts),
    "",
    formatCounts("Equipment counts", countEquipment(catalog)),
    "",
  ];

  return `${lines.join("\n")}\n`;
}
