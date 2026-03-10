const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "신희천";
pres.title = "AI Worker 프로젝트 결과보고서";

// ── Design tokens ──
const C = {
  dark: "1E293B",
  darkEnd: "334155",
  white: "FFFFFF",
  offWhite: "F8FAFC",
  text: "1A1A2E",
  textSec: "64748B",
  accent: "3B82F6",
  accentLight: "EFF6FF",
  border: "E2E8F0",
  purple: "8B5CF6",
  pink: "EC4899",
};
const FONT = "Arial";
const FONT_KR = "맑은 고딕";
const IMG_DIR = path.resolve(__dirname, "../screens");

function makeShadow() {
  return { type: "outer", color: "000000", blur: 4, offset: 2, angle: 135, opacity: 0.1 };
}

function addGradientBar(slide) {
  // Simulated gradient bar at top: blue → purple → pink
  const barH = 0.06;
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 3.33, h: barH, fill: { color: C.accent } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 3.33, y: 0, w: 3.34, h: barH, fill: { color: C.purple } });
  slide.addShape(pres.shapes.RECTANGLE, { x: 6.67, y: 0, w: 3.33, h: barH, fill: { color: C.pink } });
}

function addBadge(slide, text, y) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: y, w: text.length * 0.14 + 0.4, h: 0.35,
    fill: { color: C.accentLight },
    rectRadius: 0.05,
  });
  slide.addText(text, {
    x: 0.6, y: y, w: text.length * 0.14 + 0.4, h: 0.35,
    fontSize: 9, fontFace: FONT, color: C.accent, bold: true, align: "center", valign: "middle",
  });
}

function addTitle(slide, text, y) {
  slide.addText(text, {
    x: 0.6, y: y, w: 8.8, h: 0.55,
    fontSize: 28, fontFace: FONT_KR, color: C.text, bold: true, margin: 0,
  });
}

function addPageNum(slide, num) {
  slide.addText(String(num), {
    x: 9.2, y: 5.2, w: 0.5, h: 0.3,
    fontSize: 11, fontFace: FONT, color: C.border, align: "right",
  });
}

function addScreenshots(slide, img1, img2, caption1, caption2, y, h) {
  const imgH = h || 2.4;
  if (img1 && fs.existsSync(path.join(IMG_DIR, img1))) {
    slide.addImage({ path: path.join(IMG_DIR, img1), x: 0.6, y: y, w: 4.2, h: imgH, sizing: { type: "contain", w: 4.2, h: imgH } });
    slide.addText(caption1, { x: 0.6, y: y + imgH + 0.05, w: 4.2, h: 0.25, fontSize: 10, fontFace: FONT_KR, color: C.textSec, align: "center" });
  }
  if (img2 && fs.existsSync(path.join(IMG_DIR, img2))) {
    slide.addImage({ path: path.join(IMG_DIR, img2), x: 5.2, y: y, w: 4.2, h: imgH, sizing: { type: "contain", w: 4.2, h: imgH } });
    slide.addText(caption2, { x: 5.2, y: y + imgH + 0.05, w: 4.2, h: 0.25, fontSize: 10, fontFace: FONT_KR, color: C.textSec, align: "center" });
  }
}

// ===== Slide 1: Cover =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.dark };
  // Badge
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 3.2, y: 1.5, w: 3.6, h: 0.4,
    fill: { color: C.white, transparency: 88 },
    line: { color: C.white, width: 0.5, transparency: 80 },
    rectRadius: 0.2,
  });
  slide.addText("2026.03 프로젝트 결과보고", {
    x: 3.2, y: 1.5, w: 3.6, h: 0.4,
    fontSize: 12, fontFace: FONT_KR, color: "CADCFC", align: "center", valign: "middle",
  });
  slide.addText("AI Worker", {
    x: 1, y: 2.2, w: 8, h: 0.9,
    fontSize: 48, fontFace: FONT, color: C.white, bold: true, align: "center",
  });
  slide.addText("AI 기반 업무 자동화 도구 모음 플랫폼", {
    x: 1, y: 3.1, w: 8, h: 0.5,
    fontSize: 20, fontFace: FONT_KR, color: "94A3B8", align: "center",
  });
  slide.addText("신희천    |    2025.02 ~ 2026.03", {
    x: 1, y: 3.9, w: 8, h: 0.4,
    fontSize: 14, fontFace: FONT_KR, color: "64748B", align: "center",
  });
}

