import type { DomainCode, Item, ItemKind, ItemSource } from "@/lib/types";
import { BRAIN_STAGES } from "./stages";

export const BANK_VERSION = "2026.09.04-ace";

/**
 * The assessment item bank.
 *
 * SOURCE — this matters, please read before adding content.
 *
 * Every question here is transcribed from the programme's own printed
 * assessment booklet (Ru Education Pvt Ltd), which families already fill in by
 * hand. The booklet is laid out exactly as this file is: one page per
 * competence, questions listed VII down to I. Where a question below differs
 * from the booklet, the booklet is right and this file is a bug.
 *
 * Marked `AUTHORED` are the few places the booklet records a measurement but
 * no pass/fail question, and the stage needs one — Language V asks "how many
 * words does your child say?" where the chart's cell is "10 to 25 words", so a
 * yes/no for that threshold is added alongside the count.
 *
 * THE "how" TEXT IS AUTHORED, ALL OF IT. The paper booklet is filled in with a
 * clinician in the room, so it does not need to explain how to test anything.
 * A parent at home does. Every `how` line below was written for this app and
 * NONE of it has been reviewed by Kaushalya's child development team yet —
 * that review is a blocker before any real family uses this.
 *
 * Wording note: except where `invert` is set, questions are phrased so that
 * "yes" is always the developmentally expected answer.
 */

interface Row {
  /** The question as the parent reads it. */
  t: string;
  /** How to actually test it. Authored — see the note above. */
  h: string;
  /** Defaults to "yesno", the only kind that scores. */
  k?: ItemKind;
  /** "Yes" is the concerning answer here, not the expected one. */
  inv?: true;
  /** Only ask once the child is this old, in months. */
  min?: number;
  /** For `choice` items. */
  ch?: [string, string];
  /** For `count` and `percent` items. */
  u?: string;
  /** Authored rather than transcribed from the booklet. */
  a?: true;
}

