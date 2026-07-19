// 문항 뱅크 v0.2 — docs/research.md Part 1 근거
// - 각 scale 문항은 구성개념 tag를 가진다(분석 엔진이 이 태그로 신호를 집계).
// - reverse=true 문항은 역채점(6 - 응답). 같은 구성개념의 정방향 문항과 짝지어 응답 일관성 점검에 쓰인다.
// - age10Only 문항(RIASEC 흥미)은 만 10세 이상 자기응답 병행 시에만 노출.
//
// 구성개념 코드
//   기질(JTCI): NS 자극추구 · HA 위험회피 · RD 사회적 민감성 · P 인내력
//   성격(Big Five 겸): SD 자율성/성실성 · CO 연대감/우호성 · OP 개방성
//   정서: ER 정서조절
//   실행기능(EF): FOCUS 집중 · INHIBIT 억제 · SHIFT 인지적 유연성(전환)
//   동기: GRIT 끈기
//   흥미(Holland): R I A S E C
// ※ 표준화 검사 원문항은 저작권 대상. 아래는 공개 도메인 도구·구성개념 정의 기반 재구성 템플릿.

export type QuestionKind = "scale" | "choice" | "multi";

export type Question = {
  id: string;
  section: string;
  text: string;
  kind: QuestionKind;
  /** scale 문항의 측정 구성개념 코드 */
  tag?: string;
  /** 역채점 문항(6 - 응답으로 방향 정렬) */
  reverse?: boolean;
  options?: { label: string; value: string; emoji?: string }[];
  /** 만 10세 이상에서만 노출(자기응답 병행) */
  age10Only?: boolean;
};