// ===== Slide 2: 프로젝트 개요 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "OVERVIEW", 0.35);
  addTitle(slide, "프로젝트 개요", 0.75);

  const items = [
    "프로젝트명: AI Worker — AI 기반 업무 자동화 도구 모음 플랫폼",
    "개발 기간: 2025.02 ~ 2026.03",
    "개발 인원: 1명",
    "목적: 사내 반복 업무를 AI로 자동화하여 업무 효율 향상",
  ];
  slide.addText(items.map((t, i) => {
    const [label, ...rest] = t.split(": ");
    return [
      { text: label + ": ", options: { bold: true, breakLine: false } },
      { text: rest.join(": "), options: { breakLine: i < items.length - 1 } },
    ];
  }).flat(), {
    x: 0.8, y: 1.45, w: 8.4, h: 2.0,
    fontSize: 15, fontFace: FONT_KR, color: C.text, bullet: true, paraSpaceAfter: 8,
  });

  // Stat cards
  const stats = [
    { value: "4", label: "핵심 기능" },
    { value: "204", label: "TypeScript 파일" },
    { value: "29K", label: "코드 라인" },
    { value: "39", label: "테스트 파일" },
  ];
  stats.forEach((s, i) => {
    const x = 0.6 + i * 2.3;
    slide.addShape(pres.shapes.RECTANGLE, { x, y: 3.8, w: 2.0, h: 1.2, fill: { color: C.offWhite }, line: { color: C.border, width: 0.5 } });
    slide.addText(s.value, { x, y: 3.85, w: 2.0, h: 0.7, fontSize: 30, fontFace: FONT, color: C.accent, bold: true, align: "center", valign: "middle" });
    slide.addText(s.label, { x, y: 4.55, w: 2.0, h: 0.4, fontSize: 11, fontFace: FONT_KR, color: C.textSec, align: "center" });
  });
  addPageNum(slide, 2);
}

// ===== Slide 3: 주요 기능 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "FEATURES", 0.35);
  addTitle(slide, "주요 기능 (4가지)", 0.75);

  const rows = [
    [
      { text: "기능", options: { bold: true, color: C.white, fill: { color: C.dark } } },
      { text: "설명", options: { bold: true, color: C.white, fill: { color: C.dark } } },
    ],
    ["발표 스크립트 생성", "PPT/PDF 업로드 → 슬라이드별 발표 스크립트 자동 생성"],
    ["이미지 분석", "표/차트 이미지 → 텍스트 설명 + 핵심 인사이트"],
    ["엑셀 변환", "영수증/명함 이미지 → 구조화 데이터 → 엑셀 다운로드"],
    ["면접 질문 생성", "채용 공고(JD) + 이력서 → 맞춤 면접 질문 + 평가 기준"],
  ];
  slide.addTable(rows, {
    x: 0.6, y: 1.5, w: 8.8,
    colW: [2.8, 6.0],
    fontSize: 14, fontFace: FONT_KR, color: C.text,
    border: { pt: 0.5, color: C.border },
    rowH: [0.45, 0.45, 0.45, 0.45, 0.45],
    autoPage: false,
  });
  addPageNum(slide, 3);
}

