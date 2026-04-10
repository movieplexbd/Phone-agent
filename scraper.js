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

async function scrapePhones() {
  try {
    const url = "https://www.gsmarena.com/";
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    let phoneData = [];

    // ✅ প্রতিটি ব্র্যান্ডের লিঙ্ক বের করো
    $(".brandmenu-v2 li a").each((i, el) => {
      const brandName = $(el).text();
      const brandLink = "https://www.gsmarena.com/" + $(el).attr("href");
      phoneData.push({ brand: brandName, link: brandLink });
    });

    // ✅ প্রতিটি ব্র্যান্ডের পেজ থেকে লেটেস্ট ফোন মডেল scrape করো
    let allPhones = [];
    for (let brand of phoneData) {
      try {
        const brandRes = await axios.get(brand.link);
        const $$ = cheerio.load(brandRes.data);

        $$(".makers li a").each((i, el) => {
          const modelName = $$(el).find("strong span").text();
          const modelLink = "https://www.gsmarena.com/" + $$(el).attr("href");
          const img = $$(el).find("img").attr("src");

          allPhones.push({
            brand: brand.brand,
            model: modelName,
            link: modelLink,
            image: img
          });
        });
      } catch (err) {
        console.error(`❌ Error scraping brand ${brand.brand}:`, err.message);
      }
    }

    // ✅ Firebase এ সেভ করো
    await set(ref(db, "phones/latest"), allPhones);
    console.log("✅ All phone data saved to Firebase. Total:", allPhones.length);

    // ✅ কাজ শেষ হলে exit করো
    process.exit(0);

  } catch (err) {
    console.error("❌ Fatal Error:", err.message);
    process.exit(1);
  }
}

scrapePhones();
