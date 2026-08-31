import type { Activity, DomainCode } from "@/lib/types";
import { STAGE_FOR_BAND } from "./domains";

/**
 * Home activities, written per domain per stage.
 *
 * Deliberately low-cost and household-only: nothing here needs a purchase.
 * Report suggestions are chosen from this pool based on which items a child
 * answered "not yet" or "sometimes", so the advice tracks the actual gap
 * rather than being generic age advice.
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
    s1: [
      ["Sound from every side", "While your baby is calm and awake, shake a rattle softly about 30 cm away — first to the left, then the right, then above. Pause after each. You are looking for the eyes or head to turn towards it.", "A rattle, or rice in a small closed tin", 5, "Twice a day"],
      ["Name the sound", "Whenever a sound happens — a doorbell, a pressure cooker, a bird — pause, look at your baby and name it. “That's the door!” This links sound to meaning long before words arrive.", "Nothing", 2, "Whenever it happens"],
      ["Two-voice turns", "Talk to your baby face to face, then stop and count to five in your head. Whatever sound they make, answer it as though it were a sentence.", "Nothing", 5, "Three times a day"],
    ],
    s2: [
      ["Name calling", "From just outside their line of sight, say their name once in a normal voice. Wait. If they turn, make it worth it — a big smile. If not, come into view and try again from closer.", "Nothing", 5, "Several times a day"],
      ["Where's the cup?", "Put two familiar objects in front of them. Ask for one by name, without pointing or looking at it. Give them time.", "Two familiar household objects", 5, "Once a day"],
      ["Peek-a-boo with a pause", "Play peek-a-boo but wait a beat longer than usual before reappearing, so they have to anticipate and listen for you.", "A cloth or dupatta", 5, "Once a day"],
    ],
    s3: [
      ["One instruction, no hands", "Give a single simple instruction with your hands still — “bring me your shoe”. Resist pointing. Gestures make it easy; the listening is the point.", "Nothing", 5, "A few times a day"],
      ["Body part song", "Sing a song that names body parts and touch each one. After a week, sing it and pause before each part to let them touch it first.", "Nothing", 5, "Once a day"],
      ["Story with questions", "Read a short picture book. On each page, ask one “where is…?” question and wait for them to point.", "Any picture book", 10, "Once a day"],
    ],
    s4: [
      ["Two-step errands", "Give two instructions together — “put the book on the shelf and close the door”. Say it once. If they do only one, say the whole thing again rather than just the missing half.", "Nothing", 5, "A few times a day"],
      ["What happened next?", "After a story, close the book and ask three questions about it: who was in it, what happened, how it ended.", "Any story book", 10, "Once a day"],
      ["Listening walk", "Walk together and stop three times. Each time, both of you close your eyes and name everything you can hear.", "Nothing", 10, "Twice a week"],
    ],
    s5: [
      ["Three-step challenge", "Give three instructions in one go and make it a game — “touch your nose, jump twice, then sit down”. Increase to four when three is easy.", "Nothing", 5, "Once a day"],
      ["Retell it back", "Read a story, then ask them to tell it back to a sibling, a grandparent, or a toy.", "Any story book", 10, "Every other day"],
      ["Odd one out", "Say three words, two related and one not — “apple, banana, chair”. Ask which one doesn't belong and why.", "Nothing", 5, "Once a day"],
    ],
    s6: [
      ["First sound game", "Say a word and ask what sound it starts with. Then swap — you guess theirs. This is the foundation of reading.", "Nothing", 5, "Once a day"],
      ["Instructions once only", "Tell them you will only say it once, then give a three or four step instruction. Make it playful, not a test.", "Nothing", 5, "Once a day"],
      ["Long story, no pictures", "Read or tell a ten-minute story with no pictures, then ask them to retell the main events in order.", "A chapter book, or your own memory", 15, "Twice a week"],
    ],
  },

  // ── Seeing & Noticing ────────────────────────────────────────────────────
  vision: {
    s1: [
      ["Slow arc tracking", "Hold a bright toy about 25 cm from their face. Once they lock on, move it slowly in an arc to one side, then the other. Slower than feels natural — babies lose fast movement.", "Any brightly coloured toy", 5, "Twice a day"],
      ["Face time", "Hold your face 20–25 cm away, make eye contact, and slowly move your head side to side. Your face is the most interesting thing they will look at.", "Nothing", 5, "Several times a day"],
      ["High contrast", "Show them bold black-and-white patterns — stripes, checks, a simple drawn face. Young babies see contrast long before they see subtle colour.", "Paper and a black marker", 5, "Once a day"],
    ],
    s2: [
      ["Hide and find", "While they watch, cover a favourite toy with a cloth, leaving a corner showing. Ask where it went. Cover it fully once they find it easily.", "A cloth and a small toy", 5, "Once a day"],
      ["Crumb picking", "Put a few small pieces of soft food on the highchair tray, well spaced. Spotting and reaching for small things trains the eyes and hands together.", "Small soft food pieces", 10, "At mealtimes"],
      ["Rolling ball", "Roll a ball slowly past them, then away from them, and watch whether their eyes follow it all the way.", "Any ball", 5, "Once a day"],
    ],
    s3: [
      ["Same and same", "Put out two identical objects and one different one. Hold up a match to one and ask them to find the same.", "Pairs of household objects", 5, "Once a day"],
      ["Picture hunt", "Use a busy picture book. Name something on the page and ask them to find it. Start with big obvious things.", "Any picture book", 10, "Once a day"],
      ["Posting box", "Cut a slot in a shoebox lid and give them cards or lids to post. Aligning the object to the slot is real visual-motor work.", "A shoebox and old cards", 10, "Most days"],
    ],
    s4: [
      ["Colour hunt", "Pick a colour for the day and hunt for it around the house. “Find me something red.” Name each one you find.", "Nothing", 10, "Once a day"],
      ["Puzzles, slightly too hard", "Offer a puzzle one step beyond what they can already do, and sit nearby without taking over.", "A 4–6 piece puzzle", 15, "Most days"],
      ["Draw and copy", "Draw a simple shape and ask them to copy it. Start with a circle, then a cross, then a square.", "Paper and crayons", 10, "Most days"],
    ],
    s5: [
      ["Spot the difference", "Draw two versions of a simple picture with three small differences and ask them to find them.", "Paper and crayons", 10, "Twice a week"],
      ["Draw a person", "Ask them to draw someone in the family. Don't correct it — instead ask questions: “where are their hands?” They'll add what's missing.", "Paper and crayons", 15, "Twice a week"],
      ["Sorting basket", "Give them a basket of mixed household items and ask them to sort it — first by colour, then a different way. Let them pick the second rule.", "Buttons, lids, spoons", 15, "Most days"],
    ],
    s6: [
      ["Letter spotting", "On a walk, in a shop, or on a food packet, find and name letters. Start with the letters in their own name.", "Nothing", 10, "Once a day"],
      ["Two-rule sorting", "Ask them to find all the big red things, then all the small blue things — two features at once.", "Buttons or blocks of different sizes and colours", 15, "Twice a week"],
      ["Copy the shape", "Draw a diamond or a triangle and ask them to copy it. These are harder than they look and are strong pre-writing practice.", "Paper and pencil", 10, "Most days"],
    ],
  },

  // ── Moving & Balance ─────────────────────────────────────────────────────
  mobility: {
    s1: [
      ["Tummy time, little and often", "Short bursts on a firm surface while they are awake and you are watching. Start with a minute or two and build up. Lie down at their eye level to give them a reason to lift their head.", "A firm blanket on the floor", 5, "Three or four times a day"],
      ["Reach and roll", "With them on their back, hold a toy above and slightly to one side so they twist towards it. This is how rolling starts.", "Any favourite toy", 5, "Twice a day"],
      ["Supported sitting", "Sit them between your legs or propped with cushions so they practise holding their head and trunk upright.", "Cushions", 10, "Twice a day"],
    ],
    s2: [
      ["Toy just out of reach", "During floor play, put a favourite toy slightly beyond their reach. Resist handing it over. Wait — the effort is the exercise.", "Any favourite toy", 10, "Several times a day"],
      ["Cruising route", "Arrange stable low furniture in a line with a toy at the far end, so they can move along holding on.", "Sofa, low table, sturdy chairs", 15, "Most days"],
      ["Pull to stand", "Kneel in front of them and hold your hands out at their chest height so they pull themselves up to you.", "Nothing", 5, "Several times a day"],
    ],
    s3: [
      ["Walk to me", "Squat a couple of steps away with your arms out. When they manage it, move back a little. Do it on a soft surface.", "Nothing", 10, "Several times a day"],
      ["Cushion obstacle course", "Lay cushions and pillows on the floor to climb over, walk along and step off. Uneven surfaces build balance faster than flat ones.", "Cushions and pillows", 15, "Most days"],
      ["Kick and chase", "Put a ball at their feet and show them how to kick, then chase it together.", "A soft ball", 10, "Most days"],
    ],
    s4: [
      ["Jump the line", "Draw a chalk line or lay a dupatta on the floor and jump over it together with both feet. Then two lines, a little apart.", "Chalk or a cloth", 10, "Most days"],
      ["Stairs, one foot each", "On stairs, hold one hand and encourage one foot per step rather than both feet on each. Go slowly.", "Stairs", 5, "Daily"],
      ["Balance line", "Walk heel to toe along a line on the floor, arms out. Make it a tightrope game.", "Chalk or a line of tape", 10, "Most days"],
    ],
    s5: [
      ["Catch, close then far", "Throw a large soft ball from one metre. When they catch it most times, step back. Say “ready” each time so they prepare.", "A large soft ball", 15, "Most days"],
      ["Flamingo game", "Both of you stand on one foot and count out loud to see who lasts longer. Swap feet.", "Nothing", 5, "Once a day"],
      ["Animal walks", "Cross the room as different animals — bear on all fours, crab on your back, frog jumps, flamingo hops.", "Nothing", 10, "Most days"],
    ],
    s6: [
      ["Hop and skip course", "Mark squares on the ground and hop through them on one foot, then the other, then skip back.", "Chalk", 15, "Most days"],
      ["Small ball catching", "Throw a tennis-sized ball so they must catch with hands rather than trapping it against the chest.", "A small ball", 15, "Most days"],
      ["Cycling practice", "Fifteen minutes on a bicycle in a safe open space. Balance is a skill of hours, not instructions.", "A bicycle", 20, "Three times a week"],
    ],
  },

  // ── Hands & Problem Solving ──────────────────────────────────────────────
  hand: {
    s1: [
      ["Finger grasp", "Place your finger or a light rattle into their palm and let them grip. Gently pull back a little so they hold on.", "A light rattle", 5, "Several times a day"],
      ["Hands together", "While they are on their back, bring both their hands together over their chest and let them feel one hand with the other.", "Nothing", 5, "Twice a day"],
      ["Textures", "Let them touch different safe textures — a cotton cloth, a wooden spoon, a cool steel katori.", "Household objects", 5, "Once a day"],
    ],
    s2: [
      ["Pass it over", "Hand them a toy on one side so they must reach across and, eventually, pass it hand to hand.", "Small light toys", 10, "Once a day"],
      ["In and out of the cup", "Give them blocks and an open cup. Show them once, then let them fill and empty it as many times as they like.", "A cup and small blocks", 10, "Most days"],
      ["Pincer practice", "Put small soft pieces of food on the tray. Picking up with thumb and finger tip is the skill that later holds a pencil.", "Small soft food pieces", 10, "At mealtimes"],
    ],
    s3: [
      ["Tower and topple", "Build a tower of two blocks, then let them try. Knocking it down is half the fun and keeps them coming back.", "6–8 blocks or small boxes", 10, "Most days"],
      ["Scribble freely", "Tape a large sheet of paper to the floor and give them a chunky crayon. Don't ask for anything in particular.", "Paper and thick crayons", 10, "Most days"],
      ["Spoon it over", "Give them two bowls and a spoon and let them move rice or dal from one to the other.", "Two bowls, a spoon, dry rice", 10, "Most days"],
    ],
    s4: [
      ["Lids and jars", "Collect jars and bottles with different lids and let them match and twist them on and off.", "Clean jars and bottles", 10, "Most days"],
      ["Threading", "Thread large beads, or pasta tubes, onto a stiff lace or a straw.", "Pasta tubes and a shoelace", 15, "Most days"],
      ["Dress yourself", "Build ten extra minutes into dressing so they can do it themselves. Loose trousers and open jackets first.", "Their own clothes", 10, "Daily"],
    ],
    s5: [
      ["Tripod grip", "Break crayons into short stubs — a short crayon cannot be held in a fist, so it teaches the grip by itself.", "Broken crayons", 10, "Most days"],
      ["Cutting practice", "Draw thick straight lines on paper and let them cut along, supervised. Then curved lines.", "Safety scissors and paper", 10, "Most days"],
      ["Pouring station", "Two small jugs and a tray. Let them pour water back and forth. Spills are part of it.", "Two small jugs, a tray", 10, "Most days"],
    ],
    s6: [
      ["Write your name", "Write their name in dots for them to trace, then in faint pencil, then let them try alone.", "Paper and pencil", 10, "Daily"],
      ["Knots and laces", "Practise on a shoe off the foot, or laces threaded through a punched card — much easier than bending over a worn shoe.", "A shoelace and card", 10, "Most days"],
      ["Count and touch", "Put out ten to fifteen small objects and count them together, touching each one. Then ask them to do it alone.", "Buttons, coins or pebbles", 10, "Daily"],
    ],
  },

  // ── Talking & Communication ──────────────────────────────────────────────
  language: {
    s1: [
      ["Wait five seconds", "Talk to your baby face to face, then stop and count to five. The pause is what teaches turn-taking — most of us fill it too fast.", "Nothing", 5, "Several times a day"],
      ["Narrate the day", "Say aloud what you are doing as you do it. “Now we're washing your hands. The water is warm.” Ordinary talk, constantly.", "Nothing", 0, "All day"],
      ["Copy their sound", "When they make a sound, make the same one back, then wait. This is their first conversation.", "Nothing", 5, "Several times a day"],
    ],
    s2: [
      ["Babble back", "When they babble “bababa”, say it back, then add one — “ba-ba-ball”. Keep it playful.", "Nothing", 5, "Several times a day"],
      ["Name it every time", "Name objects consistently as they use them — cup, spoon, shoe. The same word each time matters more than the number of words.", "Everyday objects", 0, "All day"],
      ["Songs with actions", "Sing the same three or four songs with hand actions daily. Pause before the last word and see if they fill it in.", "Nothing", 10, "Daily"],
    ],
    s3: [
      ["Add one word", "Whatever they say, say it back with one more word. They say “milk”, you say “more milk”. Never correct — just extend.", "Nothing", 0, "All day"],
      ["Choices, out loud", "Instead of yes/no questions, offer two named choices — “apple or banana?” They have to produce a word to get what they want.", "Nothing", 5, "At mealtimes"],
      ["Pause the routine", "In a familiar song or routine, stop just before the part they know and look at them expectantly.", "Nothing", 5, "Daily"],
    ],
    s4: [
      ["Two-turn talk", "Ask an open question, listen, then ask a follow-up about their answer rather than moving on. Aim for four turns.", "Nothing", 10, "At mealtimes"],
      ["What happened today", "At a fixed time each day, take turns telling one thing that happened. You go first and model the detail.", "Nothing", 10, "Daily"],
      ["Picture description", "Open a book to a busy page and take turns saying what is happening — actions, not just objects.", "Any picture book", 10, "Most days"],
    ],
    s5: [
      ["Because", "Ask “why” about ordinary things and accept any answer that uses “because”. Model it yourself often.", "Nothing", 5, "All day"],
      ["Tell it to someone else", "Have them tell a grandparent or a neighbour about their day on the phone. Talking to someone who wasn't there forces detail.", "A phone", 10, "Twice a week"],
      ["Rhyme pairs", "Say a word, they say one that rhymes. Nonsense words count and make it funnier.", "Nothing", 5, "Once a day"],
    ],
    s6: [
      ["Beginning, middle, end", "Ask for a story with those three parts named out loud. Hold up three fingers and drop one as each part arrives.", "Nothing", 10, "Every other day"],
      ["New word a day", "Use one unfamiliar word each day and see whether they ask what it means. If they don't, ask them to guess from context.", "Nothing", 5, "Daily"],
      ["Explain it to me", "Ask them to explain how to do something they know well — brushing teeth, a game. Follow their instructions exactly, including the gaps.", "Nothing", 10, "Twice a week"],
    ],
  },

  // ── Connecting & Responding ──────────────────────────────────────────────
  social: {
    s1: [
      ["Face to face, phone away", "Ten minutes with nothing else in your hands. Look, smile, wait for a response, respond back. This is the whole activity.", "Nothing", 10, "Several times a day"],
      ["Copy their face", "When they make an expression, make it back with a bit more. Then try starting one and see if they copy you.", "Nothing", 5, "Several times a day"],
      ["Respond every time", "When they make a sound or a face, respond as though they meant it. Consistent response is what builds the expectation of being answered.", "Nothing", 0, "All day"],
    ],
    s2: [
      ["Peek-a-boo variations", "Hide behind a cloth, then behind a door, then let them pull the cloth off you. Vary it so it stays interesting.", "A cloth or dupatta", 10, "Several times a day"],
      ["Short goodbyes", "Leave the room for thirty seconds while someone else stays, then come back cheerfully. Build up the time. It teaches that you return.", "Nothing", 5, "Daily"],
      ["Give and take", "Hand a toy to them, hold your hand out, ask for it back, then give it again. A whole conversation without words.", "Any small toy", 10, "Daily"],
    ],
    s3: [
      ["Play beside another child", "Regular time near another child, even without playing together. Sitting alongside is the stage that comes before sharing.", "Nothing", 30, "Twice a week"],
      ["Copy the chore", "Give them a small version of what you are doing — a cloth while you wipe, a spoon while you stir.", "Household items", 10, "Daily"],
      ["Name the feeling", "When they are upset, name it before you fix it. “You're angry the tower fell.” Feelings get manageable once they have words.", "Nothing", 0, "As it happens"],
    ],
    s4: [
      ["Turn-taking game", "A simple game with clear turns — rolling a ball back and forth, or a very simple board game. Say “my turn, your turn” out loud.", "A ball or simple board game", 15, "Most days"],
      ["Pretend together", "Feed a doll, put a toy to bed, run a shop. Follow their story rather than directing it.", "Dolls, toy utensils, boxes", 20, "Most days"],
      ["One job that's theirs", "Give them one small household job that is genuinely theirs — putting spoons away, watering a plant.", "Nothing", 5, "Daily"],
    ],
    s5: [
      ["Dress-up roles", "Play at being someone else — a doctor, a teacher, a shopkeeper. Take a role yourself and stay in it.", "Old clothes, scarves", 20, "Twice a week"],
      ["How do they feel?", "While reading, stop and ask how a character feels and how they can tell. Point to the face in the picture.", "Any story book", 10, "Most days"],
      ["Playdates with a plan", "Invite one child over — one, not several. Agree one rule beforehand, like taking turns with the favourite toy.", "Nothing", 60, "Weekly"],
    ],
    s6: [
      ["Board games with rules", "Play a game with real rules and don't let them win every time. Losing well is the skill being practised.", "Any simple board game", 20, "Twice a week"],
      ["Sort it out yourselves", "When children disagree, wait longer than is comfortable before stepping in. Offer words, not solutions.", "Nothing", 0, "As it happens"],
      ["Feelings check-in", "Once a day, each person says one thing they felt and why. You go first, and be honest about a difficult one sometimes.", "Nothing", 10, "Daily"],
    ],
  },
};

function build(): Activity[] {
  const out: Activity[] = [];
  for (const [domain, stages] of Object.entries(RAW) as [
    DomainCode,
    Record<string, Row[]>,
  ][]) {
    for (const [stage, rows] of Object.entries(stages)) {
      rows.forEach(([title, description, materials, minutes, frequency], i) => {
        out.push({
          id: `${domain}-${stage}-${i + 1}`,
          domain,
          stage,
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

/** Activities for a domain at the stage covering the given band. */
export function activitiesFor(domain: DomainCode, band: string): Activity[] {
  const stage = STAGE_FOR_BAND[band];
  return ACTIVITIES.filter((a) => a.domain === domain && a.stage === stage);
}
