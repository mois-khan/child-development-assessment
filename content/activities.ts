import type { Activity, DomainCode } from "@/lib/types";

/**
 * Home activities, written per competence per activity band.
 *
 * Deliberately low-cost and household-only: nothing here needs a purchase.
 * Report suggestions are chosen from this pool based on which questions a
 * child answered "no", so the advice tracks the actual gap rather than being
 * generic age advice.
 *
 * NOTE ON KEYS — a1…a6 are ACTIVITY BANDS, not the chart's brain stages.
 * They are six spans of shared play pattern (roughly 0–6, 7–12, 13–24, 25–36,
 * 37–48 and 49–72 months) and there are deliberately six of them against the
 * chart's seven stages, because the first three stages of the chart all fall
 * inside a baby's first six months and share the same play. ACTIVITY_BAND
 * below maps one to the other; nothing else should assume the two line up.
 *
 * Authored for this project. Kaushalya's team should review and replace these
 * with their own programme activities — that is a data edit, not a code change.
 */

type Row = [
  title: string,
  description: string,
  materials: string,
  minutes: number,
  frequency: string,
];

const RAW: Record<DomainCode, Record<string, Row[]>> = {
  // ── Listening & Understanding ────────────────────────────────────────────
  auditory: {
    a1: [
      ["Sound from every side", "While your baby is calm and awake, shake a rattle softly about 30 cm away — first to the left, then the right, then above. Pause after each. You are looking for the eyes or head to turn towards it.", "A rattle, or rice in a small closed tin", 5, "Twice a day"],
      ["Name the sound", "Whenever a sound happens — a doorbell, a pressure cooker, a bird — pause, look at your baby and name it. “That's the door!” This links sound to meaning long before words arrive.", "Nothing", 2, "Whenever it happens"],
      ["Two-voice turns", "Talk to your baby face to face, then stop and count to five in your head. Whatever sound they make, answer it as though it were a sentence.", "Nothing", 5, "Three times a day"],
    ],
    a2: [
      ["Name calling", "From just outside their line of sight, say their name once in a normal voice. Wait. If they turn, make it worth it — a big smile. If not, come into view and try again from closer.", "Nothing", 5, "Several times a day"],
      ["Where's the cup?", "Put two familiar objects in front of them. Ask for one by name, without pointing or looking at it. Give them time.", "Two familiar household objects", 5, "Once a day"],
      ["Peek-a-boo with a pause", "Play peek-a-boo but wait a beat longer than usual before reappearing, so they have to anticipate and listen for you.", "A cloth or dupatta", 5, "Once a day"],
    ],
    a3: [
      ["One instruction, no hands", "Give a single simple instruction with your hands still — “bring me your shoe”. Resist pointing. Gestures make it easy; the listening is the point.", "Nothing", 5, "A few times a day"],
      ["Body part song", "Sing a song that names body parts and touch each one. After a week, sing it and pause before each part to let them touch it first.", "Nothing", 5, "Once a day"],
      ["Story with questions", "Read a short picture book. On each page, ask one “where is…?” question and wait for them to point.", "Any picture book", 10, "Once a day"],
    ],
    a4: [
      ["Two-step errands", "Give two instructions together — “put the book on the shelf and close the door”. Say it once. If they do only one, say the whole thing again rather than just the missing half.", "Nothing", 5, "A few times a day"],
      ["What happened next?", "After a story, close the book and ask three questions about it: who was in it, what happened, how it ended.", "Any story book", 10, "Once a day"],
      ["Listening walk", "Walk together and stop three times. Each time, both of you close your eyes and name everything you can hear.", "Nothing", 10, "Twice a week"],
    ],
    a5: [
      ["Three-step challenge", "Give three instructions in one go and make it a game — “touch your nose, jump twice, then sit down”. Increase to four when three is easy.", "Nothing", 5, "Once a day"],
      ["Retell it back", "Read a story, then ask them to tell it back to a sibling, a grandparent, or a toy.", "Any story book", 10, "Every other day"],
      ["Odd one out", "Say three words, two related and one not — “apple, banana, chair”. Ask which one doesn't belong and why.", "Nothing", 5, "Once a day"],
    ],
    a6: [
      ["First sound game", "Say a word and ask what sound it starts with. Then swap — you guess theirs. This is the foundation of reading.", "Nothing", 5, "Once a day"],
      ["Instructions once only", "Tell them you will only say it once, then give a three or four step instruction. Make it playful, not a test.", "Nothing", 5, "Once a day"],
      ["Long story, no pictures", "Read or tell a ten-minute story with no pictures, then ask them to retell the main events in order.", "A chapter book, or your own memory", 15, "Twice a week"],
    ],
  },

  // ── Seeing & Noticing ────────────────────────────────────────────────────
  vision: {
    a1: [
      ["Slow arc tracking", "Hold a bright toy about 25 cm from their face. Once they lock on, move it slowly in an arc to one side, then the other. Slower than feels natural — babies lose fast movement.", "Any brightly coloured toy", 5, "Twice a day"],
      ["Face time", "Hold your face 20–25 cm away, make eye contact, and slowly move your head side to side. Your face is the most interesting thing they will look at.", "Nothing", 5, "Several times a day"],
      ["High contrast", "Show them bold black-and-white patterns — stripes, checks, a simple drawn face. Young babies see contrast long before they see subtle colour.", "Paper and a black marker", 5, "Once a day"],
    ],
    a2: [
      ["Hide and find", "While they watch, cover a favourite toy with a cloth, leaving a corner showing. Ask where it went. Cover it fully once they find it easily.", "A cloth and a small toy", 5, "Once a day"],
      ["Crumb picking", "Put a few small pieces of soft food on the highchair tray, well spaced. Spotting and reaching for small things trains the eyes and hands together.", "Small soft food pieces", 10, "At mealtimes"],
      ["Rolling ball", "Roll a ball slowly past them, then away from them, and watch whether their eyes follow it all the way.", "Any ball", 5, "Once a day"],
    ],
    a3: [
      ["Same and same", "Put out two identical objects and one different one. Hold up a match to one and ask them to find the same.", "Pairs of household objects", 5, "Once a day"],
      ["Picture hunt", "Use a busy picture book. Name something on the page and ask them to find it. Start with big obvious things.", "Any picture book", 10, "Once a day"],
      ["Posting box", "Cut a slot in a shoebox lid and give them cards or lids to post. Aligning the object to the slot is real visual-motor work.", "A shoebox and old cards", 10, "Most days"],
    ],
    a4: [
      ["Colour hunt", "Pick a colour for the day and hunt for it around the house. “Find me something red.” Name each one you find.", "Nothing", 10, "Once a day"],
      ["Puzzles, slightly too hard", "Offer a puzzle one step beyond what they can already do, and sit nearby without taking over.", "A 4–6 piece puzzle", 15, "Most days"],
      ["Draw and copy", "Draw a simple shape and ask them to copy it. Start with a circle, then a cross, then a square.", "Paper and crayons", 10, "Most days"],
    ],
    a5: [
      ["Spot the difference", "Draw two versions of a simple picture with three small differences and ask them to find them.", "Paper and crayons", 10, "Twice a week"],
      ["Draw a person", "Ask them to draw someone in the family. Don't correct it — instead ask questions: “where are their hands?” They'll add what's missing.", "Paper and crayons", 15, "Twice a week"],
      ["Sorting basket", "Give them a basket of mixed household items and ask them to sort it — first by colour, then a different way. Let them pick the second rule.", "Buttons, lids, spoons", 15, "Most days"],
    ],
    a6: [
      ["Letter spotting", "On a walk, in a shop, or on a food packet, find and name letters. Start with the letters in their own name.", "Nothing", 10, "Once a day"],
      ["Two-rule sorting", "Ask them to find all the big red things, then all the small blue things — two features at once.", "Buttons or blocks of different sizes and colours", 15, "Twice a week"],
      ["Copy the shape", "Draw a diamond or a triangle and ask them to copy it. These are harder than they look and are strong pre-writing practice.", "Paper and pencil", 10, "Most days"],
    ],
  },

  // ── Moving & Balance ─────────────────────────────────────────────────────
  mobility: {
    a1: [
      ["Tummy time, little and often", "Short bursts on a firm surface while they are awake and you are watching. Start with a minute or two and build up. Lie down at their eye level to give them a reason to lift their head.", "A firm blanket on the floor", 5, "Three or four times a day"],
      ["Reach and roll", "With them on their back, hold a toy above and slightly to one side so they twist towards it. This is how rolling starts.", "Any favourite toy", 5, "Twice a day"],
      ["Supported sitting", "Sit them between your legs or propped with cushions so they practise holding their head and trunk upright.", "Cushions", 10, "Twice a day"],
    ],
    a2: [
      ["Toy just out of reach", "During floor play, put a favourite toy slightly beyond their reach. Resist handing it over. Wait — the effort is the exercise.", "Any favourite toy", 10, "Several times a day"],
      ["Cruising route", "Arrange stable low furniture in a line with a toy at the far end, so they can move along holding on.", "Sofa, low table, sturdy chairs", 15, "Most days"],
      ["Pull to stand", "Kneel in front of them and hold your hands out at their chest height so they pull themselves up to you.", "Nothing", 5, "Several times a day"],
    ],
    a3: [
      ["Walk to me", "Squat a couple of steps away with your arms out. When they manage it, move back a little. Do it on a soft surface.", "Nothing", 10, "Several times a day"],
      ["Cushion obstacle course", "Lay cushions and pillows on the floor to climb over, walk along and step off. Uneven surfaces build balance faster than flat ones.", "Cushions and pillows", 15, "Most days"],
      ["Kick and chase", "Put a ball at their feet and show them how to kick, then chase it together.", "A soft ball", 10, "Most days"],
    ],
    a4: [
      ["Jump the line", "Draw a chalk line or lay a dupatta on the floor and jump over it together with both feet. Then two lines, a little apart.", "Chalk or a cloth", 10, "Most days"],
      ["Stairs, one foot each", "On stairs, hold one hand and encourage one foot per step rather than both feet on each. Go slowly.", "Stairs", 5, "Daily"],
      ["Balance line", "Walk heel to toe along a line on the floor, arms out. Make it a tightrope game.", "Chalk or a line of tape", 10, "Most days"],
    ],
    a5: [
      ["Catch, close then far", "Throw a large soft ball from one metre. When they catch it most times, step back. Say “ready” each time so they prepare.", "A large soft ball", 15, "Most days"],
      ["Flamingo game", "Both of you stand on one foot and count out loud to see who lasts longer. Swap feet.", "Nothing", 5, "Once a day"],
      ["Animal walks", "Cross the room as different animals — bear on all fours, crab on your back, frog jumps, flamingo hops.", "Nothing", 10, "Most days"],
    ],
    a6: [
      ["Hop and skip course", "Mark squares on the ground and hop through them on one foot, then the other, then skip back.", "Chalk", 15, "Most days"],
      ["Small ball catching", "Throw a tennis-sized ball so they must catch with hands rather than trapping it against the chest.", "A small ball", 15, "Most days"],
      ["Cycling practice", "Fifteen minutes on a bicycle in a safe open space. Balance is a skill of hours, not instructions.", "A bicycle", 20, "Three times a week"],
    ],
  },

  // ── Hands & Problem Solving ──────────────────────────────────────────────
  hand: {
    a1: [
      ["Finger grasp", "Place your finger or a light rattle into their palm and let them grip. Gently pull back a little so they hold on.", "A light rattle", 5, "Several times a day"],
      ["Hands together", "While they are on their back, bring both their hands together over their chest and let them feel one hand with the other.", "Nothing", 5, "Twice a day"],
      ["Textures", "Let them touch different safe textures — a cotton cloth, a wooden spoon, a cool steel katori.", "Household objects", 5, "Once a day"],
    ],
    a2: [
      ["Pass it over", "Hand them a toy on one side so they must reach across and, eventually, pass it hand to hand.", "Small light toys", 10, "Once a day"],
      ["In and out of the cup", "Give them blocks and an open cup. Show them once, then let them fill and empty it as many times as they like.", "A cup and small blocks", 10, "Most days"],
      ["Pincer practice", "Put small soft pieces of food on the tray. Picking up with thumb and finger tip is the skill that later holds a pencil.", "Small soft food pieces", 10, "At mealtimes"],
    ],
    a3: [
      ["Tower and topple", "Build a tower of two blocks, then let them try. Knocking it down is half the fun and keeps them coming back.", "6–8 blocks or small boxes", 10, "Most days"],
      ["Scribble freely", "Tape a large sheet of paper to the floor and give them a chunky crayon. Don't ask for anything in particular.", "Paper and thick crayons", 10, "Most days"],
      ["Spoon it over", "Give them two bowls and a spoon and let them move rice or dal from one to the other.", "Two bowls, a spoon, dry rice", 10, "Most days"],
    ],
    a4: [
      ["Lids and jars", "Collect jars and bottles with different lids and let them match and twist them on and off.", "Clean jars and bottles", 10, "Most days"],
      ["Threading", "Thread large beads, or pasta tubes, onto a stiff lace or a straw.", "Pasta tubes and a shoelace", 15, "Most days"],
      ["Dress yourself", "Build ten extra minutes into dressing so they can do it themselves. Loose trousers and open jackets first.", "Their own clothes", 10, "Daily"],
    ],
    a5: [
      ["Tripod grip", "Break crayons into short stubs — a short crayon cannot be held in a fist, so it teaches the grip by itself.", "Broken crayons", 10, "Most days"],
      ["Cutting practice", "Draw thick straight lines on paper and let them cut along, supervised. Then curved lines.", "Safety scissors and paper", 10, "Most days"],
      ["Pouring station", "Two small jugs and a tray. Let them pour water back and forth. Spills are part of it.", "Two small jugs, a tray", 10, "Most days"],
    ],
    a6: [
      ["Write your name", "Write their name in dots for them to trace, then in faint pencil, then let them try alone.", "Paper and pencil", 10, "Daily"],
      ["Knots and laces", "Practise on a shoe off the foot, or laces threaded through a punched card — much easier than bending over a worn shoe.", "A shoelace and card", 10, "Most days"],
      ["Count and touch", "Put out ten to fifteen small objects and count them together, touching each one. Then ask them to do it alone.", "Buttons, coins or pebbles", 10, "Daily"],
    ],
  },

  // ── Talking & Communication ──────────────────────────────────────────────
  language: {
    a1: [
      ["Wait five seconds", "Talk to your baby face to face, then stop and count to five. The pause is what teaches turn-taking — most of us fill it too fast.", "Nothing", 5, "Several times a day"],
      ["Narrate the day", "Say aloud what you are doing as you do it. “Now we're washing your hands. The water is warm.” Ordinary talk, constantly.", "Nothing", 0, "All day"],
      ["Copy their sound", "When they make a sound, make the same one back, then wait. This is their first conversation.", "Nothing", 5, "Several times a day"],
    ],
    a2: [
      ["Babble back", "When they babble “bababa”, say it back, then add one — “ba-ba-ball”. Keep it playful.", "Nothing", 5, "Several times a day"],
      ["Name it every time", "Name objects consistently as they use them — cup, spoon, shoe. The same word each time matters more than the number of words.", "Everyday objects", 0, "All day"],
      ["Songs with actions", "Sing the same three or four songs with hand actions daily. Pause before the last word and see if they fill it in.", "Nothing", 10, "Daily"],
    ],
    a3: [
      ["Add one word", "Whatever they say, say it back with one more word. They say “milk”, you say “more milk”. Never correct — just extend.", "Nothing", 0, "All day"],
      ["Choices, out loud", "Instead of yes/no questions, offer two named choices — “apple or banana?” They have to produce a word to get what they want.", "Nothing", 5, "At mealtimes"],
      ["Pause the routine", "In a familiar song or routine, stop just before the part they know and look at them expectantly.", "Nothing", 5, "Daily"],
    ],
    a4: [
      ["Two-turn talk", "Ask an open question, listen, then ask a follow-up about their answer rather than moving on. Aim for four turns.", "Nothing", 10, "At mealtimes"],
      ["What happened today", "At a fixed time each day, take turns telling one thing that happened. You go first and model the detail.", "Nothing", 10, "Daily"],
      ["Picture description", "Open a book to a busy page and take turns saying what is happening — actions, not just objects.", "Any picture book", 10, "Most days"],
    ],
    a5: [
      ["Because", "Ask “why” about ordinary things and accept any answer that uses “because”. Model it yourself often.", "Nothing", 5, "All day"],
      ["Tell it to someone else", "Have them tell a grandparent or a neighbour about their day on the phone. Talking to someone who wasn't there forces detail.", "A phone", 10, "Twice a week"],
      ["Rhyme pairs", "Say a word, they say one that rhymes. Nonsense words count and make it funnier.", "Nothing", 5, "Once a day"],
    ],
    a6: [
      ["Beginning, middle, end", "Ask for a story with those three parts named out loud. Hold up three fingers and drop one as each part arrives.", "Nothing", 10, "Every other day"],
      ["New word a day", "Use one unfamiliar word each day and see whether they ask what it means. If they don't, ask them to guess from context.", "Nothing", 5, "Daily"],
      ["Explain it to me", "Ask them to explain how to do something they know well — brushing teeth, a game. Follow their instructions exactly, including the gaps.", "Nothing", 10, "Twice a week"],
    ],
  },

  // ── Connecting & Responding ──────────────────────────────────────────────
  // ── Touch & Feeling ──────────────────────────────────────────────────────
  tactile: {
    a1: [
      ["Skin to skin", "Hold your baby against your bare chest for as long as you both like. Steady, whole-body contact is the first tactile input a baby organises, and everything later is built on it.", "Nothing", 20, "Daily"],
      ["Textures on the arm", "Brush three different things slowly along one forearm — a soft cloth, a cool spoon, your fingertip. Pause between each and watch for a different reaction to each one.", "A cloth and a spoon", 5, "Once a day"],
      ["Firm then feather", "Stroke an arm firmly, then so lightly it barely touches. You are looking for them to notice both, not just the firm one.", "Nothing", 5, "Twice a day"],
    ],
    a2: [
      ["Warm and cool cups", "Fill one cup with cool water and one with comfortably warm water. Guide a hand to each in turn and name it — “cool”, “warm”.", "Two cups", 5, "Once a day"],
      ["Texture basket", "A basket of safe things that feel completely different — a sponge, a wooden spoon, crumpled paper, a smooth stone too big to swallow. Let them dig.", "A basket of household objects", 15, "Most days"],
      ["Massage after the bath", "A few minutes of firm, slow strokes down each arm, each leg, and the back. Cover the whole body, so no part gets less attention than the rest.", "Any oil you already use", 10, "Daily"],
    ],
    a3: [
      ["Feely bag", "Put one familiar object in a cloth bag. They reach in without looking and tell you what it is. Start with things they know very well.", "A cloth bag and familiar objects", 10, "Once a day"],
      ["Messy tray", "A tray of something to push hands through — rice, atta, wet sand. No goal, just contact. Some children need to start with a spoon before their hands.", "A tray and rice or flour", 15, "Twice a week"],
      ["Hot, warm, cold", "At mealtimes, name the temperature of what they touch before they touch it, then ask them after. Builds the words alongside the sensation.", "Nothing", 2, "At mealtimes"],
    ],
    a4: [
      ["Same or different", "Two objects in the bag. They feel both without looking and say whether they are the same. Start obviously different, then closer.", "A cloth bag and pairs of objects", 10, "Most days"],
      ["Which hand?", "Play the feely bag with one hand at a time, so the weaker hand gets the practice it would otherwise avoid.", "A cloth bag and familiar objects", 10, "Most days"],
      ["Barefoot paths", "Walk barefoot across three surfaces in a row — tiles, a mat, grass — and talk about how each one feels.", "Nothing", 10, "Twice a week"],
    ],
    a5: [
      ["Animal by touch", "Two toy animals in the bag. Eyes closed, they find the one you name. This is exactly what the assessment asks at stage V.", "Two toy animals and a bag", 10, "Most days"],
      ["Describe it, don't name it", "They feel something hidden and describe it — hard, soft, bumpy, sticky — before guessing what it is. The describing is the skill.", "A cloth bag and household objects", 10, "Most days"],
      ["Find the coin", "Scatter a few coins on a tray of rice. Eyes closed, they fish them out by touch alone.", "Coins and a tray of rice", 10, "Twice a week"],
    ],
    a6: [
      ["Heads or tails", "A coin in the closed hand, eyes shut, and they say which side is up. Then the same with the other hand.", "A coin", 5, "Most days"],
      ["Letters on the back", "Draw a letter or a number slowly on their back with a finger and ask them to name it.", "Nothing", 5, "Most days"],
      ["Sort without looking", "A mixed handful of small objects and two bowls. Eyes closed, they sort by feel — smooth into one, rough into the other.", "Small household objects and two bowls", 10, "Twice a week"],
    ],
  },
};

