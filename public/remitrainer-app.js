const STORAGE_KEY = "remitrainer_household_v2";

const focusLabels = {
  "full-body": "Full body",
  "upper-body": "Upper body",
  "lower-body": "Lower body",
  push: "Push",
  pull: "Pull",
  core: "Core",
  mobility: "Mobility/stretching",
  "pt-recovery": "PT/recovery",
  cardio: "Cardio/conditioning",
  "ai-chooses": "AI chooses",
};

const intensityLabels = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
  recovery: "Recovery",
  surprise: "Surprise me",
};

const equipmentOptions = [
  { id: "bodyweight", label: "Bodyweight" },
  { id: "mat", label: "Mat" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "resistance-bands", label: "Resistance bands" },
  { id: "bench", label: "Bench" },
  { id: "step", label: "Step or stairs" },
  { id: "chair", label: "Chair" },
  { id: "treadmill", label: "Treadmill" },
  { id: "bike", label: "Bike" },
  { id: "kettlebell", label: "Kettlebell" },
];

const movementPatternLabels = {
  squat: "Squat",
  hinge: "Hinge",
  lunge: "Lunge or step",
  horizontal_push: "Horizontal push",
  vertical_push: "Vertical push",
  horizontal_pull: "Horizontal pull",
  scapular_control: "Scapular control",
  core_anti_extension: "Core anti-extension",
  core_anti_rotation: "Core anti-rotation",
  carry: "Carry",
  conditioning: "Conditioning",
  mobility_hips: "Hip mobility",
  mobility_spine: "Spine mobility",
  rehab_knee: "Knee recovery",
  rehab_shoulder: "Shoulder recovery",
};

const levelRank = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

const intensityRank = {
  recovery: -1,
  easy: 0,
  normal: 1,
  hard: 2,
};

const feedbackLabels = {
  complete: "complete",
  easy: "too easy",
  right: "just right",
  hard: "too hard",
  pain: "pain/discomfort",
  skipped: "skipped",
  ban: "ban this exercise",
};

const workoutPlayerFeedbackLabels = {
  easy: "Too easy",
  right: "Just right",
  hard: "Too hard",
  pain: "Pain/discomfort",
  skipped: "Skipped",
  ban: "Ban this exercise",
};

const completionRatings = new Set(["complete", "easy", "right", "hard"]);
const addressedRatings = new Set(["complete", "easy", "right", "hard", "pain", "skipped", "ban"]);

const profileGuideQuestions = [
  {
    field: "age",
    title: "Age",
    prompt: "How old are you?",
    type: "number",
    min: 1,
  },
  {
    field: "sex",
    title: "Sex",
    prompt: "Which option should RemiTrainer use for exercise context?",
    type: "select",
    options: [
      ["female", "Female"],
      ["male", "Male"],
      ["nonbinary", "Nonbinary"],
      ["not-specified", "Prefer not to say"],
    ],
  },
  {
    field: "weight",
    title: "Weight",
    prompt: "What weight should be saved on the profile?",
    type: "number",
    min: 1,
  },
  {
    field: "fitness_level",
    title: "Fitness level",
    prompt: "What level feels true most days?",
    type: "select",
    options: [
      ["beginner", "Beginner"],
      ["intermediate", "Intermediate"],
      ["advanced", "Advanced"],
    ],
  },
  {
    field: "goals",
    title: "Goals",
    prompt: "What should workouts help you move toward?",
    type: "textarea",
    placeholder: "Build consistency, improve strength, protect knees...",
  },
  {
    field: "preferred_workout_style",
    title: "Workout style",
    prompt: "What kind of workout experience do you prefer?",
    type: "select",
    options: [
      ["Supportive, simple, and sustainable", "Supportive and simple"],
      ["Efficient strength work with clear progressions", "Efficient strength"],
      ["Mobility-first with calm strength work", "Mobility-first"],
      ["Conditioning-focused but not punishing", "Conditioning-focused"],
      ["A balanced mix that changes with recovery", "Balanced and adaptive"],
    ],
  },
  {
    field: "preferred_mix",
    title: "Training mix",
    prompt: "What should RemiTrainer emphasize? Pick what feels useful.",
    type: "mix",
    options: ["Strength", "Mobility", "PT/recovery", "Stretching", "Cardio"],
  },
  {
    field: "injuries_or_limitations",
    title: "Limitations",
    prompt: "Any injuries, tender spots, or movements that need caution?",
    type: "textarea",
    placeholder: "Knee pain, wrist pain, low back tightness...",
  },
  {
    field: "exercises_to_avoid",
    title: "Avoid for now",
    prompt: "Any exercises you dislike or want RemiTrainer to avoid unless necessary?",
    type: "textarea",
    placeholder: "Burpees, jumping lunges...",
  },
  {
    field: "permanently_banned_exercises",
    title: "Never suggest",
    prompt: "Any exercises that should be permanently banned for you?",
    type: "textarea",
    placeholder: "Exact exercise names, separated by commas",
  },
];

const dataModelSchema = {
  household: ["id", "name", "created_at", "updated_at"],
  profiles: [
    "id",
    "household_id",
    "name",
    "age",
    "sex",
    "weight",
    "fitness_level",
    "goals",
    "preferred_workout_style",
    "preferred_mix",
    "injuries_or_limitations",
    "exercises_to_avoid",
    "permanently_banned_exercises",
  ],
  household_equipment: ["household_id", "equipment_id", "available"],
  profile_limitations: ["id", "profile_id", "type", "value", "severity"],
  profile_banned_exercises: ["id", "profile_id", "exercise_id", "exercise_name", "banned_at", "reason"],
  shared_workout_sessions: [
    "id",
    "household_id",
    "requested_at",
    "request",
    "compact_context",
    "parent_workout_plan",
    "original_ai_response",
    "final_validated_workout",
  ],
  shared_workout_invites: [
    "id",
    "shared_workout_session_id",
    "from_profile_id",
    "to_profile_id",
    "status",
    "created_at",
    "opened_at",
    "dismissed_at",
  ],
  user_workout_instances: [
    "id",
    "shared_workout_session_id",
    "profile_id",
    "estimated_minutes",
    "adaptation_notes",
    "exercises",
  ],
  workout_exercise_instances: [
    "id",
    "user_workout_instance_id",
    "profile_id",
    "parent_slot_id",
    "movement_pattern",
    "exercise_id",
    "sets",
    "reps",
    "rest_seconds",
    "required_equipment",
    "substitution_reason",
  ],
  exercise_feedback: [
    "id",
    "profile_id",
    "shared_workout_session_id",
    "user_workout_instance_id",
    "workout_exercise_instance_id",
    "exercise_id",
    "rating",
    "logged_at",
  ],
  exercise_instruction_assets: [
    "exercise_id",
    "instruction_image_url",
    "image_prompt",
    "steps",
    "easier_version",
    "harder_version",
    "common_mistakes",
    "safety_notes",
  ],
};

