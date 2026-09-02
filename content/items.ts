import type { DomainCode, Item, ItemSource } from "@/lib/types";
import { AGE_BANDS, MODULE_BANDS } from "./domains";

export const BANK_VERSION = "2026.09.01-poc";

/**
 * The milestone item bank.
 *
 * SOURCES AND LICENSING — this matters, please read before adding content.
 *
 *  C  CDC "Learn the Signs. Act Early." milestone checklists (2021 revision),
 *     ages 2mo-5yr. A work of the US federal government, public domain.
 *     https://www.cdc.gov/act-early/milestones/index.html
 *  N  NIDCD / NIH "Your Baby's Hearing and Communicative Development
 *     Checklist". US federal government, public domain.
 *     https://www.nidcd.nih.gov/health/your-babys-hearing-and-communicative-development-checklist
 *  W  WHO Multicentre Growth Reference Study, windows of achievement for six
 *     gross motor milestones (2006). Freely reproducible with attribution.
 *  A  Authored for this project from standard developmental expectations,
 *     covering the vision strand (which the CDC does not break out), the
 *     61-72 month band (past where the CDC checklists stop), and gaps.
 *
 * ASQ-3 and Denver II are commercial licensed instruments. Their items are NOT
 * used here and must not be pasted in. The Trivandrum Development Screening
 * Chart (TDSC 0-6) is the closest validated Indian equivalent and is worth
 * licensing if Kaushalya wants an India-normed instrument — this bank is
 * structured so its items could replace these directly.
 *
 * Wording note: items are phrased so that "yes" is always the developmentally
 * expected answer, and never use "fail", "delay", or "should".
 */

type Row = [text: string, how: string, source: "C" | "N" | "W" | "A"];

const SOURCE_MAP: Record<Row[2], ItemSource> = {
  C: "CDC",
  N: "NIDCD",
  W: "WHO",
  A: "AUTHORED",
};

