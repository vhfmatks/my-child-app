// 분석 엔진 v2 — docs/research.md Part 2·3 근거
// 2계층 설계: (1) 결정론 점수엔진(근거·감사가능) → (2) 서사(표현). 이 파일은 (1)을 담당한다.
//  - 만세력(F1): JDN 기반 결정론 계산. 사주는 "문화 맥락" 라벨이며 진로 점수 가중치 0(삼각측량).
//  - 구성개념 점수화(F3): scale 응답 → 역채점 정렬 → 평균 → 지표(0~100)·수준(L/M/H).
//  - 프로파일 조합 규칙(F4): 척도 간 상호작용 해석(예: HA×SD).
//  - 12 직업 클러스터 매핑: RIASEC(흥미) + MI(강점) + 가치 + 기질적합계수 → 상위 3 방향 + 근거 칩.
//  - 응답 일관성(역채점 쌍) → 신뢰도. 모든 출력은 "현재 시점 참고자료".

import { questions } from "./questions";

export type Child = { name: string; sex: "여아" | "남아" | ""; birth: string; calendar: "solar" | "lunar"; timeMode: "exact" | "unknown"; birthHour: number | null };
export type Answers = Record<string, string | number | string[]>;

export type ConstructScore = { code: string; label: string; section: string; score: number; level: "L" | "M" | "H" };
export type ClusterScore = { name: string; emoji: string; score: number };

export type Report = {
  constellation: string; tag: string; emoji: string; temperament: string;
  strengths: { name: string; desc: string }[]; watchPoints: { name: string; desc: string }[];
  elements: Record<string, number>; dayStem: string; dayElement: string; strength: string; yongsin: string;
  pillars: { year: string; month: string; day: string; time: string };
  sajuExplanation: string;
  academic: { style: string; subjects: { subject: string; why: string }[]; selfRegulation: string; coaching: string };
  emoSocial: string; timeline: { stage: string; note: string; favorable: boolean; guide: string; caution?: string }[];
  futures: { title: string; why: string; nurture: string; chips: string[] }[];
  prescriptions: string[]; encouragement: string;
  // ── 시각화·근거용(엔진 산출) ──
  constructs: ConstructScore[];
  interest: Record<string, number>; // RIASEC 0~100
  mi: Record<string, number>;       // 다중지능 0~100
  clusterScores: ClusterScore[];    // 12 클러스터 0~100(내림차순)
  confidence: string;               // 응답 일관성 기반
};

// ─────────────────────────── 만세력(F1) ───────────────────────────
const stems = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const branches = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const elements = ["목", "화", "토", "금", "수"];
const stemElements = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const branchElements = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