const RAW: Record<string, Partial<Record<DomainCode, Row[]>>> = {
  /* ── Stage I — Medulla and Cord ─────────────────────────────────────────── */
  s1: {
    vision: [
      {
        t: "Do your child's pupils dilate in a dark room?",
        h: "Take them into a dark room for a minute, then look closely at the black centre of each eye — it should have grown wider.",
      },
    ],
    auditory: [
      {
        t: "Does your child physically startle at any sudden or sharp sound?",
        h: "Clap once, out of sight and about a metre away, and watch for a blink, a jerk, or a pause in movement.",
      },
      {
        t: "Does your child react appropriately to sudden sounds?",
        h: "After the startle, watch whether they settle again — rather than staying distressed, or not reacting at all.",
      },
    ],
    tactile: [
      {
        t: "Using your thumbnail, scratch the sole of your child's foot from the heel to the toe. Does his big toe move downward?",
        h: "Draw your thumbnail firmly up the sole from heel to toe, and watch what the big toe does.",
      },
    ],
    mobility: [
      {
        t: "Does your child move his arms and legs freely?",
        h: "Watch during a nappy change — look for easy, similar movement on both sides.",
      },
      {
        t: "Are his arms and/or legs too tight or too floppy?",
        h: "Gently bend and straighten an arm and a leg. Feel for stiffness that resists you, or for a limb with no tone at all.",
        inv: true,
      },
    ],
    language: [
      {
        t: "Does he have a lusty cry?",
        h: "When they cry from hunger or discomfort, listen for a strong, full sound rather than a weak or thin one.",
      },
    ],
    hand: [
      {
        t: "When you put an object or finger in the palm of your child's hand, does he grasp it?",
        h: "Press a finger gently into the palm and feel for a grip closing around it.",
      },
    ],
  },

  /* ── Stage II — Pons ────────────────────────────────────────────────────── */
  s2: {
    vision: [
      {
        t: "Does your child follow you with his eyes as you walk across the room?",
        h: "Walk slowly from one side of the room to the other while they are calm and awake, and watch whether their eyes come with you.",
      },
      {
        t: "Is your child aware of lights?",
        h: "In a dim room, switch on a lamp off to one side and watch for their eyes or head turning towards it.",
      },
      {
        t: "Do your child's pupils constrict immediately when you shine a light into his eyes?",
        h: "In a dim room, shine a torch briefly towards one eye from the side, and watch the black centre shrink at once.",
      },
    ],
    auditory: [
      {
        t: "Does your child follow or respond to loud and threatening sounds?",
        h: "Notice what happens with a door slam, a cooker whistle or a horn — look for turning towards it, freezing, or crying.",
      },
    ],
    tactile: [
      {
        t: "Does your child have an immediate response to pain in all the areas of his body?",
        h: "Notice their reaction to ordinary knocks in different places — arms, legs, back, feet.",
      },
      {
        t: "Does your child have an appropriate response to hot and cold?",
        h: "Watch how they react to a cool cloth, and to a warm bath.",
      },
      {
        t: "Is his response appropriate all over his body?",
        h: "Check that no part of the body reacts noticeably less than the rest.",
      },
    ],
    mobility: [
      {
        t: "Does your child crawl across the room on his tummy?",
        h: "Put a favourite toy a few feet away on the floor and let them go for it on their tummy.",
      },
      {
        t: "Does your child crawl in a smooth cross pattern?",
        h: "Watch which limbs move together — a cross pattern is right arm with left leg, then left arm with right leg.",
      },
    ],
    language: [
      {
        t: "Does your child have a vital cry when he is in pain?",
        h: "Notice whether the cry after a knock sounds different and more urgent than the everyday cry.",
      },
      {
        t: "Is his cry appropriately loud?",
        h: "Listen from the next room — you should hear it clearly through a closed door.",
      },
    ],
    hand: [
      {
        t: "Does your child have the ability to let go of an object easily?",
        h: "Once they are holding something, watch whether they can open the hand and drop it on purpose.",
      },
      {
        t: "Does he do so equally well with both hands?",
        h: "Try the same thing again with the other hand.",
      },
    ],
  },

  /* ── Stage III — Mid-Brain ──────────────────────────────────────────────── */
  s3: {
    vision: [
      {
        t: "Does your child recognise many familiar objects?",
        h: "Hold up things they know — a bottle, a favourite toy, a spoon — one at a time, and watch for a change in their face or for reaching.",
      },
      {
        t: "Does your child recognise your face without any sound or touch clues?",
        h: "Come into view silently, without speaking or touching them, and watch for recognition.",
      },
      {
        t: "If you change your facial expression greatly, does your child notice?",
        h: "Face them closely, then switch from a big smile to a surprised face, and watch whether they react.",
      },
    ],
    auditory: [
      {
        t: "Does your child respond with a smile to your loving tone of voice?",
        h: "Speak warmly and softly, face to face, then pause several seconds to let them answer.",
      },
      {
        t: "Does your child get upset when you speak in an angry tone of voice?",
        h: "Say something ordinary in a sharp tone, keeping your face neutral, and watch for a change.",
      },
      {
        t: "Does your child react appropriately to everyday noises in the house?",
        h: "Watch their response to the doorbell, a mixer, running water — interested rather than alarmed or blank.",
      },
    ],
    tactile: [
      {
        t: "Does your child appreciate coolness and warmth appropriately?",
        h: "Touch a cool spoon and then a warm one to their arm, and watch for two different reactions.",
      },
      {
        t: "Does your child enjoy being stroked?",
        h: "Stroke their arm slowly and watch whether they settle, rather than pulling away.",
      },
      {
        t: "Is his response appropriate all over his body?",
        h: "Try the same stroke on arms, legs, back and tummy, and compare.",
      },
      {
        t: "Does your child respond to soft touch?",
        h: "Brush a fingertip very lightly on the back of the hand, and watch for any notice at all.",
      },
    ],
    mobility: [
      {
        t: "Does your child creep across the room on his hands and knees?",
        h: "Place a toy across the room and watch them travel to it up off the floor, on hands and knees.",
      },
      {
        t: "Does your child creep in a smooth cross pattern?",
        h: "Watch for right hand with left knee, then left hand with right knee, without a hitch.",
      },
    ],
    language: [
      {
        t: "Does your child make a variety of sounds which let you know whether he is happy, unhappy, hungry or asleep?",
        h: "Over a day, notice whether you can tell what they want from the sound alone, without looking.",
      },
      {
        t: "Does he make the full range of sounds of a well seven-month-old?",
        h: "Listen for babbling with consonants — 'ba', 'da', 'ma' — repeated in strings, not just vowel sounds.",
      },
    ],
    hand: [
      {
        t: "Does your child spontaneously reach out and pick up objects?",
        h: "Put a toy within arm's reach and wait, without offering it — watch for them going for it themselves.",
      },
      {
        t: "Does he do so equally well with both hands?",
        h: "Place the toy on the other side and watch whether that hand works as well.",
      },
    ],
  },

  /* ── Stage IV — Initial Cortex ──────────────────────────────────────────── */
  s4: {
    vision: [
      {
        t: "Are your child's eyes consistently straight throughout the day?",
        h: "Watch both eyes at different times — morning, after a nap, in the evening — and check they point the same way together.",
      },
      {
        t: "Even if your child is tired, sick or upset, do his eyes remain perfectly straight?",
        h: "Check again at the end of a long day, or during an illness, when any drift is easiest to see.",
      },
    ],
    auditory: [
      {
        t: "Does your child consistently respond to two or more words?",
        h: "From another part of the room, say two words they know — their name, and 'milk' — and see whether each one gets a reliable response.",
      },
    ],
    tactile: [
      {
        t: "Can your child feel a penny on a flat surface?",
        h: "Place a coin on a table, guide their hand over it with their eyes closed, and see whether they find it.",
      },
      {
        t: "Can he do so with both hands?",
        h: "Try the same thing again with the other hand.",
      },
    ],
    mobility: [
      {
        t: "Can your child walk across a room completely independently?",
        h: "Stand back and let them cross the room with nothing to hold and nobody within reach.",
      },
      {
        t: "Does your child walk across the room with his arms up in the air for balance?",
        h: "Watch where the arms sit while they walk — at this stage they are up, at or above shoulder height.",
      },
      {
        t: "Does your child stand up without support?",
        h: "From sitting on the floor, watch them get to their feet without holding furniture or a hand.",
      },
    ],
    language: [
      {
        t: "Does your child say two or more words spontaneously and meaningfully?",
        h: "Wait for them to use a word on their own, for the right thing, without you saying it first.",
      },
      {
        t: "Which words does your child say?",
        h: "List the words you have heard them use meaningfully.",
        k: "text",
      },
    ],
    hand: [
      {
        t: "Does your child pick up objects between his thumb and forefinger, for example picking up crumbs?",
        h: "Scatter a few crumbs or peas on the tray and watch which fingers they use.",
      },
      {
        t: "Does he hold a pen or pencil between his thumb and two fingers?",
        h: "Offer a pencil and paper and watch the grip, rather than what they draw.",
      },
      {
        t: "Does he do so equally well with both hands?",
        h: "Offer the pencil to the other hand and watch the grip again.",
      },
    ],
  },

  /* ── Stage V — Early Cortex ─────────────────────────────────────────────── */
  s5: {
    vision: [
      {
        t: "Does your child know pictures?",
        h: "Show a picture book and ask them to point to something they know — a dog, a car, a cup.",
      },
      {
        t: "Does your child recognise traffic signals — the difference between red, amber and green?",
        h: "At a signal, or with three coloured cards, ask which one means stop and which means go.",
      },
    ],
    auditory: [
      {
        t: "Does your child understand 10 to 25 words?",
        h: "Name familiar things one at a time without pointing, and ask them to find or look at each one.",
      },
      {
        t: "Which words does your child understand?",
        h: "List the words they reliably respond to.",
        k: "text",
      },
      {
        t: "Does your child respond to directions?",
        h: "Give one simple instruction with no gesture — 'bring me your shoe' — and see whether they act on it.",
      },
      {
        t: "Please give an example of a direction he follows",
        h: "Write down one instruction they reliably act on.",
        k: "text",
      },
      {
        t: "Does your child understand couplets of words, such as 'get up', 'sit down', 'blue shirt', 'orange juice'?",
        h: "Say a two-word phrase with no pointing, and watch whether they do the whole thing rather than just one half.",
      },
    ],
    tactile: [
      {
        t: "Does your child recognise familiar objects by the way they feel?",
        h: "With their eyes closed, put a spoon or a familiar toy in their hand and ask what it is.",
      },
      {
        t: "Can he do so with both hands?",
        h: "Try the same thing again with the other hand.",
      },
      {
        t: "Does your child differentiate between a toy elephant and a toy horse just by touch, with his eyes closed?",
        h: "Eyes closed, hand them one and then the other, and ask which animal each one is.",
      },
    ],
    mobility: [
      {
        t: "Can your child walk across a room carrying an object?",
        h: "Hand them a toy at one side of the room and ask them to bring it to you at the other.",
      },
      {
        t: "Does your child walk with his arms down?",
        h: "Watch the arms while they walk — hanging and swinging by the sides, not held up for balance.",
      },
    ],
    language: [
      {
        t: "Does your child say 10 to 25 words?",
        h: "Over a few days, write down every different word you hear them use meaningfully, then count the list.",
        a: true,
      },
      {
        t: "How many words does your child say?",
        h: "Count the list of different words you have heard them use.",
        k: "count",
        u: "words",
      },
      {
        t: "Please give some examples",
        h: "Write down a few of the words.",
        k: "text",
      },
      {
        t: "Does your child use two words together, like “good boy” or “sit down”?",
        h: "Listen for two words joined on purpose, rather than two separate words said one after the other.",
      },
      {
        t: "Please give an example",
        h: "Write down one two-word phrase you have heard.",
        k: "text",
      },
    ],
    hand: [
      {
        t: "Can your child pick up objects between his thumb and forefinger using both hands at the same time?",
        h: "Put small objects on both sides and ask them to pick one up with each hand together.",
      },
    ],
  },

  /* ── Stage VI — Primitive Cortex ────────────────────────────────────────── */
  s6: {
    vision: [
      {
        t: "Does your child know letters?",
        h: "Write a few letters they see often and ask them to name each one.",
      },
      {
        t: "Does your child know numbers?",
        h: "Write a few numerals and ask them to name each one.",
      },
    ],
    auditory: [
      {
        t: "Does your child understand at least 2,000 words?",
        h: "Over a day, notice whether there is anything you say in ordinary conversation that they miss.",
      },
      {
        t: "Does he follow two or three-step instructions?",
        h: "Ask for a chain — 'pick up your cup, put it in the sink, then come here' — without repeating yourself.",
      },
      {
        t: "Please give an example",
        h: "Write down one multi-step instruction they follow.",
        k: "text",
      },
    ],
    tactile: [
      {
        t: "Does your child determine the characteristics of objects by touch alone — hard, soft, fuzzy, sticky?",
        h: "Eyes closed, hand them a stone, some cotton wool and sticky tape, and ask what each one feels like.",
      },
      {
        t: "Can he do so with both hands?",
        h: "Try the same objects again with the other hand.",
      },
    ],
    mobility: [
      {
        t: "Does your child walk in a cross pattern?",
        h: "Watch the opposite arm swing forward with each leg as they walk.",
      },
      {
        t: "Does he run in a cross pattern?",
        h: "Watch for the same opposite arm-and-leg swing while they run.",
      },
      {
        t: "Is his walking and running appropriate for his age?",
        h: "Compare with other children of the same age at the park.",
      },
    ],
    language: [
      {
        t: "Does your child say 2,000 words?",
        h: "In practice this is a child who can say anything they want to say in everyday life without getting stuck for a word.",
      },
      {
        t: "What percentage of what he says can you understand?",
        h: "Think about a normal day and estimate how much of their speech is clear to you.",
        k: "percent",
        u: "%",
      },
      {
        t: "Does he speak consistently in short sentences?",
        h: "Listen for three or more words joined with proper structure, most times they speak — not just occasionally.",
      },
      {
        t: "Please give an example",
        h: "Write down one sentence you have heard them say.",
        k: "text",
      },
    ],
    hand: [
      {
        t: "Can your child unscrew a lid from a bottle?",
        h: "Hand them a closed bottle with a lid that turns easily, and let them work at it.",
      },
      {
        t: "Can your child pour water from a mug into a glass, holding both objects in his hands?",
        h: "Half-fill a mug, give them an empty glass, and watch them pour with one in each hand.",
      },
      {
        t: "If yes, in which hand does he lift the heavier object?",
        h: "Watch which hand takes the full mug and which takes the empty glass.",
        k: "choice",
        ch: ["Left", "Right"],
      },
    ],
  },

  /* ── Stage VII — Sophisticated Cortex ───────────────────────────────────── */
  s7: {
    vision: [
      {
        t: "Does your child read?",
        h: "Give them a page they have not seen before and ask them to read it out to you.",
      },
      {
        t: "How many books can your child read?",
        h: "Count the books they can read through on their own.",
        k: "count",
        u: "books",
      },
      {
        t: "How many sentences can your child read?",
        h: "Count roughly how many written sentences they can read.",
        k: "count",
        u: "sentences",
      },
      {
        t: "How many phrases can your child read?",
        h: "Count roughly how many written phrases they can read.",
        k: "count",
        u: "phrases",
      },
      {
        t: "How many words can your child read?",
        h: "Count roughly how many written words they can read.",
        k: "count",
        u: "words",
      },
      {
        t: "Does your child read at his age level?",
        h: "Compare with a school reader written for their year.",
        min: 72,
      },
    ],
    auditory: [
      {
        t: "Does your child understand all of the vocabulary in his everyday environment, as well as an average six-year-old?",
        h: "Listen to a normal adult conversation around them and see whether they follow it without asking what words mean.",
      },
      {
        t: "Does your child understand at his age level?",
        h: "Compare with what other children in their school year are expected to follow.",
        min: 72,
      },
    ],
    tactile: [
      {
        t: "Can your child tell the “head” from the tail of a coin by touch alone?",
        h: "Eyes closed, place a coin in their hand and ask which side is facing up.",
      },
      {
        t: "Can he do so with both hands?",
        h: "Try the same coin again in the other hand.",
      },
    ],
    mobility: [
      {
        t: "Can your child balance on one foot?",
        h: "Ask them to stand on one leg and count — several seconds without putting the other foot down.",
      },
      {
        t: "Which foot does he prefer?",
        h: "Note which leg they stand on without being told.",
        k: "choice",
        ch: ["Left", "Right"],
      },
      {
        t: "Can your child kick a ball?",
        h: "Roll a ball gently towards them and ask them to kick it back.",
      },
      {
        t: "Which foot does he prefer to kick with?",
        h: "Note which foot they use without being told.",
        k: "choice",
        ch: ["Left", "Right"],
      },
      {
        t: "Is his coordination appropriate for his age?",
        h: "Compare with other children in their school year at running, climbing and ball games.",
        min: 72,
      },
    ],
    language: [
      {
        t: "Does your child speak as well as an average six-year-old?",
        h: "Ask them to explain something that happened — listen for a full account, in order, that a stranger would follow.",
      },
      {
        t: "Does your child speak at his age level?",
        h: "Compare with other children in their school year.",
        min: 72,
      },
    ],
    hand: [
      {
        t: "Does your child write independently?",
        h: "Ask them to write something of their own, without copying and without being told the spelling.",
      },
      {
        t: "How many words can he write?",
        h: "Count roughly how many words they can write unaided.",
        k: "count",
        u: "words",
      },
      {
        t: "Can he write in sentences?",
        h: "Ask them to write about something that happened today, and look for full sentences.",
      },
      {
        t: "With which hand does he write?",
        h: "Note which hand they pick the pencil up with.",
        k: "choice",
        ch: ["Left", "Right"],
      },
      {
        t: "Is his writing equal to other kids his age?",
        h: "Compare with the written work of other children in their school year.",
        min: 72,
      },
    ],
  },
};

