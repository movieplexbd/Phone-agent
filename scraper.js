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

async function scrapePhones() {
  try {
    const url = "https://www.gsmarena.com/";
    const res = await safeRequest(url);
    const $ = cheerio.load(res.data);

    let phoneData = [];
    $(".brandmenu-v2 li a").each((i, el) => {
      const brandName = $(el).text();
      const brandLink = "https://www.gsmarena.com/" + $(el).attr("href");
      phoneData.push({ brand: brandName, link: brandLink });
    });

    let allPhones = [];
    for (let brand of phoneData) {
      try {
        const brandRes = await safeRequest(brand.link);
        const $$ = cheerio.load(brandRes.data);

        $$(".makers li a").each(async (i, el) => {
          const modelName = $$(el).find("strong span").text();
          const modelLink = "https://www.gsmarena.com/" + $$(el).attr("href");
          const img = $$(el).find("img").attr("src");

          // ✅ Model details
          let specs = {};
          try {
            const modelRes = await safeRequest(modelLink);
            const $$$ = cheerio.load(modelRes.data);

            $$$(".specs-brief span").each((j, specEl) => {
              specs[`spec_${j}`] = $$$(specEl).text();
            });
          } catch (err) {
            console.error(`❌ Error scraping model ${modelName}:`, err.message);
          }

          allPhones.push({
            brand: brand.brand,
            model: modelName,
            link: modelLink,
            image: img,
            specs: specs
          });
        });

        console.log(`✅ Scraped ${brand.brand}, total phones: ${allPhones.length}`);
        await sleep(3000); // delay between brands

      } catch (err) {
        console.error(`❌ Error scraping brand ${brand.brand}:`, err.message);
      }
    }

    await set(ref(db, "phones/latest"), allPhones);
    console.log("✅ All phone data saved to Firebase. Total:", allPhones.length);

    process.exit(0);

  } catch (err) {
    console.error("❌ Fatal Error:", err.message);
    process.exit(1);
  }
}

scrapePhones();