export const questions: Question[] = [
  // ── 기질(선천) ──────────────────────────────
  { id: "novelty", section: "기질", tag: "NS", text: "새로운 놀이나 장난감을 보면 먼저 다가가 살펴봐요.", kind: "scale" },
  { id: "approach", section: "기질", tag: "NS", text: "처음 보는 사람에게도 스스럼없이 말을 걸어요.", kind: "scale" },
  { id: "caution", section: "기질", tag: "HA", text: "새로운 것을 시도할 때 유난히 긴장하고 조심스러워해요.", kind: "scale" },
  { id: "shy", section: "기질", tag: "HA", text: "낯선 장소에서는 뒤로 물러서거나 보호자를 찾아요.", kind: "scale" },
  { id: "sensitive", section: "관계", tag: "RD", text: "다른 사람의 표정이나 기분 변화를 예민하게 알아채요.", kind: "scale" },
  { id: "praise", section: "관계", tag: "RD", text: "칭찬이나 인정을 받으면 유난히 기뻐하고 힘을 내요.", kind: "scale" },
  { id: "persistence", section: "동기", tag: "P", text: "어려운 일이 있어도 끝까지 해보려고 해요.", kind: "scale" },
  { id: "giveup", section: "동기", tag: "P", reverse: true, text: "조금 어려우면 금방 포기하는 편이에요.", kind: "scale" },

  // ── 성격(후천 강점) ─────────────────────────
  { id: "autonomy", section: "성격", tag: "SD", text: "누가 시키지 않아도 스스로 할 일을 정하고 지키려 해요.", kind: "scale" },
  { id: "kindness", section: "성격", tag: "CO", text: "친구가 힘들어하면 먼저 위로하거나 도와줘요.", kind: "scale" },
  { id: "imagine", section: "성격", tag: "OP", text: "상상력이 풍부하고 '왜?'라는 질문을 자주 해요.", kind: "scale" },

  // ── 정서조절 ────────────────────────────────
  { id: "calm", section: "정서", tag: "ER", text: "속상한 일이 있어도 마음을 비교적 빨리 가라앉혀요.", kind: "scale" },
  { id: "outburst", section: "정서", tag: "ER", reverse: true, text: "화가 나면 잘 참지 못하고 크게 터뜨려요.", kind: "scale" },

  // ── 자기조절(실행기능) ──────────────────────
  { id: "focus", section: "자기조절", tag: "FOCUS", text: "해야 할 일을 시작하면 한동안 집중을 이어가요.", kind: "scale" },
  { id: "impulse", section: "자기조절", tag: "INHIBIT", reverse: true, text: "생각하기 전에 행동이 먼저 나갈 때가 많아요.", kind: "scale" },
  { id: "transition", section: "자기조절", tag: "SHIFT", reverse: true, text: "하던 일에서 다른 일로 넘어가는 걸 특히 힘들어해요.", kind: "scale" },

  // ── 동기(그릿) ──────────────────────────────
  { id: "grit1", section: "동기", tag: "GRIT", text: "한번 시작한 일은 웬만하면 끝까지 해내요.", kind: "scale" },
  { id: "grit2", section: "동기", tag: "GRIT", reverse: true, text: "새로운 것에 확 빠졌다가 이내 흥미를 잃곤 해요.", kind: "scale" },

  // ── 학습·강점·동기(선택형) ──────────────────
  { id: "learning", section: "학습", text: "우리 아이가 가장 시간 가는 줄 모르고 몰입하는 놀이는 무엇인가요?", kind: "choice", options: [
    { emoji: "🎨", label: "그림·만들기", value: "art" }, { emoji: "🧩", label: "퍼즐·숫자·규칙", value: "logic" },
    { emoji: "📖", label: "이야기·역할놀이", value: "language" }, { emoji: "🌿", label: "자연·동식물 관찰", value: "nature" },
    { emoji: "🎵", label: "노래·리듬", value: "music" }, { emoji: "🤸", label: "몸으로 하는 활동", value: "body" },
  ] },
  { id: "strengths", section: "강점", text: "잘하거나 즐기는 것을 모두 골라주세요.", kind: "multi", options: [
    { emoji: "🎨", label: "그림·공간", value: "visual" }, { emoji: "🧩", label: "문제 풀기", value: "logic" },
    { emoji: "📚", label: "말·이야기", value: "language" }, { emoji: "🎵", label: "리듬·노래", value: "music" },
    { emoji: "🤸", label: "몸으로 배우기", value: "body" }, { emoji: "🤝", label: "친구 돕기", value: "social" },
    { emoji: "🌱", label: "동식물 관찰", value: "nature" }, { emoji: "🌙", label: "혼자 생각하기", value: "self" },
  ] },
  { id: "motivation", section: "동기", text: "우리 아이가 가장 크게 기뻐하는 순간은 언제에 가깝나요?", kind: "choice", options: [
    { emoji: "✨", label: "새로운 걸 발견할 때", value: "discover" }, { emoji: "🌟", label: "칭찬·인정받을 때", value: "recognition" },
    { emoji: "🫶", label: "함께 해냈을 때", value: "together" }, { emoji: "🏁", label: "스스로 해냈을 때", value: "achieve" },
  ] },
  { id: "value", section: "관계", text: "둘 중 하나라면 아이가 더 끌리는 쪽은 무엇에 가깝나요?", kind: "choice", options: [
    { emoji: "🤝", label: "남을 돕는 일", value: "help" }, { emoji: "🎨", label: "새로 만드는 일", value: "create" },
    { emoji: "🚩", label: "이끄는 일", value: "lead" }, { emoji: "🗂️", label: "꼼꼼히 정리하는 일", value: "organize" },
  ] },

  // ── 흥미(Holland RIASEC) · 만 10세+ ──────────
  { id: "interestR", section: "흥미", tag: "R", age10Only: true, text: "만들기·조립·운동처럼 몸과 도구를 쓰는 활동이 좋아요.", kind: "scale" },
  { id: "interestI", section: "흥미", tag: "I", age10Only: true, text: "왜 그런지 알아보고 실험·관찰하는 활동이 좋아요.", kind: "scale" },
  { id: "interestA", section: "흥미", tag: "A", age10Only: true, text: "그림·글·음악으로 내 생각을 표현하는 활동이 좋아요.", kind: "scale" },
  { id: "interestS", section: "흥미", tag: "S", age10Only: true, text: "친구를 돕거나 가르쳐 주는 활동이 좋아요.", kind: "scale" },
  { id: "interestE", section: "흥미", tag: "E", age10Only: true, text: "친구들을 이끌거나 발표하는 활동이 좋아요.", kind: "scale" },
  { id: "interestC", section: "흥미", tag: "C", age10Only: true, text: "계획을 세우고 순서대로 정리하는 활동이 좋아요.", kind: "scale" },
];
