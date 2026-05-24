/** แบนเนอร์คอลลาจ — รูปที่ผู้ใช้เลือก (local) */

export type HeroCollageTile = {
  src: string;
  alt: string;
  position?: string;
};

export const HERO_COLLAGE: HeroCollageTile[] = [
  {
    src: "/hero/collage-1.png",
    alt: "พิธีทางวัฒนธรรมที่วัดในกาฬสินธุ์",
    position: "center center",
  },
  {
    src: "/hero/collage-2.png",
    alt: "วัดศรีเชียงทอง สถาปัตยกรรมมูลกระจกต้นไม้แห่งชีวิต",
    position: "center center",
  },
  {
    src: "/hero/collage-3.png",
    alt: "งานแห่ทุ่งที่พระธาตุยาคู กาฬสินธุ์",
    position: "center center",
  },
  {
    src: "/hero/collage-4.png",
    alt: "ไดโนเสาร์จำลองหน้าพิพิธภัณฑ์สิรินธร กาฬสินธุ์",
    position: "center 40%",
  },
];

export const HERO_BANNER_WIDTH = 1920;
export const HERO_BANNER_HEIGHT = 400;

export const HERO_BANNER_IMAGE = HERO_COLLAGE[0]?.src ?? "/hero/collage-1.png";

/** ผ้าไหมแพรวา จ.กาฬสินธุ์ — CC BY-SA 4.0 (TAT / Wikimedia Commons) */
export const HERO_KALASIN_CULTURE_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/8/8a/Kls_att40011012.jpg";

/** พิพิธภัณฑ์ไดโนเสาร์ภูเวียง — สำรอง (ไม่ใช้ในแบนเนอร์) */
export const HERO_KALASIN_DINO_SCENE_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Museum_Dinosaur_KK.jpg/1280px-Museum_Dinosaur_KK.jpg";

/** พิพิธภัณฑ์สิรินธร จ.กาฬสินธุ์ */
export const HERO_KALASIN_DINO_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Dinosaur_%40%E0%B8%9E%E0%B8%B4%E0%B8%9E%E0%B8%B4%E0%B8%98%E0%B8%A0%E0%B8%B1%E0%B8%93%E0%B8%91%E0%B9%8C%E0%B8%AA%E0%B8%B4%E0%B8%A3%E0%B8%B4%E0%B8%99%E0%B8%98%E0%B8%A3_%2CSirindhorn_Museum_%2CKalasin%2CThailand_-_panoramio.jpg/1920px-Dinosaur_%40%E0%B8%9E%E0%B8%B4%E0%B8%9E%E0%B8%B4%E0%B8%98%E0%B8%A0%E0%B8%B1%E0%B8%93%E0%B8%91%E0%B9%8C%E0%B8%AA%E0%B8%B4%E0%B8%A3%E0%B8%B4%E0%B8%99%E0%B8%98%E0%B8%A3_%2CSirindhorn_Museum_%2CKalasin%2CThailand_-_panoramio.jpg";