function build(): Item[] {
  const items: Item[] = [];
  for (const stage of BRAIN_STAGES) {
    const cell = RAW[stage.id];
    if (!cell) continue;
    for (const [domain, rows] of Object.entries(cell) as [DomainCode, Row[]][]) {
      rows.forEach((row, i) => {
        const source: ItemSource = row.a ? "AUTHORED" : "ACE";
        items.push({
          id: `${stage.id}-${domain}-${String(i + 1).padStart(2, "0")}`,
          domain,
          stage: stage.id,
          text: row.t,
          how: row.h,
          kind: row.k ?? "yesno",
          source,
          ...(row.inv ? { invert: true as const } : {}),
          ...(row.min !== undefined ? { minAgeMonths: row.min } : {}),
          ...(row.ch ? { choices: row.ch } : {}),
          ...(row.u ? { unit: row.u } : {}),
        });
      });
    }
  }
  return items;
}

export const ITEMS: Item[] = build();

const ITEMS_BY_STAGE_DOMAIN = new Map<string, Item[]>();
for (const item of ITEMS) {
  const key = `${item.stage}:${item.domain}`;
  const list = ITEMS_BY_STAGE_DOMAIN.get(key);
  if (list) list.push(item);
  else ITEMS_BY_STAGE_DOMAIN.set(key, [item]);
}

/**
 * Every item for one cell of the chart, in booklet order.
 *
 * `assessedMonths` drops the booklet's "if over six…" questions for a child
 * who is not yet six. Omit it and nothing is filtered, which is what the admin
 * item bank wants.
 */
export function itemsFor(
  stage: string,
  domain: DomainCode,
  assessedMonths?: number,
): Item[] {
  const all = ITEMS_BY_STAGE_DOMAIN.get(`${stage}:${domain}`) ?? [];
  if (assessedMonths === undefined) return all;
  return all.filter(
    (i) => i.minAgeMonths === undefined || assessedMonths >= i.minAgeMonths,
  );
}

/** Only the items that count towards passing a stage. */
export function scoredItemsFor(
  stage: string,
  domain: DomainCode,
  assessedMonths?: number,
): Item[] {
  return itemsFor(stage, domain, assessedMonths).filter((i) => i.kind === "yesno");
}

export const ITEM_BY_ID = new Map(ITEMS.map((i) => [i.id, i]));