// ===== Slide 4: 사용한 AI 도구 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "AI TOOLS", 0.35);
  addTitle(slide, "사용한 AI 도구", 0.75);

  // Left card
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.5, w: 4.15, h: 3.2, fill: { color: C.offWhite }, line: { color: C.border, width: 0.5 } });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: 1.7, w: 0.4, h: 0.4, fill: { color: C.accentLight }, rectRadius: 0.05 });
  slide.addText("G", { x: 0.85, y: 1.7, w: 0.4, h: 0.4, fontSize: 14, fontFace: FONT, color: C.accent, bold: true, align: "center", valign: "middle" });
  slide.addText("서비스 탑재 AI", { x: 1.4, y: 1.7, w: 3.0, h: 0.4, fontSize: 15, fontFace: FONT_KR, color: C.text, bold: true, valign: "middle" });
  slide.addText([
    { text: "Google Gemini 2.5 (Vision API)", options: { bold: true, breakLine: true } },
    { text: "슬라이드 이미지 분석 및 발표 스크립트 생성", options: { breakLine: true } },
    { text: "이미지 콘텐츠 분석 (표, 차트)", options: { breakLine: true } },
    { text: "영수증/명함 데이터 추출", options: { breakLine: true } },
    { text: "면접 질문 및 평가 기준 생성", options: {} },
  ], { x: 0.85, y: 2.3, w: 3.65, h: 2.2, fontSize: 13, fontFace: FONT_KR, color: "334155", bullet: true, paraSpaceAfter: 4 });

  // Right card
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.25, y: 1.5, w: 4.15, h: 3.2, fill: { color: C.offWhite }, line: { color: C.border, width: 0.5 } });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.5, y: 1.7, w: 0.4, h: 0.4, fill: { color: C.accentLight }, rectRadius: 0.05 });
  slide.addText("C", { x: 5.5, y: 1.7, w: 0.4, h: 0.4, fontSize: 14, fontFace: FONT, color: C.accent, bold: true, align: "center", valign: "middle" });
  slide.addText("개발에 활용한 AI Tool", { x: 6.05, y: 1.7, w: 3.0, h: 0.4, fontSize: 15, fontFace: FONT_KR, color: C.text, bold: true, valign: "middle" });
  slide.addText([
    { text: "Claude Code (Anthropic)", options: { bold: true, breakLine: true } },
    { text: "TDD 기반 코드 작성 및 테스트 자동 생성", options: { breakLine: true } },
    { text: "코드 리뷰, 디버깅, Git 워크플로우 자동화", options: { breakLine: true } },
    { text: "커스텀 스킬로 반복 워크플로우 자동화", options: {} },
  ], { x: 5.5, y: 2.3, w: 3.65, h: 2.2, fontSize: 13, fontFace: FONT_KR, color: "334155", bullet: true, paraSpaceAfter: 4 });
  addPageNum(slide, 4);
}

// ===== Slide 5: 시스템 아키텍처 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "ARCHITECTURE", 0.35);
  addTitle(slide, "시스템 아키텍처", 0.75);

  slide.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.5, w: 8.8, h: 2.2, fill: { color: C.dark } });
  slide.addText(
    "  React Client  ──────→  NestJS API  ──────→  PostgreSQL\n" +
    "  (Vite, :5175)           (:3002)\n" +
    "                             │\n" +
    "                        Gemini API\n" +
    "                        (Vision)",
    { x: 0.8, y: 1.6, w: 8.4, h: 2.0, fontSize: 14, fontFace: "Consolas", color: "E2E8F0" }
  );

  slide.addText([
    { text: "모노레포 구조", options: { bold: true, breakLine: false } },
    { text: ": pnpm workspace (apps/api-server + apps/user-client)", options: { breakLine: true } },
    { text: "컨테이너화", options: { bold: true, breakLine: false } },
    { text: ": Docker Compose (API + Client + DB)", options: {} },
  ], { x: 0.8, y: 3.9, w: 8.4, h: 1.0, fontSize: 14, fontFace: FONT_KR, color: "334155", bullet: true, paraSpaceAfter: 6 });
  addPageNum(slide, 5);
}

// ===== Slide 6: 기술 스택 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "TECH STACK", 0.35);
  addTitle(slide, "기술 스택", 0.75);

  const rows = [
    [
      { text: "영역", options: { bold: true, color: C.white, fill: { color: C.dark } } },
      { text: "기술", options: { bold: true, color: C.white, fill: { color: C.dark } } },
    ],
    ["프론트엔드", "React 19, Vite 7, TypeScript, Tailwind CSS, Zustand"],
    ["백엔드", "NestJS 11, Express 5, Prisma 7, Passport JWT"],
    ["데이터베이스", "PostgreSQL"],
    ["AI", "Google Gemini 2.5 Flash (Vision API)"],
    ["인프라", "Docker, Docker Compose, Nginx"],
    ["테스트", "Jest (백엔드), Vitest (프론트엔드)"],
  ];
  slide.addTable(rows, {
    x: 0.6, y: 1.5, w: 8.8, colW: [2.2, 6.6],
    fontSize: 13, fontFace: FONT_KR, color: C.text,
    border: { pt: 0.5, color: C.border },
    rowH: [0.42, 0.42, 0.42, 0.42, 0.42, 0.42, 0.42],
    autoPage: false,
  });
  addPageNum(slide, 6);
}

