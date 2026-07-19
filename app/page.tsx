"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ageFromBirth, createAnswer, createReport, type Answers, type Child, type Report } from "../lib/analysis";
import { questions } from "../lib/questions";

type Screen = "intro" | "details" | "questions" | "loading" | "report";
type Message = { from: "me" | "ai"; text: string };
const storageKey = "growth-compass-mvp-v1";
const showQa = false;
const blankChild: Child = { name: "", sex: "", birth: "", calendar: "solar", timeMode: "exact", birthHour: 12 };

function isCurrentReport(value: unknown): value is Report {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<Report>;
  return Boolean(
    report.pillars && report.elements && Array.isArray(report.constructs) && report.interest
    && Array.isArray(report.clusterScores) && report.confidence,
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [consent, setConsent] = useState(false);
  const [child, setChild] = useState<Child>(blankChild);
  const [answers, setAnswers] = useState<Answers>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const age = ageFromBirth(child.birth);
  const activeQuestions = useMemo(() => questions.filter((q) => !q.age10Only || (age !== null && age >= 10)), [age]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved) as Partial<{ screen: Screen; consent: boolean; child: Child; answers: Answers; questionIndex: number; report: Report; messages: Message[] }>;
        const restoredChild = data.child ?? blankChild;
        const restoredAnswers = data.answers ?? {};
        const restoredReport = isCurrentReport(data.report) ? data.report : data.report ? createReport(restoredChild, restoredAnswers) : null;
        setScreen(data.screen === "loading" ? "questions" : data.screen ?? "intro");
        setConsent(data.consent ?? false); setChild(restoredChild); setAnswers(restoredAnswers);
        setQuestionIndex(data.questionIndex ?? 0); setReport(restoredReport); setMessages(data.messages ?? []);
      }
    } catch { localStorage.removeItem(storageKey); }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify({ screen, consent, child, answers, questionIndex, report, messages }));
  }, [hydrated, screen, consent, child, answers, questionIndex, report, messages]);

  function updateChild<K extends keyof Child>(key: K, value: Child[K]) { setChild((current) => ({ ...current, [key]: value })); }
  function beginQuestions() { if (validDetails) { setQuestionIndex(0); setScreen("questions"); } }
  const validDetails = Boolean(child.name.trim() && child.sex && child.birth && (child.timeMode === "unknown" || child.birthHour !== null));
  function choose(value: string | number) {
    const question = activeQuestions[questionIndex];
    setAnswers((current) => ({ ...current, [question.id]: value }));
    if (question.kind !== "multi") window.setTimeout(() => nextQuestion(), 180);
  }
  function toggleMulti(value: string) {
    const question = activeQuestions[questionIndex]; const selected = (answers[question.id] as string[] | undefined) ?? [];
    setAnswers((current) => ({ ...current, [question.id]: selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value] }));
  }
  function nextQuestion() {
    if (questionIndex < activeQuestions.length - 1) setQuestionIndex((current) => current + 1);
    else analyze();
  }
  function analyze() {
    setScreen("loading");
    window.setTimeout(() => { setReport(createReport(child, answers)); setScreen("report"); }, 1800);
  }
  function startSample() {
    const sample: Child = { name: "서아", sex: "여아", birth: "2017-05-12", calendar: "solar", timeMode: "exact", birthHour: 14 };
    const sampleAnswers: Answers = {
      novelty: 3, approach: 4, caution: 2, shy: 2, sensitive: 5, praise: 4, persistence: 4, giveup: 2,
      autonomy: 4, kindness: 5, imagine: 4, calm: 4, outburst: 2, focus: 4, impulse: 2, transition: 2,
      grit1: 4, grit2: 2, learning: "language", strengths: ["language", "social", "self"], motivation: "together", value: "help",
    };
    setConsent(true); setChild(sample); setAnswers(sampleAnswers); setScreen("loading");
    window.setTimeout(() => { setReport(createReport(sample, sampleAnswers)); setScreen("report"); }, 1400);
  }
  function reset() {
    localStorage.removeItem(storageKey); setScreen("intro"); setConsent(false); setChild(blankChild); setAnswers({}); setQuestionIndex(0); setReport(null); setMessages([]);
  }
  function goHome() { setScreen("intro"); }
  function resumeProgress() { setScreen(Object.keys(answers).length > 0 ? "questions" : "details"); }
  function sendMessage(text: string) {
    if (!text.trim() || !report) return;
    setMessages((current) => [...current, { from: "me", text }, { from: "ai", text: createAnswer(text, report) }]);
  }
  async function shareReport() {
    const shareData = {
      title: "성장 리포트 | 우리 아이의 성장 나침반",
      text: `${child.name || "우리 아이"}의 강점과 성장 힌트를 발견하는 성장 리포트`,
      url: window.location.origin,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
    } catch { /* 사용자가 공유 창을 닫은 경우에는 별도 동작이 필요하지 않습니다. */ }
  }
  function goBack() {
    if (screen === "details") setScreen("intro");
    if (screen === "questions") questionIndex === 0 ? setScreen("details") : setQuestionIndex((current) => current - 1);
  }

  if (!hydrated) return <main className="app-shell loading-shell"><span className="tiny-star">✦</span></main>;
  return <main className="app-shell">
    {screen === "intro" && <Intro consent={consent} hasProgress={Boolean(child.name || Object.keys(answers).length)} hasReport={Boolean(report)} onConsent={setConsent} onStart={() => setScreen("details")} onResume={resumeProgress} onViewReport={() => setScreen("report")} onSample={startSample} />}
    {screen === "details" && <Details child={child} age={age} valid={validDetails} onBack={goBack} onChange={updateChild} onNext={beginQuestions} />}
    {screen === "questions" && <QuestionScreen question={activeQuestions[questionIndex]} index={questionIndex} total={activeQuestions.length} answers={answers} onBack={goBack} onChoose={choose} onToggle={toggleMulti} onNext={nextQuestion} />}
    {screen === "loading" && <Loading name={child.name || "아이"} />}
    {screen === "report" && report && <ReportScreen child={child} report={report} messages={messages} onSend={sendMessage} onShare={shareReport} onHome={goHome} onRestart={reset} />}
  </main>;
}