const exerciseLibrary = [
  exercise({
    id: "wall_pushup",
    name: "Wall push-up",
    pattern: "horizontal_push",
    focus: ["push", "upper-body", "pt-recovery"],
    equipment: ["bodyweight"],
    difficulty: 1,
    avoidIf: ["wrist pain", "shoulder pain"],
    steps: ["Stand arm's length from a wall.", "Brace gently.", "Lower chest toward wall.", "Press back with smooth control."],
    easier: "Stand closer to the wall.",
    harder: "Move feet farther away or use a lower surface.",
    mistakes: ["Shrugging shoulders", "Letting hips sag", "Rushing the bottom position"],
    safety: ["Stop if shoulder or wrist discomfort increases."],
  }),
  exercise({
    id: "incline_pushup",
    name: "Incline push-up",
    pattern: "horizontal_push",
    focus: ["push", "upper-body", "full-body"],
    equipment: ["bodyweight", "bench"],
    difficulty: 2,
    avoidIf: ["wrist pain"],
    steps: ["Place hands on a bench or sturdy counter.", "Keep ribs and hips stacked.", "Lower under control.", "Press back without locking shoulders forward."],
    easier: "Use a higher surface.",
    harder: "Use a lower surface or add a slow lower.",
    mistakes: ["Head reaching forward", "Hands too narrow", "Losing trunk position"],
    safety: ["Use a stable surface that will not slide."],
  }),
  exercise({
    id: "dumbbell_floor_press",
    name: "Dumbbell floor press",
    pattern: "horizontal_push",
    focus: ["push", "upper-body", "full-body"],
    equipment: ["dumbbells", "mat"],
    difficulty: 3,
    avoidIf: ["shoulder pain"],
    steps: ["Lie on the floor with dumbbells over elbows.", "Set shoulders gently back.", "Press weights up.", "Lower until upper arms touch the floor lightly."],
    easier: "Use lighter dumbbells or alternate arms.",
    harder: "Use a pause near the floor.",
    mistakes: ["Bouncing elbows", "Overarching low back", "Letting wrists bend back"],
    safety: ["Keep elbows about 30 to 45 degrees from the torso."],
  }),
  exercise({
    id: "band_chest_press",
    name: "Band chest press",
    pattern: "horizontal_push",
    focus: ["push", "upper-body"],
    equipment: ["resistance-bands"],
    difficulty: 2,
    avoidIf: ["shoulder pain"],
    steps: ["Anchor the band behind you.", "Stand tall with ribs down.", "Press forward.", "Return slowly with control."],
    easier: "Use a lighter band.",
    harder: "Step farther from the anchor.",
    mistakes: ["Flaring ribs", "Shrugging", "Snapping the band back"],
    safety: ["Check the band and anchor before pressing."],
  }),
  exercise({
    id: "half_kneeling_press",
    name: "Half-kneeling dumbbell press",
    pattern: "vertical_push",
    focus: ["push", "upper-body", "full-body"],
    equipment: ["dumbbells", "mat"],
    difficulty: 3,
    avoidIf: ["shoulder pain"],
    steps: ["Set up in half-kneeling.", "Brace without leaning back.", "Press one dumbbell overhead.", "Lower to shoulder height."],
    easier: "Use a lighter dumbbell or press from tall kneeling.",
    harder: "Pause overhead for two seconds.",
    mistakes: ["Arching low back", "Pressing forward instead of up", "Losing balance"],
    safety: ["Keep the press pain-free and avoid forcing overhead range."],
  }),
  exercise({
    id: "wall_slide",
    name: "Wall slide",
    pattern: "vertical_push",
    focus: ["mobility", "pt-recovery", "upper-body"],
    equipment: ["bodyweight"],
    difficulty: 1,
    avoidIf: [],
    steps: ["Stand with back near a wall.", "Slide forearms upward.", "Keep breath easy.", "Lower with control."],
    easier: "Move farther from the wall.",
    harder: "Add a light lift-off at the top.",
    mistakes: ["Forcing the range", "Shrugging", "Arching low back"],
    safety: ["Stay below painful shoulder range."],
  }),
  exercise({
    id: "one_arm_row",
    name: "One-arm dumbbell row",
    pattern: "horizontal_pull",
    focus: ["pull", "upper-body", "full-body"],
    equipment: ["dumbbells", "bench"],
    difficulty: 3,
    avoidIf: ["low back pain"],
    steps: ["Support one hand on a bench.", "Keep spine long.", "Pull dumbbell toward ribs.", "Lower slowly."],
    easier: "Use lighter weight or a higher hand support.",
    harder: "Pause at the top.",
    mistakes: ["Twisting the torso", "Pulling with the neck", "Dropping the shoulder"],
    safety: ["Keep the supporting surface stable."],
  }),
  exercise({
    id: "band_row",
    name: "Band row",
    pattern: "horizontal_pull",
    focus: ["pull", "upper-body", "full-body"],
    equipment: ["resistance-bands"],
    difficulty: 2,
    avoidIf: [],
    steps: ["Anchor band at chest height.", "Hold handles with arms long.", "Pull elbows back.", "Return slowly."],
    easier: "Use a lighter band.",
    harder: "Step farther back or pause at the squeeze.",
    mistakes: ["Shrugging", "Leaning back", "Letting band snap forward"],
    safety: ["Use a secure anchor point."],
  }),
  exercise({
    id: "towel_row",
    name: "Towel row",
    pattern: "horizontal_pull",
    focus: ["pull", "upper-body"],
    equipment: ["bodyweight"],
    difficulty: 2,
    avoidIf: ["shoulder pain"],
    steps: ["Hold a towel around a sturdy post or rail.", "Lean back slightly.", "Pull chest toward hands.", "Return under control."],
    easier: "Stand more upright.",
    harder: "Lean farther back.",
    mistakes: ["Loose grip", "Shoulders rolling forward", "Jerking from the hips"],
    safety: ["Only use a support that cannot move."],
  }),
  exercise({
    id: "band_pull_apart",
    name: "Band pull-apart",
    pattern: "scapular_control",
    focus: ["pull", "upper-body", "pt-recovery"],
    equipment: ["resistance-bands"],
    difficulty: 1,
    avoidIf: [],
    steps: ["Hold a light band at shoulder height.", "Pull hands apart.", "Squeeze shoulder blades lightly.", "Return slowly."],
    easier: "Use a lighter band or shorter range.",
    harder: "Add a pause at full reach.",
    mistakes: ["Shrugging", "Rib flare", "Bending elbows too much"],
    safety: ["Keep tension gentle for recovery days."],
  }),
  exercise({
    id: "prone_y_raise",
    name: "Prone Y raise",
    pattern: "scapular_control",
    focus: ["pull", "upper-body", "pt-recovery"],
    equipment: ["mat"],
    difficulty: 2,
    avoidIf: ["shoulder pain"],
    steps: ["Lie face down.", "Reach arms in a Y shape.", "Lift thumbs slightly.", "Lower with control."],
    easier: "Lift one arm at a time.",
    harder: "Hold the top for three seconds.",
    mistakes: ["Craning neck", "Lifting too high", "Using momentum"],
    safety: ["This should feel controlled, not pinchy."],
  }),
  exercise({
    id: "box_squat",
    name: "Box squat",
    pattern: "squat",
    focus: ["lower-body", "full-body", "pt-recovery"],
    equipment: ["chair"],
    difficulty: 1,
    avoidIf: ["knee pain"],
    steps: ["Stand in front of a chair.", "Reach hips back.", "Tap the chair lightly.", "Stand tall through the whole foot."],
    easier: "Use a higher chair.",
    harder: "Hold a dumbbell at chest height.",
    mistakes: ["Dropping quickly", "Knees collapsing inward", "Rocking to stand"],
    safety: ["Use a chair that will not slide."],
  }),
  exercise({
    id: "goblet_squat",
    name: "Goblet squat",
    pattern: "squat",
    focus: ["lower-body", "full-body"],
    equipment: ["dumbbells"],
    difficulty: 3,
    avoidIf: ["knee pain"],
    steps: ["Hold one dumbbell at chest height.", "Sit between the hips.", "Keep chest tall.", "Stand through the whole foot."],
    easier: "Use bodyweight or a box target.",
    harder: "Add a slow lower or pause.",
    mistakes: ["Heels lifting", "Rushing depth", "Knees caving inward"],
    safety: ["Use a pain-free depth."],
  }),
  exercise({
    id: "bodyweight_squat",
    name: "Bodyweight squat",
    pattern: "squat",
    focus: ["lower-body", "full-body"],
    equipment: ["bodyweight"],
    difficulty: 2,
    avoidIf: ["knee pain"],
    steps: ["Stand with comfortable stance.", "Reach hips back and down.", "Keep knees tracking over toes.", "Stand tall."],
    easier: "Reduce depth or use a chair target.",
    harder: "Add a tempo lower.",
    mistakes: ["Holding breath", "Collapsing knees", "Rushing reps"],
    safety: ["Keep discomfort under control and shorten range if needed."],
  }),
  exercise({
    id: "glute_bridge",
    name: "Glute bridge",
    pattern: "hinge",
    focus: ["lower-body", "full-body", "pt-recovery"],
    equipment: ["mat"],
    difficulty: 1,
    avoidIf: [],
    steps: ["Lie on your back with knees bent.", "Brace gently.", "Drive hips up.", "Lower slowly."],
    easier: "Use a smaller range.",
    harder: "Use one leg or add a dumbbell on the hips.",
    mistakes: ["Overarching low back", "Feet too far away", "Rushing the top"],
    safety: ["Keep the movement in the hips, not the low back."],
  }),
  exercise({
    id: "dumbbell_deadlift",
    name: "Dumbbell deadlift",
    pattern: "hinge",
    focus: ["lower-body", "pull", "full-body"],
    equipment: ["dumbbells"],
    difficulty: 3,
    avoidIf: ["low back pain"],
    steps: ["Hold dumbbells by thighs.", "Push hips back.", "Keep spine long.", "Stand by driving hips forward."],
    easier: "Use lighter dumbbells or shorten range.",
    harder: "Use a slower lower.",
    mistakes: ["Rounding low back", "Squatting the hinge", "Weights drifting forward"],
    safety: ["Stop if back pain changes or increases."],
  }),
  exercise({
    id: "hip_hinge_drill",
    name: "Hip hinge drill",
    pattern: "hinge",
    focus: ["lower-body", "full-body", "pt-recovery"],
    equipment: ["bodyweight"],
    difficulty: 1,
    avoidIf: [],
    steps: ["Stand tall.", "Push hips back toward a wall.", "Keep ribs quiet.", "Return to standing."],
    easier: "Use hands on hips for feedback.",
    harder: "Hold a light dumbbell at chest height.",
    mistakes: ["Bending mostly at knees", "Rounding spine", "Moving too fast"],
    safety: ["Keep range small and smooth."],
  }),
  exercise({
    id: "reverse_lunge",
    name: "Reverse lunge",
    pattern: "lunge",
    focus: ["lower-body", "full-body"],
    equipment: ["bodyweight"],
    difficulty: 3,
    avoidIf: ["knee pain", "balance issues"],
    steps: ["Step one foot back.", "Lower with control.", "Keep front knee tracking.", "Push back to standing."],
    easier: "Hold a wall or reduce depth.",
    harder: "Hold dumbbells.",
    mistakes: ["Front knee diving inward", "Pushing off the back foot only", "Leaning heavily forward"],
    safety: ["Use support if balance is uncertain."],
  }),
  exercise({
    id: "step_up",
    name: "Step-up",
    pattern: "lunge",
    focus: ["lower-body", "full-body", "cardio"],
    equipment: ["step"],
    difficulty: 2,
    avoidIf: ["knee pain", "balance issues"],
    steps: ["Place one foot on a step.", "Drive through the top foot.", "Stand tall.", "Step down with control."],
    easier: "Use a lower step or hand support.",
    harder: "Hold dumbbells or slow the lowering.",
    mistakes: ["Pushing off the floor foot", "Knee collapsing inward", "Dropping down"],
    safety: ["Use a step height that stays pain-free."],
  }),
  exercise({
    id: "supported_split_squat",
    name: "Supported split squat",
    pattern: "lunge",
    focus: ["lower-body", "full-body"],
    equipment: ["chair"],
    difficulty: 2,
    avoidIf: ["knee pain"],
    steps: ["Stand in a split stance near a chair.", "Hold the chair lightly.", "Lower a few inches.", "Stand through the front foot."],
    easier: "Use a smaller range.",
    harder: "Use less hand support.",
    mistakes: ["Pulling with the arms", "Front heel lifting", "Dropping too low too soon"],
    safety: ["Let the chair support balance, not load."],
  }),
  exercise({
    id: "dead_bug",
    name: "Dead bug",
    pattern: "core_anti_extension",
    focus: ["core", "full-body", "pt-recovery"],
    equipment: ["mat"],
    difficulty: 1,
    avoidIf: [],
    steps: ["Lie on your back.", "Bring knees and arms up.", "Reach opposite arm and leg away.", "Return without ribs flaring."],
    easier: "Move only the arms or tap one heel.",
    harder: "Use slower reps or longer reaches.",
    mistakes: ["Low back arching", "Holding breath", "Moving too fast"],
    safety: ["Keep the low back calm and supported."],
  }),
  exercise({
    id: "plank",
    name: "Forearm plank",
    pattern: "core_anti_extension",
    focus: ["core", "full-body"],
    equipment: ["mat"],
    difficulty: 2,
    avoidIf: ["shoulder pain", "low back pain"],
    steps: ["Set elbows under shoulders.", "Step feet back.", "Brace gently.", "Hold while breathing."],
    easier: "Use knees down or a higher surface.",
    harder: "Add slow shoulder taps from a high plank.",
    mistakes: ["Sagging hips", "Holding breath", "Shrugging shoulders"],
    safety: ["Stop before form breaks."],
  }),
  exercise({
    id: "bird_dog",
    name: "Bird dog",
    pattern: "core_anti_rotation",
    focus: ["core", "pt-recovery", "full-body"],
    equipment: ["mat"],
    difficulty: 1,
    avoidIf: ["wrist pain"],
    steps: ["Start on hands and knees.", "Reach opposite arm and leg.", "Keep hips level.", "Return slowly."],
    easier: "Move only one limb at a time.",
    harder: "Pause for three seconds each rep.",
    mistakes: ["Rotating hips", "Overarching back", "Rushing"],
    safety: ["Use fists or forearms if wrists are sensitive."],
  }),
  exercise({
    id: "pallof_press",
    name: "Pallof press",
    pattern: "core_anti_rotation",
    focus: ["core", "full-body"],
    equipment: ["resistance-bands"],
    difficulty: 2,
    avoidIf: [],
    steps: ["Anchor band at chest height.", "Stand sideways to anchor.", "Press hands forward.", "Resist rotation as you return."],
    easier: "Stand closer to the anchor.",
    harder: "Step farther away or pause arms extended.",
    mistakes: ["Rotating toward the anchor", "Shrugging", "Locking knees"],
    safety: ["Use a secure band anchor."],
  }),
  exercise({
    id: "suitcase_carry",
    name: "Suitcase carry",
    pattern: "carry",
    focus: ["core", "pull", "full-body"],
    equipment: ["dumbbells"],
    difficulty: 2,
    avoidIf: ["grip pain", "low back pain"],
    steps: ["Hold one dumbbell at your side.", "Stand tall.", "Walk slowly.", "Switch sides."],
    easier: "Use lighter weight or shorter distance.",
    harder: "Walk longer or use a heavier dumbbell.",
    mistakes: ["Leaning to one side", "Rushing steps", "Shrugging"],
    safety: ["Keep posture tall and breathing relaxed."],
  }),
  exercise({
    id: "farmer_carry",
    name: "Farmer carry",
    pattern: "carry",
    focus: ["full-body", "conditioning", "pull"],
    equipment: ["dumbbells"],
    difficulty: 2,
    avoidIf: ["grip pain"],
    steps: ["Hold dumbbells at your sides.", "Stand tall.", "Walk with controlled steps.", "Set weights down safely."],
    easier: "Use lighter weights.",
    harder: "Walk farther or slow the pace.",
    mistakes: ["Rounded shoulders", "Fast uneven steps", "Holding breath"],
    safety: ["Clear the walking path first."],
  }),
  exercise({
    id: "marching_high_knees",
    name: "Marching high knees",
    pattern: "conditioning",
    focus: ["cardio", "full-body"],
    equipment: ["bodyweight"],
    difficulty: 1,
    avoidIf: ["hip pain"],
    steps: ["Stand tall.", "March one knee up at a time.", "Swing arms naturally.", "Keep breathing steady."],
    easier: "Slow the march or use hand support.",
    harder: "Increase pace without bouncing.",
    mistakes: ["Leaning back", "Stomping", "Holding breath"],
    safety: ["Keep this low impact."],
  }),
  exercise({
    id: "step_jack",
    name: "Step jack",
    pattern: "conditioning",
    focus: ["cardio", "full-body"],
    equipment: ["bodyweight"],
    difficulty: 1,
    avoidIf: ["ankle pain"],
    steps: ["Step one foot out as arms lift.", "Step back to center.", "Alternate sides.", "Keep rhythm smooth."],
    easier: "Make smaller steps.",
    harder: "Increase tempo or add light dumbbells.",
    mistakes: ["Bouncing hard", "Letting knees cave", "Losing rhythm"],
    safety: ["Stay low impact if joints are cranky."],
  }),
  exercise({
    id: "shadow_boxing",
    name: "Shadow boxing",
    pattern: "conditioning",
    focus: ["cardio", "upper-body"],
    equipment: ["bodyweight"],
    difficulty: 2,
    avoidIf: ["shoulder pain"],
    steps: ["Stand in a comfortable stance.", "Throw relaxed punches.", "Move feet lightly.", "Keep shoulders down."],
    easier: "Punch slower and smaller.",
    harder: "Add intervals or footwork.",
    mistakes: ["Locking elbows", "Shrugging", "Holding breath"],
    safety: ["Do not snap elbows to full lockout."],
  }),
  exercise({
    id: "cat_cow",
    name: "Cat-cow",
    pattern: "mobility_spine",
    focus: ["mobility", "pt-recovery"],
    equipment: ["mat"],
    difficulty: 1,
    avoidIf: ["wrist pain"],
    steps: ["Start on hands and knees.", "Round the spine gently.", "Extend the spine gently.", "Move with breath."],
    easier: "Use forearms or fists for wrist comfort.",
    harder: "Add slow segmental control.",
    mistakes: ["Forcing end range", "Moving only the neck", "Holding breath"],
    safety: ["Keep it gentle and pain-free."],
  }),
  exercise({
    id: "thread_the_needle",
    name: "Thread the needle",
    pattern: "mobility_spine",
    focus: ["mobility", "upper-body", "pt-recovery"],
    equipment: ["mat"],
    difficulty: 1,
    avoidIf: ["shoulder pain"],
    steps: ["Start on hands and knees.", "Reach one arm under the other.", "Rotate gently.", "Return and switch sides."],
    easier: "Use a smaller reach.",
    harder: "Add a breath pause in the rotation.",
    mistakes: ["Forcing shoulder pressure", "Rushing sides", "Holding breath"],
    safety: ["Avoid pinching in the shoulder."],
  }),
  exercise({
    id: "ninety_ninety_switch",
    name: "90/90 hip switch",
    pattern: "mobility_hips",
    focus: ["mobility", "lower-body", "pt-recovery"],
    equipment: ["mat"],
    difficulty: 1,
    avoidIf: ["hip pain"],
    steps: ["Sit with knees bent in 90/90.", "Rotate knees to the other side.", "Stay tall.", "Move slowly."],
    easier: "Use hands behind you for support.",
    harder: "Use less hand support.",
    mistakes: ["Rushing", "Collapsing through the spine", "Forcing hip range"],
    safety: ["Use pain-free hip motion only."],
  }),
  exercise({
    id: "couch_stretch",
    name: "Couch stretch",
    pattern: "mobility_hips",
    focus: ["mobility", "lower-body"],
    equipment: ["mat", "bench"],
    difficulty: 2,
    avoidIf: ["knee pain"],
    steps: ["Place one knee near a wall or bench.", "Bring torso upright.", "Squeeze the back glute lightly.", "Breathe slowly."],
    easier: "Move knee farther from the wall.",
    harder: "Bring torso taller while staying relaxed.",
    mistakes: ["Arching low back", "Forcing knee bend", "Holding breath"],
    safety: ["Pad the knee and reduce range if needed."],
  }),
  exercise({
    id: "heel_slide",
    name: "Heel slide",
    pattern: "rehab_knee",
    focus: ["pt-recovery", "mobility"],
    equipment: ["mat"],
    difficulty: 1,
    avoidIf: [],
    steps: ["Lie on your back.", "Slide heel toward hips.", "Pause in comfortable range.", "Slide back out."],
    easier: "Use a towel behind the thigh for help.",
    harder: "Add a gentle end-range pause.",
    mistakes: ["Forcing range", "Holding breath", "Letting knee twist"],
    safety: ["Keep discomfort mild and temporary."],
  }),
  exercise({
    id: "quad_set",
    name: "Quad set",
    pattern: "rehab_knee",
    focus: ["pt-recovery"],
    equipment: ["mat"],
    difficulty: 1,
    avoidIf: [],
    steps: ["Sit or lie with leg straight.", "Tighten the thigh.", "Hold briefly.", "Relax fully."],
    easier: "Use a towel under the knee.",
    harder: "Add a longer hold.",
    mistakes: ["Holding breath", "Tensing the whole body", "Forcing the knee down"],
    safety: ["This should be low effort and calm."],
  }),
  exercise({
    id: "band_external_rotation",
    name: "Band external rotation",
    pattern: "rehab_shoulder",
    focus: ["pt-recovery", "upper-body"],
    equipment: ["resistance-bands"],
    difficulty: 1,
    avoidIf: ["shoulder pain"],
    steps: ["Hold elbow by your side.", "Rotate hand outward against light band.", "Pause gently.", "Return slowly."],
    easier: "Use a lighter band or no band.",
    harder: "Add a two-second pause.",
    mistakes: ["Elbow drifting away", "Twisting torso", "Using too much band"],
    safety: ["Keep effort easy and pain-free."],
  }),
];

