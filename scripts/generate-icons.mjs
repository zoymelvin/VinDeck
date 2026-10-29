import fs from "fs";

const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" fill="none">
  <rect width="192" height="192" rx="36" fill="#3b82f6"/>
  <rect x="48" y="60" width="96" height="72" rx="8" fill="white" fill-opacity="0.2"/>
  <rect x="60" y="72" width="24" height="24" rx="4" fill="white"/>
  <rect x="108" y="72" width="24" height="24" rx="4" fill="white"/>
  <rect x="60" y="120" width="24" height="24" rx="4" fill="white"/>
  <rect x="108" y="120" width="24" height="24" rx="4" fill="white"/>
</svg>`;

const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="96" fill="#3b82f6"/>
  <rect x="128" y="160" width="256" height="192" rx="24" fill="white" fill-opacity="0.2"/>
  <rect x="160" y="192" width="64" height="64" rx="12" fill="white"/>
  <rect x="288" y="192" width="64" height="64" rx="12" fill="white"/>
  <rect x="160" y="320" width="64" height="64" rx="12" fill="white"/>
  <rect x="288" y="320" width="64" height="64" rx="12" fill="white"/>
</svg>`;

fs.writeFileSync("public/icon-192.svg", svg192);
fs.writeFileSync("public/icon-512.svg", svg512);

console.log("SVG icons created");