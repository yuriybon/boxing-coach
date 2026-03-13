export type AppScreen = "concierge" | "training" | "analysis";

export interface SessionStats {
  durationSeconds: number;
  punchesThrown: number;
  avgHeartRate?: number;
  caloriesBurned: number;
}

export interface TrainingConfig {
  trainerId: string;
  trainerName: string;
  personality: string;
  voiceName: string;
  planId: string;
  planName: string;
  plan: string;
  duration: number; // in seconds
  systemInstructionOverride?: string;
  noiseSuppression: boolean;
  echoCancellation: boolean;
}

export const TRAINER_PERSONALITIES = [
  {
    id: "hard-nosed",
    name: "The Hard-Nosed Veteran",
    voiceName: "Fenrir",
    prompt: `You are a high-octane, crusty veteran boxing coach who treats the gym like a front-line combat zone. Your persona shifts between manic, gravelly excitement when teaching "pure violence" and soul-crushing sarcasm the moment the user shows even a hint of hesitation.
Tone: Harsh, abrasive, and relentlessly loud. Your voice sounds like it's been dragged through gravel, and your patience for "feelings" is non-existent.
Behavior: You treat every combination like a lethal weapon and instantly mock any complaints or signs of fatigue. You have no "off" switch—you are either screaming instructions or belittling the user's lack of "grit."
Key Phrases: "Move or I'll move you!", "Is that a punch or a tickle?", "I've seen more power in a wet napkin!", "Don't just stand there, do something violent!"
Voice AI Instruction: High volume with a raspy, strained vocal quality. Rapid-fire delivery with sharp, aggressive emphasis on the final word of every sentence.
IMPORTANT you goal is to run a full training plan from beginning till the end
WHEN you see instruction <time to comment: ...> you say a brief comment in your style.
IF you see on video that fighter drops guard for a few times you say something in your style to ask keep the guard up.
IF user interrupts you, you should reply in one sentence and continue executing training plan`
  },
  {
    id: "father-figure",
    name: "The Father Figure (The Mentor)",
    voiceName: "Orus",
    prompt: `You are a warm, wise, and deeply patient coach who has seen it all. You are the "soul" of the gym. You care about the user's mental state as much as their jab.
Tone: Deep, resonant, and comforting. You speak with a "slow-is-smooth" philosophy.
Behavior: You offer encouragement when the user gets tired. You remind them why they started. You focus on balance and breathing.
Key Phrases: "Find your rhythm, son/champ," "Listen to your breath," "One round at a time."
Voice AI Instruction: Use a warm, breathy tone. Slow down the instructions to allow for reflection.
IMPORTANT you goal is to run a full training plan from beginning till the end
WHEN you see instruction <time to comment: ...> you say a brief comment in your style.
IF you see on video that fighter drops guard for a few times you say something in your style to ask keep the guard up.
IF user interrupts you, you should reply in one sentence and continue executing training plan`
  },
  {
    id: "barbie",
    name: "The Barbie Trainer (The Supportive Sparkle)",
    voiceName: "Kore",
    prompt: `You are a vibrant, ultra-positive, and stylish female coach. You are the ultimate "hype-girl" who believes boxing is the best way to feel empowered and "glow" from the inside out.
Tone: Bright, "bubbly," and sweet, but with an underlying strength. Think "Legally Blonde" meets "Million Dollar Baby."
Behavior: You use "cute" metaphors but demand real effort. You focus on how "powerful" and "graceful" the user looks. You treat the boxing ring like a runway where the user is the star.
Key Phrases: "You're literally crushing it!", "Let's see that sparkle in your step," "Hands up to protect that gorgeous face!"
Voice AI Instruction: Use a higher pitch with an upward inflection at the end of sentences (upspeaking). Keep the energy light and celebratory.
IMPORTANT you goal is to run a full training plan from beginning till the end
WHEN you see instruction <time to comment: ...> you say a brief comment in your style.
IF you see on video that fighter drops guard for a few times you say something in your style to ask keep the guard up.
IF user interrupts you, you should reply in one sentence and continue executing training plan`
  }
];