function Intro({ consent, hasProgress, hasReport, onConsent, onStart, onResume, onViewReport, onSample }: { consent: boolean; hasProgress: boolean; hasReport: boolean; onConsent: (value: boolean) => void; onStart: () => void; onResume: () => void; onViewReport: () => void; onSample: () => void }) {
  return <section className="screen intro">
    <div className="sky"><span className="star s1">✦</span><span className="star s2">✧</span><span className="star s3">✦</span><span className="moon">☾</span>
      <p className="eyebrow light">성장 리포트 · 재미로 보는 성장 나침반</p><h1>우리 아이의<br />성장 리포트</h1><p>타고난 결과 지금의 모습을 함께 살펴봐요.</p>
    </div>
    <div className="intro-body"><div className="chips"><span>⏱ 약 5분</span><span>👆 탭 선택</span><span>📎 참고용</span></div>
      <p className="notice">이 결과는 아이의 지능·성적·미래를 정하지 않아요. 사주와 성향을 함께 보는 따뜻한 참고용 나침반입니다.</p>
      {hasReport && <div className="saved-state"><span>✨</span><div><b>이전에 만든 성장 리포트가 있어요</b><p>저장된 결과를 언제든 다시 볼 수 있어요.</p></div><button onClick={onViewReport}>결과 보기 →</button></div>}
      {!hasReport && hasProgress && <div className="saved-state"><span>🌙</span><div><b>작성 중인 내용이 저장되어 있어요</b><p>멈춘 곳부터 이어서 진행할 수 있어요.</p></div><button onClick={onResume}>이어하기 →</button></div>}
      <label className="consent"><input type="checkbox" checked={consent} onChange={(e) => onConsent(e.target.checked)} /><span><b>만 14세 미만 법정대리인 동의</b><br />아이 정보의 분석 목적 이용에 동의합니다.</span></label>
    </div>
    <Bottom><button className="primary" disabled={!consent} onClick={onStart}>시작하기 ✦</button><button className="text-button" onClick={onSample}>샘플 아이로 체험하기 →</button></Bottom>
  </section>;
}

function Header({ label, progress, onBack }: { label: string; progress: number; onBack: () => void }) {
  return <header className="topbar"><button className="back" onClick={onBack} aria-label="이전 화면">←</button><div className="progress"><i style={{ width: `${progress}%` }} /></div><span>{label}</span></header>;
}

