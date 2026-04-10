import axios from "axios";
import cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

// Firebase Config (তুমি যেটা দিয়েছো)
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

// Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function scrapePhones() {
  const url = "https://www.gsmarena.com/";
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);

  let rawData = [];
  $(".brandmenu-v2 li a").each((i, el) => {
    rawData.push($(el).text());
  });

  // Gemini দিয়ে ডাটা JSON এ রূপান্তর (strict format)
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `
Take this phone list: ${rawData.join(", ")}.
Return JSON in this exact format:
[
  { "brand": "BrandName", "model": "ModelName" },
  { "brand": "BrandName", "model": "ModelName" }
]
No extra text, only valid JSON.
`;
  const result = await model.generateContent(prompt);
  const structuredData = JSON.parse(result.response.text());

  // Firebase এ সেভ
  await set(ref(db, "phones/latest"), structuredData);
  console.log("Data saved:", structuredData);
}

scrapePhones();