function mod(value: number, divisor: number) { return ((value % divisor) + divisor) % divisor; }
function jdn(date: Date) {
  const year = date.getFullYear(); const month = date.getMonth() + 1; const day = date.getDate();
  const adjust = Math.floor((14 - month) / 12); const y = year + 4800 - adjust; const m = month + 12 * adjust - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

export function ageFromBirth(birth: string) {
  if (!birth) return null;
  const d = new Date(`${birth}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
}

// ─────────────────────── 구성개념 점수화(F3) ───────────────────────
function raw(answers: Answers, id: string): number | null {
  const v = answers[id];
  if (v === undefined || v === "unknown") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
const CONSTRUCTS: { code: string; label: string; section: string }[] = [
  { code: "NS", label: "자극추구", section: "기질" }, { code: "HA", label: "위험회피", section: "기질" },
  { code: "RD", label: "사회적 민감성", section: "기질" }, { code: "P", label: "인내력", section: "기질" },
  { code: "SD", label: "자율성", section: "성격" }, { code: "CO", label: "연대감", section: "성격" }, { code: "OP", label: "개방성", section: "성격" },
  { code: "ER", label: "정서조절", section: "정서" },
  { code: "FOCUS", label: "집중력", section: "자기조절" }, { code: "INHIBIT", label: "충동 조절", section: "자기조절" }, { code: "SHIFT", label: "유연한 전환", section: "자기조절" },
  { code: "GRIT", label: "끈기", section: "동기" },
];

// ─────────────────────── 강점·흥미 매핑 데이터 ───────────────────────
const MI_DOMAINS = ["언어", "논리수학", "공간", "음악", "신체운동", "인간친화", "자기성찰", "자연친화"];
const STRENGTH_MI: Record<string, string> = { visual: "공간", logic: "논리수학", language: "언어", music: "음악", body: "신체운동", social: "인간친화", nature: "자연친화", self: "자기성찰" };
const LEARNING_MI: Record<string, string> = { art: "공간", logic: "논리수학", language: "언어", nature: "자연친화", music: "음악", body: "신체운동" };
const RIASEC = ["R", "I", "A", "S", "E", "C"];
const RIASEC_LABEL: Record<string, string> = { R: "실행", I: "탐구", A: "예술", S: "사회", E: "진취", C: "관습" };
const MI_TO_RIASEC: Record<string, Record<string, number>> = {
  언어: { A: 0.5, S: 0.5 }, 논리수학: { I: 0.8, C: 0.2 }, 공간: { R: 0.4, A: 0.6 }, 음악: { A: 1 },
  신체운동: { R: 1 }, 인간친화: { S: 0.6, E: 0.4 }, 자기성찰: { I: 0.5, A: 0.5 }, 자연친화: { I: 0.5, R: 0.5 },
};
const MI_STRENGTH: Record<string, { name: string; desc: string }> = {
  논리수학: { name: "논리적 호기심", desc: "규칙과 원리를 발견하는 과정에서 즐거움을 느껴요." },
  언어: { name: "풍부한 언어 감각", desc: "말과 이야기로 생각을 또렷하게 풀어내요." },
  공간: { name: "시각·공간 감각", desc: "머릿속 이미지를 그림·구조로 잘 표현해요." },
  음악: { name: "리듬·소리 감각", desc: "소리와 리듬에 민감하게 반응하고 즐겨요." },
  신체운동: { name: "몸으로 배우는 힘", desc: "직접 움직이고 만지며 배울 때 가장 잘 익혀요." },
  인간친화: { name: "관계 감수성", desc: "사람의 마음을 읽고 함께하는 순간에 힘을 얻어요." },
  자기성찰: { name: "자기 이해력", desc: "자기 감정과 생각을 들여다보고 정리할 줄 알아요." },
  자연친화: { name: "섬세한 관찰력", desc: "자연과 사물의 작은 차이를 발견하고 연결해요." },
};

type Cluster = { name: string; emoji: string; riasec: Record<string, number>; mi: string[]; jobs: string[]; nurture: string; subject: string; element: string };
const CLUSTERS: Cluster[] = [
  { name: "탐구하는 과학자", emoji: "🔬", riasec: { I: 1 }, mi: ["논리수학", "자연친화"], jobs: ["데이터 사이언티스트", "AI 연구원", "바이오·유전공학 연구자"], nurture: "관찰한 것을 '왜?' 노트에 적고 작은 실험을 함께 해보세요.", subject: "수학·과학", element: "수" },
  { name: "만드는 공학자", emoji: "🛠️", riasec: { R: 1, I: 0.6 }, mi: ["신체운동", "논리수학", "공간"], jobs: ["로봇공학자", "재생에너지 엔지니어", "자율주행·전기차 전문가"], nurture: "분해·조립과 만들기 활동으로 손과 원리를 함께 익혀보세요.", subject: "수학·과학", element: "금" },
  { name: "디지털 개척자", emoji: "💻", riasec: { I: 0.8, C: 0.6 }, mi: ["논리수학"], jobs: ["소프트웨어 개발자", "사이버보안 전문가", "AI 에이전트 설계자"], nurture: "논리 퍼즐과 블록·텍스트 코딩을 놀이처럼 접해보세요.", subject: "수학·과학", element: "금" },
  { name: "상상하는 창작자", emoji: "🎨", riasec: { A: 1 }, mi: ["공간", "음악", "신체운동"], jobs: ["UX·경험 디자이너", "게임·XR 디자이너", "콘텐츠 크리에이터"], nurture: "결과보다 과정을 이야기하며 그림·만들기 작품을 남겨보세요.", subject: "예술·창작", element: "화" },
  { name: "이야기꾼·소통가", emoji: "📖", riasec: { A: 0.7, S: 0.6 }, mi: ["언어", "인간친화"], jobs: ["글로벌 콘텐츠 스토리텔러", "크로스미디어 기획자", "저널리스트"], nurture: "짧은 이야기를 짓고 가족 앞에서 발표해 보게 해주세요.", subject: "국어·사회", element: "화" },
  { name: "가르치고 키우는 사람", emoji: "🧑‍🏫", riasec: { S: 1 }, mi: ["언어", "인간친화", "자기성찰"], jobs: ["에듀테크 러닝 디자이너", "진로·학습 코치", "AI 튜터 설계자"], nurture: "배운 것을 가족에게 설명해 보며 가르치는 즐거움을 느껴보게 하세요.", subject: "국어·사회", element: "목" },
  { name: "돌보고 낫게 하는 사람", emoji: "🩺", riasec: { S: 0.9, I: 0.5 }, mi: ["인간친화", "자연친화", "신체운동"], jobs: ["디지털헬스 전문가", "놀이·미술·언어 치료사", "정신건강 전문가"], nurture: "친구 이야기를 끝까지 들어주기, 몸과 건강을 이해하는 활동을 해보세요.", subject: "국어·과학", element: "토" },
  { name: "함께 사는 사회 디자이너", emoji: "🤝", riasec: { S: 0.7, E: 0.6 }, mi: ["인간친화", "자기성찰"], jobs: ["소셜벤처 기획자", "커뮤니티 디자이너", "HR·조직문화 전문가"], nurture: "협동 놀이와 작은 봉사, 갈등을 조정하는 경험을 함께 해보세요.", subject: "국어·사회", element: "토" },
  { name: "도전하는 창업가", emoji: "🚀", riasec: { E: 1 }, mi: ["인간친화", "언어", "논리수학"], jobs: ["스타트업 창업가", "프로덕트 매니저", "그로스 마케터"], nurture: "아이디어를 직접 실행하고 발표하며 설득해 보게 해주세요.", subject: "사회·국어", element: "화" },
  { name: "똑똑한 관리자", emoji: "📊", riasec: { C: 1, E: 0.5 }, mi: ["논리수학", "자기성찰"], jobs: ["디지털금융·핀테크 기획자", "데이터 애널리스트", "ESG·리스크 분석가"], nurture: "하루 계획을 직접 세우고 숫자·규칙 놀이를 즐겨보게 하세요.", subject: "수학·사회", element: "금" },
  { name: "지구를 지키는 사람", emoji: "🌏", riasec: { R: 0.7, I: 0.7 }, mi: ["자연친화", "논리수학"], jobs: ["환경 엔지니어", "지속가능성 컨설턴트", "스마트농업·푸드테크 전문가"], nurture: "자연 관찰과 재활용·생태 활동을 꾸준히 기록해 보세요.", subject: "과학·사회", element: "목" },
  { name: "몸으로 움직이는 전문가", emoji: "🏃", riasec: { R: 1 }, mi: ["신체운동", "공간"], jobs: ["스마트건설·디지털트윈 전문가", "로봇 협업 기술자", "스포츠·퍼포먼스 코치"], nurture: "운동·조작 기술과 공간 감각을 쓰는 활동을 자주 경험하게 하세요.", subject: "체육·과학", element: "목" },
];

export function createReport(child: Child, answers: Answers): Report {
  const name = child.name || "우리 아이";

  // ── 만세력 계산 ──
  const date = new Date(`${child.birth || "2017-01-01"}T00:00:00`);
  const yearStemIndex = mod(date.getFullYear() - 4, 10); const yearBranchIndex = mod(date.getFullYear() - 4, 12);
  const monthBranchIndex = mod(date.getMonth() + 1, 12);
  const tigerStemStart = [2, 4, 6, 8, 0][yearStemIndex % 5];
  const monthStemIndex = mod(tigerStemStart + monthBranchIndex - 2, 10);
  const dayIndex = mod(10 + jdn(date) - 2415021, 60);
  const dayStemIndex = dayIndex % 10; const dayBranchIndex = dayIndex % 12;
  const hourBranchIndex = child.birthHour === null ? null : Math.floor(mod(child.birthHour + 1, 24) / 2);
  const hourStemIndex = hourBranchIndex === null ? null : mod([0, 2, 4, 6, 8][dayStemIndex % 5] + hourBranchIndex, 10);
  const pillarPairs: [number, number][] = [[yearStemIndex, yearBranchIndex], [monthStemIndex, monthBranchIndex], [dayStemIndex, dayBranchIndex]];
  if (hourStemIndex !== null && hourBranchIndex !== null) pillarPairs.push([hourStemIndex, hourBranchIndex]);
  const elementCounts = Object.fromEntries(elements.map((e) => [e, 0])) as Record<string, number>;
  pillarPairs.forEach(([s, b]) => { elementCounts[stemElements[s]] += 1; elementCounts[branchElements[b]] += 1; });
  const elementValues = elements.map((e) => elementCounts[e]);
  const strongest = elements[elementValues.indexOf(Math.max(...elementValues))];
  const balance = elements[elementValues.indexOf(Math.min(...elementValues))];
  const stem = stems[dayStemIndex]; const dayElement = stemElements[dayStemIndex];
  const generating: Record<string, string> = { 목: "수", 화: "목", 토: "화", 금: "토", 수: "금" };
  const strength = (elementCounts[dayElement] + elementCounts[generating[dayElement]]) / pillarPairs.length / 2 >= 0.45 ? "기운이 비교적 든든한 편" : "주변의 도움으로 균형을 찾는 편";

  // ── 구성개념 점수화(역채점 정렬 → 평균) ──
  const bucket: Record<string, number[]> = {};
  for (const q of questions) {
    if (q.kind !== "scale" || !q.tag) continue;
    const r = raw(answers, q.id);
    if (r === null) continue;
    (bucket[q.tag] ??= []).push(q.reverse ? 6 - r : r);
  }
  const mean = (tag: string): number | null => {
    const arr = bucket[tag];
    return arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  };
  const score100 = (tag: string): number => { const m = mean(tag); return m === null ? 50 : Math.round(((m - 1) / 4) * 100); };
  const levelOf = (tag: string): "L" | "M" | "H" => { const m = mean(tag); return m === null ? "M" : m >= 3.8 ? "H" : m <= 2.6 ? "L" : "M"; };
  const hi = (tag: string) => { const m = mean(tag); return m !== null && m >= 3.6; };
  const lo = (tag: string) => { const m = mean(tag); return m !== null && m <= 2.5; };
  const efComposite = [mean("FOCUS"), mean("INHIBIT"), mean("SHIFT")].filter((v): v is number => v !== null);
  const efMean = efComposite.length ? efComposite.reduce((a, b) => a + b, 0) / efComposite.length : null;

  const constructs: ConstructScore[] = CONSTRUCTS.map((c) => ({ code: c.code, label: c.label, section: c.section, score: score100(c.code), level: levelOf(c.code) }));

  // ── 다중지능(MI) 벡터 ──
  const miVec: Record<string, number> = Object.fromEntries(MI_DOMAINS.map((d) => [d, 0]));
  const chosen = Array.isArray(answers.strengths) ? (answers.strengths as string[]) : [];
  chosen.forEach((v) => { const d = STRENGTH_MI[v]; if (d) miVec[d] += 1; });
  const learn = typeof answers.learning === "string" ? LEARNING_MI[answers.learning] : undefined;
  if (learn) miVec[learn] += 1.2; // 몰입 놀이는 가중
  const miMax = Math.max(1, ...Object.values(miVec));
  const miNorm: Record<string, number> = Object.fromEntries(MI_DOMAINS.map((d) => [d, miVec[d] / miMax]));
  const topMI = [...MI_DOMAINS].sort((a, b) => miVec[b] - miVec[a]).filter((d) => miVec[d] > 0);

  // ── 흥미(RIASEC) 벡터: 수집 흥미 + MI 파생 + 가치 부스트 ──
  const interestCollected = RIASEC.some((k) => mean(k) !== null);
  const collected: Record<string, number> = Object.fromEntries(RIASEC.map((k) => { const m = mean(k); return [k, m === null ? 0 : (m - 1) / 4]; }));
  const derived: Record<string, number> = Object.fromEntries(RIASEC.map((k) => [k, 0]));
  MI_DOMAINS.forEach((d) => { const map = MI_TO_RIASEC[d]; for (const k in map) derived[k] += miNorm[d] * map[k]; });
  const derMax = Math.max(1e-6, ...Object.values(derived));
  RIASEC.forEach((k) => { derived[k] = derived[k] / derMax; });
  const combined: Record<string, number> = Object.fromEntries(RIASEC.map((k) => [k, interestCollected ? 0.6 * collected[k] + 0.4 * derived[k] : derived[k]]));
  // 가치·동기 선택 → 흥미 부스트(가치 tie-break)
  const motiveBoost: Record<string, string> = { discover: "I", recognition: "E", together: "S", achieve: "C" };
  const valueBoost: Record<string, string> = { help: "S", create: "A", lead: "E", organize: "C" };
  const bump = (k?: string) => { if (k && combined[k] !== undefined) combined[k] += 0.15; };
  bump(motiveBoost[String(answers.motivation)]); bump(valueBoost[String(answers.value)]);
  const combMax = Math.max(1e-6, ...Object.values(combined));
  const interest100: Record<string, number> = Object.fromEntries(RIASEC.map((k) => [k, Math.round((combined[k] / combMax) * 100)]));

  // ── 기질적합계수(0.85~1.15) ──
  function tempFit(c: Cluster): number {
    let f = 1;
    const primary = Object.entries(c.riasec).sort((a, b) => b[1] - a[1])[0][0];
    if (primary === "E") { if (hi("NS")) f += 0.1; if (hi("HA")) f -= 0.1; }
    if (primary === "S") { if (hi("RD") || hi("CO")) f += 0.1; if (lo("RD")) f -= 0.05; }
    if (primary === "I") { if ((efMean ?? 0) >= 3.6) f += 0.08; }
    if (primary === "R") { if (hi("NS")) f += 0.08; if (lo("NS")) f -= 0.05; }
    if (primary === "C") { if (hi("SD")) f += 0.1; if (lo("FOCUS")) f -= 0.05; }
    if (primary === "A") { if (hi("OP")) f += 0.1; }
    return Math.max(0.85, Math.min(1.15, f));
  }

  // ── 클러스터 점수 = 흥미매칭 + MI매칭 + 오행보정, × 기질적합 ──
  const rawScores = CLUSTERS.map((c) => {
    let s = 0;
    for (const k in c.riasec) s += (combined[k] ?? 0) * c.riasec[k];
    const miScore = c.mi.reduce((a, d) => a + (miNorm[d] ?? 0), 0) / c.mi.length;
    s += miScore * 0.9;
    if (c.element === balance) s += 0.12; // 부족 오행 보완(다양성)
    if (c.element === strongest) s += 0.05;
    return { cluster: c, score: s * tempFit(c) };
  });
  const scoreMax = Math.max(1e-6, ...rawScores.map((r) => r.score));
  const clusterScores: ClusterScore[] = [...rawScores].sort((a, b) => b.score - a.score).map((r) => ({ name: r.cluster.name, emoji: r.cluster.emoji, score: Math.round((r.score / scoreMax) * 100) }));

  // 상위 3 선정 + 대표 흥미유형 다양성 보정
  const ranked = [...rawScores].sort((a, b) => b.score - a.score);
  const top: typeof ranked = [];
  const usedPrimary = new Set<string>();
  for (const r of ranked) {
    const primary = Object.entries(r.cluster.riasec).sort((a, b) => b[1] - a[1])[0][0];
    if (top.length < 2 || !usedPrimary.has(primary) || top.length >= ranked.length - 1) { top.push(r); usedPrimary.add(primary); }
    if (top.length === 3) break;
  }
  while (top.length < 3) { const r = ranked[top.length]; if (!r) break; top.push(r); }

  // 근거 칩(contrib) 생성
  function chipsFor(c: Cluster): string[] {
    const chips: string[] = [];
    const miHit = c.mi.find((d) => topMI.slice(0, 3).includes(d));
    if (miHit) chips.push(`${miHit} 강점`);
    const primary = Object.entries(c.riasec).sort((a, b) => b[1] - a[1])[0][0];
    chips.push(`${RIASEC_LABEL[primary]} 흥미(${primary})`);
    if (c.element === balance) chips.push(`${balance} 기운 보완`);
    else if (c.element === strongest) chips.push(`${strongest} 기운`);
    return [...new Set(chips)].slice(0, 3);
  }

  const futures = top.map((r) => {
    const c = r.cluster; const chips = chipsFor(c);
    return { title: `${c.emoji} ${c.name}`, why: `${chips.slice(0, 2).join(" · ")} 신호가 이 방향을 함께 가리켜요. 이런 미래 직업으로 이어질 수 있어요: ${c.jobs.join(", ")}.`, nurture: c.nurture, chips };
  });

  // ── 강점(근거 기반 3) ──
  const strengths: { name: string; desc: string }[] = [];
  if (topMI[0]) strengths.push(MI_STRENGTH[topMI[0]]);
  const tempStrength: [boolean, { name: string; desc: string }][] = [
    [hi("CO"), { name: "따뜻한 연대감", desc: "다른 사람을 있는 그대로 받아들이고 함께하려는 마음이 커요." }],
    [hi("SD"), { name: "자기 주도성", desc: "스스로 정하고 지키며 해내려는 힘이 자라고 있어요." }],
    [hi("GRIT") || hi("P"), { name: "꾸준히 해내는 힘", desc: "속도가 조금 달라도 끝까지 이어가려는 끈기가 있어요." }],
    [hi("NS"), { name: "도전하는 호기심", desc: "낯선 경험에 먼저 다가가 배움의 실마리를 찾아요." }],
    [hi("RD"), { name: "섬세한 공감력", desc: "사람의 마음과 분위기를 빠르게 알아채요." }],
    [hi("OP"), { name: "풍부한 상상력", desc: "'왜?'를 던지며 새로운 생각을 자유롭게 떠올려요." }],
  ];
  for (const [cond, s] of tempStrength) { if (cond && strengths.length < 2) strengths.push(s); }
  if (topMI[1] && strengths.length < 3 && !strengths.includes(MI_STRENGTH[topMI[1]])) strengths.push(MI_STRENGTH[topMI[1]]);
  while (strengths.length < 3) strengths.push([{ name: "자기만의 속도", desc: "익숙한 리듬 안에서 차근차근 자신만의 방식을 만들어가요." }, { name: "새로운 것에 열린 마음", desc: "낯선 경험에서 배움의 실마리를 발견해요." }][strengths.length - 2] ?? { name: "빛나는 개성", desc: "자기만의 색으로 하루를 채워가는 아이예요." });

  // ── 함께 키워갈 지점(근거 기반 2, 프로파일 규칙 반영) ──
  const watchPoints: { name: string; desc: string }[] = [];
  if (lo("ER")) watchPoints.push({ name: "감정 가라앉히기", desc: "속상함을 말로 풀 수 있도록 충분히 기다려 주고 감정에 이름을 붙여주면 좋아요." });
  if (hi("HA") && lo("SD")) watchPoints.push({ name: "안전한 도전 경험", desc: "긴장이 큰 편이라, 미리 예고하고 작은 성공을 쌓아 '해봤더니 괜찮네' 경험을 늘려주세요." }); // F4: HA×SD
  if (lo("FOCUS") || lo("INHIBIT")) watchPoints.push({ name: "집중의 리듬 만들기", desc: "짧고 분명한 시작 단위와 몸을 쓰는 전환 시간을 함께 만들어 주면 좋아요." });
  if (lo("GRIT")) watchPoints.push({ name: "흥미를 이어가는 힘", desc: "여러 관심을 오가도 괜찮아요. 하나를 조금 더 깊이 가보는 작은 목표를 함께 정해보세요." });
  while (watchPoints.length < 2) watchPoints.push([{ name: "쉬어가는 신호 살피기", desc: "잘 해내려는 마음이 커질 때는 함께 멈추고 쉬는 신호도 챙겨주세요." }, { name: "선택의 경험 넓히기", desc: "작은 일부터 아이가 직접 고르게 하며 자기 결정의 근육을 키워주세요." }][watchPoints.length]);
  watchPoints.length = 2;

  // ── 학업(강점 교과 + 학습 스타일 + 코칭) ──
  const subjSignals: { subject: string; why: string; w: number }[] = [
    { subject: "수학·과학", why: "규칙을 찾고 원인을 탐색하는 강점과 잘 맞아요.", w: (miNorm["논리수학"] ?? 0) + combined["I"] },
    { subject: "국어·사회", why: "사람과 세상을 말·이야기로 이해하고 연결하는 강점이 보여요.", w: (miNorm["언어"] ?? 0) + combined["S"] },
    { subject: "예술·창작", why: "그림·리듬·표현 활동이 생각을 넓히는 통로가 될 수 있어요.", w: (miNorm["공간"] ?? 0) + (miNorm["음악"] ?? 0) + combined["A"] },
    { subject: "체육·실기", why: "몸으로 직접 익히는 방식이 배움을 오래 남게 해요.", w: (miNorm["신체운동"] ?? 0) + combined["R"] },
    { subject: "과학탐구·생태", why: "관찰하고 분류하는 활동에서 몰입이 살아나요.", w: (miNorm["자연친화"] ?? 0) },
  ];
  const subjects = subjSignals.sort((a, b) => b.w - a.w).slice(0, 3).filter((s, i) => i === 0 || s.w > 0).map(({ subject, why }) => ({ subject, why }));
  const logicLean = (miNorm["논리수학"] ?? 0) + combined["I"] >= (miNorm["언어"] ?? 0) + combined["S"];
  const academic = {
    style: logicLean ? "원리를 찾고 직접 풀어보며 배울 때 집중이 살아나요." : "이야기·이미지·경험을 연결할 때 배움이 오래 남아요.",
    subjects,
    selfRegulation: (efMean ?? 3) >= 3.6 ? "스스로 시작하고 이어가는 리듬이 자라고 있어요." : "시작과 전환을 돕는 작은 구조(타이머·체크리스트)가 특히 유용해요.",
    coaching: hi("HA") ? "새로운 것을 강요하기보다 미리 예고하고, 아이의 속도를 존중하며 작은 성공을 함께 짚어주세요."
      : hi("NS") || lo("INHIBIT") ? "충분히 몸을 쓰는 활동으로 에너지를 풀어주고, 시작 전 규칙을 한 번 더 확인하면 좋아요."
        : "비교보다 '어떤 방법이 재미있었어?'를 물으며 과정의 언어를 늘려주세요.",
  };

  // ── 정서·사회성 ──
  const emoSocial = hi("RD") || hi("CO")
    ? "다른 사람의 마음에 민감한 편이라 관계에서 에너지를 얻어요. 대신 혼자 회복하는 시간도 함께 존중해 주세요."
    : hi("HA")
      ? "자기만의 생각을 정리한 뒤 관계로 나아가는 편일 수 있어요. 억지로 빠르게 어울리게 하기보다 안전한 한두 관계부터 넓혀가면 좋아요."
      : "관계와 혼자만의 시간 사이에서 자기 리듬을 찾아가는 중이에요. 아이가 편안해하는 어울림의 크기를 함께 존중해 주세요.";

  // ── 별자리(대표 성향) ──
  const persona = hi("NS") ? { c: "호기심 탐험가", e: "✨" }
    : hi("CO") || combined["S"] >= Math.max(combined["I"], combined["A"], combined["R"], combined["C"]) ? { c: "따뜻한 연결가", e: "🤝" }
      : topMI[0] === "논리수학" || combined["I"] >= combined["A"] ? { c: "탐구하는 사색가", e: "🔭" }
        : topMI[0] === "공간" || topMI[0] === "음악" || combined["A"] > 0.5 ? { c: "상상하는 창작가", e: "🎨" }
          : hi("GRIT") || hi("P") ? { c: "차분한 완주자", e: "🌟" } : { c: "빛나는 관찰자", e: "🌙" };

  // ── 응답 일관성 → 신뢰도 ──
  const pairDiff = (a: string, b: string): number | null => { const x = raw(answers, a); const y = raw(answers, b); return x === null || y === null ? null : Math.abs(x - (6 - y)); };
  const diffs = [pairDiff("persistence", "giveup"), pairDiff("calm", "outburst"), pairDiff("grit1", "grit2")].filter((v): v is number => v !== null);
  const answeredScales = questions.filter((q) => q.kind === "scale" && raw(answers, q.id) !== null).length;
  const totalScales = questions.filter((q) => q.kind === "scale" && !q.age10Only).length;
  const avgDiff = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0;
  const confidence = answeredScales < totalScales * 0.6 ? "낮음 (문항이 많이 비어 참고 범위가 넓어요)"
    : avgDiff <= 1 ? "높음 (응답이 일관돼요)" : avgDiff <= 2 ? "보통" : "낮음 (응답이 다소 엇갈려 참고로만 봐주세요)";

  // 나이대별 '이렇게 지도해요' — 진로발달 단계(흥미형성→탐색→연결)에 아이 성향을 반영
  const topName = top[0]?.cluster.name;
  const stageApproach = hi("HA")
    ? "새로운 도전은 미리 예고하고 작게 쪼개 '해봤더니 괜찮네' 경험을 쌓아주세요."
    : hi("NS") || lo("INHIBIT")
      ? "에너지를 마음껏 쓸 활동을 주되, 시작 전 규칙을 한 번 더 함께 확인해요."
      : "아이의 속도를 존중하며 '어떤 게 재미있었어?'를 자주 물어봐 주세요.";
  const timeline = [
    {
      stage: "지금 (유아·초등 저학년)", favorable: true,
      note: "좋아하는 것을 마음껏 경험하며 자신감을 쌓는 시기",
      guide: `아직 직업이 아니라 '흥미의 씨앗'을 뿌리는 때예요. 잘하는 것보다 즐거워하는 순간을 함께 짚어주고, 여러 놀이를 폭넓게 경험하게 하세요. ${stageApproach}`,
    },
    {
      stage: "초등 중·고학년", favorable: !hi("HA"),
      note: hi("HA") ? "새로운 흥미를 안전하게 넓혀보는 시기 — 예고와 응원이 힘이 돼요" : "흥미를 여러 활동으로 넓히며 강점을 확인하는 시기",
      guide: `${(efMean ?? 3) < 3.6 ? "시작·정리를 돕는 작은 루틴(타이머·체크리스트)을 함께 만들고, " : ""}관심을 하나로 좁히기보다 여러 활동을 직접 체험하게 해주세요.${topName ? ` 지금 보이는 '${topName}' 결의 체험을 곁들이면 흥미가 또렷해져요.` : ""}`,
      ...(hi("HA") ? { caution: "새 학년·새 관계처럼 변화가 늘어 부담을 느끼기 쉬운 시기예요. 바뀌는 일은 미리 알려주고, 잘 안 된 날도 '그럴 수 있어'라고 먼저 안심시켜 주세요. 위축이 오래가면 재촉하지 말고 천천히 함께 살펴봐요." } : {}),
    },
    {
      stage: "청소년기", favorable: !lo("ER"),
      note: lo("ER") ? "감정의 파도가 커지는 시기 — 마음을 먼저 다독여 주면 좋아요" : "스스로 선택하고 깊이를 만들어가는 시기",
      guide: "선택권을 넘겨주고 관심사를 깊이 파보게 하세요. 진로를 대신 정해주기보다, 실제 경험(체험·봉사·동아리)과 좋은 어른(멘토)을 만나게 해 '스스로 고르는 힘'을 키워요.",
      ...(lo("ER") ? { caution: "기복이 커지는 시기라, 성취를 밀어붙이기 전에 감정을 먼저 다독여 주세요. 마음을 말로 풀 수 있게 기다려주고, 힘들어하는 신호가 오래가면 전문가와 상의해도 괜찮아요." } : {}),
    },
    {
      stage: "성인 초입", favorable: true,
      note: "강점을 삶의 방향으로 연결해 보는 시기",
      guide: "진로는 한 번에 정해지지 않고 자라며 바뀌어요. 아이의 선택을 지지하고, 한 직업보다 '옮겨가며 배우는 힘(평생학습·적응력)'을 응원해 주세요.",
    },
  ];

  return {
    constellation: persona.c, emoji: persona.e, tag: `${strongest}의 기운으로 자기만의 빛을 만드는 아이`,
    temperament: `${name}는 새로운 경험과 익숙한 리듬 사이에서 자신만의 속도를 찾아가는 중이에요. 아래는 성향 응답을 근거로 계산하고, 사주는 이야기의 문화적 배경(참고)으로 함께 본 결과예요. (응답 신뢰도: ${confidence})`,
    strengths, watchPoints,
    elements: elementCounts, dayStem: stem, dayElement, strength, yongsin: `${balance} 기운을 채우는 경험`,
    pillars: { year: `${stems[yearStemIndex]}${branches[yearBranchIndex]}`, month: `${stems[monthStemIndex]}${branches[monthBranchIndex]}`, day: `${stems[dayStemIndex]}${branches[dayBranchIndex]}`, time: hourStemIndex === null || hourBranchIndex === null ? "모름" : `${stems[hourStemIndex]}${branches[hourBranchIndex]}` },
    sajuExplanation: `${name}의 중심 기운은 ${dayElement}(${stem})로 읽혀요. ${dayElement === "목" ? "새롭게 자라고 방향을 찾아가는 힘" : dayElement === "화" ? "표현하고 따뜻하게 에너지를 나누는 힘" : dayElement === "토" ? "안정적으로 쌓고 돌보는 힘" : dayElement === "금" ? "기준을 세우고 다듬는 힘" : "깊이 생각하고 유연하게 흐르는 힘"}에 가깝습니다. ${balance} 기운은 부족하다는 평가가 아니라, 다양한 경험으로 채워가면 좋은 성장의 힌트예요.`,
    academic, emoSocial, timeline, futures,
    prescriptions: [
      "하루 10분, 아이가 고른 활동에 온전히 함께 있어 주세요.",
      "잘한 결과보다 시도한 방법을 구체적으로 말해 주세요.",
      top[0] ? `이번 주엔 '${top[0].cluster.name}' 방향의 작은 활동을 하나 같이 해보세요 — ${top[0].cluster.nurture}` : "일주일에 한 번 '이번 주에 궁금했던 것'을 함께 기록해 보세요.",
    ],
    encouragement: `${name}의 미래는 하나로 정해져 있지 않아요. 오늘의 작은 호기심과 돌봄이 내일의 별자리를 조금씩 밝혀줄 거예요.`,
    constructs, interest: interest100, mi: Object.fromEntries(MI_DOMAINS.map((d) => [d, Math.round(miNorm[d] * 100)])), clusterScores, confidence,
  };
}

export function createAnswer(question: string, report: Report) {
  const lowered = question.replaceAll(" ", "");
  if (lowered.includes("약") || lowered.includes("걱정")) return `걱정되는 모습도 ${report.watchPoints[0].name}을(를) 함께 연습할 기회로 볼 수 있어요. ${report.watchPoints[0].desc} 아이의 속도와 상황을 살피며, 어려움이 오래 지속되면 전문가와 상의해 보세요.`;
  if (lowered.includes("직업") || lowered.includes("미래")) return `${report.futures[0].title} 방향은 지금 보이는 강점 신호(${report.futures[0].chips.join(", ")})를 바탕으로 한 가능성 중 하나예요. ${report.futures[0].nurture} 직업을 정하기보다 다양한 경험으로 좋아하는 방식을 찾아가면 충분해요.`;
  return `${report.strengths[0].name}을(를) 키우려면 아이가 고른 활동에서 작은 선택권을 주는 것이 좋아요. ${report.academic.coaching} 이 결과는 성장의 참고용 나침반이라는 점도 함께 기억해 주세요.`;
}
