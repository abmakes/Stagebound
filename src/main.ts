import './style.css'
import type {
  AudienceMood,
  AudienceWho,
  DeliverySlot,
  EmotionId,
  EyesId,
  MetaState,
  PauseId,
  ToneId,
  VolumeId,
} from './data/types'
import { CHAPTERS, CURRICULUM_UNITS, ALL_CHAPTERS, SKILL_LABELS, getChapter, unitForChapter } from './data/curriculum'
import {
  EMOTION_LABELS,
  GESTURE_LABELS,
  TONE_LABELS,
  VOLUME_LABELS,
  PAUSE_LABELS,
  EYES_LABELS,
  STANCE_LABELS,
  CODEX,
} from './data/codex'
import { SKILL_EDGES, SKILL_NODES, getSkillNode, skillNodeState } from './data/skillTree'
import { unlockedGestures, unlockedStances, codexIdsForSkill } from './data/unlockOptions'
import { pickTrainSet, type TrainQuestion } from './data/training'
import {
  ensureBoardEnrollment,
  leaveBoard,
  leaveAndRemoveFromBoard,
  loadBoardProfile,
  loadBoardAsync,
  postToBoard,
  rejoinBoard,
  saveBoardProfile,
  syncScoreIfJoined,
  type BoardEntry,
  type BoardLoadResult,
} from './game/leaderboard'
import { computeStageboundScore } from './game/scoreboard'
import { getCutscene, type CutsceneId } from './game/cutscenes'
import {
  ENERGY_MAX,
  addEnergy,
  applyRunResult,
  buySkill,
  canPlayChapter,
  currentChapter,
  dismissLesson,
  isAudienceCured,
  loadMeta,
  markEndingCutsceneSeen,
  markIntroSeen,
  markThawCutsceneSeen,
  mcDisplayName,
  recordQuizResult,
  refreshEnergy,
  resetMeta,
  saveMeta,
  setPlayerAvatar,
  setPlayerName,
  spendEnergy,
  spendSkillPointsForEnergy,
} from './game/meta'
import type { PlayerAvatar } from './data/types'
import { expectedFor } from './game/scoring'
import {
  advanceAfterFeedback,
  audienceMood,
  currentTurn,
  goBackStep,
  selectDelivery,
  selectSentence,
  startChapterRun,
  submitCurrent,
  totalTurns,
  type RunState,
} from './game/runEngine'

type Screen =
  | 'intro'
  | 'cutscene'
  | 'hub'
  | 'lesson'
  | 'skills'
  | 'train'
  | 'codex'
  | 'run'
  | 'result'
  | 'board'
  | 'score'

const AUDIENCE_ORDER: AudienceWho[] = ['oldman', 'woman', 'girl']

/** Intro steps: 0 avatar, 1 name, 2 skills tip (VN story is a separate cutscene) */
const INTRO_SKILLS_STEP = 2

const ART = {
  player: {
    boy: '/art/player-speaker-boy.png',
    girl: '/art/player-speaker-girl.png',
  },
  /** Three distinct people × mood. `happy` reuses engaged art. */
  audience: {
    oldman: {
      cheer: '/art/aud-oldman-cheer.png',
      happy: '/art/aud-oldman-engaged.png',
      engaged: '/art/aud-oldman-engaged.png',
      bored: '/art/aud-oldman-bored.png',
      confused: '/art/aud-oldman-confused.png',
      afflicted: '/art/aud-oldman-afflicted.png',
    },
    woman: {
      cheer: '/art/aud-woman-cheer.png',
      happy: '/art/aud-woman-engaged.png',
      engaged: '/art/aud-woman-engaged.png',
      bored: '/art/aud-woman-bored.png',
      confused: '/art/aud-woman-confused.png',
      afflicted: '/art/aud-woman-afflicted.png',
    },
    girl: {
      cheer: '/art/aud-girl-cheer.png',
      happy: '/art/aud-girl-engaged.png',
      engaged: '/art/aud-girl-engaged.png',
      bored: '/art/aud-girl-bored.png',
      confused: '/art/aud-girl-confused.png',
      afflicted: '/art/aud-girl-afflicted.png',
    },
  },
} as const

function playerSrc(avatar: PlayerAvatar): string {
  return ART.player[avatar]
}

/** Clamp shared mood per person: uncured cannot cheer; cured never show afflicted. */
function portraitMood(who: AudienceWho, mood: AudienceMood): AudienceMood {
  const cured = isAudienceCured(meta.audienceCure, who)
  if (!cured) {
    // Boredom really has them until you cure their chapter.
    // Only high crowd energy nudges them from afflicted -> bored -> confused.
    if (mood === 'cheer' || mood === 'happy') return 'confused'
    if (mood === 'engaged') return 'bored'
    return 'afflicted'
  }
  if (mood === 'afflicted') return 'bored'
  return mood
}

function audienceSrc(who: AudienceWho, mood: AudienceMood): string {
  return ART.audience[who][mood]
}

function crowdCaption(mood: AudienceMood): string {
  switch (mood) {
    case 'cheer':
      return 'The crowd loves this!'
    case 'happy':
      return 'They are with you…'
    case 'engaged':
      return 'Hanging on every word'
    case 'bored':
      return 'They look bored…'
    case 'confused':
      return 'They look confused…'
    case 'afflicted':
      return 'Boredom has them…'
  }
}

const app = document.querySelector<HTMLDivElement>('#app')!

let meta: MetaState = refreshEnergy(loadMeta())
let screen: Screen = meta.seenIntro
  ? meta.pendingLessonChapterId
    ? 'lesson'
    : 'hub'
  : 'intro'
let lessonChapterId = meta.pendingLessonChapterId || CHAPTERS[0].id
let run: RunState | null = null
let introStep = 0
let activeCutsceneId: CutsceneId | null = null
let cutsceneStep = 0
let cutsceneReturnScreen: Screen = 'hub'
let trainQuiz: TrainQuestion[] = []
let trainIndex = 0
let trainCorrect = 0
let trainEnergyAwarded = false
let trainOnMenu = false
let selectedSkill: import('./data/types').SkillId | null = null
const boardProfile = loadBoardProfile()
let boardClassCode = boardProfile.classCode
let boardNickname = boardProfile.nickname || ''
let boardJoined = boardProfile.joined
let boardCache: BoardEntry[] = []
let boardSource: BoardLoadResult['source'] = 'local'
let boardConfigured = false
let boardStatus = ''
let boardLoading = false
let boardNeedsRefresh = true
let lastBoardSyncNote = ''
/** Codex entries to highlight when opened from skill tree */
let codexFocusIds: string[] = []
let nameDraft = ''
/** Optional curriculum unit expand override (otherwise current stage's unit) */
let hubExpandUnit: string | null = null

// Existing saves: put named players on the board unless they left
if (!boardJoined && !boardProfile.optedOut && meta.playerName && meta.playerName !== 'MC') {
  const enrolled = ensureBoardEnrollment(meta.playerName, boardClassCode)
  boardNickname = enrolled.nickname
  boardClassCode = enrolled.classCode
  boardJoined = enrolled.joined
}

function persistBoardIdentity(nickname: string, classCode: string, joined = true): void {
  boardNickname = nickname.trim().slice(0, 20)
  boardClassCode = (classCode.trim().toUpperCase() || 'WORLD2').slice(0, 32)
  boardJoined = joined && !!boardNickname
  if (joined) {
    saveBoardProfile({
      nickname: boardNickname,
      classCode: boardClassCode,
      joined: boardJoined,
      optedOut: false,
    })
  } else {
    const left = leaveBoard()
    boardNickname = left.nickname
    boardClassCode = left.classCode
    boardJoined = false
  }
}

function enrollOnBoard(name: string): void {
  const profile = ensureBoardEnrollment(name, boardClassCode || 'WORLD2')
  boardNickname = profile.nickname
  boardClassCode = profile.classCode
  boardJoined = profile.joined
}

function applyBoardResult(result: BoardLoadResult, okMessage?: string): void {
  boardCache = result.entries
  boardSource = result.source
  boardConfigured = result.configured
  if (result.error) {
    boardStatus = result.error
  } else if (okMessage) {
    boardStatus = okMessage
  } else if (result.source === 'cloud') {
    boardStatus = 'Live class board'
  } else {
    boardStatus = 'Scores on this device only'
  }
}