function Details({ child, age, valid, onBack, onChange, onNext }: { child: Child; age: number | null; valid: boolean; onBack: () => void; onChange: <K extends keyof Child>(key: K, value: Child[K]) => void; onNext: () => void }) {
  const hours = ["자(23)", "축(1)", "인(3)", "묘(5)", "진(7)", "사(9)", "오(11)", "미(13)", "신(15)", "유(17)", "술(19)", "해(21)"];
  return <section className="screen form-screen"><Header label="기본" progress={18} onBack={onBack} /><div className="content"><p className="eyebrow">STEP 1 · 아이 정보</p><h2>아이의 별자리를<br />알려주세요</h2>
    <label className="field">이름 또는 태명<input value={child.name} maxLength={20} placeholder="예: 서아" onChange={(e) => onChange("name", e.target.value)} /></label>
    <Segment label="성별" value={child.sex} options={["여아", "남아"]} onChange={(v) => onChange("sex", v as Child["sex"])} />
    <Segment label="기준" value={child.calendar} options={["solar", "lunar"]} labels={["양력", "음력"]} onChange={(v) => onChange("calendar", v as Child["calendar"])} />
    <label className="field">생년월일<input type="date" value={child.birth} max="2026-12-31" onChange={(e) => onChange("birth", e.target.value)} />{age !== null && <small>만 {age}세 · {age >= 10 ? "아이와 함께 흥미 문항도 살펴봐요" : "보호자 관찰 방식으로 진행해요"}</small>}</label>
    <div className="field"><span>태어난 시각</span><div className="seg"><button className={child.timeMode === "exact" ? "selected" : ""} onClick={() => onChange("timeMode", "exact")}>알아요</button><button className={child.timeMode === "unknown" ? "selected" : ""} onClick={() => onChange("timeMode", "unknown")}>몰라요</button></div>
      {child.timeMode === "exact" && <div className="hour-grid">{hours.map((hour, index) => <button key={hour} className={child.birthHour === (index * 2 + 23) % 24 ? "selected" : ""} onClick={() => onChange("birthHour", (index * 2 + 23) % 24)}>{hour}</button>)}</div>}
      {child.timeMode === "unknown" && <small>시각이 없으면 시주·대운 해석의 정밀도가 낮아져요.</small>}</div>
    {!valid && <p className="validation">이름, 성별, 생년월일을 입력해 주세요.</p>}
  </div><Bottom><button className="primary" disabled={!valid} onClick={onNext}>다음 · 성향 검사 →</button></Bottom></section>;
}

function Segment({ label, value, options, labels, onChange }: { label: string; value: string; options: string[]; labels?: string[]; onChange: (value: string) => void }) { return <div className="field"><span>{label}</span><div className="seg">{options.map((option, index) => <button key={option} className={value === option ? "selected" : ""} onClick={() => onChange(option)}>{labels?.[index] ?? option}</button>)}</div></div>; }

function QuestionScreen({ question, index, total, answers, onBack, onChoose, onToggle, onNext }: { question: (typeof questions)[number]; index: number; total: number; answers: Answers; onBack: () => void; onChoose: (value: string | number) => void; onToggle: (value: string) => void; onNext: () => void }) {
  const selected = answers[question.id];
  return <section className="screen question-screen"><Header label={`${index + 1}/${total}`} progress={25 + (index / total) * 65} onBack={onBack} /><div className="question-content"><p className="section-chip">{question.section}</p><p className="question-count">{index + 1} / {total}</p><h2>{question.text}</h2>
    {question.kind === "scale" && <div className="scale">{[1, 2, 3, 4, 5].map((number) => <button key={number} className={selected === number ? "selected" : ""} onClick={() => onChoose(number)}><b>{number}</b><span>{["전혀", "별로", "보통", "대체로", "매우"][number - 1]}</span></button>)}<button className="unknown" onClick={() => onChoose("unknown")}>잘 모르겠어요</button></div>}
    {question.kind === "choice" && <div className="option-list">{question.options?.map((option) => <button key={option.value} onClick={() => onChoose(option.value)}><span>{option.emoji}</span>{option.label}<b>›</b></button>)}</div>}
    {question.kind === "multi" && <div className="multi-grid">{question.options?.map((option) => <button key={option.value} className={Array.isArray(selected) && selected.includes(option.value) ? "selected" : ""} onClick={() => onToggle(option.value)}><span>{option.emoji}</span>{option.label}</button>)}</div>}
  </div>{question.kind === "multi" && <Bottom><button className="primary" disabled={!Array.isArray(selected) || selected.length === 0} onClick={onNext}>{index === total - 1 ? "분석 시작하기 ✦" : "다음 →"}</button></Bottom>}</section>;
}

function Loading({ name }: { name: string }) { const [stage, setStage] = useState(0); useEffect(() => { const timer = window.setInterval(() => setStage((s) => Math.min(3, s + 1)), 400); return () => clearInterval(timer); }, []); const labels = ["사주·오행 흐름 정리", "강점·흥미 신호 읽기", "학업·미래 방향 연결", "성장 리포트 완성"]; return <section className="screen loading-screen"><div className="orbit"><i /><i /><b>✦</b></div><p className="eyebrow">DEEP 분석 중</p><h2>{name}의 미래를<br />그리는 중이에요</h2><div className="loading-steps">{labels.map((label, index) => <p key={label} className={index < stage ? "done" : index === stage ? "current" : ""}>{index < stage ? "●" : index === stage ? "◉" : "○"} {label}</p>)}</div></section>; }