// ===== Slide 7: 화면 — 로그인 / 메인 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "SCREENSHOTS", 0.35);
  addTitle(slide, "화면 — 로그인 / 메인", 0.75);
  addScreenshots(slide, "00-login.png", "01-main.png", "로그인 화면", "메인 대시보드", 1.5, 3.5);
  addPageNum(slide, 7);
}

// ===== Slide 8: 발표 스크립트 생성 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "FEATURE 1", 0.35);
  addTitle(slide, "기능 상세 — 발표 스크립트 생성", 0.75);

  slide.addText("3단계 AI 파이프라인", { x: 0.6, y: 1.35, w: 8.8, h: 0.35, fontSize: 16, fontFace: FONT_KR, color: C.text, bold: true });
  slide.addText([
    { text: "슬라이드 분석: Gemini Vision으로 슬라이드 이미지 분석", options: { bullet: { type: "number" }, breakLine: true } },
    { text: "맥락 기반 생성: 이전 슬라이드 맥락을 반영한 스크립트 생성", options: { bullet: { type: "number" }, breakLine: true } },
    { text: "후처리 리파인: 톤, 시간, 일관성 고려하여 정제", options: { bullet: { type: "number" } } },
  ], { x: 0.8, y: 1.75, w: 8.4, h: 1.0, fontSize: 12, fontFace: FONT_KR, color: "334155", paraSpaceAfter: 2 });

  addScreenshots(slide, "02-script-generator.png", "03-script-generator-history.png", "스크립트 생성 화면", "히스토리 화면", 2.9, 2.3);
  addPageNum(slide, 8);
}

// ===== Slide 9: 이미지 분석 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "FEATURE 2", 0.35);
  addTitle(slide, "기능 상세 — 이미지 분석", 0.75);

  slide.addText([
    { text: "표, 차트, 기타 이미지 업로드", options: { breakLine: true } },
    { text: "Gemini Vision API로 콘텐츠 분석", options: { breakLine: true } },
    { text: "출력: 텍스트 설명 + 핵심 인사이트 목록", options: { bold: true, breakLine: true } },
    { text: "이미지 타입 자동 분류", options: { breakLine: true } },
    { text: "분석 히스토리 관리 (재조회/삭제)", options: {} },
  ], { x: 0.8, y: 1.4, w: 8.4, h: 1.3, fontSize: 13, fontFace: FONT_KR, color: "334155", bullet: true, paraSpaceAfter: 4 });

  addScreenshots(slide, "04-image.png", "05-image-history.png", "이미지 분석 화면", "히스토리 화면", 2.9, 2.3);
  addPageNum(slide, 9);
}

// ===== Slide 10: 엑셀 변환 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "FEATURE 3", 0.35);
  addTitle(slide, "기능 상세 — 엑셀 변환", 0.75);

  slide.addText([
    { text: "영수증 또는 명함 이미지 다중 업로드", options: { breakLine: true } },
    { text: "Gemini Vision API로 구조화 데이터 추출", options: { breakLine: true } },
    { text: "영수증: 날짜, 상호명, 항목요약, 합계금액, 결제수단", options: { breakLine: true } },
    { text: "명함: 이름, 직함, 회사명, 전화번호, 이메일, 주소", options: { breakLine: true } },
    { text: "엑셀 파일 다운로드 (ExcelJS), 변환 히스토리 관리", options: {} },
  ], { x: 0.8, y: 1.4, w: 8.4, h: 1.3, fontSize: 13, fontFace: FONT_KR, color: "334155", bullet: true, paraSpaceAfter: 4 });

  addScreenshots(slide, "06-excel.png", "07-excel-history.png", "엑셀 변환 화면", "히스토리 화면", 2.9, 2.3);
  addPageNum(slide, 10);
}