async function refreshBoard(classCode = boardClassCode): Promise<void> {
  boardLoading = true
  boardStatus = 'Loading class board…'
  const result = await loadBoardAsync(classCode)
  applyBoardResult(result)
  boardLoading = false
  boardNeedsRefresh = false
}

async function pushLiveScore(nickname = boardNickname): Promise<BoardLoadResult | null> {
  const s = computeStageboundScore(meta)
  const score = Math.max(s.total, meta.bestStageboundScore)
  if (score <= 0 && meta.chaptersCleared.length === 0) return null

  const name = (nickname || meta.playerName || '').trim()
  if (!name) return null

  const result = await postToBoard({
    nickname: name,
    classCode: boardClassCode,
    score,
    accuracy: s.qualityPct,
    finalsAvg: s.finalsPct,
    chaptersCleared: meta.chaptersCleared.length,
  })
  persistBoardIdentity(name, boardClassCode, true)
  applyBoardResult(
    result,
    result.source === 'cloud' ? 'Score posted to the class board!' : undefined,
  )
  lastBoardSyncNote =
    result.source === 'cloud'
      ? `Board updated · ${score}`
      : result.error || 'Saved on this device'
  return result
}

async function autoSyncAfterWin(): Promise<void> {
  if (!boardJoined && !(boardNickname || meta.playerName)) return
  const s = computeStageboundScore(meta)
  const result = await syncScoreIfJoined({
    score: Math.max(s.total, meta.bestStageboundScore),
    accuracy: s.accuracyPct,
    finalsAvg: s.finalsPct,
    chaptersCleared: meta.chaptersCleared.length,
    fallbackName: boardNickname || meta.playerName,
  })
  if (!result) return
  applyBoardResult(result)
  lastBoardSyncNote =
    result.source === 'cloud'
      ? `Class board updated · ${Math.max(s.total, meta.bestStageboundScore)}`
      : result.error || 'Score saved on this device'
}

