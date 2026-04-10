import axios from "axios";
import * as cheerio from "cheerio";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

// ✅ Firebase Config
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
    // Step 1: ওয়েব থেকে ডাটা আনা
    const url = "https://www.gsmarena.com/";
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    let phoneBrands = [];
    $(".brandmenu-v2 li a").each((i, el) => {
      phoneBrands.push($(el).text());
    });

    // Step 2: সরাসরি Firebase এ সেভ করা
    await set(ref(db, "phones/latest"), phoneBrands);
    console.log("✅ Phone brands saved to Firebase:", phoneBrands);

  } catch (err) {
    console.error("❌ Error during scraping:", err.message);
  }
}

// Run
scrapePhones();