/**
 * Which activity band suits a child who has reached each brain stage.
 *
 * The chart's first three stages all land inside a baby's first six months and
 * share the same play, so they share band a1. Band a5 (37–48 months) sits
 * between stages VI and VII, where the chart has no row of its own; it is
 * reachable through the report's "what's next" suggestions rather than through
 * a stage.
 */
/** The six activity bands, for the admin editor's grouping. */
export const ACTIVITY_BANDS: { id: string; label: string }[] = [
  { id: "a1", label: "0–6 months" },
  { id: "a2", label: "7–12 months" },
  { id: "a3", label: "13–24 months" },
  { id: "a4", label: "25–36 months" },
  { id: "a5", label: "37–48 months" },
  { id: "a6", label: "49–72 months" },
];

export const ACTIVITY_BAND: Record<string, string> = {
  s1: "a1", // I   Medulla and Cord
  s2: "a1", // II  Pons
  s3: "a2", // III Mid-Brain
  s4: "a2", // IV  Initial Cortex
  s5: "a3", // V   Early Cortex
  s6: "a4", // VI  Primitive Cortex
  s7: "a6", // VII Sophisticated Cortex
};

function build(): Activity[] {
  const out: Activity[] = [];
  for (const [domain, bands] of Object.entries(RAW) as [
    DomainCode,
    Record<string, Row[]>,
  ][]) {
    for (const [band, rows] of Object.entries(bands)) {
      rows.forEach(([title, description, materials, minutes, frequency], i) => {
        out.push({
          id: `${domain}-${band}-${i + 1}`,
          domain,
          stage: band,
          title,
          description,
          materials,
          minutes,
          frequency,
        });
      });
    }
  }
  return out;
}

export const ACTIVITIES: Activity[] = build();

/**
 * Activities to suggest for one competence, given the brain stage the child
 * has reached. A child who reached nothing gets the first band's activities,
 * which is where the work starts.
 */
export function activitiesFor(domain: DomainCode, stage: string): Activity[] {
  const band = ACTIVITY_BAND[stage] ?? "a1";
  return ACTIVITIES.filter((a) => a.domain === domain && a.stage === band);
}