function openBoard(): void {
  screen = 'board'
  boardNeedsRefresh = true
  render()
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function startCutscene(id: CutsceneId, returnScreen: Screen): void {
  activeCutsceneId = id
  cutsceneStep = 0
  cutsceneReturnScreen = returnScreen
  if (id === 'thaw') meta = markThawCutsceneSeen(meta)
  if (id === 'ending') meta = markEndingCutsceneSeen(meta)
  screen = 'cutscene'
  render()
}

function finishCutscene(): void {
  const id = activeCutsceneId
  activeCutsceneId = null
  cutsceneStep = 0
  if (id === 'intro') {
    introStep = INTRO_SKILLS_STEP
    screen = 'intro'
    render()
    return
  }
  const next = cutsceneReturnScreen
  cutsceneReturnScreen = 'hub'
  screen = next
  render()
}

function render(): void {
  meta = refreshEnergy(meta)
  app.innerHTML = ''
  const root = el(
    'div',
    screen === 'cutscene' ? 'app-shell cutscene-shell' : 'app-shell',
  )
  if (screen !== 'intro' && screen !== 'cutscene') root.append(renderHeader())
  if (screen === 'intro') root.append(renderIntro())
  else if (screen === 'cutscene' && activeCutsceneId) root.append(renderCutscene())
  else if (screen === 'hub') root.append(renderHub())
  else if (screen === 'lesson') root.append(renderLesson())
  else if (screen === 'skills') root.append(renderSkills())
  else if (screen === 'train') root.append(renderTrain())
  else if (screen === 'codex') root.append(renderCodex())
  else if (screen === 'board') root.append(renderBoard())
  else if (screen === 'score') root.append(renderScore())
  else if (screen === 'run' && run) root.append(renderRun())
  else if (screen === 'result' && run?.result) root.append(renderResult())
  else root.append(renderHub())
  app.append(root)
}

function renderHeader(): HTMLElement {
  const header = el('header', 'top-bar')
  const brand = el('button', 'brand', 'Stagebound')
  brand.type = 'button'
  brand.addEventListener('click', () => {
    screen = 'hub'
    run = null
    render()
  })
  const chips = el('div', 'hud-chips')
  chips.append(el('span', 'chip', `Lv ${meta.playerLevel}`))
  chips.append(el('span', 'chip gold', `${meta.skillPoints} SP`))
  chips.append(el('span', 'chip energy', `⚡ ${meta.energy}`))
  header.append(brand, chips)
  return header
}

function renderIntro(): HTMLElement {
  const main = el('main', 'intro-screen')

  // Step 0: choose boy or girl
  if (introStep === 0) {
    const stage = el('section', 'intro-stage visual-pick')
    stage.append(el('div', 'curtain left', ''))
    stage.append(el('div', 'curtain right', ''))
    stage.append(el('div', 'intro-spotlight', ''))
    const art = el('div', 'intro-art')
    const pickRow = el('div', 'avatar-pick-row')
    for (const avatar of ['boy', 'girl'] as PlayerAvatar[]) {
      const card = el('button', `avatar-card ${meta.playerAvatar === avatar ? 'selected' : ''}`)
      card.type = 'button'
      const img = el('img', 'avatar-pick-img') as HTMLImageElement
      img.src = playerSrc(avatar)
      img.alt = avatar === 'boy' ? 'Boy MC' : 'Girl MC'
      card.append(img)
      card.append(el('span', 'avatar-pick-label', avatar === 'boy' ? 'Boy' : 'Girl'))
      card.addEventListener('click', () => {
        meta = setPlayerAvatar(meta, avatar)
        render()
      })
      pickRow.append(card)
    }
    art.append(pickRow)
    stage.append(art)

    const copy = el('div', 'intro-copy pop-in')
    copy.append(el('p', 'eyebrow', 'Welcome to Stagebound'))
    copy.append(el('h1', '', 'Choose your MC'))
    copy.append(
      el('p', 'lead', 'Pick who stands on stage in Ha Long Bay. You will speak as the MC.'),
    )
    const next = el('button', 'btn primary big', 'Continue')
    next.type = 'button'
    next.addEventListener('click', () => {
      introStep = 1
      render()
    })
    copy.append(next)
    main.append(stage, copy)
    return main
  }

  // Step 1: enter name → then intro cutscene
  if (introStep === 1) {
    const stage = el('section', 'intro-stage visual-pick')
    stage.append(el('div', 'curtain left', ''))
    stage.append(el('div', 'curtain right', ''))
    stage.append(el('div', 'intro-spotlight', ''))
    const art = el('div', 'intro-art')
    const wrap = el('div', 'intro-player-wrap')
    const img = el('img', 'intro-player float-in') as HTMLImageElement
    img.src = playerSrc(meta.playerAvatar)
    img.alt = 'Your MC'
    wrap.append(img)
    art.append(wrap)
    stage.append(art)

    const copy = el('div', 'intro-copy pop-in')
    copy.append(el('p', 'eyebrow', 'Your stage name'))
    copy.append(el('h1', '', 'What should we call you?'))
    copy.append(el('p', 'lead', 'You will appear as MC — your name on the tour.'))
    const input = document.createElement('input')
    input.className = 'name-input'
    input.type = 'text'
    input.maxLength = 24
    input.placeholder = 'Your first name'
    input.value = nameDraft || (meta.playerName && meta.playerName !== 'MC' ? meta.playerName : '')
    input.autocomplete = 'given-name'
    copy.append(input)

    const actions = el('div', 'hub-actions')
    const back = el('button', 'btn ghost', 'Back')
    back.type = 'button'
    back.addEventListener('click', () => {
      nameDraft = input.value
      introStep = 0
      render()
    })
    const next = el('button', 'btn primary big', 'Continue')
    next.type = 'button'
    next.addEventListener('click', () => {
      nameDraft = input.value.trim()
      if (!nameDraft) {
        input.focus()
        input.classList.add('shake')
        return
      }
      meta = setPlayerName(meta, nameDraft)
      enrollOnBoard(nameDraft)
      startCutscene('intro', 'intro')
    })
    actions.append(back, next)
    copy.append(actions)
    main.append(stage, copy)
    queueMicrotask(() => input.focus())
    return main
  }

  // Step 2: skills / energy tip after intro cutscene
  const stage = el('section', 'intro-stage visual-progress')
  stage.append(el('div', 'curtain left', ''))
  stage.append(el('div', 'curtain right', ''))
  stage.append(el('div', 'intro-spotlight', ''))
  const art = el('div', 'intro-art')
  const strip = el('div', 'intro-progress-strip')
  const steps = ['Face', 'Tone', 'Gesture', 'Stance']
  steps.forEach((label, i) => {
    const card = el('div', `prog-chip slide-up delay-${i}`)
    card.append(el('span', 'prog-num', `${i + 1}`))
    card.append(el('span', '', label))
    strip.append(card)
    if (i < steps.length - 1) strip.append(el('span', 'prog-arrow', '→'))
  })
  art.append(strip)
  const mini = el('img', 'intro-player-small float-in') as HTMLImageElement
  mini.src = playerSrc(meta.playerAvatar)
  mini.alt = 'You'
  art.append(mini)
  stage.append(art)

  const copy = el('div', 'intro-copy pop-in')
  copy.append(el('p', 'eyebrow', 'How to play'))
  copy.append(el('h1', '', 'Choose your path · Manage energy'))
  copy.append(
    el(
      'p',
      'lead',
      'Unlock skills on a branching tree — a few tools at a time. You get 3 energy every 8 hours. Train with class quizzes for extra energy.',
    ),
  )

  const actions = el('div', 'hub-actions')
  const back = el('button', 'btn ghost', 'Back')
  back.type = 'button'
  back.addEventListener('click', () => {
    activeCutsceneId = 'intro'
    cutsceneStep = getCutscene('intro').slides.length - 1
    cutsceneReturnScreen = 'intro'
    screen = 'cutscene'
    render()
  })
  const next = el('button', 'btn primary big', 'Start practicing')
  next.type = 'button'
  next.addEventListener('click', () => {
    meta = markIntroSeen(meta)
    enrollOnBoard(meta.playerName || nameDraft || 'Friend')
    lessonChapterId = CHAPTERS[0].id
    screen = 'lesson'
    render()
  })
  actions.append(back, next)
  copy.append(actions)

  const skip = el('button', 'intro-skip', 'Skip intro')
  skip.type = 'button'
  skip.addEventListener('click', () => {
    if (!meta.playerName || meta.playerName === 'MC') {
      meta = setPlayerName(meta, nameDraft || 'Friend')
    }
    enrollOnBoard(meta.playerName || nameDraft || 'Friend')
    meta = markIntroSeen(meta)
    screen = 'hub'
    render()
  })
  copy.append(skip)

  main.append(stage, copy)
  return main
}

function renderCutscene(): HTMLElement {
  const id = activeCutsceneId!
  const def = getCutscene(id)
  const slide = def.slides[Math.min(cutsceneStep, def.slides.length - 1)]
  const layout = slide.layout === 'narrow' ? 'narrow' : 'cover'
  const main = el('main', `cutscene-screen layout-${layout}`)

  const stage = el('section', 'cutscene-stage')
  const frame = el('div', `cutscene-frame layout-${layout}`)
  const img = el('img', `cutscene-art layout-${layout} ${slide.motion}`) as HTMLImageElement
  img.src = slide.image
  img.alt = slide.title
  frame.append(img)
  stage.append(frame)

  const caption = el('div', 'cutscene-caption pop-in')
  caption.append(el('p', 'eyebrow', `${def.label} ${cutsceneStep + 1} / ${def.slides.length}`))
  caption.append(el('h1', '', slide.title))
  caption.append(el('p', 'lead', slide.body))
  stage.append(caption)

  const footer = el('div', 'cutscene-footer')
  const dots = el('div', 'intro-dots cutscene-dots')
  for (let i = 0; i < def.slides.length; i++) {
    dots.append(el('span', `dot ${i === cutsceneStep ? 'on' : ''}`, ''))
  }
  footer.append(dots)

  const actions = el('div', 'cutscene-actions')
  const back = el('button', 'btn ghost cutscene-btn', 'Back')
  back.type = 'button'
  back.addEventListener('click', () => {
    if (cutsceneStep > 0) {
      cutsceneStep -= 1
      render()
      return
    }
    if (id === 'intro') {
      activeCutsceneId = null
      introStep = 1
      screen = 'intro'
      render()
      return
    }
    finishCutscene()
  })
  actions.append(back)

  const isLast = cutsceneStep >= def.slides.length - 1
  const next = el(
    'button',
    'btn primary cutscene-btn',
    id === 'ending' && isLast ? 'See Score' : 'Continue',
  )
  next.type = 'button'
  next.addEventListener('click', () => {
    if (!isLast) {
      cutsceneStep += 1
      render()
      return
    }
    finishCutscene()
  })
  actions.append(next)
  footer.append(actions)

  if (def.allowSkip) {
    const skip = el('button', 'cutscene-skip', id === 'intro' ? 'Skip intro' : 'Skip')
    skip.type = 'button'
    skip.addEventListener('click', () => {
      if (id === 'intro') {
        if (!meta.playerName || meta.playerName === 'MC') {
          meta = setPlayerName(meta, nameDraft || 'Friend')
        }
        enrollOnBoard(meta.playerName || nameDraft || 'Friend')
        meta = markIntroSeen(meta)
        activeCutsceneId = null
        cutsceneStep = 0
        screen = 'hub'
        render()
        return
      }
      finishCutscene()
    })
    footer.append(skip)
  }

  stage.append(footer)
  main.append(stage)
  return main
}

function renderHub(): HTMLElement {
  const main = el('main', 'hub')

  // Energy actions only when you need them — top bar already shows ⚡ count
  if (meta.energy < ENERGY_MAX) {
    const energyBar = el('div', 'hub-status-bar')
    if (meta.energy < 1) {
      energyBar.append(el('span', 'energy-note', 'Out of energy'))
      const getEnergy = el('button', 'btn primary tiny', 'Get energy')
      getEnergy.type = 'button'
      getEnergy.addEventListener('click', () => openEnergyScreen())
      energyBar.append(getEnergy)
    } else {
      energyBar.append(el('span', 'energy-note', 'Need more energy?'))
      const getEnergy = el('button', 'btn ghost tiny', 'Quiz for +1 ⚡')
      getEnergy.type = 'button'
      getEnergy.addEventListener('click', () => openEnergyScreen())
      energyBar.append(getEnergy)
    }
    main.append(energyBar)
  }

  const cleared = meta.chaptersCleared.length
  const total = ALL_CHAPTERS.length
  const pct = total > 0 ? Math.round((cleared / total) * 100) : 0

  const hero = el('section', 'theater-banner face-mc')
  const artCol = el('div', 'hero-art')
  const art = el('img', 'hero-player') as HTMLImageElement
  art.src = playerSrc(meta.playerAvatar)
  art.alt = 'Your MC'
  artCol.append(art)

  const copy = el('div', 'hero-copy')
  const topRow = el('div', 'hero-top-row')
  topRow.append(el('p', 'eyebrow', 'Ha Long Tour'))
  const change = el('button', 'btn ghost tiny hero-change', 'Change')
  change.type = 'button'
  change.addEventListener('click', () => {
    introStep = 0
    meta = { ...meta, seenIntro: false }
    saveMeta(meta)
    screen = 'intro'
    render()
  })
  topRow.append(change)
  copy.append(topRow)
  copy.append(el('h1', '', mcDisplayName(meta)))
  copy.append(
    el('p', 'hero-blurb', 'Bring the crowd back to life — one stage at a time.'),
  )

  const progress = el('div', 'hero-progress')
  const progressHead = el('div', 'hero-progress-head')
  progressHead.append(el('span', '', 'Tour progress'))
  progressHead.append(el('span', 'hero-progress-count', `${cleared}/${total}`))
  progress.append(progressHead)
  const track = el('div', 'hero-progress-track')
  const fill = el('div', 'hero-progress-fill')
  fill.style.width = `${pct}%`
  track.append(fill)
  progress.append(track)
  copy.append(progress)

  hero.append(artCol, copy)
  main.append(hero)

  if (meta.lastReflection && isUsefulCoachNote(meta.lastReflection)) {
    const note = el('aside', 'coach-note')
    const quote =
      meta.lastReflection.tip && !isGenericCoachTip(meta.lastReflection.tip)
        ? meta.lastReflection.tip
        : meta.lastReflection.strength
    note.append(el('strong', '', 'Your coach says'))
    const q = el('p', 'coach-quote')
    q.textContent = `“${quote}”`
    note.append(q)
    main.append(note)
  }

  const ch = currentChapter(meta)
  const playCard = el('section', 'play-card')
  playCard.append(el('p', 'eyebrow', `Stage ${ch.number}`))
  playCard.append(el('h2', '', ch.title))
  playCard.append(el('p', '', ch.subtitle))

  const gate = canPlayChapter(meta, ch.id)
  const needsSkills = !gate.ok && (gate.reason || '').startsWith('Need skill')
  const needsEnergy = !gate.ok && (gate.reason || '').toLowerCase().includes('energy')

  if (!gate.ok) {
    playCard.append(
      el('p', 'warn', needsSkills ? 'Upgrade skills to continue' : gate.reason || 'Locked'),
    )
    if (needsSkills && gate.reason) {
      playCard.append(el('p', 'hint-line', gate.reason))
    }
    const row = el('div', 'hub-actions')
    if (needsSkills) {
      const toSkills = el('button', 'btn primary big', 'Open skill tree')
      toSkills.type = 'button'
      toSkills.addEventListener('click', () => {
        screen = 'skills'
        render()
      })
      row.append(toSkills)
    } else if (needsEnergy) {
      const train = el('button', 'btn primary big', 'Get energy')
      train.type = 'button'
      train.addEventListener('click', () => openEnergyScreen())
      row.append(train)
    }
    playCard.append(row)
  } else {
    const go = el('button', 'btn primary big', `Enter the stage · 1 ⚡`)
    go.type = 'button'
    go.addEventListener('click', () => {
      lessonChapterId = ch.id
      meta = { ...meta, pendingLessonChapterId: ch.id }
      screen = 'lesson'
      render()
    })
    playCard.append(go)
  }
  main.append(playCard)

  const nav = el('div', 'hub-actions hub-nav-compact')
  const sk = el(
    'button',
    needsSkills ? 'btn primary tiny' : 'btn secondary tiny',
    'Skill tree',
  )
  sk.type = 'button'
  sk.addEventListener('click', () => {
    screen = 'skills'
    render()
  })
  const cx = el('button', 'btn ghost tiny', 'Codex')
  cx.type = 'button'
  cx.addEventListener('click', () => {
    codexFocusIds = []
    screen = 'codex'
    render()
  })
  const board = el('button', 'btn ghost tiny', 'Board')
  board.type = 'button'
  board.addEventListener('click', () => openBoard())
  nav.append(sk, cx, board)
  main.append(nav)

  const activeUnit = unitForChapter(ch.id)
  const list = el('section', 'chapter-list')
  list.append(el('h3', '', 'Curriculum'))

  for (const unit of CURRICULUM_UNITS) {
    const stages = unit.chapterIds
      .map((id) => {
        try {
          return getChapter(id)
        } catch {
          return null
        }
      })
      .filter(Boolean) as ReturnType<typeof getChapter>[]
    const clearedCount = stages.filter((c) => meta.chaptersCleared.includes(c.id)).length
    const expanded = hubExpandUnit ? hubExpandUnit === unit.id : unit.id === activeUnit.id
    const unitRow = el('div', `unit-block ${expanded ? 'open' : 'closed'}`)
    const header = el('button', 'unit-header')
    header.type = 'button'
    header.innerHTML = `<span class="titles"><strong>${escapeHtml(unit.title)}</strong><small>${escapeHtml(unit.subtitle)}</small></span><span class="flag">${clearedCount}/${stages.length}</span>`
    header.addEventListener('click', () => {
      if (expanded && !hubExpandUnit) return
      hubExpandUnit = unit.id === activeUnit.id ? null : unit.id
      render()
    })
    unitRow.append(header)

    if (expanded) {
      const body = el('div', 'unit-stages')
      for (const c of stages) {
        const row = el('button', 'chapter-row')
        row.type = 'button'
        const cleared = meta.chaptersCleared.includes(c.id)
        const current = c.id === ch.id
        row.classList.toggle('current', current)
        row.classList.toggle('cleared', cleared)
        const numLabel = c.id.startsWith('final-') ? `F${c.number - 7}` : String(c.number)
        const flag = chapterStarFlag(meta, c.id, cleared, current)
        row.innerHTML = `<span class="num">${numLabel}</span><span class="titles"><strong>${escapeHtml(c.title)}</strong><small>${escapeHtml(c.subtitle)}</small></span><span class="flag">${flag}</span>`
        row.addEventListener('click', () => {
          const g = canPlayChapter(meta, c.id)
          if (!g.ok) {
            alert(g.reason || 'Locked')
            return
          }
          hubExpandUnit = null
          lessonChapterId = c.id
          screen = 'lesson'
          render()
        })
        body.append(row)
      }
      unitRow.append(body)
    }
    list.append(unitRow)
  }
  main.append(list)

  if (meta.chaptersCleared.length > 0 || meta.bestStageboundScore > 0) {
    const live = computeStageboundScore(meta)
    const scoreBtn = el(
      'button',
      'btn primary big',
      `Your score · ${live.total}${live.total < meta.bestStageboundScore ? ` (best ${meta.bestStageboundScore})` : ''}`,
    )
    scoreBtn.type = 'button'
    scoreBtn.addEventListener('click', () => {
      screen = 'score'
      render()
    })
    main.append(scoreBtn)
  }

  return main
}

function renderLesson(): HTMLElement {
  const ch = getChapter(lessonChapterId)
  const main = el('main', 'lesson-screen')
  main.append(el('p', 'eyebrow', `Lesson · Chapter ${ch.number}`))
  main.append(el('h1', '', ch.lesson.headline))
  main.append(el('p', 'lead', ch.lesson.body))

  const grid = el('div', 'lesson-examples')
  for (const ex of ch.lesson.examples) {
    const card = el('div', 'lesson-card')
    card.append(el('strong', '', ex.label))
    card.append(el('p', '', ex.detail))
    grid.append(card)
  }
  main.append(grid)

  if (ch.teaches && !meta.unlockedSkills.includes(ch.teaches)) {
    const cost = getSkillNode(ch.teaches).cost
    const buy = el('button', 'btn primary big', `Unlock ${SKILL_LABELS[ch.teaches]} (${cost} SP)`)
    buy.type = 'button'
    buy.disabled = meta.skillPoints < cost || skillNodeState(ch.teaches, meta.unlockedSkills) !== 'available'
    buy.addEventListener('click', () => {
      const res = buySkill(meta, ch.teaches!)
      meta = res.meta
      render()
    })
    main.append(buy)
    if (meta.skillPoints < cost) {
      main.append(
        el(
          'p',
          'warn',
          'Not enough skill points. Practice a chapter you can already play to earn SP, then come back.',
        ),
      )
    }
  }

  const actions = el('div', 'hub-actions')
  const gate = canPlayChapter(meta, ch.id)
  const play = el('button', 'btn primary big', gate.ok ? 'Start practice run · 1 ⚡' : 'Need skills or energy')
  play.type = 'button'
  play.disabled = !gate.ok
  play.addEventListener('click', () => {
    if (!canPlayChapter(meta, ch.id).ok) return
    meta = dismissLesson(meta)
    meta = spendEnergy(meta)
    run = startChapterRun(meta, ch.id)
    screen = 'run'
    render()
  })
  const back = el('button', 'btn ghost', 'Back')
  back.type = 'button'
  back.addEventListener('click', () => {
    meta = dismissLesson(meta)
    screen = 'hub'
    render()
  })
  actions.append(play, back)
  main.append(actions)
  return main
}

function openEnergyScreen(): void {
  trainOnMenu = true
  trainQuiz = []
  trainIndex = 0
  trainCorrect = 0
  trainEnergyAwarded = false
  screen = 'train'
  render()
}

function startTraining(): void {
  trainOnMenu = false
  trainQuiz = pickTrainSet(5)
  trainIndex = 0
  trainCorrect = 0
  trainEnergyAwarded = false
  screen = 'train'
  render()
}

function appendEnergyConvert(actions: HTMLElement): void {
  const convert = el('button', 'btn secondary', 'Spend 2 skill points → +1 energy')
  convert.type = 'button'
  convert.disabled = meta.skillPoints < 2 || meta.energy >= ENERGY_MAX
  convert.addEventListener('click', () => {
    const res = spendSkillPointsForEnergy(meta)
    meta = res.meta
    if (!res.ok) alert(res.msg)
    else alert(res.msg)
    render()
  })
  actions.append(convert)
}

function renderSkills(): HTMLElement {
  const main = el('main', 'skills-screen')
  main.append(el('h1', '', 'MC Skill Tree'))
  main.append(
    el(
      'p',
      'lead',
      `${meta.skillPoints} SP · Unlock a few tools at a time. More Gestures unlocks after Hand Gestures.`,
    ),
  )

  const canvas = el('div', 'tree-canvas')
  const inner = el('div', 'tree-canvas-inner')
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'tree-lines')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('preserveAspectRatio', 'none')

  for (const edge of SKILL_EDGES) {
    const from = SKILL_NODES.find((n) => n.id === edge.from)!
    const to = SKILL_NODES.find((n) => n.id === edge.to)!
    const fromState = skillNodeState(edge.from, meta.unlockedSkills)
    const toState = skillNodeState(edge.to, meta.unlockedSkills)
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', String(from.x))
    line.setAttribute('y1', String(from.y))
    line.setAttribute('x2', String(to.x))
    line.setAttribute('y2', String(to.y))
    const lit = fromState === 'owned' && (toState === 'owned' || toState === 'available')
    line.setAttribute('class', lit ? 'tree-edge on' : 'tree-edge')
    svg.appendChild(line)
  }
  inner.append(svg)

  for (const node of SKILL_NODES) {
    const state = skillNodeState(node.id, meta.unlockedSkills)
    const btn = el('button', `tree-node ${state} ${selectedSkill === node.id ? 'focus' : ''}`)
    btn.type = 'button'
    btn.style.left = `${node.x}%`
    btn.style.top = `${node.y}%`
    btn.append(el('span', 'tree-node-title', SKILL_LABELS[node.id]))
    btn.append(el('span', 'tree-node-meta', state === 'owned' ? '✓' : state === 'available' ? `${node.cost} SP` : '🔒'))
    btn.addEventListener('click', () => {
      selectedSkill = node.id
      render()
    })
    inner.append(btn)
  }
  canvas.append(inner)
  main.append(canvas)

  const detail = el('div', 'tree-detail')
  const focus = selectedSkill || 'emotion'
  const node = SKILL_NODES.find((n) => n.id === focus)!
  const state = skillNodeState(focus, meta.unlockedSkills)
  detail.append(el('h3', '', SKILL_LABELS[focus]))
  detail.append(el('p', '', node.blurb))
  if (state === 'owned') {
    detail.append(el('p', 'owned-tag', 'Unlocked — ready for the stage'))
  } else if (state === 'available') {
    const unlock = el('button', 'btn primary', `Unlock · ${node.cost} SP`)
    unlock.type = 'button'
    unlock.disabled = meta.skillPoints < node.cost
    unlock.addEventListener('click', () => {
      const res = buySkill(meta, focus)
      meta = res.meta
      if (!res.ok) alert(res.msg)
      render()
    })
    detail.append(unlock)
  } else {
    const need = node.requires.filter((r) => !meta.unlockedSkills.includes(r))
    detail.append(
      el('p', 'warn', `Locked. Need: ${need.map((id) => SKILL_LABELS[id]).join(' + ')}`),
    )
  }

  const study = el('button', 'btn secondary', 'Study in Codex')
  study.type = 'button'
  study.addEventListener('click', () => {
    codexFocusIds = codexIdsForSkill(focus)
    screen = 'codex'
    render()
  })
  detail.append(study)
  main.append(detail)

  const actions = el('div', 'hub-actions stack')
  const back = el('button', 'btn ghost', 'Back to hub')
  back.type = 'button'
  back.addEventListener('click', () => {
    screen = 'hub'
    render()
  })
  const rs = el('button', 'btn ghost danger-link', 'Reset all progress')
  rs.type = 'button'
  rs.addEventListener('click', () => {
    if (confirm('Reset all progress?')) {
      meta = resetMeta()
      introStep = 0
      hubExpandUnit = null
      screen = 'intro'
      lessonChapterId = CHAPTERS[0].id
      render()
    }
  })
  actions.append(back, rs)
  main.append(actions)
  return main
}