function ReportScreen({ child, report, messages, onSend, onShare, onHome, onRestart }: { child: Child; report: Report; messages: Message[]; onSend: (text: string) => void; onShare: () => void; onHome: () => void; onRestart: () => void }) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  // 결과 전체(스크롤 밖 포함)를 하나의 긴 PNG로 저장. html2canvas 는 클릭 시에만 동적 로드.
  async function saveAsPng() {
    const node = captureRef.current;
    if (!node || saving) return;
    setSaving(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#fbf3ef", useCORS: true, logging: false });
      const link = document.createElement("a");
      link.download = `${(child.name || "우리아이").trim()}_성장리포트.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      window.alert("이미지 저장 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }
  return <section className="screen report-screen"><div className="report-top"><span>성장 리포트</span><div><button onClick={onShare}>공유</button><button onClick={onHome}>홈으로</button><button onClick={onRestart}>새로 하기</button></div></div><div className="report-content">
    <div className="report-capture" ref={captureRef}>
    <div className="constellation"><span>{report.emoji}</span><p>우리 아이의 별자리</p><h1>{report.constellation}</h1><small>{report.tag}</small></div>
    <p className="disclaimer">사주와 성향 응답을 함께 본 참고용 결과예요. 미래를 확정하거나 평가하지 않아요.</p>
    <Card title="🔮 사주 분석 한눈에 보기">
      <p className="saju-intro">사주는 태어난 때의 기운을 다섯 가지 성향으로 나누어 보는 문화적 렌즈예요. 좋고 나쁨을 판단하는 결과가 아니라, 아이를 이해하는 하나의 힌트로 봐주세요.</p>
      <div className="saju-metrics">
        <div><span>나를 나타내는 기운</span><b>{report.dayStem} · {report.dayElement}</b><small>아이의 기본 성향</small></div>
        <div><span>전체 균형</span><b>{report.strength}</b><small>기운이 모이는 방식</small></div>
        <div><span>채워볼 기운</span><b>{report.yongsin}</b><small>성장을 돕는 경험</small></div>
        <div><span>출생 시각</span><b>{report.pillars.time === "모름" ? "시각 미입력" : "반영됨"}</b><small>{report.pillars.time === "모름" ? "해석 범위가 넓어요" : "시주까지 참고했어요"}</small></div>
      </div>
      <h3 className="saju-subtitle">태어난 때의 네 기둥</h3>
      <div className="pillars">{([['년', report.pillars.year], ['월', report.pillars.month], ['일', report.pillars.day], ['시', report.pillars.time]] as const).map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div>
      <h3 className="saju-subtitle">오행 분포</h3>
      <div className="element-bars">{Object.entries(report.elements).map(([element, value]) => <div key={element}><span>{element}</span><i style={{ width: `${Math.max(value, 0) * 25}%` }} /><b>{value}</b></div>)}</div>
      <p className="saju-detail">{report.sajuExplanation}</p>
      <div className="element-guide"><span><b>목</b> 성장·계획</span><span><b>화</b> 표현·활력</span><span><b>토</b> 안정·돌봄</span><span><b>금</b> 기준·정리</span><span><b>수</b> 생각·유연함</span></div>
      <small>간이 계산 결과입니다. 절기·음력·진태양시를 정밀 보정하지 않았으며, 출생 시각을 모르면 시주와 흐름 해석의 참고 범위가 넓어집니다.</small>
    </Card>
    <ProfileCard report={report} />
    <Card title="⭐ 빛나는 강점">{report.strengths.map((item) => <div className="insight" key={item.name}><b>{item.name}</b><p>{item.desc}</p></div>)}</Card>
    <Card title="🤍 함께 키워갈 지점">{report.watchPoints.map((item) => <div className="insight soft" key={item.name}><b>{item.name}</b><p>{item.desc}</p></div>)}</Card>
    <Card title="📚 학업 성취"><p className="lead">{report.academic.style}</p>{report.academic.subjects.map((item) => <div className="subject" key={item.subject}><b>{item.subject}</b><span>{item.why}</span></div>)}<p><b>집중·자기조절</b><br />{report.academic.selfRegulation}</p><p><b>부모 코칭</b><br />{report.academic.coaching}</p></Card>
    <Card title="🧠 정서·사회성"><p>{report.emoSocial}</p></Card>
    <Card title="🌌 나이대별 흐름"><div className="timeline">{report.timeline.map((item) => <div key={item.stage}><i className={item.favorable ? "favorable" : "watch"} /><b>{item.stage} <em>{item.favorable ? "순풍" : "살펴봄"}</em></b><p>{item.note}</p><p className="tl-guide"><b>이렇게 지도해요</b> {item.guide}</p></div>)}</div></Card>
    <Card title="🧭 어울리는 미래 방향">{report.futures.map((item) => <div className="future" key={item.title}><h3>{item.title}</h3><p>{item.why}</p><div className="tags">{item.chips.map((chip) => <span key={chip}>{chip}</span>)}</div><p className="nurture"><b>지금 키울 것</b> {item.nurture}</p></div>)}</Card>
    <Card title="✅ 지금 이렇게">{report.prescriptions.map((item, index) => <p className="prescription" key={item}><b>{index + 1}</b>{item}</p>)}<blockquote>“{report.encouragement}”</blockquote></Card>
    {showQa && <Chat messages={messages} onSend={onSend} />}
    <footer>✦ 이 서비스는 재미로 보는 성장 참고용 도구입니다. IQ·성적·건강·미래를 판단하지 않으며, 걱정이 지속되면 관련 전문가와 상담해 주세요.</footer>
    </div>
    <div className="report-actions">
      <button className="act-share" onClick={onShare}>🔗 공유하기</button>
      <button className="act-save" onClick={saveAsPng} disabled={saving} aria-busy={saving}>{saving ? "이미지 만드는 중…" : "🖼️ 이미지로 저장"}</button>
    </div>
  </div></section>;
}

function ProfileCard({ report }: { report: Report }) {
  return <Card title="🧭 성향 지표 (참고용)">
    <p className="lead">응답을 구성개념별로 모은 <b>상대적</b> 지표예요. 높낮이는 '우열'이 아니라 '성향의 방향'을 뜻해요.</p>
    <div className="metric-bars">{report.constructs.map((c) => <div key={c.code}><span>{c.label}</span><i className={c.level === "H" ? "hi" : c.level === "L" ? "lo" : ""} style={{ width: `${Math.max(4, c.score)}%` }} /><b>{c.score}</b></div>)}</div>
    <h3 className="saju-subtitle">흥미 유형 (Holland RIASEC)</h3>
    <div className="metric-bars riasec">{Object.entries(report.interest).map(([code, value]) => <div key={code}><span>{code}</span><i style={{ width: `${Math.max(4, value)}%` }} /><b>{value}</b></div>)}</div>
    <div className="element-guide"><span><b>R</b> 실행</span><span><b>I</b> 탐구</span><span><b>A</b> 예술</span><span><b>S</b> 사회</span><span><b>E</b> 진취</span><span><b>C</b> 관습</span></div>
    <h3 className="saju-subtitle">미래 방향 적합도 (상위 5)</h3>
    <div className="cluster-bars">{report.clusterScores.slice(0, 5).map((c) => <div key={c.name}><div className="clabel"><span>{c.emoji} {c.name}</span><b>{c.score}</b></div><i style={{ width: `${Math.max(4, c.score)}%` }} /></div>)}</div>
    <small>또래 규준(비교)이 아닌 아이 내부의 상대적 강약을 보여주는 간이 값이며 표준화 검사가 아니에요. 응답 신뢰도: {report.confidence}</small>
  </Card>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) { return <article className="report-card"><h2>{title}</h2>{children}</article>; }
function Bottom({ children }: { children: React.ReactNode }) { return <div className="bottom">{children}</div>; }
function Chat({ messages, onSend }: { messages: Message[]; onSend: (text: string) => void }) { const [text, setText] = useState(""); function submit(e: FormEvent) { e.preventDefault(); onSend(text); setText(""); } const suggestions = ["강점을 어떻게 키울까요?", "약한 부분이 걱정돼요", "어울리는 미래 방향은 왜 그런가요?"]; return <article className="chat"><h2>💬 더 궁금한 점을 물어보세요</h2><div className="suggestions">{suggestions.map((item) => <button key={item} onClick={() => onSend(item)}>{item}</button>)}</div>{messages.length > 0 && <div className="messages">{messages.map((message, index) => <p key={`${message.text}-${index}`} className={message.from}>{message.text}</p>)}</div>}<form onSubmit={submit}><input value={text} onChange={(e) => setText(e.target.value)} placeholder="궁금한 점을 입력하세요" aria-label="질문 입력" /><button aria-label="전송">↑</button></form></article>; }