const RAW: Record<string, Partial<Record<DomainCode, Row[]>>> = {
  // ─── 0–2 months ────────────────────────────────────────────────────────────
  b01: {
    auditory: [
      ["Reacts to loud sounds", "Clap once, out of sight, about a metre away. Look for a blink, a startle, or a pause in movement.", "C"],
      ["Calms down or quietens when you speak to them", "When they are fussing, talk softly near them without picking them up.", "N"],
      ["Recognises your voice and settles when crying", "Speak from just out of view while they are crying and watch for a change.", "N"],
      ["Starts or stops sucking in response to a sound while feeding", "Make a soft sound during a feed and watch their sucking rhythm.", "N"],
    ],
    vision: [
      ["Looks at your face", "Hold your face about 20–25 cm away while they are calm and alert.", "C"],
      ["Watches you as you move", "Walk slowly across their view and see whether their eyes follow you.", "C"],
      ["Looks at a toy for several seconds", "Hold a bright toy still, about 25 cm away.", "C"],
      ["Follows a face or bright toy as you move it slowly side to side", "Move it in a slow arc about 25 cm from their face. Look for the eyes tracking past the middle.", "A"],
    ],
    mobility: [
      ["Holds head up when on tummy", "Place them on their tummy on a firm surface for a minute while they are awake.", "C"],
      ["Moves both arms and both legs equally", "Watch during a nappy change — look for similar movement on both sides.", "C"],
      ["Lifts head briefly when held against your shoulder", "Hold them upright against your shoulder without supporting the head for a moment.", "A"],
    ],
    hand: [
      ["Opens hands briefly", "Watch their hands while they are calm and awake, not crying.", "C"],
      ["Brings a hand towards their mouth", "Watch during a quiet, alert period.", "A"],
      ["Grasps your finger when you place it in their palm", "Press a finger gently into the palm and feel for a grip.", "A"],
    ],
    language: [
      ["Makes sounds other than crying", "Listen during calm, alert times — gurgles, grunts or small vowel sounds.", "C"],
      ["Coos and makes pleasure sounds", "Talk to them face to face and pause to let them answer.", "N"],
      ["Has a different cry for different needs", "Notice whether hungry, tired and uncomfortable cries sound different to you.", "N"],
    ],
    social: [
      ["Calms down when spoken to or picked up", "Try talking first, before picking them up, and see if that alone settles them.", "C"],
      ["Seems happy to see you when you walk up to them", "Approach while they are calm and awake and watch their face and body.", "C"],
      ["Smiles when you talk to them", "Smile and talk face to face, then wait several seconds for a reply.", "C"],
      ["Makes eye contact during feeding or cuddling", "Look for them holding your gaze for a moment.", "A"],
    ],
  },

  // ─── 3–4 months ────────────────────────────────────────────────────────────
  b02: {
    auditory: [
      ["Turns head towards the sound of your voice", "Speak from one side, out of view, about a metre away.", "C"],
      ["Follows sounds with their eyes", "Shake a rattle out of sight, then watch whether their eyes search for it.", "N"],
      ["Responds to changes in the tone of your voice", "Say the same phrase warmly, then firmly, and watch their expression.", "N"],
      ["Notices toys that make sounds", "Offer a rattle or squeaky toy and watch for attention to the sound.", "N"],
    ],
    vision: [
      ["Looks at their own hands with interest", "Watch during a calm, awake period on their back.", "C"],
      ["Follows a moving toy from one side to the other without losing it", "Move a toy slowly through a half circle in front of them.", "A"],
      ["Eyes work together, without one turning in or out most of the time", "Watch their eyes as they look at your face. An occasional drift is normal at this age; a constant turn is worth mentioning to your doctor.", "A"],
      ["Looks at a person across the room", "Have someone stand a few metres away and talk.", "A"],
    ],
    mobility: [
      ["Holds head steady without support when you hold them", "Hold them upright without supporting the head and watch for steadiness.", "C"],
      ["Pushes up onto elbows or forearms when on tummy", "Give them a few minutes of tummy time on a firm surface.", "C"],
      ["Rolls partly onto their side", "Watch during floor play on their back.", "A"],
    ],
    hand: [
      ["Holds a toy when you put it in their hand", "Place a light rattle in the palm and see if they hold on.", "C"],
      ["Uses their arm to swing at toys", "Hold a toy within reach above their chest.", "C"],
      ["Brings hands to mouth", "Watch during a calm, awake period.", "C"],
      ["Brings both hands together in front of their chest", "Watch during floor play on their back.", "A"],
    ],
    language: [
      ["Makes sounds like “oooo” and “aahh” (cooing)", "Talk face to face and pause to let them take a turn.", "C"],
      ["Makes sounds back when you talk to them", "Say something, then wait five seconds without filling the silence.", "C"],
      ["Babbles when excited or unhappy", "Listen during play and during a grumpy moment.", "N"],
      ["Makes gurgling sounds when playing alone or with you", "Listen while they are content on their own.", "N"],
    ],
    social: [
      ["Smiles on their own to get your attention", "Look for a smile they start, not one that answers yours.", "C"],
      ["Chuckles when you try to make them laugh", "Try a gentle tickle or a silly sound.", "C"],
      ["Looks at you, moves, or makes sounds to get or keep your attention", "Turn away mid-play and see whether they try to draw you back.", "C"],
      ["Opens their mouth when they see the breast or bottle, if hungry", "Watch at the start of a feed when they are hungry.", "C"],
    ],
  },

  // ─── 5–6 months ────────────────────────────────────────────────────────────
  b03: {
    auditory: [
      ["Turns to look towards a new sound", "Make a soft sound to one side, out of view.", "N"],
      ["Pays attention to music", "Play a song and watch for stilling, turning, or moving to it.", "N"],
      ["Listens when spoken to and looks at the speaker", "Have someone else talk nearby and watch whether they turn.", "N"],
      ["Notices when a sound stops", "Play music, then stop it suddenly, and watch their reaction.", "A"],
    ],
    vision: [
      ["Reaches accurately for a toy they can see", "Hold a toy within arm's reach and slightly to one side.", "A"],
      ["Looks at themselves in a mirror with interest", "Hold them in front of a mirror for a minute.", "C"],
      ["Follows a dropped object with their eyes", "Drop a soft toy from their eye level and watch whether they look down.", "A"],
      ["Notices small objects, like crumbs on a tray", "Put a few small bits of food on the highchair tray.", "A"],
    ],
    mobility: [
      ["Rolls from tummy to back", "Give them tummy time on a firm, safe surface and watch.", "C"],
      ["Pushes up with straight arms when on tummy", "Watch during tummy time.", "C"],
      ["Leans on their hands to support themselves when sitting", "Sit them on the floor and stay close to catch them.", "C"],
      ["Takes some weight on their legs when held standing", "Hold them under the arms with feet on your lap.", "W"],
    ],
    hand: [
      ["Reaches to grab a toy they want", "Put a favourite toy just within reach.", "C"],
      ["Puts things in their mouth to explore them", "Offer a safe teething toy and watch.", "C"],
      ["Holds a toy in each hand", "Offer a second toy while they already hold one.", "A"],
      ["Passes a toy from one hand to the other", "Offer a toy to one hand and watch what happens next.", "A"],
    ],
    language: [
      ["Takes turns making sounds with you", "Make a sound, wait, and see if they answer before you go again.", "C"],
      ["Blows raspberries", "Do it yourself first and watch whether they copy.", "C"],
      ["Makes squealing noises", "Listen during excited play.", "C"],
      ["Babbles using sounds like p, b and m", "Listen for “ba”, “ma” or “pa” sounds during play.", "N"],
    ],
    social: [
      ["Knows familiar people", "Watch how they respond to you compared with someone they rarely see.", "C"],
      ["Laughs", "Try a game they enjoy, like peek-a-boo.", "C"],
      ["Closes their lips to show they don't want more food", "Offer another spoonful when they seem finished.", "C"],
      ["Shows they are enjoying playing with you", "Watch their face and body during a favourite game.", "A"],
    ],
  },

  // ─── 7–9 months ────────────────────────────────────────────────────────────
  b04: {
    auditory: [
      ["Looks when you call their name", "Call their name once, from behind, in a normal voice.", "C"],
      ["Turns and looks in the direction of sounds", "Make a sound to one side, out of view.", "N"],
      ["Understands words for common things like “cup”, “shoe” or “milk”", "Say the word without pointing and watch whether they look at the object.", "N"],
      ["Enjoys playing peek-a-boo and pat-a-cake", "Play both and watch for anticipation.", "N"],
    ],
    vision: [
      ["Looks for an object when it drops out of sight", "Drop a toy over the edge of the highchair tray.", "C"],
      ["Spots small objects and tries to pick them up", "Put a few small bits of food on the tray.", "A"],
      ["Recognises a familiar person across the room", "Have a familiar person enter and stand a few metres away, quietly.", "A"],
    ],
    mobility: [
      ["Sits without support", "Sit them on the floor and let go, staying close.", "C"],
      ["Gets to a sitting position by themselves", "Watch during floor play, starting from lying or crawling.", "C"],
      ["Rolls both ways", "Watch during floor play over several minutes.", "A"],
      ["Pushes up onto hands and knees, or crawls", "Put a toy just out of reach during floor play.", "W"],
    ],
    hand: [
      ["Moves things from one hand to the other", "Offer a toy to one hand and watch.", "C"],
      ["Bangs two things together", "Give them two blocks or two spoons.", "C"],
      ["Uses fingers to rake food towards themselves", "Put small bits of food on the tray.", "C"],
      ["Picks up a small object between thumb and the side of a finger", "Offer a single small piece of food.", "A"],
    ],
    language: [
      ["Makes a lot of different sounds like “mamamama” and “bababababa”", "Listen during play.", "C"],
      ["Babbles using long and short groups of sounds", "Listen for strings like “tata, upup, bibibi”.", "N"],
      ["Babbles to get and keep your attention", "Turn away mid-play and listen.", "N"],
      ["Copies different speech sounds you make", "Make a simple sound and wait to see whether they try it.", "N"],
    ],
    social: [
      ["Is shy, clingy, or wary around strangers", "Watch how they respond to someone new approaching.", "C"],
      ["Shows several facial expressions — happy, sad, angry, surprised", "Watch across a whole day.", "C"],
      ["Reacts when you leave, by looking, reaching, or crying", "Step out of the room briefly while someone else stays.", "C"],
      ["Lifts their arms up to be picked up", "Stand in front of them and hold out your hands without speaking.", "C"],
    ],
  },

  // ─── 10–12 months ──────────────────────────────────────────────────────────
  b05: {
    auditory: [
      ["Understands “no” — pauses briefly or stops when you say it", "Say it once, calmly, as they reach for something they shouldn't.", "C"],
      ["Responds to simple requests like “come here”", "Say it without gestures and see whether they respond.", "N"],
      ["Turns straight away to a voice from across the room", "Have someone call from a few metres away.", "A"],
      ["Enjoys and responds to simple songs and rhymes", "Sing a familiar song and watch for movement or anticipation.", "N"],
    ],
    vision: [
      ["Looks for things they see you hide, like a toy under a cloth", "Hide a toy under a cloth while they watch.", "C"],
      ["Looks at something across the room that they want", "Watch what they do when a favourite toy is out of reach.", "A"],
      ["Watches a rolling ball and follows where it goes", "Roll a ball slowly past them.", "A"],
    ],
    mobility: [
      ["Pulls up to stand", "Put a toy on a low, stable sofa or table.", "C"],
      ["Walks holding on to furniture", "Set up a safe run of low furniture with a toy at the end.", "C"],
      ["Stands alone for a few seconds", "Let go while they are steady and stay close.", "W"],
      ["Sits down from standing without falling", "Watch during furniture play.", "A"],
    ],
    hand: [
      ["Picks things up between thumb and pointer finger", "Put a few small bits of food on the tray and watch the grip.", "C"],
      ["Puts something into a container, like a block in a cup", "Give them blocks and an open cup and show them once.", "C"],
      ["Drinks from a cup without a lid, as you hold it", "Offer a small open cup at a mealtime.", "C"],
      ["Lets go of an object on purpose", "Hold out your hand and ask for the toy.", "A"],
    ],
    language: [
      ["Calls a parent “mama” or “dada” or another special name", "Listen for it used for the right person, not just as a sound.", "C"],
      ["Waves bye-bye", "Wave as someone leaves and see whether they copy or start it.", "C"],
      ["Has one or two words besides mama and dada", "Think of sounds they use consistently to mean one thing.", "N"],
      ["Communicates with gestures, like waving or holding up their arms", "Watch across a normal morning.", "N"],
    ],
    social: [
      ["Plays games with you, like pat-a-cake", "Start the game and see whether they join in.", "C"],
      ["Shows you a toy, or holds it out to you", "Sit with them during play and watch.", "A"],
      ["Looks at your face to check how you react", "Watch what they do when something surprising happens.", "A"],
    ],
  },

  // ─── 13–15 months ──────────────────────────────────────────────────────────
  b06: {
    auditory: [
      ["Looks at a familiar object when you name it", "Say “where is your cup?” without pointing.", "C"],
      ["Follows a direction given with both a gesture and words", "Hold out your hand and say “give me the toy”.", "C"],
      ["Enjoys simple stories, songs and rhymes", "Read a short picture book and watch their attention.", "N"],
      ["Points to one or two body parts when asked", "Ask “where is your nose?” without pointing yourself.", "N"],
    ],
    vision: [
      ["Points to ask for something across the room", "Watch what they do when they want something out of reach.", "C"],
      ["Looks at pictures in a book", "Sit together with a picture book.", "A"],
      ["Finds a toy hidden under one of two cloths", "Hide it under one while they watch, then offer both.", "A"],
    ],
    mobility: [
      ["Takes a few steps on their own", "Stand a short distance away and hold out your hands.", "C"],
      ["Stands up from the floor without holding on", "Watch during floor play.", "A"],
      ["Bends down to pick up a toy and stands up again", "Put a toy on the floor while they are standing.", "A"],
    ],
    hand: [
      ["Stacks at least two small objects, like blocks", "Build a small tower yourself first, then hand them the blocks.", "C"],
      ["Uses fingers to feed themselves some food", "Offer finger food at a mealtime.", "C"],
      ["Tries to use things the right way, like a phone, cup or book", "Leave safe everyday objects within reach and watch.", "C"],
      ["Puts small objects into a narrow container", "Give them a bottle with a wide neck and some blocks.", "A"],
    ],
    language: [
      ["Tries to say one or two words besides mama or dada", "Listen for attempts like “ba” for ball — it needn't be clear.", "C"],
      ["Picks up new words now and then", "Think about whether their word list has grown this month.", "N"],
      ["Points to ask for something or to get help", "Watch what they do when they need something.", "C"],
      ["Uses several different consonant sounds at the start of words", "Listen for a range of sounds, not just one.", "N"],
    ],
    social: [
      ["Copies other children while playing", "Watch them near another child.", "C"],
      ["Shows you an object they like", "Sit with them during play and watch.", "C"],
      ["Claps when excited", "Watch during a game they enjoy.", "C"],
      ["Shows affection — hugs, cuddles or kisses", "Watch across a normal day.", "C"],
      ["Hugs a doll or soft toy", "Leave one within reach during play.", "C"],
    ],
  },

  // ─── 16–18 months ──────────────────────────────────────────────────────────
  b07: {
    auditory: [
      ["Follows a one-step direction without any gestures", "Say “give it to me” with your hands by your sides.", "C"],
      ["Points to pictures in a book when you name them", "Ask “where is the dog?” on a familiar page.", "N"],
      ["Understands simple questions like “where is your shoe?”", "Ask without pointing and watch where they look.", "N"],
      ["Comes when you call them from another room", "Call once, in a normal voice.", "A"],
    ],
    vision: [
      ["Points to show you something interesting", "Watch for pointing that shares rather than requests.", "C"],
      ["Looks at a few pages in a book with you", "Read together and watch how long they stay with it.", "C"],
      ["Notices when two objects are the same", "Put out two identical objects and one different one.", "A"],
    ],
    mobility: [
      ["Walks without holding on to anyone or anything", "Watch them cross a room.", "C"],
      ["Climbs on and off a sofa or chair without help", "Watch during play, staying close.", "C"],
      ["Walks fast, or runs a few steps", "Watch in an open, safe space.", "A"],
    ],
    hand: [
      ["Scribbles", "Give them a chunky crayon and paper and show them once.", "C"],
      ["Drinks from a cup without a lid, and may spill sometimes", "Offer an open cup at a mealtime.", "C"],
      ["Feeds themselves with their fingers", "Offer finger food.", "C"],
      ["Tries to use a spoon", "Offer a spoon with a thick food like porridge.", "C"],
    ],
    language: [
      ["Tries to say three or more words besides mama or dada", "Count the words they use consistently, even if unclear.", "C"],
      ["Names a familiar object when asked what it is", "Point at a cup or ball and ask “what's this?”", "A"],
      ["Shakes their head or says “no” to refuse", "Offer something you know they don't want.", "A"],
    ],
    social: [
      ["Moves away from you but looks back to check you are close", "Watch at a park or in a large room.", "C"],
      ["Puts their hands out for you to wash them", "Watch at the usual hand-washing moment.", "C"],
      ["Helps you dress them by pushing an arm through a sleeve or lifting a foot", "Watch during dressing.", "C"],
      ["Copies you doing chores, like sweeping", "Do a household task nearby and watch.", "C"],
      ["Plays with toys in a simple way, like pushing a toy car", "Watch during independent play.", "C"],
    ],
  },

  // ─── 19–24 months ──────────────────────────────────────────────────────────
  b08: {
    auditory: [
      ["Points to at least two body parts when you ask", "Ask for two, one at a time, without pointing yourself.", "C"],
      ["Points to things in a book when you ask, like “where is the bear?”", "Use a familiar book.", "C"],
      ["Follows a simple instruction called from another room", "Ask them to bring you something, once.", "A"],
      ["Sits and listens to a short story", "Read a short picture book and watch their attention.", "A"],
    ],
    vision: [
      ["Plays with more than one toy at the same time, like putting toy food on a plate", "Watch during independent play.", "C"],
      ["Matches objects of the same colour or shape", "Put out two red and two blue blocks and ask them to find the same.", "A"],
      ["Looks closely at small pictures in a book", "Use a busy picture book and ask them to find something.", "A"],
    ],
    mobility: [
      ["Runs", "Watch in an open, safe space.", "C"],
      ["Kicks a ball", "Put a ball at their feet and show them once.", "C"],
      ["Walks up a few stairs, with or without help", "Watch on a staircase, staying close.", "C"],
      ["Squats down to play and stands up again without using hands", "Put a toy on the floor while they stand.", "A"],
    ],
    hand: [
      ["Eats with a spoon", "Offer a spoon at a mealtime and watch how much reaches the mouth.", "C"],
      ["Holds something in one hand while using the other, like taking a lid off", "Give them a container with a loose lid.", "C"],
      ["Tries to use switches, knobs or buttons on a toy", "Offer a toy with buttons.", "C"],
      ["Stacks four or more blocks into a tower", "Build one yourself first, then give them 6–8 blocks and two or three tries.", "A"],
    ],
    language: [
      ["Says at least two words together, like “more milk”", "Listen across a normal day.", "C"],
      ["Uses gestures beyond waving and pointing, like blowing a kiss or nodding", "Watch across a normal day.", "C"],
      ["Uses one- or two-word questions like “where kitty?”", "Listen for a rising, questioning tone.", "N"],
      ["Uses about twenty or more words", "Try listing them — most parents are surprised either way.", "A"],
    ],
    social: [
      ["Notices when others are hurt or upset", "Watch their face when someone cries nearby.", "C"],
      ["Looks at your face to see how to react in a new situation", "Watch in an unfamiliar place.", "C"],
      ["Plays alongside other children", "Watch at a park or playgroup.", "A"],
    ],
  },

  // ─── 25–30 months ──────────────────────────────────────────────────────────
  b09: {
    auditory: [
      ["Follows two-step instructions like “put the toy down and close the door”", "Say it once, without gestures.", "C"],
      ["Names things in a book when you point and ask “what is this?”", "Use a familiar picture book.", "C"],
      ["Listens to a short story all the way to the end", "Read a short book and watch whether they stay with it.", "A"],
      ["Hears you when you call from another room", "Call once, in a normal voice, with no other noise.", "N"],
    ],
    vision: [
      ["Shows they know at least one colour", "Ask “which one is red?” with a red and a blue crayon out.", "C"],
      ["Turns book pages one at a time", "Read together and let them turn.", "C"],
      ["Fits simple shapes into a shape sorter or puzzle", "Offer a shape sorter and let them try without help.", "A"],
    ],
    mobility: [
      ["Jumps off the ground with both feet", "Show them once and ask them to try.", "C"],
      ["Walks up stairs putting both feet on each step", "Watch on a staircase, staying close.", "A"],
      ["Throws a ball forwards", "Hand them a ball and ask them to throw it to you.", "A"],
      ["Stands on one foot for a moment while holding on", "Show them, then let them try holding a chair.", "A"],
    ],
    hand: [
      ["Uses hands to twist things, like doorknobs or unscrewing lids", "Give them a jar with a loose lid.", "C"],
      ["Takes some clothes off by themselves, like loose trousers or an open jacket", "Watch at bath time.", "C"],
      ["Solves a simple problem, like standing on a stool to reach something", "Put something they want slightly out of reach, safely.", "C"],
      ["Uses things to pretend, like feeding a block to a doll as if it were food", "Watch during independent play.", "C"],
    ],
    language: [
      ["Says about fifty words", "You needn't count exactly — is it dozens rather than a handful?", "C"],
      ["Says two or more words together with an action word, like “doggie run”", "Listen across a normal day.", "C"],
      ["Uses words like “I”, “me” or “we”", "Listen across a normal day.", "C"],
      ["Speaks so that family members understand them", "Think about whether you need to translate for grandparents.", "N"],
    ],
    social: [
      ["Plays next to other children and sometimes with them", "Watch at a park or playgroup.", "C"],
      ["Shows you what they can do — “look at me!”", "Watch during play.", "C"],
      ["Follows simple routines when told, like helping to pick up toys", "Ask at the usual tidy-up moment.", "C"],
    ],
  },

  // ─── 31–36 months ──────────────────────────────────────────────────────────
  b10: {
    auditory: [
      ["Answers simple “who”, “what” and “where” questions", "Ask about something happening right now.", "N"],
      ["Listens to a story and answers a simple question about it", "Read a short book, then ask what happened.", "A"],
      ["Hears the television at the same volume as everyone else", "Notice whether they ask for it louder than others need.", "N"],
    ],
    vision: [
      ["Draws a circle when you show them how", "Draw one yourself, then give them the crayon.", "C"],
      ["Completes a simple three or four piece puzzle", "Offer a chunky wooden puzzle.", "A"],
      ["Notices small differences between two pictures", "Use a spot-the-difference picture book.", "A"],
    ],
    mobility: [
      ["Runs and changes direction without falling", "Watch in an open, safe space.", "A"],
      ["Pedals a tricycle", "Offer a tricycle sized for them.", "A"],
      ["Walks up stairs one foot per step", "Watch on a staircase, staying close.", "A"],
      ["Stands on one foot for a second or two without holding on", "Show them, then let them try.", "A"],
    ],
    hand: [
      ["Strings items together, like large beads or macaroni", "Offer large beads and a stiff lace.", "C"],
      ["Puts on some clothes by themselves, like loose trousers or a jacket", "Watch during dressing and don't help too early.", "C"],
      ["Uses a fork", "Offer a fork with food that needs spearing.", "C"],
      ["Snips paper with child-safe scissors", "Offer safety scissors and a strip of paper, supervised.", "A"],
    ],
    language: [
      ["Talks with you using at least two back-and-forth exchanges", "Start a conversation and count the turns.", "C"],
      ["Asks “who”, “what”, “where” or “why” questions", "Listen across a normal day.", "C"],
      ["Says what is happening in a picture, like “running” or “eating”", "Point at a picture and ask what's happening.", "C"],
      ["Says their first name when asked", "Ask “what's your name?”", "C"],
      ["Talks well enough for others to understand, most of the time", "Think about whether someone outside the family follows them.", "C"],
    ],
    social: [
      ["Calms down within ten minutes after you leave, such as at a childcare drop-off", "Ask the staff how long it takes.", "C"],
      ["Notices other children and joins them to play", "Watch at a park or playgroup.", "C"],
      ["Takes turns in a simple game, with a reminder", "Play a simple turn-taking game.", "A"],
    ],
  },

  // ─── 37–48 months ──────────────────────────────────────────────────────────
  b11: {
    auditory: [
      ["Pays attention to a short story and answers simple questions about it", "Read a story, then ask two questions about it.", "N"],
      ["Follows a three-step instruction", "Say all three at once, then watch.", "A"],
      ["Hears and understands most of what is said at home", "Notice how often you repeat yourself.", "N"],
    ],
    vision: [
      ["Draws a person with three or more body parts", "Ask them to draw a person and count the parts.", "C"],
      ["Names a few colours of items", "Point at things around the room and ask.", "C"],
      ["Copies a simple shape like a cross or a square", "Draw one, then ask them to copy it.", "A"],
    ],
    mobility: [
      ["Catches a large ball most of the time", "Throw a large soft ball gently from about two metres.", "C"],
      ["Stands on one foot for about five seconds", "Show them, then count out loud while they try.", "A"],
      ["Avoids danger, like not jumping from tall heights at a playground", "Watch at a playground.", "C"],
      ["Climbs playground equipment confidently", "Watch at a playground.", "A"],
    ],
    hand: [
      ["Holds a crayon or pencil between fingers and thumb, not in a fist", "Watch the grip while they draw.", "C"],
      ["Unbuttons some buttons", "Watch during dressing.", "C"],
      ["Serves themselves food or pours water, with you supervising", "Offer a small, light jug at a mealtime.", "C"],
      ["Cuts along a line with child-safe scissors", "Draw a straight line and offer safety scissors, supervised.", "A"],
    ],
    language: [
      ["Says sentences with four or more words", "Listen across a normal day.", "C"],
      ["Talks about at least one thing that happened during their day", "Ask what they did today and wait.", "C"],
      ["Answers simple questions like “what is a coat for?”", "Ask about two or three everyday objects.", "C"],
      ["Says some words from a song, story or rhyme", "Start a familiar rhyme and pause.", "C"],
      ["Speaks smoothly, without repeating syllables or words", "Listen during a longer stretch of talking.", "N"],
    ],
    social: [
      ["Pretends to be something else during play — a teacher, a superhero, an animal", "Watch during free play.", "C"],
      ["Asks to go and play with other children when none are around", "Listen across a normal week.", "C"],
      ["Comforts others who are hurt or sad", "Watch when someone nearby is upset.", "C"],
      ["Likes to be a helper", "Offer a small task and watch their response.", "C"],
      ["Behaves differently depending on where they are, like a library or a playground", "Watch across different places.", "C"],
    ],
  },

  // ─── 49–60 months ──────────────────────────────────────────────────────────
  b12: {
    auditory: [
      ["Answers simple questions about a book or story after you read it", "Read a short story, then ask about it.", "C"],
      ["Keeps a conversation going with more than three back-and-forth exchanges", "Start a chat and count the turns.", "C"],
      ["Uses or recognises simple rhymes, like bat–cat or ball–tall", "Say a word and ask for one that rhymes.", "C"],
      ["Follows instructions given to a whole group, not only to them", "Watch at school, or give an instruction to several children.", "A"],
    ],
    vision: [
      ["Names some letters when you point to them", "Point at letters in a familiar book.", "C"],
      ["Names some numbers between 1 and 5 when you point to them", "Write them out and point.", "C"],
      ["Writes some letters in their name", "Ask them to write their name.", "C"],
      ["Copies a triangle", "Draw one, then ask them to copy it.", "A"],
    ],
    mobility: [
      ["Hops on one foot", "Show them, then ask them to try.", "C"],
      ["Walks down stairs one foot per step without holding on", "Watch on a staircase, staying close.", "A"],
      ["Skips or gallops", "Show them, then ask them to try.", "A"],
      ["Balances on one foot for about ten seconds", "Count out loud while they try.", "A"],
    ],
    hand: [
      ["Buttons some buttons", "Watch during dressing.", "C"],
      ["Counts to ten", "Ask them to count out loud.", "C"],
      ["Draws a person with at least six body parts", "Ask for a drawing and count the parts.", "A"],
      ["Cuts out a simple shape with scissors", "Draw a large circle and offer safety scissors, supervised.", "A"],
    ],
    language: [
      ["Tells a story they heard or made up, with at least two events", "Ask them to tell you a story.", "C"],
      ["Uses sentences that give many details", "Listen when they describe something that happened.", "N"],
      ["Tells stories that stay on topic", "Listen for whether the thread holds.", "N"],
      ["Says most sounds correctly, except perhaps l, s, r, v, z, ch, sh and th", "Listen during a longer stretch of talking.", "N"],
      ["Uses words about time, like yesterday, tomorrow, morning or night", "Ask what they did yesterday.", "C"],
    ],
    social: [
      ["Follows rules or takes turns when playing games with other children", "Watch a board game or a playground game.", "C"],
      ["Sings, dances or performs for you", "Watch across a normal week.", "C"],
      ["Does simple chores at home, like matching socks or clearing the table", "Ask for help with one small job.", "C"],
      ["Pays attention for five to ten minutes during an activity", "Time a story or a craft activity. Screen time doesn't count.", "C"],
    ],
  },

  // ─── 61–72 months ──────────────────────────────────────────────────────────
  // Past where the CDC checklists stop. Authored from standard school
  // readiness expectations — this band in particular should be reviewed by
  // Kaushalya's child development lead before use.
  b13: {
    auditory: [
      ["Follows a three-step instruction given only once", "Give all three steps, then don't repeat them.", "A"],
      ["Listens to a ten-minute story and retells the main events", "Read a longer story, then ask them to tell it back.", "A"],
      ["Picks out the first sound in a spoken word, like the “b” in “ball”", "Say a word and ask what sound it starts with.", "A"],
      ["Follows classroom-style instructions given to a group", "Ask their teacher, or watch in a group setting.", "A"],
    ],
    vision: [
      ["Recognises and names most letters of the alphabet", "Point at letters out of order.", "A"],
      ["Copies a diamond or another complex shape", "Draw one, then ask them to copy it.", "A"],
      ["Sorts objects by two features at once, like big red buttons", "Mix buttons of two sizes and two colours and ask for one group.", "A"],
      ["Recognises a few familiar written words, like their own name", "Write their name among two others and ask them to find it.", "A"],
    ],
    mobility: [
      ["Skips smoothly on alternating feet", "Watch in an open space.", "A"],
      ["Rides a bicycle, with or without training wheels", "Watch in a safe open space.", "A"],
      ["Catches a small ball with their hands only, not against their chest", "Throw a tennis-sized ball gently from two metres.", "A"],
      ["Balances on one foot with eyes closed for a few seconds", "Show them, then count while they try.", "A"],
    ],
    hand: [
      ["Writes their own first name without help", "Ask them to write it, without a copy to look at.", "A"],
      ["Ties a knot, or is trying shoelaces", "Offer a lace and watch.", "A"],
      ["Draws a person with a head, body, arms, legs and a face", "Ask for a drawing of someone in the family.", "A"],
      ["Counts ten or more objects accurately, touching each one", "Put out twelve small objects and ask how many.", "A"],
      ["Cuts out a shape neatly with scissors", "Draw a simple shape and offer scissors, supervised.", "A"],
    ],
    language: [
      ["Tells a story with a clear beginning, middle and end", "Ask them to tell you about a film or their day.", "A"],
      ["Uses full sentences with correct grammar most of the time", "Listen during a longer conversation.", "A"],
      ["Explains why something happened, using “because”", "Ask why about something that just happened.", "A"],
      ["Asks what an unfamiliar word means", "Use a word they won't know and see whether they ask.", "A"],
      ["Is understood by people outside the family all of the time", "Ask someone who doesn't know them well.", "A"],
    ],
    social: [
      ["Plays cooperatively in a group and sorts out small disagreements", "Watch during group play.", "A"],
      ["Separates from you without distress at school", "Ask their teacher about drop-off.", "A"],
      ["Waits their turn and follows game rules without reminders", "Play a board game with two or more children.", "A"],
      ["Describes how they are feeling in words", "Ask how they felt about something that happened.", "A"],
      ["Shows care for a younger child or a pet", "Watch across a normal week.", "A"],
    ],
  },
};