function renderTrain(): HTMLElement {
  const main = el('main', 'train-screen')

  if (trainOnMenu) {
    main.append(el('h1', '', 'Get energy'))
    main.append(el('p', 'lead', `You have ⚡ ${meta.energy} energy and ${meta.skillPoints} skill points.`))
    main.append(el('p', 'lead', 'Or use skill points: 2 points = 1 energy.'))
    const actions = el('div', 'hub-actions stack')
    const quiz = el('button', 'btn primary big', 'Take quiz for +1 energy')
    quiz.type = 'button'
    quiz.addEventListener('click', () => startTraining())
    actions.append(quiz)
    appendEnergyConvert(actions)
    const back = el('button', 'btn ghost', 'Back to hub')
    back.type = 'button'
    back.addEventListener('click', () => {
      trainOnMenu = false
      screen = 'hub'
      render()
    })
    actions.append(back)
    main.append(actions)
    return main
  }

  if (!trainQuiz.length) {
    trainOnMenu = true
    return renderTrain()
  }

  if (trainIndex >= trainQuiz.length) {
    const awarded = trainCorrect >= 5
    main.append(el('h1', '', awarded ? 'Training complete!' : 'Keep training'))
    if (awarded) {
      if (!trainEnergyAwarded) {
        meta = addEnergy(meta, 1)
        trainEnergyAwarded = true
        meta = recordQuizResult(meta, trainCorrect, trainQuiz.length)
      }
      main.append(el('p', 'lead', `You got ${trainCorrect}/5. +1 energy! Now ⚡ ${meta.energy}`))
    } else {
      if (!trainEnergyAwarded) {
        meta = recordQuizResult(meta, trainCorrect, trainQuiz.length)
        trainEnergyAwarded = true
      }
      main.append(el('p', 'lead', `You got ${trainCorrect}/5. Need all 5 correct for +1 energy.`))
    }
    const actions = el('div', 'hub-actions stack')
    const again = el('button', 'btn primary big', 'Take quiz again')
    again.type = 'button'
    again.addEventListener('click', () => startTraining())
    actions.append(again)
    appendEnergyConvert(actions)
    const back = el('button', 'btn ghost', 'Back to hub')
    back.type = 'button'
    back.addEventListener('click', () => {
      trainOnMenu = false
      screen = 'hub'
      render()
    })
    actions.append(back)
    main.append(actions)
    return main
  }

  const q = trainQuiz[trainIndex]
  main.append(el('p', 'eyebrow', `Training ${trainIndex + 1} / ${trainQuiz.length} · Correct ${trainCorrect}`))
  main.append(el('h1', '', 'Class review'))
  main.append(el('p', 'lead', q.prompt))
  const list = el('div', 'one-choices')
  q.choices.forEach((choice, i) => {
    const btn = el('button', 'line-choice', choice)
    btn.type = 'button'
    btn.addEventListener('click', () => {
      if (i === q.correctIndex) trainCorrect += 1
      trainIndex += 1
      render()
    })
    list.append(btn)
  })
  main.append(list)
  return main
}