const controls = {
  appShell: document.querySelector(".app-shell"),
  activeProfile: document.querySelector("#active-profile"),
  householdJoin: document.querySelector("#household-join"),
  joinProfileName: document.querySelector("#join-profile-name"),
  appTabs: [...document.querySelectorAll("[data-app-tab]")],
  sectionPanels: [...document.querySelectorAll("[data-section-panel]")],
  form: document.querySelector("#workout-form"),
  customCount: document.querySelector("#custom-count"),
  radios: [...document.querySelectorAll("input[name='exerciseCount']")],
  intensity: document.querySelector("#intensity"),
  focus: document.querySelector("#focus"),
  style: document.querySelector("#style"),
  participants: document.querySelector("#participants"),
  warmup: document.querySelector("#warmup"),
  cooldown: document.querySelector("#cooldown"),
  generateButton: document.querySelector("#generate-button"),
  checkSharedWorkout: document.querySelector("#check-shared-workout"),
  resetDemo: document.querySelector("#reset-demo"),
  profiles: document.querySelector("#profiles"),
  equipmentList: document.querySelector("#equipment-list"),
  historyInsights: document.querySelector("#history-insights"),
  workoutOutput: document.querySelector("#workout-output"),
  dataView: document.querySelector("#data-view"),
  instructionDialog: document.querySelector("#instruction-dialog"),
  instructionDetail: document.querySelector("#instruction-detail"),
  closeDialog: document.querySelector("#close-dialog"),
  profileGuideDialog: document.querySelector("#profile-guide-dialog"),
  profileGuideContent: document.querySelector("#profile-guide-content"),
  workoutPlayerDialog: document.querySelector("#workout-player-dialog"),
  workoutPlayerContent: document.querySelector("#workout-player-content"),
  sharedWorkoutDialog: document.querySelector("#shared-workout-dialog"),
  sharedWorkoutContent: document.querySelector("#shared-workout-content"),
};

let state = loadState();
syncExerciseInstructionAssetsToLibrary();
let currentDataTab = "context";
let currentAppTab = "workout";
let activeProfileId = controls.activeProfile?.value || controls.appShell?.dataset.selectedProfile || "jeanne";
let profileGuide = null;
let workoutPlayer = {
  sessionId: null,
  instanceId: null,
  index: 0,
  showFinish: false,
  touchStartX: 0,
};
let activeInstructionExerciseId = null;
let sharedWorkoutDialogState = null;
let cloudSyncTimer = null;
let isApplyingCloudState = false;
let hasLoadedCloudState = false;
let activeSessionId = state.shared_workout_sessions.at(-1)?.id || null;
let lastStrictJson = activeSessionId ? getSession(activeSessionId)?.original_ai_response || null : null;

renderApp();
bindEvents();
syncStateFromCloud();

function bindEvents() {
  controls.appTabs.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveAppTab(button.dataset.appTab);
    });
  });

  controls.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await spinUpWorkout();
  });

  controls.form.addEventListener("input", updateRequestSummary);

  controls.householdJoin.addEventListener("change", updateRequestSummary);
  controls.checkSharedWorkout.addEventListener("click", checkForSharedWorkout);

  controls.radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) controls.customCount.value = radio.value;
      updateRequestSummary();
    });
  });

  controls.customCount.addEventListener("input", () => {
    const matchingRadio = controls.radios.find((radio) => radio.value === controls.customCount.value);
    controls.radios.forEach((radio) => {
      radio.checked = radio === matchingRadio;
    });
  });

  controls.profiles.addEventListener("input", (event) => {
    const target = event.target;
    const profileId = target.closest("[data-profile-id]")?.dataset.profileId;
    const field = target.dataset.profileField;
    if (!profileId || !field) return;

    const profile = state.profiles.find((item) => item.id === profileId);
    profile[field] = field === "age" || field === "weight" ? Number(target.value || 0) : target.value;
    state.household.updated_at = nowIso();
    normalizeProfileTables();
    saveState();
    queueStateSync(700);
    renderMemory();
    renderDataView();
  });

  controls.profiles.addEventListener("click", (event) => {
    const guideButton = event.target.closest("[data-profile-action='guide']");
    if (!guideButton) return;
    openProfileGuide(guideButton.closest("[data-profile-id]")?.dataset.profileId);
  });

  controls.equipmentList.addEventListener("change", (event) => {
    const target = event.target;
    if (!target.matches("input[type='checkbox']")) return;
    updateHouseholdEquipment(target.value, target.checked);
    saveState();
    queueStateSync(200);
    renderDataView();
  });

  controls.workoutOutput.addEventListener("click", (event) => {
    const detailButton = event.target.closest("[data-detail-exercise]");
    if (detailButton) {
      openInstructionDetail(detailButton.dataset.detailExercise);
      return;
    }

    const startButton = event.target.closest("[data-start-workout]");
    if (startButton) {
      openWorkoutPlayer(startButton.dataset.sessionId, startButton.dataset.instanceId);
      return;
    }

    const feedbackButton = event.target.closest("[data-feedback]");
    if (feedbackButton) {
      recordFeedback(feedbackButton);
    }
  });

  document.querySelector(".data-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-data-tab]");
    if (!button) return;
    currentDataTab = button.dataset.dataTab;
    document.querySelectorAll(".tab-button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    renderDataView();
  });

  controls.closeDialog.addEventListener("click", () => {
    controls.instructionDialog.close();
  });

  controls.instructionDetail.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-generate-exercise-image]");
    if (!button) return;
    await generateExerciseImage(button.dataset.generateExerciseImage);
  });

  controls.profileGuideDialog.addEventListener("click", (event) => {
    const action = event.target.closest("[data-guide-action]")?.dataset.guideAction;
    if (!action) return;
    handleProfileGuideAction(action);
  });

  controls.profileGuideContent.addEventListener("input", (event) => {
    const input = event.target.closest("[data-guide-input], [data-guide-mix]");
    if (!input || !profileGuide) return;
    updateProfileGuideDraft(input);
  });

  controls.profileGuideDialog.addEventListener("close", () => {
    if (!controls.profileGuideDialog.open) profileGuide = null;
  });

  controls.workoutPlayerDialog.addEventListener("click", (event) => {
    const detailButton = event.target.closest("[data-detail-exercise]");
    if (detailButton) {
      openInstructionDetail(detailButton.dataset.detailExercise);
      return;
    }

    const feedbackButton = event.target.closest("[data-player-feedback]");
    if (feedbackButton) {
      handleWorkoutPlayerFeedback(feedbackButton);
      return;
    }

    const action = event.target.closest("[data-player-action]")?.dataset.playerAction;
    if (!action) return;
    handleWorkoutPlayerAction(action);
  });

  controls.workoutPlayerDialog.addEventListener("close", () => {
    resetWorkoutPlayer();
  });

  controls.sharedWorkoutDialog.addEventListener("click", (event) => {
    const action = event.target.closest("[data-shared-action]")?.dataset.sharedAction;
    if (!action) return;
    handleSharedWorkoutDialogAction(action);
  });

  controls.sharedWorkoutDialog.addEventListener("close", () => {
    sharedWorkoutDialogState = null;
  });

  controls.workoutPlayerDialog.addEventListener(
    "touchstart",
    (event) => {
      workoutPlayer.touchStartX = event.changedTouches[0]?.clientX || 0;
    },
    { passive: true },
  );

  controls.workoutPlayerDialog.addEventListener(
    "touchend",
    (event) => {
      const touchEndX = event.changedTouches[0]?.clientX || 0;
      handleWorkoutPlayerSwipe(touchEndX - workoutPlayer.touchStartX);
    },
    { passive: true },
  );

  document.addEventListener("keydown", (event) => {
    if (!controls.workoutPlayerDialog.open) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveWorkoutPlayer(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveWorkoutPlayer(-1);
    }
  });

  controls.resetDemo.addEventListener("click", () => {
    state = createDefaultState();
    activeSessionId = null;
    lastStrictJson = null;
    saveState();
    renderApp();
  });
}

function renderApp() {
  syncExerciseInstructionAssetsToLibrary();
  syncActiveProfile();
  setActiveAppTab(currentAppTab, false);
  renderProfiles();
  renderEquipment();
  renderMemory();
  updateRequestSummary();
  renderActiveSession();
  renderDataView();
}

function syncActiveProfile() {
  if (!state.profiles.some((profile) => profile.id === activeProfileId)) {
    activeProfileId = state.profiles[0]?.id || "jeanne";
  }

  const activeProfile = getActiveProfile();
  const otherProfile = getOtherProfile();
  document.querySelector("#active-profile-name").textContent = activeProfile?.name || "Household member";
  controls.joinProfileName.textContent = otherProfile?.name || "other person";
  controls.participants.value = controls.householdJoin.checked ? "all" : activeProfileId;
}

function setActiveAppTab(tabName, scrollToTop = true) {
  currentAppTab = tabName || "workout";
  controls.appShell.classList.add("tabs-ready");
  controls.appTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.appTab === currentAppTab);
  });
  controls.sectionPanels.forEach((panel) => {
    panel.classList.toggle("is-active-tab", panel.dataset.sectionPanel === currentAppTab);
  });

  if (scrollToTop && window.matchMedia("(max-width: 720px)").matches) {
    controls.appShell.scrollIntoView({ block: "start" });
  }
}

function updateRequestSummary() {
  const request = getRequest();
  const participantCount = getParticipants(request).length;
  controls.participants.value = request.participant_mode;
  document.querySelector("#exercise-count").textContent = request.count;
  document.querySelector("#participant-count").textContent = participantCount;
  document.querySelector("#participant-label").textContent = participantCount === 1 ? "person" : "people";
  controls.generateButton.textContent = request.participant_mode === "all" ? "Generate shared workout" : "Generate solo workout";
}

async function spinUpWorkout() {
  const request = getRequest();
  controls.generateButton.classList.add("loading");
  controls.generateButton.textContent = "Spinning up...";
  try {
    await delay(520);

    const compactContext = buildCompactContext(request);
    const parentPlan = buildParentPlan(request, compactContext);
    const cloudWorkout = await requestCloudWorkout(request, compactContext, parentPlan);
    const originalAiResponse =
      cloudWorkout?.original_ai_response || buildStrictJsonResponse(request, compactContext, parentPlan);
    const finalPlan = validateGeneratedWorkout(originalAiResponse, request);
    const saved = saveGeneratedWorkout(request, compactContext, originalAiResponse, finalPlan, {
      source: cloudWorkout?.source || "local",
      persistence_status: cloudWorkout?.persistence_status || { saved: false, reason: "Local fallback" },
    });

    activeSessionId = saved.session.id;
    lastStrictJson = saved.session.original_ai_response;
    renderApp();
    if (request.participant_mode === "all") {
      openSharedWorkoutReadyDialog(saved.session.id);
    }
  } catch (error) {
    console.error(error);
    controls.workoutOutput.innerHTML = `<p class="empty-state">Workout generation failed: ${escapeHtml(error.message)}</p>`;
  } finally {
    controls.generateButton.classList.remove("loading");
    updateRequestSummary();
  }
}

async function requestCloudWorkout(request, compactContext, parentPlan) {
  if (!window.location.origin.startsWith("http")) return null;

  try {
    const response = await fetch("/api/workouts/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request,
        compact_context: compactContext,
        draft_parent_plan: parentPlan,
        exercise_library: buildExerciseLibraryPayload(),
      }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.info("Cloud workout generation unavailable; using local fallback.", error);
    return null;
  }
}

async function syncStateFromCloud(options = {}) {
  if (!window.location.origin.startsWith("http")) return;

  try {
    const response = await fetch("/api/household/state");
    if (!response.ok) return;

    const payload = await response.json();
    if (!payload.database_configured) {
      hasLoadedCloudState = true;
      return;
    }

    const cloudState = payload.state;
    hasLoadedCloudState = true;

    if (cloudState && hasDurableCloudState(cloudState)) {
      isApplyingCloudState = true;
      state = mergeCloudState(cloudState);
      activeSessionId = options.activateSessionId && getSession(options.activateSessionId)
        ? options.activateSessionId
        : state.shared_workout_sessions.at(-1)?.id || null;
      lastStrictJson = activeSessionId ? getSession(activeSessionId)?.original_ai_response || null : null;
      saveState();
      renderApp();
      isApplyingCloudState = false;
      return true;
    }

    queueStateSync(50);
    return false;
  } catch (error) {
    console.info("Cloud household state unavailable; keeping local state.", error);
    return false;
  } finally {
    isApplyingCloudState = false;
  }
}

function openSharedWorkoutReadyDialog(sessionId) {
  const otherProfile = getOtherProfile();
  const activeProfile = getActiveProfile();
  sharedWorkoutDialogState = {
    type: "ready",
    sessionId,
    toProfileId: otherProfile?.id,
  };

  controls.sharedWorkoutContent.innerHTML = `
    <div class="shared-dialog-content">
      <p class="eyebrow">Shared workout ready</p>
      <h2>Send to ${escapeHtml(otherProfile?.name || "the other person")}?</h2>
      <p class="subtle">
        ${escapeHtml(activeProfile?.name || "You")} can start now. Sending creates an invite so ${escapeHtml(otherProfile?.name || "the other person")}
        can tap Check for shared workout and open their version.
      </p>
      <div class="shared-dialog-actions">
        <button class="ghost-action" type="button" data-shared-action="close">Not now</button>
        <button class="ghost-action" type="button" data-shared-action="open-mine">Open mine</button>
        <button class="primary-action" type="button" data-shared-action="send">Send to ${escapeHtml(otherProfile?.name || "other person")}</button>
      </div>
    </div>
  `;
  showSharedWorkoutDialog();
}

async function checkForSharedWorkout() {
  controls.checkSharedWorkout.textContent = "Checking...";
  controls.checkSharedWorkout.disabled = true;

  try {
    const response = await fetch("/api/shared-workout-invites");
    if (!response.ok) {
      showSharedWorkoutMessage("Could not check right now", "The app could not reach the shared workout invite endpoint.");
      return;
    }

    const payload = await response.json();
    const invite = payload.invites?.[0];
    if (!invite) {
      showSharedWorkoutMessage("No shared workout yet", "Ask the other person to tap Send after generating a shared workout.");
      return;
    }

    openSharedWorkoutInviteDialog(invite);
  } catch (error) {
    console.info("Shared workout check failed.", error);
    showSharedWorkoutMessage("Could not check right now", "Try again in a moment.");
  } finally {
    controls.checkSharedWorkout.textContent = "Check for shared workout";
    controls.checkSharedWorkout.disabled = false;
  }
}

function openSharedWorkoutInviteDialog(invite) {
  sharedWorkoutDialogState = {
    type: "invite",
    invite,
  };

  const sender = invite.from_profile_name || profileName(invite.from_profile_id);
  const workoutTitle = invite.workout_title || "Shared workout";
  controls.sharedWorkoutContent.innerHTML = `
    <div class="shared-dialog-content">
      <p class="eyebrow">Shared workout</p>
      <h2>${escapeHtml(sender)} sent a workout</h2>
      <p class="subtle">${escapeHtml(workoutTitle)} is ready for your profile.</p>
      <div class="shared-dialog-actions">
        <button class="ghost-action" type="button" data-shared-action="close">Not now</button>
        <button class="primary-action" type="button" data-shared-action="open-invite">Open shared workout</button>
      </div>
    </div>
  `;
  showSharedWorkoutDialog();
}