// ===== Slide 11: 면접 질문 생성 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "FEATURE 4", 0.35);
  addTitle(slide, "기능 상세 — 면접 질문 생성", 0.75);

  slide.addText([
    { text: "채용 공고(JD) 텍스트 입력 + 이력서/경력서 (선택)", options: { breakLine: true } },
    { text: "6개 직무 유형: 개발, 디자인, 기획, 마케팅, 영업, 일반", options: { breakLine: true } },
    { text: "출력 (질문 5개): 면접 질문 + 평가 의도 + 우수 답변 키워드 + 상/중/하 평가 기준", options: { breakLine: true } },
    { text: "엑셀 다운로드, 전체 복사 기능", options: {} },
  ], { x: 0.8, y: 1.4, w: 8.4, h: 1.2, fontSize: 13, fontFace: FONT_KR, color: "334155", bullet: true, paraSpaceAfter: 4 });

  addScreenshots(slide, "08-interview.png", "09-interview-history.png", "면접 질문 생성 화면", "히스토리 화면", 2.8, 2.4);
  addPageNum(slide, 11);
}

// ===== Slide 12: 데이터베이스 설계 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "DATABASE", 0.35);
  addTitle(slide, "데이터베이스 설계", 0.75);

  slide.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.5, w: 8.8, h: 1.8, fill: { color: C.dark } });
  slide.addText(
    "  User (1) ──→ (N) PresentationHistory\n" +
    "       (1) ──→ (N) ImageAnalysisHistory\n" +
    "       (1) ──→ (N) ImageToExcelHistory\n" +
    "       (1) ──→ (N) InterviewHistory",
    { x: 0.8, y: 1.6, w: 8.4, h: 1.6, fontSize: 14, fontFace: "Consolas", color: "E2E8F0" }
  );

  slide.addText([
    { text: "5개 테이블, userId + createdAt 복합 인덱스", options: { breakLine: true } },
    { text: "JSON 필드로 유연한 결과 데이터 저장", options: { breakLine: true } },
    { text: "User 삭제 시 히스토리 Cascade 삭제", options: {} },
  ], { x: 0.8, y: 3.6, w: 8.4, h: 1.0, fontSize: 14, fontFace: FONT_KR, color: "334155", bullet: true, paraSpaceAfter: 6 });
  addPageNum(slide, 12);
}

// ===== Slide 13: 프로젝트 규모 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "SCALE", 0.35);
  addTitle(slide, "프로젝트 규모", 0.75);

  const rows = [
    [
      { text: "지표", options: { bold: true, color: C.white, fill: { color: C.dark } } },
      { text: "수치", options: { bold: true, color: C.white, fill: { color: C.dark } } },
    ],
    ["총 커밋 수", "33"],
    ["TypeScript 파일 수", "204"],
    ["총 코드 라인 수", "약 29,000줄"],
    ["백엔드 모듈", "6개"],
    ["프론트엔드 기능 모듈", "6개"],
    ["DB 테이블", "5개"],
    ["테스트 파일", "39개 (백엔드 21 + 프론트엔드 18)"],
  ];
  slide.addTable(rows, {
    x: 0.6, y: 1.5, w: 8.8, colW: [3.5, 5.3],
    fontSize: 13, fontFace: FONT_KR, color: C.text,
    border: { pt: 0.5, color: C.border },
    rowH: [0.42, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38],
    autoPage: false,
  });
  addPageNum(slide, 13);
}