function renderCodex(): HTMLElement {
  const main = el('main', 'codex')
  main.append(el('h1', '', 'Codex'))
  if (codexFocusIds.length) {
    main.append(el('p', 'lead', 'Study these skills from your tree — then try them on stage.'))
  }
  const list = el('div', 'codex-list')
  const ordered = [...CODEX].sort((a, b) => {
    const af = codexFocusIds.includes(a.id) ? 0 : 1
    const bf = codexFocusIds.includes(b.id) ? 0 : 1
    return af - bf
  })
  for (const entry of ordered) {
    const unlocked = meta.unlockedCodex.includes(entry.id) || entry.id === 'face_feeling'
    const focused = codexFocusIds.includes(entry.id)
    const card = el('article', `codex-card ${unlocked ? 'on' : 'off'} ${focused ? 'focus' : ''}`)
    card.id = `codex-${entry.id}`
    card.append(el('p', 'cat', entry.category))
    card.append(el('h3', '', unlocked ? entry.name : '???'))
    if (unlocked) {
      card.append(el('p', '', entry.when))
      const example = el('p', 'example')
      example.textContent = asSpeechQuote(entry.example)
      card.append(example)
    }
    list.append(card)
  }
  main.append(list)
  const back = el('button', 'btn ghost', 'Back')
  back.type = 'button'
  back.addEventListener('click', () => {
    codexFocusIds = []
    screen = 'hub'
    render()
  })
  main.append(back)
  if (codexFocusIds[0]) {
    queueMicrotask(() => {
      document.getElementById(`codex-${codexFocusIds[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }
  return main
}

function renderRun(): HTMLElement {
  if (!run) return el('main')
  const ch = getChapter(run.chapterId)
  const turn = currentTurn(run)
  const mood = audienceMood(run)
  const main = el('main', 'run-screen')

  // Stage theater
  const stage = el('section', 'theater theater-bleed')
  stage.append(el('div', 'curtain left', ''))
  stage.append(el('div', 'curtain right', ''))

  const crowdLabel = el('p', 'crowd-label', crowdCaption(mood))
  stage.append(crowdLabel)

  const audienceRow = el('div', 'audience-row')
  const labels: Record<AudienceWho, string> = {
    oldman: 'Old man',
    woman: 'Lady',
    girl: 'Young girl',
  }
  for (const who of AUDIENCE_ORDER) {
    const faceMood = portraitMood(who, mood)
    const wrap = el('div', `aud-slot mood-${faceMood}`)
    const img = el('img', `aud-face mood-${faceMood}`) as HTMLImageElement
    img.src = audienceSrc(who, faceMood)
    img.alt = `${labels[who]} · ${faceMood}`
    wrap.append(img)
    audienceRow.append(wrap)
  }
  stage.append(audienceRow)

  const meter = el('div', 'audience-meter')
  meter.append(el('span', '', 'Audience'))
  const track = el('div', 'meter-track')
  const fill = el('div', 'meter-fill')
  fill.style.width = `${run.audience}%`
  fill.dataset.level = run.audience > 55 ? 'good' : run.audience > 28 ? 'ok' : 'low'
  track.append(fill)
  meter.append(track)
  stage.append(meter)

  const playArea = el('div', 'play-area')
  const playerWrap = el('div', 'player-wrap')
  const player = el('img', 'player-sprite') as HTMLImageElement
  player.src = playerSrc(meta.playerAvatar)
  player.alt = 'You'
  playerWrap.append(player)

  const bubble = el('div', `speech-bubble at-feet ${run.bubbleText === '…' ? 'empty' : ''}`)
  bubble.textContent = run.phase === 'feedback' && run.lastFeedback
    ? run.lastFeedback.ok
      ? turn.successTip
      : run.lastFeedback.tips[0] || turn.coachTip
    : run.bubbleText
  playerWrap.append(bubble)
  playArea.append(playerWrap)
  stage.append(playArea)

  const metaLine = el('p', 'run-meta', `${ch.title} · Beat ${run.turnIndex + 1}/${totalTurns(run)} · ${turn.moment}`)
  stage.append(metaLine)
  main.append(stage)

  const panel = el('section', 'choice-panel')
  if (run.phase === 'pick') {
    const topRow = el('div', 'pick-nav')
    const stepIdx = run.pickQueue.indexOf(run.pickStep)
    if (stepIdx > 0) {
      const back = el('button', 'btn ghost pick-back', '← Back')
      back.type = 'button'
      back.addEventListener('click', () => {
        if (!run) return
        run = goBackStep(run)
        render()
      })
      topRow.append(back)
    }
    const leave = el('button', 'btn ghost pick-leave', 'Leave stage')
    leave.type = 'button'
    leave.addEventListener('click', () => {
      run = null
      screen = 'hub'
      render()
    })
    topRow.append(leave)
    panel.append(topRow)
    panel.append(el('h2', 'step-title', stepTitle(run.pickStep, turn.prompt)))
    panel.append(renderPickStep(run, turn))
  } else if (run.phase === 'feedback' && run.lastFeedback) {
    const fb = run.lastFeedback
    panel.classList.add(fb.ok ? 'ok' : 'bad')
    panel.append(el('h2', '', fb.ok ? 'Nice!' : 'Coach tip'))
    panel.append(
      el('p', '', `+${fb.points}/${fb.maxPoints} · Audience ${fb.audienceDelta >= 0 ? '+' : ''}${fb.audienceDelta}`),
    )
    for (const s of fb.strengths) panel.append(el('p', 'good', `✓ ${s}`))
    for (const t of fb.tips) panel.append(el('p', 'tip', `→ ${t}`))
    const actions = el('div', 'hub-actions stack')
    const next = el('button', 'btn primary big', run.audience <= 0 ? 'See result' : 'Next line')
    next.type = 'button'
    next.addEventListener('click', () => {
      if (!run) return
      run = advanceAfterFeedback(run, meta)
      if (run.phase === 'finished' && run.result) {
        const finished = run.result
        meta = applyRunResult(meta, finished)
        screen = 'result'
        if (finished.won) void autoSyncAfterWin().then(() => render())
      }
      render()
    })
    actions.append(next)
    panel.append(actions)
  }
  main.append(panel)
  return main
}

function stepTitle(step: RunState['pickStep'], prompt: string): string {
  if (step === 'sentence') return prompt
  if (step === 'confirm') return 'Ready to deliver?'
  const titles: Record<string, string> = {
    emotion: 'Show a feeling on your face',
    tone: 'Choose your tone of voice',
    gesture: 'Choose a hand gesture',
    stance: 'Choose your stance',
    volume: 'Choose your volume',
    pause: 'Pause after this line?',
    stressWord: 'Tap the word to STRESS',
    sayClearWord: 'Tap the word to say CLEARLY',
    eyes: 'Where do you look?',
  }
  return titles[step] || String(step)
}

function renderPickStep(state: RunState, turn: ReturnType<typeof currentTurn>): HTMLElement {
  const step = state.pickStep
  if (step === 'sentence') {
    const wrap = el('div', 'one-choices')
    if (turn.styleChoice || turn.sentences.some((s) => s.style)) {
      wrap.append(
        el(
          'p',
          'muted style-hint',
          'Pick your speaking style — comedy, heart, or fire. All three work; match your face and voice.',
        ),
      )
    }
    for (const s of turn.sentences) {
      const btn = el('button', `line-choice${s.style ? ` style-${s.style}` : ''}`)
      btn.type = 'button'
      if (s.style) {
        const label =
          s.style === 'comedy' ? 'Comedy · laugh' : s.style === 'heart' ? 'Heart · compassion' : 'Fire · passion'
        btn.append(el('span', 'style-tag', label))
        btn.append(el('span', 'style-line', s.text))
      } else {
        btn.textContent = s.text
      }
      btn.addEventListener('click', () => {
        if (!run) return
        run = selectSentence(run, s.id)
        render()
      })
      wrap.append(btn)
    }
    return wrap
  }

  if (step === 'confirm') {
    const wrap = el('div', 'confirm-box')
    wrap.append(el('p', '', 'Your line is in the speech bubble. Deliver it!'))
    const go = el('button', 'btn primary big', 'Deliver!')
    go.type = 'button'
    go.addEventListener('click', () => {
      if (!run) return
      run = submitCurrent(run, meta)
      render()
    })
    wrap.append(go)
    return wrap
  }

  if (step === 'stressWord' || step === 'sayClearWord') {
    const sentence = turn.sentences.find((s) => s.id === state.draft.sentenceId)
    const wrap = el('div', 'word-row')
    if (!sentence) {
      wrap.append(el('p', '', 'Pick a sentence first.'))
      return wrap
    }
    for (const w of sentence.words) {
      const btn = el('button', 'word-chip', w)
      btn.type = 'button'
      btn.addEventListener('click', () => {
        if (!run) return
        run = selectDelivery(run, step, w)
        render()
      })
      wrap.append(btn)
    }
    return wrap
  }

  return renderSlotPills(step)
}

function renderSlotPills(slot: DeliverySlot): HTMLElement {
  const wrap = el('div', 'one-choices pills')
  const options = optionsForSlot(slot)
  for (const opt of options) {
    const btn = el('button', 'line-choice compact', opt.label)
    btn.type = 'button'
    btn.addEventListener('click', () => {
      if (!run) return
      run = selectDelivery(run, slot, opt.id)
      render()
    })
    wrap.append(btn)
  }
  return wrap
}

function pickCappedOptions(
  all: { id: string; label: string }[],
  correctId: string | undefined,
  max = 5,
): { id: string; label: string }[] {
  if (all.length <= max) return all
  const correct = all.find((o) => o.id === correctId)
  const others = all.filter((o) => o.id !== correctId)
  // Stable-ish shuffle
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[others[i], others[j]] = [others[j], others[i]]
  }
  const pick = others.slice(0, max - (correct ? 1 : 0))
  const result = correct ? [correct, ...pick] : pick.slice(0, max)
  // Shuffle final order so correct is not always first
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function optionsForSlot(slot: DeliverySlot): { id: string; label: string }[] {
  let all: { id: string; label: string }[] = []
  switch (slot) {
    case 'emotion':
      all = (Object.keys(EMOTION_LABELS) as EmotionId[]).map((id) => ({
        id,
        label: EMOTION_LABELS[id],
      }))
      break
    case 'tone':
      all = (Object.keys(TONE_LABELS) as ToneId[]).map((id) => ({ id, label: TONE_LABELS[id] }))
      break
    case 'gesture':
      all = unlockedGestures(meta.unlockedSkills).map((id) => ({ id, label: GESTURE_LABELS[id] }))
      break
    case 'stance':
      all = unlockedStances(meta.unlockedSkills).map((id) => ({ id, label: STANCE_LABELS[id] }))
      break
    case 'volume':
      all = (Object.keys(VOLUME_LABELS) as VolumeId[]).map((id) => ({ id, label: VOLUME_LABELS[id] }))
      break
    case 'pause':
      all = (Object.keys(PAUSE_LABELS) as PauseId[]).map((id) => ({ id, label: PAUSE_LABELS[id] }))
      break
    case 'eyes':
      all = (Object.keys(EYES_LABELS) as EyesId[]).map((id) => ({ id, label: EYES_LABELS[id] }))
      break
    default:
      return []
  }

  let correctId: string | undefined
  if (run) {
    const turn = currentTurn(run)
    const sentence = turn.sentences.find((s) => s.id === run!.draft.sentenceId)
    const exp = expectedFor(turn, sentence)
    correctId = exp[slot] as string | undefined
  }
  return pickCappedOptions(all, correctId, 5)
}

function renderResult(): HTMLElement {
  if (!run?.result) return el('main')
  const r = run.result
  const ch = getChapter(r.chapterId)
  const main = el('main', 'result-screen')
  const stage = el('section', 'theater result')
  const img = el('img', 'result-player') as HTMLImageElement
  img.src = playerSrc(meta.playerAvatar)
  img.alt = 'You'
  stage.append(img)
  stage.append(el('h1', '', r.won ? 'Chapter cleared!' : 'The crowd left…'))
  stage.append(el('p', '', ch.title))
  main.append(stage)

  const grid = el('div', 'result-grid')
  grid.append(statCard('Score', `${r.score}/${r.maxScore}`))
  grid.append(statCard('Skill points', `+${r.skillPointsGained}`))
  grid.append(statCard('Matches', `${r.matches}`))
  grid.append(statCard('Audience', `${r.audienceLeft}`))
  const live = computeStageboundScore(meta)
  grid.append(statCard('Stagebound', `${live.total}`))
  main.append(grid)

  const note = el('div', 'coach-note')
  note.innerHTML = `<strong>Reflection</strong><p>${escapeHtml(r.strength)}</p><p class="tip-line">${escapeHtml(r.tip)}</p>`
  main.append(note)

  if (r.newUnlocks.length) {
    const u = el('div', 'unlocks')
    for (const n of r.newUnlocks) u.append(el('p', '', `★ ${n}`))
    main.append(u)
  }

  if (r.won) {
    const live = computeStageboundScore(meta)
    const boardNote = el('div', 'coach-note board-sync-note')
    boardNote.append(el('strong', '', 'Class board'))
    if (boardJoined) {
      boardNote.append(
        el(
          'p',
          'muted',
          lastBoardSyncNote ||
            `On the board as ${boardNickname || meta.playerName} · ${boardClassCode}. Score ${Math.max(live.total, meta.bestStageboundScore)} syncs after every clear.`,
        ),
      )
      const view = el('button', 'btn secondary', 'View leaderboard')
      view.type = 'button'
      view.addEventListener('click', () => {
        run = null
        openBoard()
      })
      boardNote.append(view)
    } else {
      boardNote.append(
        el('p', 'muted', 'You left the class board. Rejoin anytime to share progress with the class.'),
      )
      const rejoin = el('button', 'btn secondary', 'Rejoin class board')
      rejoin.type = 'button'
      rejoin.addEventListener('click', () => {
        const profile = rejoinBoard(meta.playerName || boardNickname || 'MC', boardClassCode)
        boardNickname = profile.nickname
        boardClassCode = profile.classCode
        boardJoined = profile.joined
        void pushLiveScore(boardNickname).then(() => {
          run = null
          openBoard()
        })
      })
      boardNote.append(rejoin)
    }
    main.append(boardNote)
  }

  if (!r.won) {
    main.append(
      el(
        'p',
        'warn',
        'Failed runs still give practice skill points. Unlock the next tool, then try again.',
      ),
    )
  }

  const actions = el('div', 'hub-actions stack')
  const justClearedChapter = r.won && r.newUnlocks.some((u) => u.startsWith('Chapter cleared:'))

  if (r.won && r.chapterId === 'final-5-championship') {
    const see = el('button', 'btn primary big', 'See Stagebound Score')
    see.type = 'button'
    see.addEventListener('click', () => {
      run = null
      if (justClearedChapter && !meta.seenEndingCutscene) {
        startCutscene('ending', 'score')
        return
      }
      screen = 'score'
      render()
    })
    actions.append(see)
  } else {
    const again = el('button', 'btn primary big', r.won ? 'Continue' : 'Retry chapter')
    again.type = 'button'
    again.addEventListener('click', () => {
      if (r.won) {
        run = null
        if (
          r.chapterId === 'ch2-find-voice' &&
          justClearedChapter &&
          !meta.seenThawCutscene
        ) {
          startCutscene('thaw', 'hub')
          return
        }
        screen = 'hub'
      } else {
        lessonChapterId = r.chapterId
        screen = 'lesson'
      }
      render()
    })
    actions.append(again)
  }
  const toScore = el('button', 'btn secondary', 'View Stagebound Score')
  toScore.type = 'button'
  toScore.addEventListener('click', () => {
    run = null
    if (
      r.won &&
      r.chapterId === 'final-5-championship' &&
      justClearedChapter &&
      !meta.seenEndingCutscene
    ) {
      startCutscene('ending', 'score')
      return
    }
    screen = 'score'
    render()
  })
  actions.append(toScore)
  const skills = el('button', 'btn ghost', 'Skill tree')
  skills.type = 'button'
  skills.addEventListener('click', () => {
    screen = 'skills'
    render()
  })
  actions.append(skills)
  main.append(actions)
  return main
}

function renderScore(): HTMLElement {
  const main = el('main', 'score-screen')
  const s = computeStageboundScore(meta)
  if (s.total > (meta.bestStageboundScore || 0)) {
    meta = { ...meta, bestStageboundScore: s.total }
    saveMeta(meta)
  }
  main.append(el('h1', '', 'Stagebound Score'))
  main.append(el('p', 'lead', `Current score: ${s.total} / 1000`))
  main.append(
    el(
      'p',
      'lead',
      `Best: ${meta.bestStageboundScore} · Chapters cleared: ${s.chaptersCleared}/${s.chaptersTotal}`,
    ),
  )
  const grid = el('div', 'result-grid')
  grid.append(
    statCard(
      'Progress',
      `${s.chaptersCleared}/${s.chaptersTotal} · ${s.progressPoints}`,
    ),
  )
  grid.append(
    statCard('Quality', `${Math.round(s.qualityPct * 100)}% · ${s.qualityPoints}`),
  )
  grid.append(
    statCard('Finals', `${Math.round(s.finalsPct * 100)}% · ${s.finalsPoints}`),
  )
  grid.append(statCard('Total', `${s.total}`))
  main.append(grid)
  main.append(
    el(
      'p',
      'muted',
      'Progress rises when you clear chapters. Quality rewards strong best scores. Finals add extra points for the three final speeches.',
    ),
  )

  const form = el('div', 'coach-note')
  form.append(el('strong', '', 'Class board'))
  form.append(
    el(
      'p',
      'muted',
      boardJoined
        ? `On the board as ${boardNickname || meta.playerName} · ${boardClassCode}. Clears update the class automatically.`
        : 'You left the class board. Rejoin to share your score with the class.',
    ),
  )
  const name = el('input', 'board-input') as HTMLInputElement
  name.placeholder = 'Your name'
  name.value = boardNickname || meta.playerName || ''
  name.maxLength = 20
  const code = el('input', 'board-input') as HTMLInputElement
  code.placeholder = 'Class code e.g. World2'
  code.value = boardClassCode
  form.append(name, code)
  const post = el('button', 'btn primary big', boardJoined ? 'Update my score' : 'Rejoin & post score')
  post.type = 'button'
  post.addEventListener('click', () => {
    const profile = rejoinBoard(name.value || meta.playerName || 'MC', code.value || 'WORLD2')
    boardNickname = profile.nickname
    boardClassCode = profile.classCode
    boardJoined = profile.joined
    post.disabled = true
    post.textContent = 'Posting…'
    void pushLiveScore(boardNickname).then(() => {
      openBoard()
    })
  })
  form.append(post)
  if (boardStatus) form.append(el('p', 'muted', boardStatus))
  main.append(form)

  const actions = el('div', 'hub-actions stack')
  const board = el('button', 'btn secondary', 'View leaderboard')
  board.type = 'button'
  board.addEventListener('click', () => openBoard())
  const hub = el('button', 'btn ghost', 'Back to hub')
  hub.type = 'button'
  hub.addEventListener('click', () => {
    screen = 'hub'
    render()
  })
  actions.append(board, hub)
  main.append(actions)
  return main
}

function renderBoard(): HTMLElement {
  const main = el('main', 'board-screen')
  main.append(el('h1', '', 'Class leaderboard'))
  const codeRow = el('div', 'get-energy-bar')
  const code = el('input', 'board-input') as HTMLInputElement
  code.placeholder = 'Class code'
  code.value = boardClassCode
  const load = el('button', 'btn secondary', boardLoading ? 'Loading…' : 'Show')
  load.type = 'button'
  load.disabled = boardLoading
  load.addEventListener('click', () => {
    boardClassCode = code.value.trim().toUpperCase() || 'WORLD2'
    saveBoardProfile({ classCode: boardClassCode, nickname: boardNickname, joined: boardJoined })
    boardNeedsRefresh = true
    void refreshBoard(boardClassCode).then(() => render())
    render()
  })
  codeRow.append(code, load)
  main.append(codeRow)
  main.append(el('p', 'lead', `Top scores for ${boardClassCode.toUpperCase()}`))
  main.append(
    el(
      'p',
      'muted',
      boardStatus ||
        (boardConfigured && boardSource === 'cloud'
          ? 'Live class board'
          : 'Scores on this device until the shared database is linked'),
    ),
  )

  if (!boardJoined) {
    const join = el('div', 'coach-note')
    join.append(el('strong', '', 'You left the class board'))
    join.append(el('p', 'muted', 'Rejoin anytime — same name, class code World2.'))
    const name = el('input', 'board-input') as HTMLInputElement
    name.placeholder = 'Your name'
    name.value = boardNickname || meta.playerName || ''
    name.maxLength = 20
    join.append(name)
    const go = el('button', 'btn primary', 'Rejoin class board')
    go.type = 'button'
    go.addEventListener('click', () => {
      const profile = rejoinBoard(name.value || meta.playerName || 'MC', boardClassCode)
      boardNickname = profile.nickname
      boardClassCode = profile.classCode
      boardJoined = profile.joined
      void pushLiveScore(boardNickname).then(() => render())
      render()
    })
    join.append(go)
    main.append(join)
  } else {
    const status = el('div', 'coach-note')
    status.append(
      el('p', 'muted', `On the board as ${boardNickname} · ${boardClassCode} · auto-updates on chapter clear`),
    )
    const leave = el('button', 'btn ghost', 'Leave class board')
    leave.type = 'button'
    leave.addEventListener('click', () => {
      leave.disabled = true
      leave.textContent = 'Removing…'
      void leaveAndRemoveFromBoard().then((result) => {
        boardNickname = loadBoardProfile().nickname
        boardClassCode = loadBoardProfile().classCode
        boardJoined = false
        applyBoardResult(result, result.error || 'You left the class board. Your name was removed.')
        boardNeedsRefresh = true
        render()
      })
    })
    status.append(leave)
    main.append(status)
  }

  const entries = boardCache.length ? boardCache : []
  const list = el('div', 'board-list')
  if (boardLoading && !entries.length) {
    list.append(el('p', 'lead', 'Loading scores…'))
  } else if (!entries.length) {
    list.append(el('p', 'lead', 'No scores yet. Clear a chapter — you’re already on the board!'))
  } else {
    entries.forEach((e, i) => {
      const row = el('div', 'board-row')
      const cleared =
        typeof e.chaptersCleared === 'number' && e.chaptersCleared > 0
          ? ` · ${e.chaptersCleared} cleared`
          : ''
      row.innerHTML = `<span class="board-rank">${i + 1}</span><span class="board-name">${escapeHtml(e.nickname)}${cleared ? `<small class="board-meta">${cleared}</small>` : ''}</span><span class="board-score">${e.score}</span>`
      list.append(row)
    })
  }
  main.append(list)

  const back = el('button', 'btn ghost', 'Back')
  back.type = 'button'
  back.addEventListener('click', () => {
    screen = 'hub'
    render()
  })
  main.append(back)

  if (boardNeedsRefresh && !boardLoading) {
    void refreshBoard(boardClassCode).then(() => {
      if (screen === 'board') render()
    })
  }

  return main
}

function statCard(label: string, value: string): HTMLElement {
  const c = el('div', 'stat-card')
  c.append(el('p', 'muted', label))
  c.append(el('p', 'stat-value', value))
  return c
}

function asSpeechQuote(text: string): string {
  const t = text.trim()
  if (!t) return t
  if (
    (t.startsWith('“') && t.endsWith('”')) ||
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith('‘') && t.endsWith('’'))
  ) {
    return t
  }
  return `“${t}”`
}

function chapterStarFlag(m: MetaState, chapterId: string, cleared: boolean, current: boolean): string {
  const best = m.bestScore[chapterId]
  const max = m.bestMaxScore[chapterId]
  if (typeof best === 'number' && typeof max === 'number' && max > 0) {
    const ratio = best / max
    const threeNeed = max <= 12 ? 1 : 0.8
    if (ratio >= threeNeed) return '★★★'
    if (ratio >= 0.6) return '★★☆'
    return '★☆☆'
  }
  if (cleared) return '★☆☆'
  if (current) return '▶'
  return '·'
}

function isGenericCoachTip(tip: string): boolean {
  return (
    tip === 'Replay and try a different face or gesture on the same line.' ||
    tip === 'Spend a skill point, then retry this chapter.'
  )
}

function isGenericCoachStrength(strength: string): boolean {
  return (
    strength === 'Clear line for this moment' ||
    strength === 'You picked a line that fits this part of the speech.' ||
    strength === 'You kept speaking on stage.' ||
    strength === 'You learned something from the miss.'
  )
}

function isUsefulCoachNote(r: { strength: string; tip: string }): boolean {
  const tipOk = !!r.tip && !isGenericCoachTip(r.tip)
  const strengthOk = !!r.strength && !isGenericCoachStrength(r.strength)
  return tipOk || strengthOk
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

render()