function showSharedWorkoutMessage(title, body) {
  sharedWorkoutDialogState = { type: "message" };
  controls.sharedWorkoutContent.innerHTML = `
    <div class="shared-dialog-content">
      <p class="eyebrow">Shared workout</p>
      <h2>${escapeHtml(title)}</h2>
      <p class="subtle">${escapeHtml(body)}</p>
      <div class="shared-dialog-actions">
        <button class="primary-action" type="button" data-shared-action="close">OK</button>
      </div>
    </div>
  `;
  showSharedWorkoutDialog();
}

function showSharedWorkoutDialog() {
  if (!controls.sharedWorkoutDialog.open) {
    controls.sharedWorkoutDialog.showModal();
  }
}

async function handleSharedWorkoutDialogAction(action) {
  if (action === "close") {
    controls.sharedWorkoutDialog.close();
    return;
  }

  if (action === "open-mine") {
    const sessionId = sharedWorkoutDialogState?.sessionId;
    controls.sharedWorkoutDialog.close();
    openOwnWorkout(sessionId);
    return;
  }

  if (action === "send") {
    await sendSharedWorkoutInvite();
    return;
  }

  if (action === "open-invite") {
    await openSharedWorkoutInvite();
  }
}

async function sendSharedWorkoutInvite() {
  const sessionId = sharedWorkoutDialogState?.sessionId;
  const toProfileId = sharedWorkoutDialogState?.toProfileId;
  const toProfile = state.profiles.find((profile) => profile.id === toProfileId);
  if (!sessionId || !toProfileId) return;

  await saveStateToCloud();

  try {
    const response = await fetch("/api/shared-workout-invites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shared_workout_session_id: sessionId,
        to_profile_id: toProfileId,
      }),
    });

    if (!response.ok) {
      showSharedWorkoutMessage("Could not send it", "The workout is saved, but the invite could not be created.");
      return;
    }

    controls.sharedWorkoutContent.innerHTML = `
      <div class="shared-dialog-content">
        <p class="eyebrow">Sent</p>
        <h2>Sent to ${escapeHtml(toProfile?.name || "the other person")}</h2>
        <p class="subtle">They can tap Check for shared workout and open their version.</p>
        <div class="shared-dialog-actions">
          <button class="ghost-action" type="button" data-shared-action="close">Close</button>
          <button class="primary-action" type="button" data-shared-action="open-mine">Open mine</button>
        </div>
      </div>
    `;
  } catch (error) {
    console.info("Shared workout send failed.", error);
    showSharedWorkoutMessage("Could not send it", "Try again in a moment.");
  }
}

async function openSharedWorkoutInvite() {
  const invite = sharedWorkoutDialogState?.invite;
  if (!invite) return;

  try {
    const response = await fetch("/api/shared-workout-invites", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invite_id: invite.id,
        status: "opened",
      }),
    });

    if (!response.ok) {
      showSharedWorkoutMessage("Could not open it", "The invite was found, but it could not be marked opened.");
      return;
    }

    await syncStateFromCloud({ activateSessionId: invite.shared_workout_session_id });
    controls.sharedWorkoutDialog.close();
    openOwnWorkout(invite.shared_workout_session_id);
  } catch (error) {
    console.info("Shared workout open failed.", error);
    showSharedWorkoutMessage("Could not open it", "Try again in a moment.");
  }
}

function openOwnWorkout(sessionId) {
  const session = getSession(sessionId);
  if (!session) return;

  activeSessionId = session.id;
  renderActiveSession();
  const instance = getVisibleInstances(session).find((item) => item.profile_id === activeProfileId) || getVisibleInstances(session)[0];
  if (instance) {
    openWorkoutPlayer(session.id, instance.id);
  }
}

function hasDurableCloudState(cloudState) {
  return [
    cloudState.profiles,
    cloudState.household_equipment,
    cloudState.profile_banned_exercises,
    cloudState.shared_workout_sessions,
    cloudState.exercise_feedback,
    cloudState.exercise_instruction_assets,
  ].some((items) => Array.isArray(items) && items.length);
}

function mergeCloudState(cloudState) {
  const defaults = createDefaultState();
  const mergedProfiles = mergeById(defaults.profiles, cloudState.profiles || [], "id");
  const mergedEquipment = mergeById(defaults.household_equipment, cloudState.household_equipment || [], "equipment_id");
  const mergedAssets = mergeById(defaults.exercise_instruction_assets, cloudState.exercise_instruction_assets || [], "exercise_id");

  return {
    ...defaults,
    ...cloudState,
    version: 2,
    household: cloudState.household || defaults.household,
    profiles: mergedProfiles,
    household_equipment: mergedEquipment,
    exercise_instruction_assets: mergedAssets,
    profile_limitations: cloudState.profile_limitations?.length ? cloudState.profile_limitations : defaults.profile_limitations,
    profile_banned_exercises: cloudState.profile_banned_exercises || [],
    shared_workout_sessions: cloudState.shared_workout_sessions || [],
    user_workout_instances: cloudState.user_workout_instances || [],
    workout_exercise_instances: cloudState.workout_exercise_instances || [],
    exercise_feedback: cloudState.exercise_feedback || [],
  };
}

function mergeById(defaultItems, cloudItems, idKey) {
  const records = new Map(defaultItems.map((item) => [item[idKey], item]));
  cloudItems.forEach((item) => {
    records.set(item[idKey], { ...(records.get(item[idKey]) || {}), ...item });
  });
  return [...records.values()];
}

function queueStateSync(delayMs = 500) {
  if (isApplyingCloudState || !hasLoadedCloudState || !window.location.origin.startsWith("http")) return;
  window.clearTimeout(cloudSyncTimer);
  cloudSyncTimer = window.setTimeout(saveStateToCloud, delayMs);
}

async function saveStateToCloud() {
  try {
    const response = await fetch("/api/household/state", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state: toCloudState(state) }),
    });

    if (!response.ok) {
      console.info("Cloud household state save failed.", await response.text());
    }
  } catch (error) {
    console.info("Cloud household state save unavailable.", error);
  }
}

function toCloudState(currentState) {
  return {
    version: currentState.version,
    household: currentState.household,
    profiles: currentState.profiles,
    household_equipment: currentState.household_equipment,
    profile_limitations: currentState.profile_limitations,
    profile_banned_exercises: currentState.profile_banned_exercises,
    shared_workout_sessions: currentState.shared_workout_sessions,
    user_workout_instances: currentState.user_workout_instances,
    workout_exercise_instances: currentState.workout_exercise_instances,
    exercise_feedback: currentState.exercise_feedback,
    exercise_instruction_assets: currentState.exercise_instruction_assets,
  };
}

function buildExerciseLibraryPayload() {
  syncExerciseInstructionAssetsToLibrary();
  return exerciseLibrary.map((item) => ({
    id: item.id,
    name: item.name,
    movement_pattern: item.movement_pattern,
    focus_tags: item.focus_tags,
    required_equipment: item.required_equipment,
    difficulty: item.difficulty,
    avoid_if: item.avoid_if,
    instruction_image_url: item.instruction_image_url,
    image_prompt: item.image_prompt,
  }));
}

function getRequest() {
  const requestedIntensity = controls.intensity.value;
  const intensity =
    requestedIntensity === "surprise"
      ? chooseStable(["easy", "normal", "hard", "recovery"], nowIso())
      : requestedIntensity;
  const requestedFocus = controls.focus.value;
  const focus =
    requestedFocus === "ai-chooses"
      ? chooseStable(
          ["full-body", "upper-body", "lower-body", "push", "pull", "core", "mobility", "pt-recovery", "cardio"],
          `${nowIso()}-${requestedIntensity}`,
        )
      : requestedFocus;

  return {
    count: clamp(Number(controls.customCount.value || 5), 3, 12),
    requested_intensity: requestedIntensity,
    intensity,
    requested_focus: requestedFocus,
    focus,
    preferred_style: controls.style.value,
    participant_mode: controls.householdJoin.checked ? "all" : activeProfileId,
    include_warmup: controls.warmup.checked,
    include_cooldown: controls.cooldown.checked,
    requested_at: nowIso(),
  };
}

function buildCompactContext(request) {
  const participants = getParticipants(request);
  const availableEquipment = getAvailableEquipment();
  const recentFeedback = state.exercise_feedback.slice(-36);
  const recentExercises = state.workout_exercise_instances.slice(-60);
  const recentSessions = state.shared_workout_sessions.slice(-6);

  return {
    household: {
      id: state.household.id,
      name: state.household.name,
    },
    equipment: availableEquipment,
    request: {
      workout_size: request.count,
      intensity: request.intensity,
      focus: request.focus,
      preferred_style: request.preferred_style,
      participants: participants.map((profile) => profile.name),
      include_warmup: request.include_warmup,
      include_cooldown: request.include_cooldown,
    },
    profiles: participants.map((profile) => compactProfile(profile)),
    recent_workouts: recentSessions.map((session) => ({
      id: session.id,
      date: session.requested_at,
      focus: session.request.focus,
      intensity: session.request.intensity,
      movement_patterns: session.parent_workout_plan.slots.map((slot) => slot.movement_pattern),
    })),
    recent_movement_patterns: countBy(recentExercises, "movement_pattern"),
    recent_exercise_feedback: summarizeFeedback(recentFeedback),
    weekly_balance: weeklyBalance(),
    intensity_trends: countBy(recentSessions.map((session) => session.request), "intensity"),
    skipped_pain_flags: recentFeedback
      .filter((feedback) => feedback.rating === "skipped" || feedback.rating === "pain")
      .map((feedback) => ({
        profile_id: feedback.profile_id,
        exercise_id: feedback.exercise_id,
        rating: feedback.rating,
        logged_at: feedback.logged_at,
      })),
  };
}

function compactProfile(profile) {
  const banned = getProfileBans(profile.id).map((ban) => ban.exercise_name);
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    sex: profile.sex,
    weight: profile.weight,
    fitness_level: profile.fitness_level,
    goals: splitList(profile.goals),
    preferred_workout_style: profile.preferred_workout_style,
    preferred_mix: profile.preferred_mix,
    injuries: splitList(profile.injuries_or_limitations),
    exercises_to_avoid: splitList(profile.exercises_to_avoid),
    banned_exercises: unique([...splitList(profile.permanently_banned_exercises), ...banned]),
    recent_feedback: summarizeFeedback(state.exercise_feedback.filter((item) => item.profile_id === profile.id).slice(-16)),
  };
}

function buildParentPlan(request, compactContext) {
  const patterns = getMovementPatternSequence(request.focus, request.preferred_style);
  const recentPatterns = compactContext.recent_movement_patterns;
  const sortedPatterns = rotateForVariety(patterns, recentPatterns, request.count);
  const slots = sortedPatterns.slice(0, request.count).map((pattern, index) => ({
    id: id("slot"),
    order: index + 1,
    section: index < Math.ceil(request.count * 0.72) ? "primary" : "accessory",
    movement_pattern: pattern,
    movement_label: movementPatternLabels[pattern],
    intent: intentForPattern(pattern, request),
  }));

  return {
    id: id("parent"),
    title: `${intensityLabels[request.intensity]} ${focusLabels[request.focus]}`,
    workout_size: request.count,
    shared_alignment_rule: "Keep participants aligned by movement pattern, not exact exercise.",
    warmup: request.include_warmup ? buildPrepSlots(request.focus, "warmup") : [],
    slots,
    cooldown: request.include_cooldown ? buildPrepSlots(request.focus, "cooldown") : [],
  };
}

function buildStrictJsonResponse(request, compactContext, parentPlan) {
  const participants = getParticipants(request);
  const userAdaptations = participants.map((profile) => buildUserAdaptation(profile, request, parentPlan));
  const response = {
    parent_shared_workout_plan: parentPlan,
    user_specific_adaptations: userAdaptations,
    generation_rules_applied: [
      "strict_json_only",
      "respect_profile_banned_exercises",
      "respect_injuries_and_limitations",
      "stay_within_household_equipment",
      "prefer_recent_variety",
      "align_by_movement_pattern",
      "substitute_when_needed",
      "progress_without_endlessly_increasing_length",
    ],
    compact_context_summary_used: compactContext,
  };

  return JSON.stringify(response, null, 2);
}

function buildUserAdaptation(profile, request, parentPlan) {
  const preset = prescriptionPreset(profile, request);
  const adaptedWarmup = uniquePrepItems(parentPlan.warmup.map((slot) => adaptPrepSlot(slot, profile, request)));
  const adaptedExercises = parentPlan.slots.map((slot) => {
    const selection = selectExerciseForSlot(slot, profile, request);
    return {
      id: id("exercise_instance"),
      parent_slot_id: slot.id,
      order: slot.order,
      section: slot.section,
      movement_pattern: slot.movement_pattern,
      movement_label: slot.movement_label,
      exercise_id: selection.exercise.id,
      exercise_name: selection.exercise.name,
      sets: selection.exercise.movement_pattern.includes("mobility") || selection.exercise.movement_pattern.includes("rehab")
        ? Math.max(1, preset.sets - 1)
        : selection.sectionSetCount ?? preset.sets,
      reps: repsFor(selection.exercise, profile, request),
      rest_seconds: restFor(selection.exercise, profile, request),
      required_equipment: selection.exercise.required_equipment,
      substitution_reason: selection.reason,
      coaching_note: coachingNote(selection.exercise, profile, request),
      instruction_image_url: selection.exercise.instruction_image_url,
      image_prompt: selection.exercise.image_prompt,
    };
  });
  const adaptedCooldown = uniquePrepItems(parentPlan.cooldown.map((slot) => adaptPrepSlot(slot, profile, request)));

  return {
    id: id("user_instance"),
    profile_id: profile.id,
    profile_name: profile.name,
    estimated_minutes: estimateUserMinutes(adaptedWarmup, adaptedExercises, adaptedCooldown, profile, request),
    adaptation_notes: adaptationNotes(profile, adaptedExercises),
    warmup: adaptedWarmup,
    exercises: adaptedExercises,
    cooldown: adaptedCooldown,
  };
}

