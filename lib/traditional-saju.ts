export type TraditionalSajuInput = {
  birth: string;
  sex: "여아" | "남아" | "";
  calendar: "solar" | "lunar";
  birthHour: number | null;
};

type Pillar = {
  label: string;
  stem: string;
  branch: string;
  hiddenStems: string[];
  stemTenGod: string;
  hiddenTenGods: string[];
  lifeStage: string;
};

export type TraditionalSajuAnalysis = {
  pillars: { year: string; month: string; day: string; time: string };
  pillarDetails: Pillar[];
  elements: Record<string, number>;
  dayStem: string;
  dayElement: string;
  strength: string;
  balanceElement: string;
  yongsin: string;
  seasonalTerm: string;
  monthCommand: string;
  relations: { kind: "합" | "충"; target: string; description: string }[];
  daeun: { direction: "순행" | "역행"; startAge: number; periods: { pillar: string; ages: string }[]; note: string };
  currentYear: { pillar: string; tenGod: string; note: string };
  precisionNotes: string[];
};

const stems = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const branches = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const elementNames = ["목", "화", "토", "금", "수"];
const stemElements = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const branchElements = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];
const hiddenStemIndexes = [[9], [5, 9, 7], [0, 2, 4], [1], [4, 1, 9], [2, 4, 6], [3, 5], [5, 3, 1], [6, 8, 4], [7], [4, 7, 3], [8, 0]];
const lifeStageStarts = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
const lifeStages = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"];
const controlMap = [2, 3, 4, 0, 1];