// ===== Slide 14: 개발 방법론 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "METHODOLOGY", 0.35);
  addTitle(slide, "개발 방법론", 0.75);

  // Left card: TDD
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.5, w: 4.15, h: 2.8, fill: { color: C.offWhite }, line: { color: C.border, width: 0.5 } });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: 1.7, w: 0.4, h: 0.4, fill: { color: C.accentLight }, rectRadius: 0.05 });
  slide.addText("T", { x: 0.85, y: 1.7, w: 0.4, h: 0.4, fontSize: 14, fontFace: FONT, color: C.accent, bold: true, align: "center", valign: "middle" });
  slide.addText("TDD (테스트 주도 개발)", { x: 1.4, y: 1.7, w: 3.0, h: 0.4, fontSize: 15, fontFace: FONT_KR, color: C.text, bold: true, valign: "middle" });
  slide.addText([
    { text: "Red → Green → Refactor 사이클", options: { breakLine: true } },
    { text: "[BEHAVIORAL] / [STRUCTURAL] 커밋 구분", options: {} },
  ], { x: 0.85, y: 2.3, w: 3.65, h: 1.5, fontSize: 13, fontFace: FONT_KR, color: "334155", bullet: true, paraSpaceAfter: 6 });

  // Right card: AI Pair Programming
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.25, y: 1.5, w: 4.15, h: 2.8, fill: { color: C.offWhite }, line: { color: C.border, width: 0.5 } });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.5, y: 1.7, w: 0.4, h: 0.4, fill: { color: C.accentLight }, rectRadius: 0.05 });
  slide.addText("A", { x: 5.5, y: 1.7, w: 0.4, h: 0.4, fontSize: 14, fontFace: FONT, color: C.accent, bold: true, align: "center", valign: "middle" });
  slide.addText("AI 페어 프로그래밍", { x: 6.05, y: 1.7, w: 3.0, h: 0.4, fontSize: 15, fontFace: FONT_KR, color: C.text, bold: true, valign: "middle" });
  slide.addText([
    { text: "Claude Code로 PRD → 계획 → TDD → 코드 리뷰 전 과정 AI 활용", options: { breakLine: true } },
    { text: "커스텀 스킬 /prd, /plan, /go-phase 등으로 워크플로우 자동화", options: {} },
  ], { x: 5.5, y: 2.3, w: 3.65, h: 1.5, fontSize: 13, fontFace: FONT_KR, color: "334155", bullet: true, paraSpaceAfter: 6 });
  addPageNum(slide, 14);
}

// ===== Slide 15: 보안 및 배포 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "SECURITY & DEPLOY", 0.35);
  addTitle(slide, "보안 및 배포", 0.75);

  // Left: 보안
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.5, w: 4.15, h: 2.8, fill: { color: C.offWhite }, line: { color: C.border, width: 0.5 } });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: 1.7, w: 0.4, h: 0.4, fill: { color: C.accentLight }, rectRadius: 0.05 });
  slide.addText("S", { x: 0.85, y: 1.7, w: 0.4, h: 0.4, fontSize: 14, fontFace: FONT, color: C.accent, bold: true, align: "center", valign: "middle" });
  slide.addText("보안", { x: 1.4, y: 1.7, w: 2.0, h: 0.4, fontSize: 15, fontFace: FONT_KR, color: C.text, bold: true, valign: "middle" });
  slide.addText([
    { text: "이메일/비밀번호 인증 (bcrypt 해싱)", options: { breakLine: true } },
    { text: "JWT 토큰 기반 API 접근 제어", options: { breakLine: true } },
    { text: "CORS Origin 제한, 입력 검증, 데이터 격리", options: {} },
  ], { x: 0.85, y: 2.3, w: 3.65, h: 1.5, fontSize: 13, fontFace: FONT_KR, color: "334155", bullet: true, paraSpaceAfter: 4 });

  // Right: 배포
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.25, y: 1.5, w: 4.15, h: 2.8, fill: { color: C.offWhite }, line: { color: C.border, width: 0.5 } });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.5, y: 1.7, w: 0.4, h: 0.4, fill: { color: C.accentLight }, rectRadius: 0.05 });
  slide.addText("D", { x: 5.5, y: 1.7, w: 0.4, h: 0.4, fontSize: 14, fontFace: FONT, color: C.accent, bold: true, align: "center", valign: "middle" });
  slide.addText("배포", { x: 6.05, y: 1.7, w: 2.0, h: 0.4, fontSize: 15, fontFace: FONT_KR, color: C.text, bold: true, valign: "middle" });
  slide.addText([
    { text: "Docker Compose 기반 컨테이너 배포", options: { breakLine: true } },
    { text: "API: NestJS + LibreOffice + Poppler", options: { breakLine: true } },
    { text: "Client: React 빌드 + Nginx 서빙", options: { breakLine: true } },
    { text: "DB: PostgreSQL", options: {} },
  ], { x: 5.5, y: 2.3, w: 3.65, h: 1.5, fontSize: 13, fontFace: FONT_KR, color: "334155", bullet: true, paraSpaceAfter: 4 });
  addPageNum(slide, 15);
}

