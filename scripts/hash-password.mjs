#!/usr/bin/env node
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { hashPassword } from "../src/lib/auth.ts";

async function readPassword(prompt: string): Promise<string> {
  const rl = createInterface({ input, output, terminal: true });
  process.stdout.write(prompt);
  const password = await rl.question("", { mask: "*" });
  rl.close();
  console.log("");
  return password;
}

async function main() {
  console.log("=== Generator Hash Kata Sandi VinDeck ===");
  console.log("Kata sandi minimal 12 karakter.");
  console.log("");

  while (true) {
    const pwd1 = await readPassword("Masukkan kata sandi: ");
    if (pwd1.length < 12) {
      console.log("Kata sandi terlalu pendek (minimal 12 karakter). Coba lagi.\n");
      continue;
    }

    const pwd2 = await readPassword("Konfirmasi kata sandi: ");
    if (pwd1 !== pwd2) {
      console.log("Kata sandi tidak cocok. Coba lagi.\n");
      continue;
    }

    const hash = await hashPassword(pwd1);
    console.log("\n=== HASIL HASH (salin ini ke DASHBOARD_PASSWORD_HASH) ===");
    console.log(hash);
    console.log("\n=== PETUNJUK ===");
    console.log("1. Simpan hash di atas ke variabel lingkungan DASHBOARD_PASSWORD_HASH di Vercel (Production).");
    console.log("2. Buat SESSION_SECRET dengan: openssl rand -hex 32");
    console.log("3. Simpan SESSION_SECRET ke variabel lingkungan di Vercel (Production).");
    console.log("4. Redeploy proyek.");
    break;
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});