function validateGeneratedWorkout(originalAiResponse, request) {
  const parsed = JSON.parse(originalAiResponse);
  const availableEquipment = new Set(getAvailableEquipment());
  const validatedAdaptations = parsed.user_specific_adaptations.map((instance) => {
    const profile = state.profiles.find((item) => item.id === instance.profile_id);
    const banned = new Set(getBannedExerciseIds(profile.id));
    const exercises = instance.exercises.map((item) => {
      const current = getExercise(item.exercise_id);
      const invalidEquipment = item.required_equipment.some((equipment) => !availableEquipment.has(equipment));
      const invalidBan = banned.has(item.exercise_id);
      const invalidLimitation = conflictsWithLimitations(current, profile);

      if (!invalidEquipment && !invalidBan && !invalidLimitation) {
        return attachInstructionFields(item, current);
      }

      const replacement = selectExerciseForSlot(
        {
          id: item.parent_slot_id,
          order: item.order,
          section: item.section,
          movement_pattern: item.movement_pattern,
          movement_label: item.movement_label,
        },
        profile,
        request,
        new Set([item.exercise_id]),
      );

      return attachInstructionFields({
        ...item,
        exercise_id: replacement.exercise.id,
        exercise_name: replacement.exercise.name,
        required_equipment: replacement.exercise.required_equipment,
        substitution_reason: replacement.reason || "Validator replaced an unavailable or unsafe exercise.",
        instruction_image_url: replacement.exercise.instruction_image_url,
        image_prompt: replacement.exercise.image_prompt,
      }, replacement.exercise);
    });

    return {
      ...instance,
      exercises,
      estimated_minutes: estimateUserMinutes(instance.warmup, exercises, instance.cooldown, profile, request),
    };
  });

  return {
    parent_shared_workout_plan: parsed.parent_shared_workout_plan,
    user_specific_adaptations: validatedAdaptations,
    generation_rules_applied: parsed.generation_rules_applied,
  };
}

function saveGeneratedWorkout(request, compactContext, originalAiResponse, finalPlan, cloudMetadata = {}) {
  const persistedSessionId = cloudMetadata?.persistence_status?.sessionId;
  const session = {
    id: persistedSessionId || id("session"),
    household_id: state.household.id,
    requested_at: nowIso(),
    request,
    compact_context: compactContext,
    parent_workout_plan: finalPlan.parent_shared_workout_plan,
    original_ai_response: originalAiResponse,
    final_validated_workout: finalPlan,
    cloud: cloudMetadata,
  };

  state.shared_workout_sessions.push(session);

  const instances = finalPlan.user_specific_adaptations.map((adaptation) => {
    const instance = {
      id: adaptation.id,
      shared_workout_session_id: session.id,
      profile_id: adaptation.profile_id,
      estimated_minutes: adaptation.estimated_minutes,
      adaptation_notes: adaptation.adaptation_notes,
      warmup: adaptation.warmup,
      cooldown: adaptation.cooldown,
      exercises: adaptation.exercises,
    };

    state.user_workout_instances.push(instance);
    adaptation.exercises.forEach((exerciseItem) => {
      state.workout_exercise_instances.push({
        ...exerciseItem,
        id: exerciseItem.id,
        shared_workout_session_id: session.id,
        user_workout_instance_id: instance.id,
        profile_id: adaptation.profile_id,
      });
    });
    return instance;
  });

  trimHistory();
  saveState();
  queueStateSync(100);
  return { session, instances };
}

function renderProfiles() {
  const activeProfile = getActiveProfile();
  controls.profiles.innerHTML = activeProfile
    ? renderProfileCard(activeProfile)
    : `<p class="empty-state">No profile found for this login.</p>`;
}

function renderProfileCard(profile) {
  const banCount = unique([...splitList(profile.permanently_banned_exercises), ...getProfileBans(profile.id).map((ban) => ban.exercise_name)]).length;
  return `
    <article class="profile-card" data-profile-id="${profile.id}">
      <header>
        <div>
          <h3>${escapeHtml(profile.name)}</h3>
          <p>${escapeHtml(profile.fitness_level)} - ${banCount} banned</p>
        </div>
        <button class="ghost-action" type="button" data-profile-action="guide">Guided update</button>
      </header>
      <div class="mini-grid">
        <label>
          <span>Age</span>
          <input data-profile-field="age" type="number" min="1" value="${profile.age}" />
        </label>
        <label>
          <span>Weight</span>
          <input data-profile-field="weight" type="number" min="1" value="${profile.weight}" />
        </label>
      </div>
      <div class="mini-grid">
        <label>
          <span>Sex</span>
          <select data-profile-field="sex">
            ${option("female", "Female", profile.sex)}
            ${option("male", "Male", profile.sex)}
            ${option("nonbinary", "Nonbinary", profile.sex)}
            ${option("not-specified", "Prefer not to say", profile.sex)}
          </select>
        </label>
        <label>
          <span>Fitness level</span>
          <select data-profile-field="fitness_level">
            ${option("beginner", "Beginner", profile.fitness_level)}
            ${option("intermediate", "Intermediate", profile.fitness_level)}
            ${option("advanced", "Advanced", profile.fitness_level)}
          </select>
        </label>
      </div>
      <label>
        <span>Goals</span>
        <textarea data-profile-field="goals">${escapeHtml(profile.goals)}</textarea>
      </label>
      <label>
        <span>Preferred workout style</span>
        <textarea data-profile-field="preferred_workout_style">${escapeHtml(profile.preferred_workout_style)}</textarea>
      </label>
      <label>
        <span>Preferred mix</span>
        <textarea data-profile-field="preferred_mix">${escapeHtml(profile.preferred_mix)}</textarea>
      </label>
      <label>
        <span>Injuries or limitations</span>
        <textarea data-profile-field="injuries_or_limitations">${escapeHtml(profile.injuries_or_limitations)}</textarea>
      </label>
      <label>
        <span>Exercises to avoid</span>
        <textarea data-profile-field="exercises_to_avoid">${escapeHtml(profile.exercises_to_avoid)}</textarea>
      </label>
      <label>
        <span>Exercises permanently banned</span>
        <textarea data-profile-field="permanently_banned_exercises">${escapeHtml(profile.permanently_banned_exercises)}</textarea>
      </label>
    </article>
  `;
}

function openProfileGuide(profileId) {
  const profile = state.profiles.find((item) => item.id === profileId);
  if (!profile) return;

  profileGuide = {
    profileId,
    step: 0,
    draft: { ...profile },
  };
  renderProfileGuideStep();
  controls.profileGuideDialog.showModal();
}

function renderProfileGuideStep() {
  if (!profileGuide) return;

  const profile = state.profiles.find((item) => item.id === profileGuide.profileId);
  const question = profileGuideQuestions[profileGuide.step];
  const isLastStep = profileGuide.step === profileGuideQuestions.length - 1;
  const progress = `${profileGuide.step + 1} of ${profileGuideQuestions.length}`;

  controls.profileGuideContent.innerHTML = `
    <div class="profile-guide">
      <div class="guide-header">
        <div>
          <p class="eyebrow">Profile guide</p>
          <h2>${escapeHtml(profile.name)} profile</h2>
        </div>
        <button class="dialog-close inline-close" type="button" data-guide-action="close" aria-label="Close profile guide">Close</button>
      </div>
      <div class="guide-progress" aria-label="Profile guide progress">
        <span>${escapeHtml(progress)}</span>
        <div><i style="width: ${Math.round(((profileGuide.step + 1) / profileGuideQuestions.length) * 100)}%"></i></div>
      </div>
      <section class="guide-step">
        <p class="eyebrow">${escapeHtml(question.title)}</p>
        <h3>${escapeHtml(question.prompt)}</h3>
        ${renderProfileGuideInput(question, profileGuide.draft[question.field])}
      </section>
      <div class="guide-actions">
        <button class="ghost-action" type="button" data-guide-action="back" ${profileGuide.step === 0 ? "disabled" : ""}>Back</button>
        <button class="primary-action" type="button" data-guide-action="${isLastStep ? "save" : "next"}">
          ${isLastStep ? "Save profile" : "Next"}
        </button>
      </div>
    </div>
  `;
}

function renderProfileGuideInput(question, value) {
  if (question.type === "select") {
    return `
      <select class="guide-input" data-guide-input>
        ${question.options.map(([optionValue, label]) => option(optionValue, label, value)).join("")}
      </select>
    `;
  }

  if (question.type === "textarea") {
    return `
      <textarea
        class="guide-input guide-textarea"
        data-guide-input
        placeholder="${escapeHtml(question.placeholder || "")}"
      >${escapeHtml(value)}</textarea>
    `;
  }

  if (question.type === "mix") {
    const selected = selectedMixOptions(value);
    return `
      <div class="choice-grid">
        ${question.options
          .map(
            (item) => `
              <label class="choice-pill">
                <input data-guide-mix type="checkbox" value="${escapeHtml(item)}" ${selected.includes(item) ? "checked" : ""} />
                <span>${escapeHtml(item)}</span>
              </label>
            `,
          )
          .join("")}
      </div>
    `;
  }

  return `
    <input
      class="guide-input"
      data-guide-input
      type="number"
      min="${question.min || 0}"
      value="${escapeHtml(value)}"
    />
  `;
}

function selectedMixOptions(value) {
  const normalized = normalize(value);
  return profileGuideQuestions
    .find((question) => question.type === "mix")
    .options.filter((optionText) => normalized.includes(normalize(optionText).split(" ")[0]));
}

function updateProfileGuideDraft(input) {
  const question = profileGuideQuestions[profileGuide.step];

  if (question.type === "mix") {
    const selected = [...controls.profileGuideContent.querySelectorAll("[data-guide-mix]:checked")].map((item) => item.value);
    profileGuide.draft[question.field] = selected.length
      ? `Emphasize ${selected.join(", ")}. Keep the mix flexible based on recovery and consistency.`
      : "";
    return;
  }

  profileGuide.draft[question.field] = question.type === "number" ? Number(input.value || 0) : input.value;
}

function handleProfileGuideAction(action) {
  if (!profileGuide) return;

  if (action === "close") {
    controls.profileGuideDialog.close();
    profileGuide = null;
    return;
  }

  if (action === "back") {
    profileGuide.step = Math.max(0, profileGuide.step - 1);
    renderProfileGuideStep();
    return;
  }

  if (action === "next") {
    profileGuide.step = Math.min(profileGuideQuestions.length - 1, profileGuide.step + 1);
    renderProfileGuideStep();
    return;
  }

  if (action === "save") {
    saveProfileGuide();
  }
}

function saveProfileGuide() {
  const profile = state.profiles.find((item) => item.id === profileGuide.profileId);
  if (!profile) return;

  profileGuideQuestions.forEach((question) => {
    profile[question.field] = profileGuide.draft[question.field];
  });
  state.household.updated_at = nowIso();
  normalizeProfileTables();
  saveState();
  queueStateSync(250);
  controls.profileGuideDialog.close();
  profileGuide = null;
  renderProfiles();
  renderMemory();
  renderDataView();
}

function renderEquipment() {
  controls.equipmentList.innerHTML = equipmentOptions
    .map((equipment) => {
      const checked = state.household_equipment.some((item) => item.equipment_id === equipment.id && item.available);
      const disabled = equipment.id === "bodyweight" ? "disabled" : "";
      return `
        <label class="check-pill">
          <input type="checkbox" value="${equipment.id}" ${checked ? "checked" : ""} ${disabled} />
          <span>${equipment.label}</span>
        </label>
      `;
    })
    .join("");
}

function renderMemory() {
  const weekly = weeklyBalance();
  const pain = state.exercise_feedback.filter((item) => item.rating === "pain").slice(-5);
  const tooEasy = state.exercise_feedback.filter((item) => item.rating === "easy").slice(-5);
  const skipped = state.exercise_feedback.filter((item) => item.rating === "skipped").slice(-5);
  const progressed = buildProgressionCandidates();
  const neglected = findNeglectedPatterns();

  document.querySelector("#saved-sessions").textContent = `${state.shared_workout_sessions.length} saved sessions`;
  document.querySelector("#saved-feedback").textContent = `${state.exercise_feedback.length} feedback logs`;
  document.querySelector("#saved-bans").textContent = `${state.profile_banned_exercises.length} banned exercises`;

  controls.historyInsights.innerHTML = [
    insight("This week", `${weekly.sessions} sessions. Patterns: ${formatCounts(weekly.patterns) || "none yet"}.`),
    insight("Neglected", neglected.length ? neglected.map((pattern) => movementPatternLabels[pattern]).join(", ") : "No clear gaps yet."),
    insight("Too easy", tooEasy.length ? summarizeFeedbackList(tooEasy) : "No recent too-easy flags."),
    insight("Discomfort", pain.length ? summarizeFeedbackList(pain) : "No recent pain flags."),
    insight("Progress next", progressed.length ? progressed.join(", ") : "Complete more exercises before progressing."),
    insight("Avoid", buildAvoidList(skipped, pain)),
  ].join("");
}

function renderActiveSession() {
  if (!activeSessionId) {
    controls.workoutOutput.innerHTML = `<p class="empty-state">Create a shared workout to see the parent movement plan and each person's adapted version.</p>`;
  document.querySelector("#workout-title").textContent = "Ready to generate";
  document.querySelector("#estimate-main").textContent = "0";
    return;
  }

  const session = getSession(activeSessionId);
  if (!session) return;

  const displayedInstances = getVisibleInstances(session);
  const maxEstimate = Math.max(...displayedInstances.map((instance) => instance.estimated_minutes), 0);
  document.querySelector("#workout-title").textContent = session.parent_workout_plan.title;
  document.querySelector("#exercise-count").textContent = session.parent_workout_plan.workout_size;
  document.querySelector("#estimate-main").textContent = maxEstimate;
  document.querySelector("#participant-count").textContent = displayedInstances.length;
  document.querySelector("#participant-label").textContent = displayedInstances.length === 1 ? "person" : "people";

  controls.workoutOutput.innerHTML = `
    ${renderParentPlan(session.parent_workout_plan)}
    <div class="instance-grid">
      ${displayedInstances.map((instance) => renderUserInstance(instance, session)).join("")}
    </div>
  `;
}

function renderParentPlan(parentPlan) {
  return `
    <article class="parent-plan">
      <h3>Parent movement plan</h3>
      <p class="subtle">${parentPlan.shared_alignment_rule}</p>
      <div class="movement-grid">
        ${parentPlan.slots
          .map(
            (slot) => `
              <div class="movement-card">
                <strong>${slot.order}. ${slot.movement_label}</strong>
                <span>${slot.section} - ${slot.intent}</span>
              </div>
            `,
          )
          .join("")}
      </div>
    </article>
  `;
}

function renderUserInstance(instance, session) {
  const profile = state.profiles.find((item) => item.id === instance.profile_id);
  const summary = buildWorkoutPlayerSummary(instance);
  return `
    <article class="user-instance">
      <header>
        <div>
          <h3>${escapeHtml(profile.name)}'s version</h3>
          <p class="subtle">${escapeHtml(instance.adaptation_notes.join(" "))}</p>
        </div>
        <div class="instance-actions">
          <span class="tag">${instance.estimated_minutes} min estimate</span>
          <span class="tag">${summary.addressed} of ${summary.total} addressed</span>
          <button
            class="primary-action compact-action"
            type="button"
            data-start-workout
            data-session-id="${session.id}"
            data-instance-id="${instance.id}"
          >Start workout</button>
        </div>
      </header>
      ${instance.warmup.length ? renderPrepList("Warmup", instance.warmup) : ""}
      <ul class="exercise-list">
        ${instance.exercises.map((exerciseItem) => renderExerciseItem(exerciseItem, instance, session)).join("")}
      </ul>
      ${instance.cooldown.length ? renderPrepList("Cooldown", instance.cooldown) : ""}
    </article>
  `;
}

