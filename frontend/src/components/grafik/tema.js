// Grafiklerin ortak renk ve biçim kaynağı.
//
// Renkler CSS değişkeni olarak veriliyor: SVG'nin fill/stroke nitelikleri
// var(--...) kabul ettiği için tema (açık/koyu) değişince grafik de
// kendiliğinden değişiyor, JS tarafında tema dinlemeye gerek kalmıyor.
// Önceden renkler koda gömülüydü ve açık temada okunmuyordu.

import { getCategoryData } from "../../utils/categories";

export const GRAFIK_RENK = {
  gelir: "var(--green)",
  harcama: "var(--red)",
  vurgu: "var(--accent-primary)",
  izgara: "var(--bg-card-border)",
  eksen: "var(--text-faint)",
};

// Kategori grafikleri uygulamanın geri kalanıyla aynı rengi kullanmalı:
// listede turuncu rozetle duran "Market" pastada da turuncu görünsün.
export const kategoriRengi = (ad) => getCategoryData(ad).color;

// Eksen etiketi: dar telefon ekranında tam tutar sığmıyor.
// Eski hali (v/1000).toFixed(0) küçük tutarları "₺0K" diye gösteriyordu.
export const paraKisa = (v) => {
  const n = Math.abs(v);
  if (n >= 1_000_000) return `₺${(v / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${Math.round(v / 1_000)}K`;
  return `₺${Math.round(v)}`;
};

export const paraTam = (v) =>
  `₺${Math.round(v ?? 0).toLocaleString("tr-TR")}`;

const AY_KISA = ["Oca", "Şub", "Mar", "Nis", "May", "Haz",
                 "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const AY_UZUN = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                 "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

// "2026-09" → "Eyl 26" (eksen) / "Eylül 2026" (başlık)
const ayParcala = (ay) => {
  const [yil, no] = String(ay ?? "").split("-");
  const i = Number(no) - 1;
  return i >= 0 && i < 12 ? { i, yil } : null;
};

export const ayKisa = (ay) => {
  const p = ayParcala(ay);
  return p ? `${AY_KISA[p.i]} ${p.yil.slice(2)}` : ay;
};

export const ayUzun = (ay) => {
  const p = ayParcala(ay);
  return p ? `${AY_UZUN[p.i]} ${p.yil}` : ay;
};
