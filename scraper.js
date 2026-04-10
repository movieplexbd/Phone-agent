import axios from "axios";
import * as cheerio from "cheerio";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBsz-82MDaibWnIBUpoykrZHyJW7UMedX8",
  authDomain: "movies-bee24.firebaseapp.com",
  databaseURL: "https://movies-bee24-default-rtdb.firebaseio.com",
  projectId: "movies-bee24",
  storageBucket: "movies-bee24.appspot.com",
  messagingSenderId: "1080659811750",
  appId: "1:1080659811750:web:c1ef7d4dacc3ab17edc367"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Helper: delay function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: safe request with retry
async function safeRequest(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url);
    } catch (err) {
      if (err.response && err.response.status === 429) {
        console.warn("⚠️ Rate limited, waiting...");
        await sleep(5000);
      } else {
        throw err;
      }
    }
  }
}

async function scrapeMobileDokan() {
  try {
    const url = "https://www.mobiledokan.com/mobile/";
    const res = await safeRequest(url);
    const $ = cheerio.load(res.data);

    let allPhones = [];

    // ✅ প্রতিটি ফোনের ব্লক scrape করো
    $(".phone").each((i, el) => {
      const modelName = $(el).find(".phone-title a").text().trim();
      const modelLink = $(el).find(".phone-title a").attr("href");
      const img = $(el).find("img").attr("src");
      const price = $(el).find(".phone-price").text().trim();

      // Specs block
      let specs = {};
      $(el).find(".phone-specs li").each((j, specEl) => {
        const specText = $(specEl).text().trim();
        specs[`spec_${j}`] = specText;
      });

      allPhones.push({
        model: modelName,
        link: modelLink,
        image: img,
        price: price,
        specs: specs
      });
    });

    // ✅ Firebase এ সেভ করো
    await set(ref(db, "phones/latest"), allPhones);
    console.log("✅ All MobileDokan phone data saved. Total:", allPhones.length);

    process.exit(0);

  } catch (err) {
    console.error("❌ Fatal Error:", err.message);
    process.exit(1);
  }
}

scrapeMobileDokan();