function renderPrepList(title, items) {
  return `
    <div class="workout-prep">
      <h3>${title}</h3>
      <div class="movement-grid">
        ${items
          .map(
            (item) => `
              <div class="movement-card">
                <strong>${escapeHtml(item.name)}</strong>
                <span>${escapeHtml(item.dose)}</span>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderExerciseItem(exerciseItem, instance, session) {
  const feedback = state.exercise_feedback.filter((item) => item.workout_exercise_instance_id === exerciseItem.id);
  const isBanned = state.profile_banned_exercises.some(
    (ban) => ban.profile_id === instance.profile_id && ban.exercise_id === exerciseItem.exercise_id,
  );
  const lastFeedback = feedback.at(-1)?.rating;
  const status = getExerciseStatus(exerciseItem);
  const equipment = exerciseItem.required_equipment.map(labelForEquipment).join(", ");
  return `
    <li class="exercise-item ${isBanned ? "is-banned" : ""}">
      <div class="exercise-main">
        <strong>${escapeHtml(exerciseItem.exercise_name)}</strong>
        <p>${escapeHtml(exerciseItem.coaching_note)}</p>
        <div class="meta-row">
          <span>${escapeHtml(exerciseItem.movement_label)}</span>
          <span>${escapeHtml(equipment)}</span>
          ${exerciseItem.substitution_reason ? `<span>${escapeHtml(exerciseItem.substitution_reason)}</span>` : ""}
          ${lastFeedback ? `<span>Last: ${escapeHtml(feedbackLabels[lastFeedback])}</span>` : ""}
          ${status !== "pending" ? `<span>${escapeHtml(labelForExerciseStatus(status))}</span>` : ""}
        </div>
      </div>
      <div class="exercise-dose">
        <strong>${exerciseItem.sets} sets</strong>
        <span>${escapeHtml(exerciseItem.reps)} - ${exerciseItem.rest_seconds}s rest</span>
      </div>
      <div class="feedback-row">
        <button class="detail-button" type="button" data-detail-exercise="${exerciseItem.exercise_id}">Visual instructions</button>
        ${Object.entries(feedbackLabels)
          .map(
            ([rating, label]) => `
              <button
                class="feedback-button"
                type="button"
                data-feedback="${rating}"
                data-session-id="${session.id}"
                data-instance-id="${instance.id}"
                data-profile-id="${instance.profile_id}"
                data-exercise-instance-id="${exerciseItem.id}"
                data-exercise-id="${exerciseItem.exercise_id}"
                data-exercise-name="${escapeHtml(exerciseItem.exercise_name)}"
              >${label}</button>
            `,
          )
          .join("")}
      </div>
    </li>
  `;
}

function openWorkoutPlayer(sessionId, instanceId) {
  const session = getSession(sessionId);
  const instance = getSessionInstances(sessionId).find((item) => item.id === instanceId);
  if (!session || !instance || !instance.exercises.length) return;

  const firstOpenIndex = instance.exercises.findIndex((exerciseItem) => !isExerciseAddressed(exerciseItem));
  workoutPlayer = {
    sessionId,
    instanceId,
    index: firstOpenIndex >= 0 ? firstOpenIndex : 0,
    showFinish: firstOpenIndex < 0,
    touchStartX: 0,
  };
  renderWorkoutPlayer();
  controls.workoutPlayerDialog.showModal();
}

function renderWorkoutPlayer() {
  const context = getWorkoutPlayerContext();
  if (!context) {
    controls.workoutPlayerContent.innerHTML = "";
    return;
  }

  const { session, instance, profile, exercises } = context;
  const summary = buildWorkoutPlayerSummary(instance);

  if (workoutPlayer.showFinish) {
    controls.workoutPlayerContent.innerHTML = renderWorkoutFinish(session, instance, profile, summary);
    return;
  }

  const exerciseItem = exercises[workoutPlayer.index];
  const feedback = state.exercise_feedback.filter((item) => item.workout_exercise_instance_id === exerciseItem.id);
  const lastFeedback = feedback.at(-1)?.rating;
  const status = getExerciseStatus(exerciseItem);
  const equipment = exerciseItem.required_equipment.map(labelForEquipment).join(", ");
  const progressPercent = Math.round(((workoutPlayer.index + 1) / exercises.length) * 100);

  controls.workoutPlayerContent.innerHTML = `
    <div class="player-shell">
      <header class="player-header">
        <div>
          <p class="eyebrow">${escapeHtml(profile.name)} workout</p>
          <h2>${escapeHtml(session.parent_workout_plan.title)}</h2>
        </div>
        <button class="ghost-action" type="button" data-player-action="close">Close</button>
      </header>

      <div class="player-progress">
        <span>${workoutPlayer.index + 1} of ${exercises.length}</span>
        <div><i style="width: ${progressPercent}%"></i></div>
      </div>

      <div class="player-top-nav">
        <button class="ghost-action" type="button" data-player-action="previous" ${workoutPlayer.index === 0 ? "disabled" : ""}>
          Previous
        </button>
        <button class="detail-button" type="button" data-detail-exercise="${exerciseItem.exercise_id}">Visual instructions</button>
        <button class="ghost-action" type="button" data-player-action="next">
          ${workoutPlayer.index === exercises.length - 1 ? "Review" : "Next"}
        </button>
      </div>

      <section class="player-card" aria-live="polite">
        <div class="player-status-row">
          <span>${escapeHtml(labelForExerciseStatus(status))}</span>
          ${lastFeedback ? `<span>Last: ${escapeHtml(feedbackLabels[lastFeedback])}</span>` : ""}
        </div>
        <div>
          <p class="eyebrow">${escapeHtml(exerciseItem.movement_label)}</p>
          <h1>${escapeHtml(exerciseItem.exercise_name)}</h1>
          <p class="player-note">${escapeHtml(exerciseItem.coaching_note)}</p>
        </div>
        <div class="player-dose-grid">
          <div>
            <span>Sets</span>
            <strong>${exerciseItem.sets}</strong>
          </div>
          <div>
            <span>Reps</span>
            <strong>${escapeHtml(exerciseItem.reps)}</strong>
          </div>
          <div>
            <span>Rest</span>
            <strong>${exerciseItem.rest_seconds}s</strong>
          </div>
          <div>
            <span>Equipment</span>
            <strong>${escapeHtml(equipment || "None")}</strong>
          </div>
        </div>
        ${exerciseItem.substitution_reason ? `<p class="player-subtle">${escapeHtml(exerciseItem.substitution_reason)}</p>` : ""}
      </section>

      <section class="player-feedback-panel">
        <button
          class="primary-action player-complete"
          type="button"
          data-player-feedback="complete"
          ${playerFeedbackDataset(session, instance, exerciseItem)}
        >Complete and next</button>
        <details class="player-feedback-details">
          <summary>Exercise feedback</summary>
          <div class="player-feedback-grid">
            ${Object.entries(workoutPlayerFeedbackLabels)
              .map(
                ([rating, label]) => `
                  <button
                    class="feedback-button"
                    type="button"
                    data-player-feedback="${rating}"
                    ${playerFeedbackDataset(session, instance, exerciseItem)}
                  >${escapeHtml(label)}</button>
                `,
              )
              .join("")}
          </div>
        </details>
      </section>
    </div>
  `;
}

function renderWorkoutFinish(session, instance, profile, summary) {
  const flagged = [
    summary.skipped ? `${summary.skipped} skipped` : "",
    summary.pain ? `${summary.pain} pain/discomfort` : "",
    summary.banned ? `${summary.banned} banned` : "",
  ].filter(Boolean);

  return `
    <div class="player-shell player-finish-shell">
      <header class="player-header">
        <div>
          <p class="eyebrow">${escapeHtml(profile.name)} workout</p>
          <h2>${escapeHtml(session.parent_workout_plan.title)}</h2>
        </div>
        <button class="ghost-action" type="button" data-player-action="close">Close</button>
      </header>

      <section class="player-finish-card">
        <p class="eyebrow">Session wrap-up</p>
        <h1>Are you finished?</h1>
        <p class="player-note">
          ${summary.addressed} of ${summary.total} exercises are logged for this workout.
          ${flagged.length ? `RemiTrainer will remember: ${escapeHtml(flagged.join(", "))}.` : "RemiTrainer will use this to keep the next workout sustainable."}
        </p>
        <div class="player-summary-grid">
          <div><span>Completed</span><strong>${summary.completed}</strong></div>
          <div><span>Skipped</span><strong>${summary.skipped}</strong></div>
          <div><span>Pain</span><strong>${summary.pain}</strong></div>
          <div><span>Banned</span><strong>${summary.banned}</strong></div>
        </div>
      </section>

      <footer class="player-footer">
        <button class="ghost-action" type="button" data-player-action="review">Review exercises</button>
        <button class="primary-action" type="button" data-player-action="finish">Finish workout</button>
      </footer>
    </div>
  `;
}

function playerFeedbackDataset(session, instance, exerciseItem) {
  return `
    data-session-id="${session.id}"
    data-instance-id="${instance.id}"
    data-profile-id="${instance.profile_id}"
    data-exercise-instance-id="${exerciseItem.id}"
    data-exercise-id="${exerciseItem.exercise_id}"
    data-exercise-name="${escapeHtml(exerciseItem.exercise_name)}"
  `;
}

function handleWorkoutPlayerFeedback(button) {
  const feedback = recordFeedback(button, { refresh: false });
  const context = getWorkoutPlayerContext();
  if (!context || !feedback) return;

  const terminalRating = addressedRatings.has(feedback.rating);
  if (terminalRating && workoutPlayer.index < context.exercises.length - 1) {
    workoutPlayer.index += 1;
  } else if (terminalRating && areAllExercisesAddressed(context.instance)) {
    workoutPlayer.showFinish = true;
  }

  renderMemory();
  renderActiveSession();
  renderDataView();
  renderWorkoutPlayer();
}

function handleWorkoutPlayerAction(action) {
  if (action === "close" || action === "finish") {
    controls.workoutPlayerDialog.close();
    return;
  }

  if (action === "previous") {
    moveWorkoutPlayer(-1);
    return;
  }

  if (action === "next") {
    moveWorkoutPlayer(1);
    return;
  }

  if (action === "review") {
    workoutPlayer.showFinish = false;
    workoutPlayer.index = 0;
    renderWorkoutPlayer();
  }
}

function moveWorkoutPlayer(direction) {
  const context = getWorkoutPlayerContext();
  if (!context || workoutPlayer.showFinish) return;

  const nextIndex = workoutPlayer.index + direction;
  if (nextIndex < 0) return;

  if (nextIndex >= context.exercises.length) {
    if (areAllExercisesAddressed(context.instance)) {
      workoutPlayer.showFinish = true;
      renderWorkoutPlayer();
    }
    return;
  }

  workoutPlayer.index = nextIndex;
  renderWorkoutPlayer();
}

function handleWorkoutPlayerSwipe(deltaX) {
  if (Math.abs(deltaX) < 48) return;
  moveWorkoutPlayer(deltaX < 0 ? 1 : -1);
}

function resetWorkoutPlayer() {
  workoutPlayer = {
    sessionId: null,
    instanceId: null,
    index: 0,
    showFinish: false,
    touchStartX: 0,
  };
}

function getWorkoutPlayerContext() {
  if (!workoutPlayer.sessionId || !workoutPlayer.instanceId) return null;

  const session = getSession(workoutPlayer.sessionId);
  const instance = getSessionInstances(workoutPlayer.sessionId).find((item) => item.id === workoutPlayer.instanceId);
  if (!session || !instance) return null;

  const profile = state.profiles.find((item) => item.id === instance.profile_id) || { name: instance.profile_id };
  const exercises = instance.exercises || [];
  if (!exercises.length) return null;

  workoutPlayer.index = clamp(workoutPlayer.index, 0, exercises.length - 1);
  return { session, instance, profile, exercises };
}

function buildWorkoutPlayerSummary(instance) {
  const exercises = instance?.exercises || [];
  const statuses = exercises.map(getExerciseStatus);
  return {
    total: exercises.length,
    addressed: statuses.filter((status) => addressedRatings.has(status)).length,
    completed: statuses.filter((status) => completionRatings.has(status)).length,
    skipped: statuses.filter((status) => status === "skipped").length,
    pain: statuses.filter((status) => status === "pain").length,
    banned: statuses.filter((status) => status === "ban").length,
  };
}

function areAllExercisesAddressed(instance) {
  const summary = buildWorkoutPlayerSummary(instance);
  return summary.total > 0 && summary.addressed >= summary.total;
}

function isExerciseAddressed(exerciseItem) {
  return addressedRatings.has(getExerciseStatus(exerciseItem));
}

function getExerciseStatus(exerciseItem) {
  const exerciseInstance = state.workout_exercise_instances.find((item) => item.id === exerciseItem.id);
  const lastFeedback = state.exercise_feedback.filter((item) => item.workout_exercise_instance_id === exerciseItem.id).at(-1);
  if (exerciseInstance?.completed_at) return lastFeedback?.rating && completionRatings.has(lastFeedback.rating) ? lastFeedback.rating : "complete";
  if (lastFeedback?.rating) return lastFeedback.rating;
  return "pending";
}

function labelForExerciseStatus(status) {
  const labels = {
    pending: "Not logged",
    complete: "Complete",
    easy: "Too easy",
    right: "Just right",
    hard: "Too hard",
    pain: "Pain/discomfort",
    skipped: "Skipped",
    ban: "Banned",
  };
  return labels[status] || status;
}

function renderDataView() {
  if (currentDataTab === "schema") {
    controls.dataView.textContent = JSON.stringify(dataModelSchema, null, 2);
    return;
  }

  if (currentDataTab === "response") {
    controls.dataView.textContent = lastStrictJson
      ? formatDataView(lastStrictJson)
      : JSON.stringify({ message: "No generated workout yet." }, null, 2);
    return;
  }

  controls.dataView.textContent = JSON.stringify(buildCompactContext(getRequest()), null, 2);
}

function formatDataView(value) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function recordFeedback(button, options = {}) {
  const rating = button.dataset.feedback || button.dataset.playerFeedback;
  const feedback = {
    id: id("feedback"),
    profile_id: button.dataset.profileId,
    shared_workout_session_id: button.dataset.sessionId,
    user_workout_instance_id: button.dataset.instanceId,
    workout_exercise_instance_id: button.dataset.exerciseInstanceId,
    exercise_id: button.dataset.exerciseId,
    exercise_name: button.dataset.exerciseName,
    rating,
    logged_at: nowIso(),
  };

  state.exercise_feedback.push(feedback);

  if (completionRatings.has(rating)) {
    const exerciseInstance = state.workout_exercise_instances.find((item) => item.id === feedback.workout_exercise_instance_id);
    if (exerciseInstance) exerciseInstance.completed_at = feedback.logged_at;
  }

  if (rating === "ban") {
    banExercise(feedback);
  }

  saveState();
  queueStateSync(100);
  if (options.refresh !== false) {
    renderMemory();
    renderActiveSession();
    renderDataView();
  }
  return feedback;
}

function banExercise(feedback) {
  const alreadyBanned = state.profile_banned_exercises.some(
    (ban) => ban.profile_id === feedback.profile_id && ban.exercise_id === feedback.exercise_id,
  );
  if (alreadyBanned) return;

  state.profile_banned_exercises.push({
    id: id("ban"),
    profile_id: feedback.profile_id,
    exercise_id: feedback.exercise_id,
    exercise_name: feedback.exercise_name,
    banned_at: feedback.logged_at,
    reason: "User selected ban this exercise.",
  });

  const profile = state.profiles.find((item) => item.id === feedback.profile_id);
  const existing = splitList(profile.permanently_banned_exercises);
  if (!existing.map(normalize).includes(normalize(feedback.exercise_name))) {
    profile.permanently_banned_exercises = [...existing, feedback.exercise_name].join(", ");
  }
  normalizeProfileTables();
}

function openInstructionDetail(exerciseId) {
  activeInstructionExerciseId = exerciseId;
  const item = getExercise(exerciseId);
  renderInstructionDetail(item);
  controls.instructionDialog.showModal();
}

function renderInstructionDetail(item, statusMessage = "") {
  const visual = item.instruction_image_url
    ? `<img src="${escapeHtml(item.instruction_image_url)}" alt="${escapeHtml(item.name)} instruction" />`
    : `
      <div class="instruction-placeholder">
        <strong>No image yet</strong>
        <p class="subtle">${escapeHtml(item.image_prompt)}</p>
        <button class="primary-action compact-action" type="button" data-generate-exercise-image="${item.id}">
          Generate illustration
        </button>
      </div>
    `;

  controls.instructionDetail.innerHTML = `
    <div class="instruction-content">
      <div>
        <p class="eyebrow">Exercise instructions</p>
        <h2>${escapeHtml(item.name)}</h2>
      </div>
      <div class="instruction-visual">${visual}</div>
      ${statusMessage ? `<p class="instruction-status">${escapeHtml(statusMessage)}</p>` : ""}
      <div class="instruction-columns">
        <section>
          <h3>Steps</h3>
          <ol>${item.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
        </section>
        <section>
          <h3>Scale</h3>
          <ul>
            <li><strong>Easier:</strong> ${escapeHtml(item.easier_version)}</li>
            <li><strong>Harder:</strong> ${escapeHtml(item.harder_version)}</li>
          </ul>
        </section>
        <section>
          <h3>Common mistakes</h3>
          <ul>${item.common_mistakes.map((mistake) => `<li>${escapeHtml(mistake)}</li>`).join("")}</ul>
        </section>
        <section>
          <h3>Safety notes</h3>
          <ul>${item.safety_notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
        </section>
      </div>
      <pre class="json-view">${escapeHtml(
        JSON.stringify(
          {
            exercise_id: item.id,
            instruction_image_url: item.instruction_image_url,
            image_prompt: item.image_prompt,
          },
          null,
          2,
        ),
      )}</pre>
    </div>
  `;
}

async function generateExerciseImage(exerciseId) {
  const item = getExercise(exerciseId);
  const button = controls.instructionDetail.querySelector("[data-generate-exercise-image]");
  if (button) {
    button.disabled = true;
    button.textContent = "Generating...";
  }
  renderInstructionDetail(item, "Generating illustration. This can take a moment.");

  try {
    const response = await fetch("/api/exercise-images/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exercise_id: item.id,
        exercise_name: item.name,
        image_prompt: item.image_prompt,
        steps: item.steps,
        easier_version: item.easier_version,
        harder_version: item.harder_version,
        common_mistakes: item.common_mistakes,
        safety_notes: item.safety_notes,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      renderInstructionDetail(item, payload.error || "Could not generate illustration.");
      return;
    }

    item.instruction_image_url = payload.instruction_image_url;
    const asset = state.exercise_instruction_assets.find((record) => record.exercise_id === item.id);
    if (asset) {
      asset.instruction_image_url = payload.instruction_image_url;
      asset.image_prompt = item.image_prompt;
      asset.updated_at = nowIso();
    } else {
      state.exercise_instruction_assets.push({
        exercise_id: item.id,
        instruction_image_url: payload.instruction_image_url,
        image_prompt: item.image_prompt,
        steps: item.steps,
        easier_version: item.easier_version,
        harder_version: item.harder_version,
        common_mistakes: item.common_mistakes,
        safety_notes: item.safety_notes,
        updated_at: nowIso(),
      });
    }
    saveState();
    syncExerciseInstructionAssetsToLibrary();
    queueStateSync(50);
    renderInstructionDetail(item, "Illustration saved.");
  } catch (error) {
    console.info("Exercise image generation failed.", error);
    renderInstructionDetail(item, "Could not generate illustration. Try again later.");
  }
}

function selectExerciseForSlot(slot, profile, request, excluded = new Set()) {
  const availableEquipment = getAvailableEquipment();
  const bannedIds = new Set([...getBannedExerciseIds(profile.id), ...excluded]);
  const avoidNames = splitList(profile.exercises_to_avoid).map(normalize);
  const permanentNames = splitList(profile.permanently_banned_exercises).map(normalize);
  const desiredDifficulty = desiredDifficultyFor(profile, request);
  const recentExerciseCounts = countBy(
    state.workout_exercise_instances.filter((item) => item.profile_id === profile.id).slice(-36),
    "exercise_id",
  );

  const patternCandidates = exerciseLibrary.filter((exerciseItem) => exerciseItem.movement_pattern === slot.movement_pattern);
  const strict = patternCandidates.filter((exerciseItem) => {
    return (
      !bannedIds.has(exerciseItem.id) &&
      !avoidNames.includes(normalize(exerciseItem.name)) &&
      !permanentNames.includes(normalize(exerciseItem.name)) &&
      hasEquipment(exerciseItem, availableEquipment) &&
      !conflictsWithLimitations(exerciseItem, profile)
    );
  });

  if (strict.length) {
    return {
      exercise: chooseBestCandidate(strict, desiredDifficulty, recentExerciseCounts, profile),
      reason: "",
    };
  }

  const safeSamePattern = patternCandidates.filter((exerciseItem) => {
    return (
      !bannedIds.has(exerciseItem.id) &&
      !permanentNames.includes(normalize(exerciseItem.name)) &&
      hasEquipment(exerciseItem, availableEquipment)
    );
  });

  if (safeSamePattern.length) {
    return {
      exercise: chooseBestCandidate(safeSamePattern, desiredDifficulty, recentExerciseCounts, profile),
      reason: "Same movement pattern substitution.",
    };
  }

  const alignedAlternative = exerciseLibrary.filter((exerciseItem) => {
    return (
      exerciseItem.focus_tags.includes(request.focus) &&
      !bannedIds.has(exerciseItem.id) &&
      !permanentNames.includes(normalize(exerciseItem.name)) &&
      hasEquipment(exerciseItem, availableEquipment) &&
      !conflictsWithLimitations(exerciseItem, profile)
    );
  });

  if (alignedAlternative.length) {
    return {
      exercise: chooseBestCandidate(alignedAlternative, desiredDifficulty, recentExerciseCounts, profile),
      reason: "Pattern changed to respect equipment, bans, or limitations.",
    };
  }

  return {
    exercise: chooseBestCandidate(
      exerciseLibrary.filter((exerciseItem) => hasEquipment(exerciseItem, availableEquipment) && !bannedIds.has(exerciseItem.id)),
      desiredDifficulty,
      recentExerciseCounts,
      profile,
    ),
    reason: "Fallback substitution within available equipment.",
  };
}

function chooseBestCandidate(candidates, desiredDifficulty, recentExerciseCounts, profile) {
  return [...candidates].sort((a, b) => {
    const aScore = candidateScore(a, desiredDifficulty, recentExerciseCounts, profile);
    const bScore = candidateScore(b, desiredDifficulty, recentExerciseCounts, profile);
    return aScore - bScore || a.name.localeCompare(b.name);
  })[0];
}

function candidateScore(candidate, desiredDifficulty, recentExerciseCounts, profile) {
  let score = Math.abs(candidate.difficulty - desiredDifficulty) * 3;
  score += recentExerciseCounts[candidate.id] || 0;
  if (candidate.difficulty > levelRank[profile.fitness_level] + 1) score += 4;
  if (candidate.difficulty < levelRank[profile.fitness_level] - 1) score += 1;
  return score;
}

function desiredDifficultyFor(profile, request) {
  const base = levelRank[profile.fitness_level] || 2;
  const shift = request.intensity === "hard" ? 0.6 : request.intensity === "easy" ? -0.4 : request.intensity === "recovery" ? -1 : 0;
  return clamp(base + shift, 1, 3);
}

function prescriptionPreset(profile, request) {
  const level = levelRank[profile.fitness_level];
  const intensity = intensityRank[request.intensity];
  const rawSets = level + (intensity > 1 ? 1 : 0) - (intensity < 0 ? 1 : 0);
  return {
    sets: clamp(rawSets, 1, 4),
  };
}

function repsFor(exerciseItem, profile, request) {
  if (exerciseItem.movement_pattern.includes("mobility") || exerciseItem.movement_pattern.includes("rehab")) {
    return request.intensity === "recovery" ? "45-60 sec" : "30-45 sec";
  }
  if (exerciseItem.movement_pattern === "conditioning") {
    return request.intensity === "hard" ? "35-45 sec" : "25-35 sec";
  }
  if (profile.fitness_level === "beginner") return request.intensity === "hard" ? "8-10" : "6-8";
  if (profile.fitness_level === "advanced") return request.intensity === "hard" ? "6-12" : "8-12";
  return request.intensity === "easy" ? "8-10" : "8-12";
}

function restFor(exerciseItem, profile, request) {
  let rest = profile.fitness_level === "beginner" ? 75 : profile.fitness_level === "advanced" ? 45 : 60;
  if (request.intensity === "hard") rest -= 10;
  if (request.intensity === "recovery") rest += 15;
  if (exerciseItem.movement_pattern === "conditioning") rest -= 15;
  if (exerciseItem.movement_pattern.includes("mobility") || exerciseItem.movement_pattern.includes("rehab")) rest -= 20;
  return clamp(Math.round(rest / 5) * 5, 20, 90);
}

function coachingNote(exerciseItem, profile, request) {
  if (request.intensity === "recovery" || exerciseItem.movement_pattern.includes("rehab")) {
    return "Keep this calm and leave the area feeling better than when you started.";
  }
  if (profile.fitness_level === "beginner") {
    return "Use a simple variation and stop each set with clean reps still available.";
  }
  if (profile.fitness_level === "advanced" && request.intensity === "hard") {
    return "Make this challenging through load, control, or density while keeping the movement crisp.";
  }
  return "Choose a variation that feels useful today, not punishing.";
}

function adaptationNotes(profile, exercises) {
  const substitutions = exercises.filter((item) => item.substitution_reason).length;
  const banned = unique([
    ...getProfileBans(profile.id).map((ban) => ban.exercise_name),
    ...splitList(profile.permanently_banned_exercises),
  ]).length;
  const notes = [`Customized for ${profile.fitness_level} level.`];
  if (substitutions) notes.push(`${substitutions} aligned substitution${substitutions === 1 ? "" : "s"} used.`);
  if (banned) notes.push(`${banned} banned exercise${banned === 1 ? "" : "s"} avoided.`);
  if (splitList(profile.injuries_or_limitations).length) notes.push("Limitations checked before selection.");
  return notes;
}

function estimateUserMinutes(warmup, exercises, cooldown, profile, request) {
  let minutes = warmup.length ? (profile.fitness_level === "beginner" ? 6 : 5) : 0;
  exercises.forEach((item) => {
    const exerciseItem = getExercise(item.exercise_id);
    const sets = Number(item.sets || 1);
    const movementTime =
      exerciseItem.movement_pattern === "conditioning"
        ? 0.85
        : exerciseItem.movement_pattern.includes("mobility") || exerciseItem.movement_pattern.includes("rehab")
          ? 0.75
          : 1.12;
    minutes += sets * (movementTime + item.rest_seconds / 60);
  });
  minutes += cooldown.length ? (request.intensity === "hard" ? 6 : 4) : 0;
  if (profile.fitness_level === "beginner") minutes *= 1.08;
  if (profile.fitness_level === "advanced" && request.intensity === "hard") minutes *= 0.92;
  return Math.max(8, Math.round(minutes));
}

function buildPrepSlots(focus, type) {
  const warmup = {
    "upper-body": ["wall_slide", "band_pull_apart", "cat_cow"],
    push: ["wall_slide", "band_pull_apart", "cat_cow"],
    pull: ["wall_slide", "band_pull_apart", "cat_cow"],
    "lower-body": ["hip_hinge_drill", "glute_bridge", "ninety_ninety_switch"],
    core: ["dead_bug", "bird_dog", "cat_cow"],
    mobility: ["cat_cow", "ninety_ninety_switch", "thread_the_needle"],
    "pt-recovery": ["heel_slide", "quad_set", "wall_slide"],
    cardio: ["marching_high_knees", "step_jack", "cat_cow"],
    "full-body": ["cat_cow", "hip_hinge_drill", "marching_high_knees"],
  };
  const cooldown = {
    "upper-body": ["thread_the_needle", "wall_slide", "cat_cow"],
    push: ["thread_the_needle", "wall_slide", "cat_cow"],
    pull: ["thread_the_needle", "wall_slide", "cat_cow"],
    "lower-body": ["ninety_ninety_switch", "couch_stretch", "glute_bridge"],
    core: ["cat_cow", "dead_bug", "ninety_ninety_switch"],
    mobility: ["cat_cow", "thread_the_needle", "ninety_ninety_switch"],
    "pt-recovery": ["heel_slide", "quad_set", "cat_cow"],
    cardio: ["marching_high_knees", "ninety_ninety_switch", "cat_cow"],
    "full-body": ["cat_cow", "thread_the_needle", "ninety_ninety_switch"],
  };

  return (type === "warmup" ? warmup[focus] || warmup["full-body"] : cooldown[focus] || cooldown["full-body"]).map((exerciseId, index) => {
    const item = getExercise(exerciseId);
    return {
      id: id(type),
      order: index + 1,
      exercise_id: item.id,
      movement_pattern: item.movement_pattern,
      name: item.name,
      dose: type === "warmup" ? "30-45 sec" : "40-60 sec",
    };
  });
}

function adaptPrepSlot(slot, profile, request) {
  const exerciseItem = getExercise(slot.exercise_id);
  if (hasEquipment(exerciseItem, getAvailableEquipment()) && !conflictsWithLimitations(exerciseItem, profile)) {
    return slot;
  }
  const replacement = selectExerciseForSlot(
    {
      id: slot.id,
      order: slot.order,
      section: "prep",
      movement_pattern: slot.movement_pattern,
      movement_label: movementPatternLabels[slot.movement_pattern],
    },
    profile,
    request,
  );
  return {
    ...slot,
    exercise_id: replacement.exercise.id,
    name: replacement.exercise.name,
    substitution_reason: replacement.reason,
  };
}

function uniquePrepItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.exercise_id)) return false;
    seen.add(item.exercise_id);
    return true;
  });
}