// ===== Slide 16: 기대효과 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "EXPECTED BENEFITS", 0.35);
  addTitle(slide, "기대효과", 0.75);

  const cards = [
    { icon: "⚡", title: "업무 효율화", items: ["발표 스크립트 수작업 → AI 자동 생성 (수분 → 수초)", "영수증/명함 수기 입력 → 이미지만으로 엑셀 변환", "면접 질문 설계 시간 단축"] },
    { icon: "★", title: "품질 향상", items: ["슬라이드 맥락 반영한 일관된 발표 스크립트", "구조화된 면접 평가 기준으로 공정성 확보", "사람에 따른 품질 편차 감소"] },
    { icon: "💰", title: "비용 절감", items: ["Gemini Flash 모델로 저비용 AI 처리", "외부 SaaS 구독 없이 자체 플랫폼 운영", "1인 개발 (AI 페어 프로그래밍)"] },
    { icon: "🎓", title: "AI 역량 내재화", items: ["Gemini Vision API 활용 노하우 축적", "AI 기반 서비스 설계/개발 경험 확보", "TDD + AI 페어 프로그래밍 방법론 검증"] },
  ];

  cards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.6 + col * 4.65;
    const y = 1.4 + row * 2.05;
    slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.35, h: 1.85, fill: { color: C.offWhite }, line: { color: C.border, width: 0.5 } });
    slide.addText(card.icon + "  " + card.title, { x: x + 0.2, y: y + 0.1, w: 3.95, h: 0.35, fontSize: 15, fontFace: FONT_KR, color: C.text, bold: true });
    slide.addText(card.items.map((t, j) => ({
      text: t, options: { breakLine: j < card.items.length - 1 }
    })), { x: x + 0.2, y: y + 0.5, w: 3.95, h: 1.2, fontSize: 11, fontFace: FONT_KR, color: "334155", bullet: true, paraSpaceAfter: 2 });
  });
  addPageNum(slide, 16);
}

// ===== Slide 17: 향후 계획 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.white };
  addGradientBar(slide);
  addBadge(slide, "ROADMAP", 0.35);
  addTitle(slide, "향후 계획", 0.75);

  slide.addText([
    { text: "다국어 스크립트 생성 지원", options: { breakLine: true } },
    { text: "팀 공유 기능 (히스토리 공유, 협업)", options: { breakLine: true } },
    { text: "추가 AI 모델 지원 (GPT-4o, Claude 등 선택 가능)", options: { breakLine: true } },
    { text: "발표 리허설 모드 (타이머 + 스크립트 프롬프터)", options: { breakLine: true } },
    { text: "관리자 대시보드 (사용 통계, 사용자 관리)", options: {} },
  ], { x: 0.8, y: 1.5, w: 8.4, h: 2.5, fontSize: 15, fontFace: FONT_KR, color: "334155", bullet: true, paraSpaceAfter: 10 });
  addPageNum(slide, 17);
}

// ===== Slide 18: 감사합니다 =====
{
  const slide = pres.addSlide();
  slide.background = { color: C.dark };
  slide.addText("감사합니다", {
    x: 1, y: 2.0, w: 8, h: 1.0,
    fontSize: 44, fontFace: FONT_KR, color: C.white, bold: true, align: "center",
  });
  slide.addText("AI Worker — AI 기반 업무 자동화 도구 모음 플랫폼", {
    x: 1, y: 3.1, w: 8, h: 0.5,
    fontSize: 16, fontFace: FONT_KR, color: "64748B", align: "center",
  });
}

// ── Write file ──
const outPath = path.resolve(__dirname, "REPORT_SLIDES_NEW.pptx");
pres.writeFile({ fileName: outPath }).then(() => {
  console.log("Created:", outPath);
}).catch(err => {
  console.error("Error:", err);
});