function mod(value: number, divisor: number) { return ((value % divisor) + divisor) % divisor; }
function jdn(date: Date) {
  const year = date.getFullYear(); const month = date.getMonth() + 1; const day = date.getDate();
  const adjust = Math.floor((14 - month) / 12); const y = year + 4800 - adjust; const m = month + 12 * adjust - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// 절입 시각까지 반영한 천문 만세력은 아니며, 월주·대운의 기준점을 투명하게 드러내기 위한 주요 절기 근사표입니다.
const termSeeds = [
  [1, 6, 1, "소한"], [2, 4, 2, "입춘"], [3, 6, 3, "경칩"], [4, 5, 4, "청명"], [5, 6, 5, "입하"], [6, 6, 6, "망종"],
  [7, 7, 7, "소서"], [8, 8, 8, "입추"], [9, 8, 9, "백로"], [10, 8, 10, "한로"], [11, 7, 11, "입동"], [12, 7, 0, "대설"],
] as const;

function termsAround(year: number) {
  return [year - 1, year, year + 1].flatMap((y) => termSeeds.map(([month, day, branch, name]) => ({ date: new Date(y, month - 1, day), branch, name, year: y }))).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function tenGod(dayStemIndex: number, targetStemIndex: number) {
  const dayElementIndex = Math.floor(dayStemIndex / 2); const targetElementIndex = Math.floor(targetStemIndex / 2);
  const samePolarity = dayStemIndex % 2 === targetStemIndex % 2;
  if (dayElementIndex === targetElementIndex) return samePolarity ? "비견" : "겁재";
  if (targetElementIndex === mod(dayElementIndex + 1, 5)) return samePolarity ? "식신" : "상관";
  if (dayElementIndex === mod(targetElementIndex + 1, 5)) return samePolarity ? "편인" : "정인";
  if (targetElementIndex === controlMap[dayElementIndex]) return samePolarity ? "편재" : "정재";
  return samePolarity ? "편관" : "정관";
}

function lifeStage(dayStemIndex: number, branchIndex: number) {
  const direction = dayStemIndex % 2 === 0 ? 1 : -1;
  return lifeStages[mod(direction * (branchIndex - lifeStageStarts[dayStemIndex]), 12)];
}

function relationItems(stemIndexes: number[], branchIndexes: number[]) {
  const pairs: { kind: "합" | "충"; target: string; description: string }[] = [];
  const stemHap = [[0, 5], [1, 6], [2, 7], [3, 8], [4, 9]];
  const branchHap = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
  const branchChung = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
  const present = (pair: number[], values: number[]) => pair.every((value) => values.includes(value));
  stemHap.filter((pair) => present(pair, stemIndexes)).forEach((pair) => pairs.push({ kind: "합", target: `${stems[pair[0]]}${stems[pair[1]]}`, description: "천간끼리 만나는 관계" }));
  branchHap.filter((pair) => present(pair, branchIndexes)).forEach((pair) => pairs.push({ kind: "합", target: `${branches[pair[0]]}${branches[pair[1]]}`, description: "지지끼리 조화를 이루는 관계" }));
  branchChung.filter((pair) => present(pair, branchIndexes)).forEach((pair) => pairs.push({ kind: "충", target: `${branches[pair[0]]}${branches[pair[1]]}`, description: "지지끼리 변화·긴장을 만드는 관계" }));
  return pairs;
}

export function calculateTraditionalSaju(input: TraditionalSajuInput): TraditionalSajuAnalysis {
  const date = new Date(`${input.birth || "2017-01-01"}T00:00:00`);
  const terms = termsAround(date.getFullYear());
  const activeTerm = [...terms].reverse().find((term) => term.date <= date) ?? terms[0];
  const sajuYear = date < new Date(date.getFullYear(), 1, 4) ? date.getFullYear() - 1 : date.getFullYear();
  const yearStemIndex = mod(sajuYear - 4, 10); const yearBranchIndex = mod(sajuYear - 4, 12);
  const monthBranchIndex = activeTerm.branch;
  const tigerStemStart = [2, 4, 6, 8, 0][yearStemIndex % 5];
  const monthStemIndex = mod(tigerStemStart + monthBranchIndex - 2, 10);
  const dayIndex = mod(10 + jdn(date) - 2415021, 60);
  const dayStemIndex = dayIndex % 10; const dayBranchIndex = dayIndex % 12;
  const hourBranchIndex = input.birthHour === null ? null : Math.floor(mod(input.birthHour + 1, 24) / 2);
  const hourStemIndex = hourBranchIndex === null ? null : mod([0, 2, 4, 6, 8][dayStemIndex % 5] + hourBranchIndex, 10);
  const pairs: [string, number, number][] = [["년", yearStemIndex, yearBranchIndex], ["월", monthStemIndex, monthBranchIndex], ["일", dayStemIndex, dayBranchIndex]];
  if (hourStemIndex !== null && hourBranchIndex !== null) pairs.push(["시", hourStemIndex, hourBranchIndex]);
  const elementCounts = Object.fromEntries(elementNames.map((element) => [element, 0])) as Record<string, number>;
  pairs.forEach(([, stemIndex, branchIndex]) => { elementCounts[stemElements[stemIndex]] += 1; elementCounts[branchElements[branchIndex]] += 1; });
  const values = elementNames.map((element) => elementCounts[element]);
  const strongest = elementNames[values.indexOf(Math.max(...values))];
  const balanceElement = elementNames[values.indexOf(Math.min(...values))];
  const dayElement = stemElements[dayStemIndex];
  const generatingElement: Record<string, string> = { 목: "수", 화: "목", 토: "화", 금: "토", 수: "금" };
  const supportRatio = (elementCounts[dayElement] + elementCounts[generatingElement[dayElement]]) / (pairs.length * 2);
  const strength = supportRatio >= .45 ? "일간을 돕는 기운이 비교적 많은 편" : "일간과 다른 기운이 고르게 섞인 편";
  const pillars = { year: `${stems[yearStemIndex]}${branches[yearBranchIndex]}`, month: `${stems[monthStemIndex]}${branches[monthBranchIndex]}`, day: `${stems[dayStemIndex]}${branches[dayBranchIndex]}`, time: hourStemIndex === null || hourBranchIndex === null ? "모름" : `${stems[hourStemIndex]}${branches[hourBranchIndex]}` };
  const pillarDetails = pairs.map(([label, stemIndex, branchIndex]) => ({ label, stem: stems[stemIndex], branch: branches[branchIndex], hiddenStems: hiddenStemIndexes[branchIndex].map((index) => stems[index]), stemTenGod: label === "일" ? "일간(나)" : tenGod(dayStemIndex, stemIndex), hiddenTenGods: hiddenStemIndexes[branchIndex].map((index) => tenGod(dayStemIndex, index)), lifeStage: lifeStage(dayStemIndex, branchIndex) }));
  if (hourStemIndex === null || hourBranchIndex === null) pillarDetails.push({ label: "시", stem: "—", branch: "—", hiddenStems: [], stemTenGod: "미입력", hiddenTenGods: [], lifeStage: "—" });
  const yearPolarityYang = yearStemIndex % 2 === 0;
  const forward = (input.sex === "남아" && yearPolarityYang) || (input.sex === "여아" && !yearPolarityYang);
  const boundary = forward ? terms.find((term) => term.date > date) : [...terms].reverse().find((term) => term.date < date);
  const distanceDays = boundary ? Math.abs(jdn(boundary.date) - jdn(date)) : 15;
  const startAge = Math.max(1, Math.min(10, Math.round(distanceDays / 3)));
  const direction: "순행" | "역행" = forward ? "순행" : "역행";
  const daeun = { direction, startAge, periods: Array.from({ length: 6 }, (_, index) => ({ pillar: `${stems[mod(monthStemIndex + (forward ? 1 : -1) * (index + 1), 10)]}${branches[mod(monthBranchIndex + (forward ? 1 : -1) * (index + 1), 12)]}`, ages: `${startAge + index * 10}~${startAge + index * 10 + 9}세` })), note: `${forward ? "다음" : "이전"} 주요 절기까지 약 ${distanceDays}일을 3일=1년 방식으로 환산한 근사 시작 나이` };
  const now = new Date(); const flowYear = now.getFullYear(); const flowStemIndex = mod(flowYear - 4, 10); const flowBranchIndex = mod(flowYear - 4, 12);
  const currentYear = { pillar: `${flowYear}년 ${stems[flowStemIndex]}${branches[flowBranchIndex]}`, tenGod: tenGod(dayStemIndex, flowStemIndex), note: `${tenGod(dayStemIndex, flowStemIndex)} 관계의 해로 읽는 간이 세운 지표` };
  const precisionNotes = ["월주는 주요 절기 날짜를 기준으로 계산했지만, 절입의 정확한 시각·출생 지역·진태양시는 반영하지 않았어요.", "음력·윤달 입력은 양력 변환이 자동 적용되지 않아, 정밀 명식에는 양력 생년월일이 필요해요.", "대운 시작 나이와 용신은 학파별 차이가 있고, 여기서는 계산 규칙을 공개한 근사값이에요."];
  return { pillars, pillarDetails, elements: elementCounts, dayStem: stems[dayStemIndex], dayElement, strength, balanceElement, yongsin: `${balanceElement} 기운을 채우는 경험`, seasonalTerm: activeTerm.name, monthCommand: `${branches[monthBranchIndex]}월령 · ${pillarDetails[1].hiddenStems[0]}(${pillarDetails[1].hiddenTenGods[0]})`, relations: relationItems(pairs.map(([, stemIndex]) => stemIndex), pairs.map(([, , branchIndex]) => branchIndex)), daeun, currentYear, precisionNotes };
}