function getMovementPatternSequence(focus, style) {
  const sequences = {
    "full-body": [
      "squat",
      "horizontal_push",
      "hinge",
      "horizontal_pull",
      "core_anti_extension",
      "lunge",
      "carry",
      "vertical_push",
      "core_anti_rotation",
      "conditioning",
      "mobility_hips",
      "mobility_spine",
    ],
    "upper-body": [
      "horizontal_push",
      "horizontal_pull",
      "vertical_push",
      "scapular_control",
      "core_anti_rotation",
      "carry",
      "mobility_spine",
      "conditioning",
    ],
    "lower-body": ["squat", "hinge", "lunge", "core_anti_extension", "carry", "mobility_hips", "conditioning", "rehab_knee"],
    push: ["horizontal_push", "vertical_push", "squat", "core_anti_extension", "mobility_spine", "conditioning", "lunge"],
    pull: ["horizontal_pull", "hinge", "scapular_control", "carry", "core_anti_rotation", "mobility_spine", "conditioning"],
    core: ["core_anti_extension", "core_anti_rotation", "carry", "hinge", "mobility_spine", "conditioning", "squat"],
    mobility: ["mobility_spine", "mobility_hips", "rehab_shoulder", "rehab_knee", "core_anti_rotation", "hinge"],
    "pt-recovery": ["rehab_knee", "rehab_shoulder", "mobility_spine", "mobility_hips", "core_anti_extension", "hinge"],
    cardio: ["conditioning", "lunge", "carry", "squat", "horizontal_push", "core_anti_extension", "mobility_hips"],
  };

  const base = sequences[focus] || sequences["full-body"];
  if (style === "strength") return prioritize(base, ["squat", "hinge", "horizontal_push", "horizontal_pull", "lunge", "carry"]);
  if (style === "mobility") return prioritize(base, ["mobility_spine", "mobility_hips", "core_anti_rotation"]);
  if (style === "pt") return prioritize(base, ["rehab_knee", "rehab_shoulder", "mobility_spine", "mobility_hips"]);
  if (style === "cardio") return prioritize(base, ["conditioning", "lunge", "carry"]);
  return base;
}