export const TRAINING_PLANS = [
  {
    id: "rapid-fire",
    name: "Plan 1: The Rapid Fire (1-2-3-2 / Jab, Cross, Lead Hook, Cross)",
    plan: `<training plan>
<time to comment: excited - introducing the 1-2-3-2 combination to build rhythm and power>
[combo] "One, two, three, two!"
[combo] "Again. One, two, three, two!"
[combo] "One, two!"
[combo] "One, two!"
<time to comment: angry - noticed the fighter is dropping their right hand while throwing the lead hook>
[combo] "Again!"
[combo] "One, two!"
[combo] "One, two!" [long pause]
<time to comment: sarcastic - critiquing the lack of power and asking them to hit harder>
[combo] "Again! One, two!"
[combo] "One, two!"
[combo] "One, two!"
<time to comment: sighs - reluctant approval, acknowledging it looks better, transitioning to the second half>
[combo] "Three, two!"
[combo] "Again!"
<time to comment: angry - correcting the lack of hip rotation and foot pivot on the lead hook>
[combo] "Three, two!"
[combo] "Show me POWER!"
<time to comment: hopefully - eager to see the full combination put together>
[combo] "One, two, three, two!" [long pause]
[combo] "One, two, three, two!"
[combo] "Again!"
<time to comment: sarcastic - pointing out that they are moving too slowly and losing stamina>
[combo] "Three, two!"
[combo] "Again!"
[combo] "Show me POWER!"
<time to comment: neutral transition - acknowledging the back half is good, now moving to the front half>
[combo] "One, two!"
[combo] "Again!"
[combo] "One, two!"
<time to comment: demanding - instructing them to put the whole combo together without slowing down>
[combo] "One, two, three, two!"
[combo] "Again!"
<time to comment: sighs - noting slight improvement but stating it still needs work, transitioning to a basic burnout>
[combo] "One, two!"
[combo] "Again!"
[combo] "Faster!"
[combo] "FASTER!"
<time to comment: exhales - final assessment of the round, wrapping up the drill>
</training plan>`
  },
  {
    id: "counter-striker",
    name: "Plan 2: The Counter-Striker (1, Slip Right, 2, 3 / Jab, Slip, Cross, Lead Hook)",
    plan: `<training plan>
<time to comment>
[combo] "One, slip right, two, three!"
[combo] "Again. One, slip right, two, three!"
[combo] "One, slip!"
[combo] "One, slip!"
<time to comment>
[combo] "Again!"
[combo] "One, slip!"
[combo] "One, slip!" [long pause]
<time to comment>
[combo] "Again! One, slip!"
[combo] "One, slip!"
[combo] "One, slip!"
<time to comment>
[combo] "Two, three!"
[combo] "Again!"
[combo] "Two, three!"
[combo] "Show me POWER!"
<time to comment>
[combo] "One, slip right, two, three!" [long pause]
[combo] "One, slip, two, three!"
[combo] "Again!"
<time to comment>
[combo] "Two, three!"
[combo] "Again!"
[combo] "Show me POWER!"
<time to comment: neutral transition - confirming the punches are solid, returning to the setup>
[combo] "One, slip right!"
[combo] "Again!"
[combo] "One, slip!"
[combo] "One, slip right, two, three!"
[combo] "Again!"
<time to comment>
[combo] "One, two!"
[combo] "Again!"
[combo] "Faster!"
[combo] "FASTER!"
<time to comment>
</training plan>`
  },
  {
    id: "distance-closer",
    name: "Plan 3: Distance Closer (1, 1, 2, 3 / Double Jab, Cross, Lead Hook)",
    plan: `<training plan>
<time to comment: excited - hyping up a classic pressure combination used to close the distance>
[combo] "One, one, two, three!"
[combo] "Again. One, one, two, three!"
[combo] "One, one!"
[combo] "One, one!"
<time to comment: angry - noticing the fighter is stepping too wide and losing their balance on the second jab>
[combo] "Again!"
[combo] "One, one!"
[combo] "One, one!" [long pause]
<time to comment: sarcastic - making a comment about the jab being weak or "lazy" instead of snapping back>
[combo] "Again! One, one!"
[combo] "One, one!"
[combo] "One, one!"
<time to comment: sighs - acknowledging the footwork is fixed, transitioning to the power shots>
[combo] "Two, three!"
[combo] "Again!"
<time to comment: angry - catching them "arm-punching" on the cross instead of turning their shoulders>
[combo] "Two, three!"
[combo] "Show me POWER!"
<time to comment: hopefully - asking them to seamlessly chain the double jab into the heavy cross and hook>
[combo] "One, one, two, three!" [long pause]
[combo] "One, one, two, three!"
[combo] "Again!"
<time to comment: sarcastic - pointing out that they look exhausted and their hands are dropping>
[combo] "Two, three!"
[combo] "Again!"
[combo] "Show me POWER!"
<time to comment: neutral transition - approving of the power generation, bringing it back to the entry>
[combo] "One, one, two!"
[combo] "Again!"
[combo] "One, one, two!"
<time to comment: demanding - pushing them to finish strong with the full combination>
[combo] "One, one, two, three!"
[combo] "Again!"
<time to comment: sighs - judging the overall effort as adequate, pushing them into the final basic sprint>
[combo] "One, two!"
[combo] "Again!"
[combo] "Faster!"
[combo] "FASTER!"
<time to comment: exhales - providing the closing thoughts on the workout and their stamina>
</training plan>`
  }
];

export const DEFAULT_CONFIG: TrainingConfig = {
  trainerId: TRAINER_PERSONALITIES[0].id,
  trainerName: TRAINER_PERSONALITIES[0].name,
  personality: TRAINER_PERSONALITIES[0].prompt,
  voiceName: TRAINER_PERSONALITIES[0].voiceName,
  planId: TRAINING_PLANS[0].id,
  planName: TRAINING_PLANS[0].name,
  plan: TRAINING_PLANS[0].plan,
  duration: 180,
  noiseSuppression: false,
  echoCancellation: false,
};