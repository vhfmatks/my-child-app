# 우리 아이 어떻게 될까요? (my-child-app)

아이의 **만세력(사주)** 과 **성향 검사**를 종합해 학업·미래 직업 방향을 제시하고, 부모의 후속 질문에 답하는 모바일 웹 앱입니다. "재미로 보는 성장 나침반" — 따뜻하고 희망적인 개인화 리포트를 지향합니다.

> ⚠️ 참고용·비확정 도구입니다. 아이의 지능·성적·미래를 확정하거나 평가하지 않으며, 항상 '경향·가능성'으로 제시합니다.

## 무엇을 하나요

- **성향 조사(문항 v0.2)**: 기질(JTCI: 자극추구·위험회피·사회적 민감성·인내력), 성격(자율성·연대감·개방성), 정서조절, 실행기능, 그릿, 다중지능(강점 렌즈), 흥미(Holland RIASEC), 가치 — 구성개념별 태그·역채점 문항. 연령 게이트(만 10세+ 흥미 자기응답).
- **결정론 분석 엔진**: 만세력(JDN 기반) + 구성개념 점수화(역채점 정렬→지표) + 프로파일 조합 규칙 + **12개 직업 클러스터 매핑**(흥미·강점·가치·기질적합) + 근거 칩. 사주는 문화 맥락(진로 계산 가중치 0)으로 분리.
- **성장 리포트**: 별자리 정체성, 사주 요약, 성향 지표, 강점·함께 키워갈 지점, 학업, 정서·사회성, 나이대별 흐름, **어울리는 미래 방향(직업)**, 지금 실천할 처방.

근거 조사 요약은 [`docs/research.md`](docs/research.md), 설계 명세는 [`docs/prd.md`](docs/prd.md)를 참고하세요.

## 기술 스택

- Next.js 16 (App Router) · React 19 · TypeScript
- 상태는 브라우저 로컬(세션 보존), 서버리스 정적 배포

## 개발

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 정적 export → out/
npm run typecheck
```

## 배포 (GitHub Pages)

`main` 브랜치에 push 하면 GitHub Actions(`.github/workflows/deploy.yml`)가 정적 export 후 자동 배포합니다.

- 배포 URL: **https://vhfmatks.github.io/my-child-app/**
- 최초 1회 저장소 설정에서 **Settings → Pages → Source: GitHub Actions** 로 지정해야 합니다.
- `next.config.ts` 는 GitHub Actions 빌드에서만 `basePath=/my-child-app` 를 적용합니다.

## 프로젝트 구조

```
app/          화면(단일 페이지 라우팅) · 스타일
lib/          questions.ts(문항 뱅크) · analysis.ts(분석 엔진)
docs/         prd.md(명세) · research.md(근거 조사)
```

---
*본 서비스는 자기이해·양육 참고용이며, 걱정이 지속되면 관련 전문가와 상담해 주세요.*