function rotateForVariety(patterns, recentCounts, count) {
  const expanded = [];
  while (expanded.length < count + patterns.length) expanded.push(...patterns);
  return expanded.sort((a, b) => (recentCounts[a] || 0) - (recentCounts[b] || 0));
}

function intentForPattern(pattern, request) {
  if (pattern.includes("mobility")) return "Restore range and control";
  if (pattern.includes("rehab")) return "Support recovery without irritation";
  if (pattern === "conditioning") return "Build repeatable work capacity";
  if (request.intensity === "hard") return "Progress through load, tempo, or density";
  if (request.intensity === "recovery") return "Practice quality and leave fresh";
  return "Build strength and movement quality";
}

function getParticipants(request) {
  if (request.participant_mode === "all") return state.profiles;
  return state.profiles.filter((profile) => profile.id === request.participant_mode);
}

function getSessionInstances(sessionId) {
  return state.user_workout_instances.filter((instance) => instance.shared_workout_session_id === sessionId);
}

function getVisibleInstances(session) {
  const allInstances = getSessionInstances(session.id);
  const activeInstances = allInstances.filter((instance) => instance.profile_id === activeProfileId);
  return activeInstances.length ? activeInstances : allInstances;
}

function getActiveProfile() {
  return state.profiles.find((profile) => profile.id === activeProfileId);
}

function getOtherProfile() {
  return state.profiles.find((profile) => profile.id !== activeProfileId);
}

function getAvailableEquipment() {
  return state.household_equipment.filter((item) => item.available).map((item) => item.equipment_id);
}

function updateHouseholdEquipment(equipmentId, available) {
  let record = state.household_equipment.find((item) => item.equipment_id === equipmentId);
  if (!record) {
    record = { household_id: state.household.id, equipment_id: equipmentId, available };
    state.household_equipment.push(record);
  }
  record.available = equipmentId === "bodyweight" ? true : available;
  state.household.updated_at = nowIso();
}

function hasEquipment(exerciseItem, availableEquipment) {
  const available = new Set(availableEquipment);
  return exerciseItem.required_equipment.every((equipment) => available.has(equipment));
}

function conflictsWithLimitations(exerciseItem, profile) {
  const limitationText = splitList(profile.injuries_or_limitations).map(normalize).join(" ");
  if (!limitationText) return false;
  return exerciseItem.avoid_if.some((avoid) => limitationText.includes(normalize(avoid)));
}

function getProfileBans(profileId) {
  return state.profile_banned_exercises.filter((ban) => ban.profile_id === profileId);
}

function getBannedExerciseIds(profileId) {
  return getProfileBans(profileId).map((ban) => ban.exercise_id);
}

function getSession(sessionId) {
  return state.shared_workout_sessions.find((session) => session.id === sessionId);
}

function getExercise(exerciseId) {
  const item = exerciseLibrary.find((exerciseItem) => exerciseItem.id === exerciseId) || exerciseLibrary[0];
  const asset = state.exercise_instruction_assets.find((record) => record.exercise_id === item.id);
  return asset ? applyInstructionAsset(item, asset) : item;
}

function syncExerciseInstructionAssetsToLibrary() {
  const assets = new Map(
    (state.exercise_instruction_assets || [])
      .filter((asset) => asset.exercise_id)
      .map((asset) => [asset.exercise_id, asset]),
  );

  exerciseLibrary.forEach((item) => {
    const asset = assets.get(item.id);
    if (asset) applyInstructionAsset(item, asset);
  });
}

function applyInstructionAsset(item, asset) {
  if (asset.instruction_image_url) item.instruction_image_url = String(asset.instruction_image_url);
  if (asset.image_prompt) item.image_prompt = String(asset.image_prompt);
  if (Array.isArray(asset.steps) && asset.steps.length) item.steps = asset.steps;
  if (asset.easier_version) item.easier_version = String(asset.easier_version);
  if (asset.harder_version) item.harder_version = String(asset.harder_version);
  if (Array.isArray(asset.common_mistakes) && asset.common_mistakes.length) item.common_mistakes = asset.common_mistakes;
  if (Array.isArray(asset.safety_notes) && asset.safety_notes.length) item.safety_notes = asset.safety_notes;
  return item;
}

function attachInstructionFields(exerciseItem, libraryExercise) {
  return {
    ...exerciseItem,
    instruction_image_url: exerciseItem.instruction_image_url || libraryExercise?.instruction_image_url || "",
    image_prompt: exerciseItem.image_prompt || libraryExercise?.image_prompt || "",
  };
}

function labelForEquipment(equipmentId) {
  return equipmentOptions.find((item) => item.id === equipmentId)?.label || equipmentId;
}

function normalizeProfileTables() {
  state.profile_limitations = state.profiles.flatMap((profile) =>
    splitList(profile.injuries_or_limitations).map((value) => ({
      id: `limitation_${profile.id}_${slug(value)}`,
      profile_id: profile.id,
      type: "injury_or_limitation",
      value,
      severity: "user-reported",
    })),
  );
}

function weeklyBalance() {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const sessions = state.shared_workout_sessions.filter((session) => new Date(session.requested_at).getTime() >= weekAgo);
  const sessionIds = new Set(sessions.map((session) => session.id));
  const exercises = state.workout_exercise_instances.filter((item) => sessionIds.has(item.shared_workout_session_id));
  return {
    sessions: sessions.length,
    patterns: countBy(exercises, "movement_pattern"),
    focus: countBy(sessions.map((session) => session.request), "focus"),
  };
}

function findNeglectedPatterns() {
  const weekly = weeklyBalance();
  return ["squat", "hinge", "horizontal_push", "horizontal_pull", "core_anti_extension", "mobility_hips"].filter(
    (pattern) => !weekly.patterns[pattern],
  );
}

function buildProgressionCandidates() {
  const easyCounts = countBy(state.exercise_feedback.filter((item) => item.rating === "easy"), "exercise_name");
  return Object.entries(easyCounts)
    .filter(([, count]) => count >= 1)
    .slice(0, 4)
    .map(([name]) => name);
}

function buildAvoidList(skipped, pain) {
  const banned = state.profile_banned_exercises.map((item) => item.exercise_name);
  const flagged = [...skipped, ...pain].map((item) => item.exercise_name);
  const avoid = unique([...banned, ...flagged]).slice(0, 6);
  return avoid.length ? avoid.join(", ") : "No strong avoid signals yet.";
}

function summarizeFeedback(feedbackItems) {
  return {
    complete: feedbackItems.filter((item) => item.rating === "complete").length,
    too_easy: feedbackItems.filter((item) => item.rating === "easy").length,
    just_right: feedbackItems.filter((item) => item.rating === "right").length,
    too_hard: feedbackItems.filter((item) => item.rating === "hard").length,
    pain_discomfort: feedbackItems.filter((item) => item.rating === "pain").length,
    skipped: feedbackItems.filter((item) => item.rating === "skipped").length,
    banned: feedbackItems.filter((item) => item.rating === "ban").length,
  };
}

function summarizeFeedbackList(items) {
  return items.map((item) => `${item.exercise_name} (${profileName(item.profile_id)})`).join(", ");
}

function profileName(profileId) {
  return state.profiles.find((profile) => profile.id === profileId)?.name || profileId;
}

function insight(title, body) {
  return `
    <article class="insight-card">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(body)}</p>
    </article>
  `;
}

function formatCounts(counts) {
  return Object.entries(counts)
    .slice(0, 6)
    .map(([key, value]) => `${movementPatternLabels[key] || key}: ${value}`)
    .join(", ");
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    if (parsed.version !== 2) return createDefaultState();
    return parsed;
  } catch {
    return createDefaultState();
  }
}

function createDefaultState() {
  const created = nowIso();
  const defaultState = {
    version: 2,
    household: {
      id: "household_remi",
      name: "Remi household",
      created_at: created,
      updated_at: created,
    },
    profiles: [
      {
        id: "jon",
        household_id: "household_remi",
        name: "Jon",
        age: 42,
        sex: "male",
        weight: 190,
        fitness_level: "advanced",
        goals: "Build strength, improve conditioning, stay durable",
        preferred_workout_style: "Efficient strength work with clear progressions",
        preferred_mix: "strength 55%, mobility 15%, PT 5%, stretching 10%, cardio 15%",
        injuries_or_limitations: "occasional low back tightness",
        exercises_to_avoid: "high-rep burpees",
        permanently_banned_exercises: "",
      },
      {
        id: "jeanne",
        household_id: "household_remi",
        name: "Jeanne",
        age: 40,
        sex: "female",
        weight: 145,
        fitness_level: "beginner",
        goals: "Build consistency, feel stronger, protect knees and wrists",
        preferred_workout_style: "Supportive workouts with simple movements and recovery balance",
        preferred_mix: "strength 35%, mobility 25%, PT 20%, stretching 10%, cardio 10%",
        injuries_or_limitations: "knee pain, wrist pain",
        exercises_to_avoid: "jumping lunges, mountain climbers",
        permanently_banned_exercises: "",
      },
    ],
    household_equipment: equipmentOptions.map((equipment) => ({
      household_id: "household_remi",
      equipment_id: equipment.id,
      available: ["bodyweight", "mat", "dumbbells", "resistance-bands", "bench", "chair", "step"].includes(equipment.id),
    })),
    profile_limitations: [],
    profile_banned_exercises: [],
    shared_workout_sessions: [],
    user_workout_instances: [],
    workout_exercise_instances: [],
    exercise_feedback: [],
    exercise_instruction_assets: exerciseLibrary.map((item) => ({
      exercise_id: item.id,
      instruction_image_url: item.instruction_image_url,
      image_prompt: item.image_prompt,
      steps: item.steps,
      easier_version: item.easier_version,
      harder_version: item.harder_version,
      common_mistakes: item.common_mistakes,
      safety_notes: item.safety_notes,
    })),
  };
  defaultState.profile_limitations = defaultState.profiles.flatMap((profile) =>
    splitList(profile.injuries_or_limitations).map((value) => ({
      id: `limitation_${profile.id}_${slug(value)}`,
      profile_id: profile.id,
      type: "injury_or_limitation",
      value,
      severity: "user-reported",
    })),
  );
  return defaultState;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function trimHistory() {
  state.shared_workout_sessions = state.shared_workout_sessions.slice(-30);
  const keptSessionIds = new Set(state.shared_workout_sessions.map((session) => session.id));
  state.user_workout_instances = state.user_workout_instances.filter((instance) =>
    keptSessionIds.has(instance.shared_workout_session_id),
  );
  state.workout_exercise_instances = state.workout_exercise_instances.filter((instance) =>
    keptSessionIds.has(instance.shared_workout_session_id),
  );
  state.exercise_feedback = state.exercise_feedback.slice(-500);
}

function exercise(config) {
  return {
    id: config.id,
    name: config.name,
    movement_pattern: config.pattern,
    focus_tags: config.focus,
    required_equipment: config.equipment,
    difficulty: config.difficulty,
    avoid_if: config.avoidIf,
    instruction_image_url: config.instructionImageUrl || "",
    image_prompt:
      config.imagePrompt ||
      `Clean instructional fitness illustration for ${config.name}, neutral background, show start and finish positions, no text.`,
    steps: config.steps,
    easier_version: config.easier,
    harder_version: config.harder,
    common_mistakes: config.mistakes,
    safety_notes: config.safety,
  };
}

function option(value, label, selectedValue) {
  return `<option value="${value}" ${value === selectedValue ? "selected" : ""}>${label}</option>`;
}

function splitList(value) {
  return String(value || "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = typeof key === "function" ? key(item) : item[key];
    if (!value) return counts;
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function prioritize(items, priority) {
  const prioritySet = new Set(priority);
  return unique([...priority.filter((item) => items.includes(item)), ...items.filter((item) => !prioritySet.has(item))]);
}

function chooseStable(items, seed) {
  return items[hash(seed) % items.length];
}

function hash(value) {
  return [...String(value)].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 11);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value) {
  return normalize(value).replace(/\s+/g, "_");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