function build(): Item[] {
  const items: Item[] = [];
  for (const band of AGE_BANDS) {
    const cell = RAW[band.id];
    if (!cell) continue;
    for (const [domain, rows] of Object.entries(cell) as [DomainCode, Row[]][]) {
      rows.forEach(([text, how, source], i) => {
        items.push({
          id: `${band.id}-${domain}-${String(i + 1).padStart(2, "0")}`,
          domain,
          band: band.id,
          text,
          how,
          source: SOURCE_MAP[source],
        });
      });
    }
  }
  return items;
}

export const ITEMS: Item[] = build();

export const ITEMS_BY_BAND_DOMAIN = new Map<string, Item[]>(
  (() => {
    const m = new Map<string, Item[]>();
    for (const item of ITEMS) {
      const key = `${item.band}:${item.domain}`;
      const list = m.get(key);
      if (list) list.push(item);
      else m.set(key, [item]);
    }
    return m;
  })(),
);

export function itemsFor(band: string, domain: DomainCode): Item[] {
  return ITEMS_BY_BAND_DOMAIN.get(`${band}:${domain}`) ?? [];
}

/**
 * The fixed question set for one section (domain) of one module — every
 * band that module covers, in age order, with no duplicates. This is what
 * the assessment actually asks: deterministic per child age, never adaptive.
 */
export function itemsForModule(moduleId: number, domain: DomainCode): Item[] {
  const bands = MODULE_BANDS[moduleId] ?? [];
  return bands.flatMap((b) => itemsFor(b.id, domain));
}

export const ITEM_BY_ID = new Map(ITEMS.map((i) => [i.id, i]));
