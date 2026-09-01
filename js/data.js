/* ══════════════════════════════════════════════════════════
   PIXEL DROP — data.js
   디지털 굿즈 카탈로그 데이터셋 (전역 배열)
   · imageSrc: 현재는 생성형 AI 렌더 에셋 URL — 실제 파일 수급 시
     assets/images/items/경로 로 교체 (image_assets.md 참조)
   · videoUrl: 유튜브 전체 URL이 아닌 "고유 ID"만 저장 (Phase 11)
   ══════════════════════════════════════════════════════════ */

const RARITY_META = {
  Common: { label: "COMMON", color: "#64748B", weight: 50 },
  Rare: { label: "RARE", color: "#00C2D1", weight: 30 },
  "Super Rare": { label: "SUPER RARE", color: "#FF007A", weight: 15 },
  Legendary: { label: "LEGENDARY", color: "#F5A300", weight: 5 },
};

const CATEGORIES = [
  "Character",
  "Pixel Art",
  "Poster",
  "Sticker",
  "Wallpaper",
  "Motion",
];

/* eslint-disable */
const products = [
  {
    id: "PD-001",
    slot: "A1",
    title: "네온 사이버 캣",
    category: "Character",
    rarity: "Super Rare",
    type: "image",
    imageSrc:
      "https://image.qwenlm.ai/generated-images/eb550f21-5fa0-4236-840e-2e1a55961fe4/_result.png",
    videoUrl: null,
    prompt:
      "Pixel art portrait of a neon cyberpunk cat wearing a chrome visor, glowing cyan and magenta palette, dark navy grid background, 16-bit sprite style, thick outlines, centered head composition",
    tags: ["고양이", "네온", "사이버펑크", "크롬바이저"],
  },
  {
    id: "PD-002",
    slot: "A2",
    title: "우주 고양이 아스트로",
    category: "Character",
    rarity: "Rare",
    type: "image",
    imageSrc:
      "https://image.qwenlm.ai/generated-images/e025ccb7-c550-4f9f-9251-080dcc3c1423/_result.png",
    videoUrl: null,
    prompt:
      "Pixel art astronaut cat floating in pastel outer space with small planets, stars and a gold capsule satellite, cyan magenta gold palette, 16-bit sprite, thick outlines, deep indigo background",
    tags: ["고양이", "우주", "아스트로", "캡슐"],
  },
  {
    id: "PD-003",
    slot: "A3",
    title: "픽셀 아케이드 머신",
    category: "Pixel Art",
    rarity: "Common",
    type: "image",
    imageSrc:
      "https://image.qwenlm.ai/generated-images/e560e185-d693-45e1-ad84-cf92b28e2871/_result.png",
    videoUrl: null,
    prompt:
      "Pixel art retro arcade cabinet machine with a glowing cat face on screen, cyan magenta yellow palette, 16-bit sprite style, thick dark outlines, flat light gray background",
    tags: ["아케이드", "오락기", "레트로", "CRT"],
  },
  {
    id: "PD-004",
    slot: "B1",
    title: "사이버 라면 한 그릇",
    category: "Pixel Art",
    rarity: "Rare",
    type: "image",
    imageSrc:
      "https://image.qwenlm.ai/generated-images/a136811e-c66c-42a1-8ebe-66427ff09fff/_result.png",
    videoUrl: null,
    prompt:
      "Pixel art bowl of holographic neon ramen with glowing steam swirls and chopsticks, cyberpunk food illustration, cyan and magenta palette, 16-bit sprite, thick outlines, dark navy background",
    tags: ["라면", "사이버푸드", "홀로그램", "야식"],
  },
  {
    id: "PD-005",
    slot: "B2",
    title: "핑크 글로우 실크스크린 포스터",
    category: "Poster",
    rarity: "Super Rare",
    type: "image",
    imageSrc:
      "https://image.qwenlm.ai/generated-images/3faf4779-1522-4b92-943d-5a51f90fed99/_result.png",
    videoUrl: null,
    prompt:
      "Retro pop-art screenprint poster of a cat face made of halftone dots, neon pink cyan and yellow ink layers, bold geometric shapes, slight misregistration effect, grainy risograph texture",
    tags: ["포스터", "팝아트", "실크스크린", "반상화"],
  },
  {
    id: "PD-006",
    slot: "B3",
    title: "말랑 캣 스티커팩",
    category: "Sticker",
    rarity: "Common",
    type: "image",
    imageSrc:
      "https://image.qwenlm.ai/generated-images/fb909fd8-5384-46b1-873c-39f9a2cfb7de/_result.png",
    videoUrl: null,
    prompt:
      "Sheet of cute pixel art cat stickers in six different poses, kawaii 16-bit sprites, thick white sticker borders, arranged in a neat grid on a flat light gray background, pastel neon accents",
    tags: ["스티커", "카와이", "다이어리", "꾸미기"],
  },
  {
    id: "PD-007",
    slot: "C1",
    title: "신스웨이브 선셋 월페이퍼",
    category: "Wallpaper",
    rarity: "Rare",
    type: "image",
    imageSrc:
      "https://image.qwenlm.ai/generated-images/1dcd0d86-23dc-43b6-8b31-a6dce9eaf4a2/_result.png",
    videoUrl: null,
    prompt:
      "Synthwave sunset landscape, pixel art style, glowing magenta sun with horizontal scanlines over a neon cyan perspective grid floor, purple mountains silhouette, stars, 16-bit retro aesthetic, wide cinematic",
    tags: ["배경화면", "신스웨이브", "석양", "와이드"],
  },
  {
    id: "PD-008",
    slot: "C2",
    title: "골든 캡슐 캣",
    category: "Character",
    rarity: "Legendary",
    type: "image",
    imageSrc:
      "https://image.qwenlm.ai/generated-images/8b570243-4dda-43d0-b3e9-94a932e101ec/_result.png",
    videoUrl: null,
    prompt:
      "Cute pixel art illustration of a chubby cyberpunk cat bursting out of a golden gacha capsule, neon cyan and magenta confetti pixels flying, chunky 16-bit sprites, thick dark outlines, flat ice-white background, pop-art arcade sticker style",
    tags: ["고양이", "골든", "레전더리", "캡슐", "시그니처"],
  },
  {
    id: "PD-009",
    slot: "C3",
    title: "픽셀 드롭 오프닝 모션",
    category: "Motion",
    rarity: "Legendary",
    type: "video",
    imageSrc: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    videoUrl: "dQw4w9WgXcQ",
    prompt:
      "Veo cinematic prompt: seamless loop of a golden gacha capsule spinning in zero gravity, neon confetti explosion on beat, cyan-magenta rim light, 16-bit particle overlay, arcade signage bokeh, 24fps",
    tags: ["모션", "영상", "루프", "오프닝"],
  },
];

/* 스튜디오 스타일 프리셋 (이미지 시드 크기 + CSS 필터) */
const STUDIO_STYLES = {
  PIXEL: { label: "픽셀", size: 72, filter: "none", px: true },
  CYBERPUNK: {
    label: "사이버펑크",
    size: 480,
    filter: "hue-rotate(140deg) saturate(2.2) contrast(1.25)",
    px: false,
  },
  POPART: {
    label: "팝아트",
    size: 480,
    filter: "saturate(2.7) contrast(1.35)",
    px: false,
  },
  DREAMY: {
    label: "드리미",
    size: 480,
    filter: "blur(1.2px) brightness(1.14) saturate(1.45)",
    px: false,
  },
  RETRO: {
    label: "레트로",
    size: 480,
    filter: "sepia(.72) contrast(1.12) saturate(1.3)",
    px: false,
  },
  RENDER3D: {
    label: "3D 렌더",
    size: 480,
    filter: "contrast(1.18) brightness(1.08) saturate(1.15)",
    px: false,
  },
};
