/**
 * FitForge Worldwide Food Database & Nutritional Intelligence Engine
 * Comprehensive database covering 14 regional cuisines with verified macronutrients,
 * micronutrients, portion weights, and algorithmic food detection verification.
 * 
 * Cuisines covered:
 * - Gujarati Foods
 * - Punjabi Foods
 * - South Indian Foods
 * - Indian Multi-Regional Foods
 * - Chinese Foods
 * - Japanese Foods
 * - Thai Foods
 * - Korean Foods
 * - Italian Foods
 * - Mexican Foods
 * - American Foods
 * - European Foods
 * - Middle Eastern Foods
 * - African Foods
 */

const WORLDWIDE_FOOD_CATALOG = {
  // =========================================================================
  // 1. GUJARATI FOODS
  // =========================================================================
  "dhokla": {
    name: "Khaman Dhokla",
    cuisine: "Gujarati",
    aliases: ["khaman", "dhokla", "yellow dhokla", "nylon khaman"],
    servingSize: "4 pieces (120g)",
    defaultGrams: 120,
    per100g: { calories: 152, protein: 7.2, carbs: 24.5, fat: 2.8, fiber: 3.1, sugar: 4.2, sodium: 340 },
    micronutrients: { potassium: 180, calcium: 45, iron: 1.8, vitaminC: 4.2 },
    healthScore: 84
  },
  "thepla": {
    name: "Methi Thepla",
    cuisine: "Gujarati",
    aliases: ["methi thepla", "thepla", "gujarati flatbread"],
    servingSize: "2 theplas (80g)",
    defaultGrams: 80,
    per100g: { calories: 275, protein: 8.5, carbs: 42.0, fat: 8.5, fiber: 5.4, sugar: 1.2, sodium: 310 },
    micronutrients: { potassium: 210, calcium: 80, iron: 2.6, vitaminA: 320 },
    healthScore: 82
  },
  "khandvi": {
    name: "Khandvi",
    cuisine: "Gujarati",
    aliases: ["khandvi", "patuli", "besan rolls"],
    servingSize: "5 rolls (100g)",
    defaultGrams: 100,
    per100g: { calories: 140, protein: 6.8, carbs: 18.0, fat: 4.5, fiber: 2.5, sugar: 2.0, sodium: 290 },
    micronutrients: { potassium: 160, calcium: 55, iron: 1.5 },
    healthScore: 86
  },
  "handvo": {
    name: "Vegetable Handvo",
    cuisine: "Gujarati",
    aliases: ["handvo", "gujarati handvo", "lentil vegetable cake"],
    servingSize: "1 slice (120g)",
    defaultGrams: 120,
    per100g: { calories: 185, protein: 7.5, carbs: 26.0, fat: 5.8, fiber: 4.2, sugar: 2.5, sodium: 280 },
    micronutrients: { potassium: 220, calcium: 65, iron: 2.2 },
    healthScore: 85
  },
  "undhiyu": {
    name: "Surati Undhiyu",
    cuisine: "Gujarati",
    aliases: ["undhiyu", "surti undhiyu", "mixed vegetable undhiyu"],
    servingSize: "1 bowl (180g)",
    defaultGrams: 180,
    per100g: { calories: 160, protein: 4.8, carbs: 19.5, fat: 7.2, fiber: 6.0, sugar: 3.5, sodium: 260 },
    micronutrients: { potassium: 380, calcium: 70, iron: 2.4, vitaminA: 280, vitaminC: 15 },
    healthScore: 80
  },
  "sev tameta": {
    name: "Sev Tameta Nu Shaak",
    cuisine: "Gujarati",
    aliases: ["sev tameta", "sev tamatar", "sev tomato curry"],
    servingSize: "1 bowl (150g)",
    defaultGrams: 150,
    per100g: { calories: 145, protein: 3.8, carbs: 15.0, fat: 8.0, fiber: 2.8, sugar: 4.5, sodium: 380 },
    micronutrients: { potassium: 260, calcium: 40, iron: 1.6, vitaminC: 18 },
    healthScore: 75
  },
  "khakhra": {
    name: "Methi Khakhra",
    cuisine: "Gujarati",
    aliases: ["khakhra", "jeera khakhra", "crispy wheat flatbread"],
    servingSize: "2 pieces (50g)",
    defaultGrams: 50,
    per100g: { calories: 395, protein: 12.0, carbs: 68.0, fat: 8.5, fiber: 9.0, sugar: 1.0, sodium: 410 },
    micronutrients: { potassium: 240, calcium: 90, iron: 3.2 },
    healthScore: 85
  },
  "fafda": {
    name: "Gujarati Fafda",
    cuisine: "Gujarati",
    aliases: ["fafda", "besan fafda"],
    servingSize: "4 strips (80g)",
    defaultGrams: 80,
    per100g: { calories: 480, protein: 14.5, carbs: 48.0, fat: 25.0, fiber: 4.5, sugar: 1.0, sodium: 520 },
    micronutrients: { potassium: 290, calcium: 50, iron: 2.8 },
    healthScore: 62
  },
  "dal dhokli": {
    name: "Gujarati Dal Dhokli",
    cuisine: "Gujarati",
    aliases: ["dal dhokli", "varan phala"],
    servingSize: "1 large bowl (250g)",
    defaultGrams: 250,
    per100g: { calories: 125, protein: 4.8, carbs: 21.0, fat: 2.5, fiber: 3.2, sugar: 2.8, sodium: 290 },
    micronutrients: { potassium: 210, calcium: 40, iron: 1.9 },
    healthScore: 83
  },

  // =========================================================================
  // 2. PUNJABI FOODS
  // =========================================================================
  "dal makhani": {
    name: "Dal Makhani",
    cuisine: "Punjabi",
    aliases: ["dal makhani", "maa ki dal", "black lentil curry"],
    servingSize: "1 bowl (200g)",
    defaultGrams: 200,
    per100g: { calories: 155, protein: 6.2, carbs: 17.5, fat: 7.0, fiber: 4.5, sugar: 1.5, sodium: 340 },
    micronutrients: { potassium: 310, calcium: 75, iron: 2.8 },
    healthScore: 78
  },
  "butter chicken": {
    name: "Murgh Makhani (Butter Chicken)",
    cuisine: "Punjabi",
    aliases: ["butter chicken", "murgh makhani", "chicken makhani"],
    servingSize: "1 portion (220g)",
    defaultGrams: 220,
    per100g: { calories: 195, protein: 15.5, carbs: 6.5, fat: 12.0, fiber: 1.2, sugar: 3.0, sodium: 380 },
    micronutrients: { potassium: 280, calcium: 60, iron: 1.9 },
    healthScore: 74
  },
  "paneer tikka": {
    name: "Tandoori Paneer Tikka",
    cuisine: "Punjabi",
    aliases: ["paneer tikka", "tandoori paneer", "grilled paneer"],
    servingSize: "6 pieces (150g)",
    defaultGrams: 150,
    per100g: { calories: 235, protein: 15.2, carbs: 7.5, fat: 16.0, fiber: 2.0, sugar: 2.0, sodium: 320 },
    micronutrients: { potassium: 200, calcium: 240, iron: 1.8 },
    healthScore: 88
  },
  "chana bhatura": {
    name: "Chole Bhature",
    cuisine: "Punjabi",
    aliases: ["chole bhature", "chana bhatura", "chickpea curry with fried bread"],
    servingSize: "2 bhature + chole (300g)",
    defaultGrams: 300,
    per100g: { calories: 250, protein: 6.8, carbs: 34.0, fat: 9.8, fiber: 4.2, sugar: 2.0, sodium: 410 },
    micronutrients: { potassium: 270, calcium: 55, iron: 2.6 },
    healthScore: 68
  },
  "sarson saag": {
    name: "Sarson Ka Saag",
    cuisine: "Punjabi",
    aliases: ["sarson ka saag", "mustard greens saag", "sarson saag"],
    servingSize: "1 bowl (180g)",
    defaultGrams: 180,
    per100g: { calories: 95, protein: 4.2, carbs: 8.5, fat: 5.0, fiber: 4.8, sugar: 1.8, sodium: 290 },
    micronutrients: { potassium: 380, calcium: 160, iron: 3.4, vitaminA: 650, vitaminC: 45 },
    healthScore: 92
  },
  "makki roti": {
    name: "Makki Di Roti",
    cuisine: "Punjabi",
    aliases: ["makki di roti", "cornmeal flatbread", "makki roti"],
    servingSize: "2 rotis (100g)",
    defaultGrams: 100,
    per100g: { calories: 260, protein: 6.5, carbs: 48.0, fat: 5.0, fiber: 6.2, sugar: 1.0, sodium: 220 },
    micronutrients: { potassium: 210, calcium: 30, iron: 2.1 },
    healthScore: 85
  },
  "amritsari kulcha": {
    name: "Amritsari Aloo Kulcha",
    cuisine: "Punjabi",
    aliases: ["amritsari kulcha", "aloo kulcha", "stuffed kulcha"],
    servingSize: "1 kulcha (130g)",
    defaultGrams: 130,
    per100g: { calories: 265, protein: 6.5, carbs: 45.0, fat: 7.0, fiber: 3.0, sugar: 2.2, sodium: 390 },
    micronutrients: { potassium: 230, calcium: 40, iron: 1.8 },
    healthScore: 72
  },

  // =========================================================================
  // 3. SOUTH INDIAN FOODS
  // =========================================================================
  "masala dosa": {
    name: "Crisp Masala Dosa",
    cuisine: "South Indian",
    aliases: ["masala dosa", "potato masala dosa", "mysore masala dosa"],
    servingSize: "1 dosa with potato filling (180g)",
    defaultGrams: 180,
    per100g: { calories: 175, protein: 4.2, carbs: 29.5, fat: 4.6, fiber: 2.8, sugar: 1.2, sodium: 310 },
    micronutrients: { potassium: 220, calcium: 35, iron: 1.6 },
    healthScore: 82
  },
  "plain dosa": {
    name: "Plain Sada Dosa",
    cuisine: "South Indian",
    aliases: ["plain dosa", "sada dosa", "dosa"],
    servingSize: "1 large dosa (100g)",
    defaultGrams: 100,
    per100g: { calories: 165, protein: 4.0, carbs: 28.5, fat: 3.8, fiber: 1.8, sugar: 0.8, sodium: 280 },
    micronutrients: { potassium: 150, calcium: 25, iron: 1.3 },
    healthScore: 84
  },
  "idli": {
    name: "Steamed Rice & Urad Idli",
    cuisine: "South Indian",
    aliases: ["idli", "steamed idli", "rice idli"],
    servingSize: "3 idlis (150g)",
    defaultGrams: 150,
    per100g: { calories: 132, protein: 4.5, carbs: 27.0, fat: 0.5, fiber: 2.0, sugar: 0.5, sodium: 210 },
    micronutrients: { potassium: 120, calcium: 20, iron: 1.1 },
    healthScore: 92
  },
  "sambhar": {
    name: "Vegetable Lentil Sambhar",
    cuisine: "South Indian",
    aliases: ["sambhar", "sambar", "south indian sambar"],
    servingSize: "1 bowl (200g)",
    defaultGrams: 200,
    per100g: { calories: 68, protein: 3.4, carbs: 11.2, fat: 1.1, fiber: 2.8, sugar: 2.4, sodium: 310 },
    micronutrients: { potassium: 290, calcium: 45, iron: 1.7, vitaminA: 180 },
    healthScore: 90
  },
  "medu vada": {
    name: "Crisp Medu Vada",
    cuisine: "South Indian",
    aliases: ["medu vada", "vada", "urad dal vada"],
    servingSize: "2 vadas (100g)",
    defaultGrams: 100,
    per100g: { calories: 265, protein: 8.5, carbs: 28.0, fat: 13.5, fiber: 3.6, sugar: 0.8, sodium: 380 },
    micronutrients: { potassium: 240, calcium: 65, iron: 2.2 },
    healthScore: 70
  },
  "upma": {
    name: "Rava Vegetable Upma",
    cuisine: "South Indian",
    aliases: ["upma", "rava upma", "sooji upma"],
    servingSize: "1 bowl (180g)",
    defaultGrams: 180,
    per100g: { calories: 148, protein: 3.8, carbs: 24.5, fat: 3.8, fiber: 2.2, sugar: 1.2, sodium: 270 },
    micronutrients: { potassium: 140, calcium: 28, iron: 1.4 },
    healthScore: 84
  },
  "pongal": {
    name: "Ven Pongal (Ghee Khichdi)",
    cuisine: "South Indian",
    aliases: ["ven pongal", "pongal", "khara pongal"],
    servingSize: "1 bowl (200g)",
    defaultGrams: 200,
    per100g: { calories: 170, protein: 5.2, carbs: 26.5, fat: 4.8, fiber: 2.5, sugar: 0.5, sodium: 290 },
    micronutrients: { potassium: 180, calcium: 35, iron: 1.6 },
    healthScore: 83
  },
  "bisi bele bath": {
    name: "Bisi Bele Bath",
    cuisine: "South Indian",
    aliases: ["bisi bele bath", "spiced lentil rice"],
    servingSize: "1 bowl (220g)",
    defaultGrams: 220,
    per100g: { calories: 155, protein: 4.8, carbs: 26.0, fat: 3.5, fiber: 3.2, sugar: 1.8, sodium: 320 },
    micronutrients: { potassium: 250, calcium: 40, iron: 1.8 },
    healthScore: 84
  },

  // =========================================================================
  // 4. INDIAN MULTI-REGIONAL STAPLES
  // =========================================================================
  "roti": {
    name: "Whole Wheat Roti / Chapati",
    cuisine: "Indian",
    aliases: ["roti", "chapati", "phulka", "whole wheat flatbread"],
    servingSize: "2 rotis (70g)",
    defaultGrams: 70,
    per100g: { calories: 295, protein: 10.5, carbs: 55.0, fat: 3.5, fiber: 7.5, sugar: 1.0, sodium: 180 },
    micronutrients: { potassium: 230, calcium: 35, iron: 3.2 },
    healthScore: 90
  },
  "naan": {
    name: "Tandoori Naan",
    cuisine: "Indian",
    aliases: ["naan", "plain naan", "butter naan", "garlic naan"],
    servingSize: "1 piece (110g)",
    defaultGrams: 110,
    per100g: { calories: 290, protein: 8.5, carbs: 48.0, fat: 7.0, fiber: 2.2, sugar: 3.0, sodium: 420 },
    micronutrients: { potassium: 150, calcium: 45, iron: 1.8 },
    healthScore: 72
  },
  "biryani": {
    name: "Hyderabadi Chicken Biryani",
    cuisine: "Indian",
    aliases: ["biryani", "chicken biryani", "mutton biryani", "veg biryani"],
    servingSize: "1 plate (300g)",
    defaultGrams: 300,
    per100g: { calories: 175, protein: 9.8, carbs: 22.0, fat: 5.6, fiber: 1.8, sugar: 1.2, sodium: 380 },
    micronutrients: { potassium: 240, calcium: 40, iron: 1.9 },
    healthScore: 78
  },
  "rice": {
    name: "Steamed Basmati Rice",
    cuisine: "Indian",
    aliases: ["rice", "steamed rice", "basmati rice", "white rice"],
    servingSize: "1 cup cooked (150g)",
    defaultGrams: 150,
    per100g: { calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.6, sugar: 0.1, sodium: 2 },
    micronutrients: { potassium: 35, calcium: 10, iron: 0.8 },
    healthScore: 82
  },
  "dal": {
    name: "Yellow Dal Tadka",
    cuisine: "Indian",
    aliases: ["dal", "dal tadka", "yellow dal", "toor dal", "moong dal"],
    servingSize: "1 bowl (180g)",
    defaultGrams: 180,
    per100g: { calories: 115, protein: 7.2, carbs: 16.5, fat: 2.4, fiber: 3.8, sugar: 1.2, sodium: 290 },
    micronutrients: { potassium: 280, calcium: 40, iron: 2.4 },
    healthScore: 89
  },
  "paneer": {
    name: "Fresh Cottage Cheese (Paneer)",
    cuisine: "Indian",
    aliases: ["paneer", "cottage cheese", "fresh paneer"],
    servingSize: "100g raw",
    defaultGrams: 100,
    per100g: { calories: 265, protein: 18.5, carbs: 4.5, fat: 19.5, fiber: 0.0, sugar: 2.5, sodium: 22 },
    micronutrients: { potassium: 120, calcium: 480, iron: 0.5 },
    healthScore: 88
  },
  "palak paneer": {
    name: "Palak Paneer",
    cuisine: "Indian",
    aliases: ["palak paneer", "spinach paneer"],
    servingSize: "1 bowl (200g)",
    defaultGrams: 200,
    per100g: { calories: 175, protein: 9.5, carbs: 6.8, fat: 12.5, fiber: 3.2, sugar: 2.0, sodium: 310 },
    micronutrients: { potassium: 340, calcium: 280, iron: 2.9, vitaminA: 520 },
    healthScore: 90
  },
  "chole": {
    name: "Pindi Chole (Chickpea Curry)",
    cuisine: "Indian",
    aliases: ["chole", "chana masala", "chickpea curry"],
    servingSize: "1 bowl (200g)",
    defaultGrams: 200,
    per100g: { calories: 145, protein: 7.5, carbs: 21.0, fat: 3.6, fiber: 5.5, sugar: 2.2, sodium: 320 },
    micronutrients: { potassium: 310, calcium: 60, iron: 2.5 },
    healthScore: 89
  },
  "rajma": {
    name: "Rajma Masala (Kidney Beans)",
    cuisine: "Indian",
    aliases: ["rajma", "rajma masala", "kidney bean curry"],
    servingSize: "1 bowl (200g)",
    defaultGrams: 200,
    per100g: { calories: 135, protein: 7.8, carbs: 20.5, fat: 2.5, fiber: 5.8, sugar: 1.8, sodium: 310 },
    micronutrients: { potassium: 380, calcium: 55, iron: 2.8 },
    healthScore: 91
  },
  "samosa": {
    name: "Spiced Potato Samosa",
    cuisine: "Indian",
    aliases: ["samosa", "punjabi samosa", "aloo samosa"],
    servingSize: "1 piece (80g)",
    defaultGrams: 80,
    per100g: { calories: 262, protein: 4.5, carbs: 32.0, fat: 13.5, fiber: 2.8, sugar: 1.5, sodium: 410 },
    micronutrients: { potassium: 190, calcium: 30, iron: 1.5 },
    healthScore: 64
  },
  "pav bhaji": {
    name: "Mumbai Pav Bhaji",
    cuisine: "Indian",
    aliases: ["pav bhaji", "bhaji pav"],
    servingSize: "1 plate (2 pav + bhaji, 260g)",
    defaultGrams: 260,
    per100g: { calories: 175, protein: 4.5, carbs: 26.0, fat: 6.2, fiber: 3.5, sugar: 3.2, sodium: 450 },
    micronutrients: { potassium: 280, calcium: 45, iron: 1.8, vitaminC: 22 },
    healthScore: 74
  },
  "salad": {
    name: "Fresh Garden Cucumber & Tomato Salad",
    cuisine: "Indian",
    aliases: ["salad", "green salad", "kachumber", "cucumber tomato salad"],
    servingSize: "1 bowl (120g)",
    defaultGrams: 120,
    per100g: { calories: 25, protein: 1.2, carbs: 4.8, fat: 0.3, fiber: 1.8, sugar: 2.4, sodium: 35 },
    micronutrients: { potassium: 210, calcium: 25, iron: 0.6, vitaminC: 16, vitaminA: 180 },
    healthScore: 98
  },

  // =========================================================================
  // 5. CHINESE FOODS
  // =========================================================================
  "dim sum": {
    name: "Steamed Dim Sum (Dumplings)",
    cuisine: "Chinese",
    aliases: ["dim sum", "dumplings", "har gow", "siu mai", "steamed dumplings"],
    servingSize: "4 pieces (120g)",
    defaultGrams: 120,
    per100g: { calories: 175, protein: 8.5, carbs: 22.0, fat: 5.8, fiber: 1.5, sugar: 1.2, sodium: 480 },
    micronutrients: { potassium: 160, calcium: 30, iron: 1.4 },
    healthScore: 82
  },
  "kung pao chicken": {
    name: "Kung Pao Chicken",
    cuisine: "Chinese",
    aliases: ["kung pao chicken", "gong bao ji ding", "spicy peanut chicken"],
    servingSize: "1 bowl (200g)",
    defaultGrams: 200,
    per100g: { calories: 180, protein: 15.0, carbs: 8.5, fat: 9.8, fiber: 2.2, sugar: 4.0, sodium: 520 },
    micronutrients: { potassium: 290, calcium: 40, iron: 1.8 },
    healthScore: 79
  },
  "fried rice": {
    name: "Egg & Vegetable Fried Rice",
    cuisine: "Chinese",
    aliases: ["fried rice", "egg fried rice", "chicken fried rice", "veg fried rice"],
    servingSize: "1 bowl (200g)",
    defaultGrams: 200,
    per100g: { calories: 165, protein: 4.8, carbs: 26.5, fat: 4.5, fiber: 1.5, sugar: 1.0, sodium: 410 },
    micronutrients: { potassium: 140, calcium: 25, iron: 1.2 },
    healthScore: 76
  },
  "chow mein": {
    name: "Chicken / Veg Chow Mein",
    cuisine: "Chinese",
    aliases: ["chow mein", "stir fry noodles", "lo mein", "chinese noodles"],
    servingSize: "1 bowl (220g)",
    defaultGrams: 220,
    per100g: { calories: 185, protein: 7.2, carbs: 25.0, fat: 6.2, fiber: 2.0, sugar: 2.5, sodium: 490 },
    micronutrients: { potassium: 180, calcium: 30, iron: 1.5 },
    healthScore: 75
  },
  "mapo tofu": {
    name: "Sichuan Mapo Tofu",
    cuisine: "Chinese",
    aliases: ["mapo tofu", "spicy sichuan tofu", "mabo tofu"],
    servingSize: "1 bowl (200g)",
    defaultGrams: 200,
    per100g: { calories: 135, protein: 9.5, carbs: 5.2, fat: 8.8, fiber: 2.1, sugar: 1.5, sodium: 560 },
    micronutrients: { potassium: 220, calcium: 180, iron: 2.6 },
    healthScore: 84
  },
  "spring rolls": {
    name: "Crisp Spring Rolls",
    cuisine: "Chinese",
    aliases: ["spring rolls", "egg roll", "vegetable spring rolls"],
    servingSize: "2 rolls (90g)",
    defaultGrams: 90,
    per100g: { calories: 240, protein: 5.2, carbs: 28.0, fat: 12.0, fiber: 2.2, sugar: 2.8, sodium: 480 },
    micronutrients: { potassium: 150, calcium: 35, iron: 1.2 },
    healthScore: 68
  },

  // =========================================================================
  // 6. JAPANESE FOODS
  // =========================================================================
  "sushi": {
    name: "Salmon / Tuna Sushi Roll",
    cuisine: "Japanese",
    aliases: ["sushi", "salmon sushi", "maki roll", "california roll", "nigiri"],
    servingSize: "6 pieces (180g)",
    defaultGrams: 180,
    per100g: { calories: 150, protein: 6.5, carbs: 25.0, fat: 2.5, fiber: 1.2, sugar: 3.5, sodium: 390 },
    micronutrients: { potassium: 160, calcium: 20, iron: 1.1, omega3: 650 },
    healthScore: 89
  },
  "ramen": {
    name: "Traditional Japanese Ramen",
    cuisine: "Japanese",
    aliases: ["ramen", "tonkotsu ramen", "miso ramen", "shoyu ramen"],
    servingSize: "1 large bowl with broth (450g)",
    defaultGrams: 450,
    per100g: { calories: 95, protein: 5.2, carbs: 12.5, fat: 2.8, fiber: 1.0, sugar: 1.2, sodium: 520 },
    micronutrients: { potassium: 190, calcium: 25, iron: 1.4 },
    healthScore: 75
  },
  "teriyaki chicken": {
    name: "Teriyaki Chicken",
    cuisine: "Japanese",
    aliases: ["teriyaki chicken", "chicken teriyaki", "grilled teriyaki"],
    servingSize: "1 portion (180g)",
    defaultGrams: 180,
    per100g: { calories: 185, protein: 22.0, carbs: 9.0, fat: 6.5, fiber: 0.5, sugar: 7.5, sodium: 480 },
    micronutrients: { potassium: 310, calcium: 20, iron: 1.3 },
    healthScore: 82
  },
  "miso soup": {
    name: "Traditional Miso Soup with Tofu",
    cuisine: "Japanese",
    aliases: ["miso soup", "miso shiru"],
    servingSize: "1 bowl (180ml / 180g)",
    defaultGrams: 180,
    per100g: { calories: 35, protein: 2.8, carbs: 3.5, fat: 1.1, fiber: 0.8, sugar: 1.2, sodium: 460 },
    micronutrients: { potassium: 150, calcium: 35, iron: 0.9 },
    healthScore: 90
  },
  "tempura": {
    name: "Prawn & Vegetable Tempura",
    cuisine: "Japanese",
    aliases: ["tempura", "shrimp tempura", "vegetable tempura"],
    servingSize: "5 pieces (130g)",
    defaultGrams: 130,
    per100g: { calories: 230, protein: 7.5, carbs: 22.0, fat: 12.5, fiber: 1.5, sugar: 1.0, sodium: 340 },
    micronutrients: { potassium: 160, calcium: 35, iron: 1.2 },
    healthScore: 71
  },

  // =========================================================================
  // 7. THAI FOODS
  // =========================================================================
  "pad thai": {
    name: "Authentic Pad Thai",
    cuisine: "Thai",
    aliases: ["pad thai", "phat thai", "thai stir fry noodles"],
    servingSize: "1 plate (250g)",
    defaultGrams: 250,
    per100g: { calories: 170, protein: 7.5, carbs: 23.5, fat: 5.5, fiber: 1.8, sugar: 4.5, sodium: 460 },
    micronutrients: { potassium: 210, calcium: 40, iron: 1.5 },
    healthScore: 80
  },
  "tom yum": {
    name: "Tom Yum Goong (Hot & Sour Prawn Soup)",
    cuisine: "Thai",
    aliases: ["tom yum", "tom yum soup", "tom yum goong"],
    servingSize: "1 bowl (220g)",
    defaultGrams: 220,
    per100g: { calories: 55, protein: 6.2, carbs: 3.8, fat: 1.8, fiber: 0.8, sugar: 2.0, sodium: 490 },
    micronutrients: { potassium: 240, calcium: 45, iron: 1.2, vitaminC: 15 },
    healthScore: 88
  },
  "green curry": {
    name: "Thai Green Curry (Gaeng Keow Wan)",
    cuisine: "Thai",
    aliases: ["green curry", "thai green curry", "chicken green curry"],
    servingSize: "1 bowl with chicken (220g)",
    defaultGrams: 220,
    per100g: { calories: 145, protein: 9.2, carbs: 5.5, fat: 9.8, fiber: 1.6, sugar: 3.0, sodium: 420 },
    micronutrients: { potassium: 270, calcium: 35, iron: 1.6 },
    healthScore: 82
  },

  // =========================================================================
  // 8. KOREAN FOODS
  // =========================================================================
  "bibimbap": {
    name: "Korean Bibimbap with Egg & Beef",
    cuisine: "Korean",
    aliases: ["bibimbap", "dolsot bibimbap", "korean mixed rice"],
    servingSize: "1 bowl (320g)",
    defaultGrams: 320,
    per100g: { calories: 160, protein: 7.5, carbs: 22.0, fat: 4.8, fiber: 2.8, sugar: 2.5, sodium: 410 },
    micronutrients: { potassium: 290, calcium: 45, iron: 2.2, vitaminA: 340 },
    healthScore: 91
  },
  "kimchi": {
    name: "Traditional Fermented Kimchi",
    cuisine: "Korean",
    aliases: ["kimchi", "fermented cabbage kimchi", "baechu kimchi"],
    servingSize: "1 side bowl (80g)",
    defaultGrams: 80,
    per100g: { calories: 23, protein: 1.8, carbs: 3.8, fat: 0.5, fiber: 2.4, sugar: 1.2, sodium: 590 },
    micronutrients: { potassium: 260, calcium: 65, iron: 1.2, vitaminC: 25, probiotics: 100 },
    healthScore: 94
  },
  "bulgogi": {
    name: "Korean Beef Bulgogi",
    cuisine: "Korean",
    aliases: ["bulgogi", "marinated beef bulgogi"],
    servingSize: "1 portion (180g)",
    defaultGrams: 180,
    per100g: { calories: 215, protein: 21.0, carbs: 9.5, fat: 10.5, fiber: 1.0, sugar: 7.0, sodium: 480 },
    micronutrients: { potassium: 320, calcium: 30, iron: 2.6 },
    healthScore: 80
  },
  "tteokbokki": {
    name: "Spicy Korean Rice Cakes (Tteokbokki)",
    cuisine: "Korean",
    aliases: ["tteokbokki", "topokki", "spicy rice cake"],
    servingSize: "1 bowl (200g)",
    defaultGrams: 200,
    per100g: { calories: 195, protein: 4.2, carbs: 41.0, fat: 1.8, fiber: 2.0, sugar: 6.5, sodium: 540 },
    micronutrients: { potassium: 160, calcium: 25, iron: 1.1 },
    healthScore: 70
  },

  // =========================================================================
  // 9. ITALIAN FOODS
  // =========================================================================
  "pizza": {
    name: "Italian Margherita Pizza",
    cuisine: "Italian",
    aliases: ["pizza", "margherita pizza", "cheese pizza", "woodfired pizza"],
    servingSize: "2 slices (180g)",
    defaultGrams: 180,
    per100g: { calories: 266, protein: 11.2, carbs: 33.0, fat: 10.2, fiber: 2.3, sugar: 3.6, sodium: 590 },
    micronutrients: { potassium: 180, calcium: 190, iron: 2.2 },
    healthScore: 74
  },
  "pasta": {
    name: "Pasta al Pomodoro / Bolognese",
    cuisine: "Italian",
    aliases: ["pasta", "spaghetti", "penne", "pasta arrabbiata", "spaghetti bolognese"],
    servingSize: "1 plate (220g)",
    defaultGrams: 220,
    per100g: { calories: 155, protein: 6.2, carbs: 26.5, fat: 2.8, fiber: 2.0, sugar: 3.0, sodium: 340 },
    micronutrients: { potassium: 210, calcium: 35, iron: 1.8 },
    healthScore: 82
  },
  "lasagna": {
    name: "Classic Baked Lasagna",
    cuisine: "Italian",
    aliases: ["lasagna", "lasagne", "beef lasagna", "vegetable lasagna"],
    servingSize: "1 slice (220g)",
    defaultGrams: 220,
    per100g: { calories: 175, protein: 9.8, carbs: 16.5, fat: 7.8, fiber: 1.8, sugar: 2.8, sodium: 430 },
    micronutrients: { potassium: 240, calcium: 140, iron: 1.9 },
    healthScore: 77
  },
  "risotto": {
    name: "Mushroom & Parmesan Risotto",
    cuisine: "Italian",
    aliases: ["risotto", "mushroom risotto", "risotto alla milanese"],
    servingSize: "1 plate (200g)",
    defaultGrams: 200,
    per100g: { calories: 165, protein: 4.8, carbs: 25.0, fat: 5.2, fiber: 1.8, sugar: 1.2, sodium: 390 },
    micronutrients: { potassium: 190, calcium: 80, iron: 1.4 },
    healthScore: 80
  },

  // =========================================================================
  // 10. MEXICAN FOODS
  // =========================================================================
  "tacos": {
    name: "Authentic Mexican Street Tacos",
    cuisine: "Mexican",
    aliases: ["tacos", "taco", "carne asada taco", "al pastor taco", "chicken taco"],
    servingSize: "2 tacos (160g)",
    defaultGrams: 160,
    per100g: { calories: 190, protein: 11.5, carbs: 18.5, fat: 7.8, fiber: 2.5, sugar: 1.5, sodium: 380 },
    micronutrients: { potassium: 260, calcium: 70, iron: 2.1 },
    healthScore: 84
  },
  "burrito": {
    name: "Rice, Bean & Grilled Chicken Burrito",
    cuisine: "Mexican",
    aliases: ["burrito", "chicken burrito", "bean burrito"],
    servingSize: "1 burrito (280g)",
    defaultGrams: 280,
    per100g: { calories: 185, protein: 9.5, carbs: 24.5, fat: 5.8, fiber: 3.5, sugar: 2.0, sodium: 440 },
    micronutrients: { potassium: 310, calcium: 85, iron: 2.4 },
    healthScore: 82
  },
  "guacamole": {
    name: "Fresh Avocado Guacamole",
    cuisine: "Mexican",
    aliases: ["guacamole", "guac", "avocado dip"],
    servingSize: "1/2 cup (100g)",
    defaultGrams: 100,
    per100g: { calories: 160, protein: 2.0, carbs: 8.5, fat: 14.5, fiber: 6.8, sugar: 0.8, sodium: 220 },
    micronutrients: { potassium: 485, calcium: 15, iron: 0.8, vitaminE: 2.1 },
    healthScore: 94
  },
  "quesadilla": {
    name: "Cheese & Chicken Quesadilla",
    cuisine: "Mexican",
    aliases: ["quesadilla", "cheese quesadilla", "chicken quesadilla"],
    servingSize: "1 quesadilla (180g)",
    defaultGrams: 180,
    per100g: { calories: 270, protein: 14.2, carbs: 22.0, fat: 14.0, fiber: 2.0, sugar: 1.8, sodium: 530 },
    micronutrients: { potassium: 210, calcium: 280, iron: 1.8 },
    healthScore: 73
  },

  // =========================================================================
  // 11. AMERICAN FOODS
  // =========================================================================
  "burger": {
    name: "Classic Cheeseburger",
    cuisine: "American",
    aliases: ["burger", "cheeseburger", "hamburger", "veggie burger"],
    servingSize: "1 burger (200g)",
    defaultGrams: 200,
    per100g: { calories: 265, protein: 14.5, carbs: 24.0, fat: 12.8, fiber: 1.8, sugar: 4.5, sodium: 490 },
    micronutrients: { potassium: 250, calcium: 120, iron: 2.4 },
    healthScore: 70
  },
  "chicken breast": {
    name: "Grilled Lean Chicken Breast",
    cuisine: "American",
    aliases: ["chicken breast", "grilled chicken", "chicken", "baked chicken"],
    servingSize: "1 breast (160g)",
    defaultGrams: 160,
    per100g: { calories: 165, protein: 31.0, carbs: 0.0, fat: 3.6, fiber: 0.0, sugar: 0.0, sodium: 74 },
    micronutrients: { potassium: 380, calcium: 15, iron: 1.0 },
    healthScore: 98
  },
  "mac and cheese": {
    name: "Baked Macaroni & Cheese",
    cuisine: "American",
    aliases: ["mac and cheese", "macaroni and cheese", "macaroni cheese"],
    servingSize: "1 bowl (200g)",
    defaultGrams: 200,
    per100g: { calories: 210, protein: 8.5, carbs: 24.0, fat: 9.0, fiber: 1.4, sugar: 3.2, sodium: 470 },
    micronutrients: { potassium: 140, calcium: 180, iron: 1.2 },
    healthScore: 68
  },
  "buffalo wings": {
    name: "Crisp Buffalo Chicken Wings",
    cuisine: "American",
    aliases: ["buffalo wings", "chicken wings", "hot wings"],
    servingSize: "4 wings (150g)",
    defaultGrams: 150,
    per100g: { calories: 255, protein: 18.5, carbs: 4.5, fat: 18.0, fiber: 0.5, sugar: 1.0, sodium: 680 },
    micronutrients: { potassium: 220, calcium: 20, iron: 1.2 },
    healthScore: 66
  },
  "oatmeal": {
    name: "Rolled Oatmeal with Berries",
    cuisine: "American",
    aliases: ["oatmeal", "oats", "porridge", "rolled oats"],
    servingSize: "1 bowl (200g)",
    defaultGrams: 200,
    per100g: { calories: 72, protein: 2.8, carbs: 12.8, fat: 1.4, fiber: 2.4, sugar: 1.5, sodium: 45 },
    micronutrients: { potassium: 120, calcium: 30, iron: 1.4 },
    healthScore: 96
  },
  "egg": {
    name: "Boiled / Poached Whole Egg",
    cuisine: "American",
    aliases: ["egg", "eggs", "boiled egg", "fried egg", "scrambled egg"],
    servingSize: "2 large eggs (100g)",
    defaultGrams: 100,
    per100g: { calories: 155, protein: 13.0, carbs: 1.1, fat: 11.0, fiber: 0.0, sugar: 1.1, sodium: 124 },
    micronutrients: { potassium: 126, calcium: 50, iron: 1.8, choline: 250 },
    healthScore: 94
  },

  // =========================================================================
  // 12. EUROPEAN FOODS
  // =========================================================================
  "croissant": {
    name: "Butter Croissant",
    cuisine: "European",
    aliases: ["croissant", "french croissant", "butter croissant"],
    servingSize: "1 croissant (65g)",
    defaultGrams: 65,
    per100g: { calories: 406, protein: 8.2, carbs: 45.8, fat: 21.0, fiber: 2.6, sugar: 11.2, sodium: 460 },
    micronutrients: { potassium: 120, calcium: 40, iron: 1.8 },
    healthScore: 62
  },
  "paella": {
    name: "Spanish Seafood & Saffron Paella",
    cuisine: "European",
    aliases: ["paella", "spanish paella", "seafood paella"],
    servingSize: "1 plate (250g)",
    defaultGrams: 250,
    per100g: { calories: 155, protein: 8.8, carbs: 21.0, fat: 4.2, fiber: 1.8, sugar: 1.2, sodium: 390 },
    micronutrients: { potassium: 220, calcium: 45, iron: 2.1 },
    healthScore: 84
  },
  "greek salad": {
    name: "Mediterranean Greek Salad with Feta",
    cuisine: "European",
    aliases: ["greek salad", "horiatiki", "mediterranean salad"],
    servingSize: "1 bowl (180g)",
    defaultGrams: 180,
    per100g: { calories: 95, protein: 3.5, carbs: 4.2, fat: 7.2, fiber: 2.0, sugar: 2.8, sodium: 290 },
    micronutrients: { potassium: 280, calcium: 110, iron: 1.1, vitaminC: 22 },
    healthScore: 92
  },

  // =========================================================================
  // 13. MIDDLE EASTERN FOODS
  // =========================================================================
  "shawarma": {
    name: "Chicken Shawarma Wrap",
    cuisine: "Middle Eastern",
    aliases: ["shawarma", "chicken shawarma", "doner wrap"],
    servingSize: "1 wrap (220g)",
    defaultGrams: 220,
    per100g: { calories: 195, protein: 13.5, carbs: 19.0, fat: 7.8, fiber: 2.2, sugar: 2.0, sodium: 460 },
    micronutrients: { potassium: 270, calcium: 65, iron: 2.1 },
    healthScore: 82
  },
  "falafel": {
    name: "Crisp Herb Chickpea Falafel",
    cuisine: "Middle Eastern",
    aliases: ["falafel", "ta'ameya", "chickpea fritters"],
    servingSize: "4 pieces (120g)",
    defaultGrams: 120,
    per100g: { calories: 285, protein: 12.5, carbs: 32.0, fat: 12.5, fiber: 7.5, sugar: 2.8, sodium: 420 },
    micronutrients: { potassium: 410, calcium: 80, iron: 3.4 },
    healthScore: 85
  },
  "hummus": {
    name: "Creamy Tahini Hummus with Olive Oil",
    cuisine: "Middle Eastern",
    aliases: ["hummus", "hommus", "houmous", "chickpea dip"],
    servingSize: "1/2 cup (100g)",
    defaultGrams: 100,
    per100g: { calories: 166, protein: 7.9, carbs: 14.3, fat: 9.6, fiber: 6.0, sugar: 0.3, sodium: 380 },
    micronutrients: { potassium: 290, calcium: 40, iron: 2.4 },
    healthScore: 93
  },
  "shakshuka": {
    name: "Spiced Poached Egg Shakshuka",
    cuisine: "Middle Eastern",
    aliases: ["shakshuka", "shakshouka", "poached eggs in tomato"],
    servingSize: "1 pan serving (220g)",
    defaultGrams: 220,
    per100g: { calories: 110, protein: 6.8, carbs: 6.5, fat: 6.2, fiber: 2.2, sugar: 3.8, sodium: 340 },
    micronutrients: { potassium: 320, calcium: 60, iron: 2.2, vitaminC: 28 },
    healthScore: 92
  },

  // =========================================================================
  // 14. AFRICAN FOODS
  // =========================================================================
  "jollof rice": {
    name: "Smoky West African Jollof Rice",
    cuisine: "African",
    aliases: ["jollof rice", "nigerian jollof", "ghana jollof", "jollof"],
    servingSize: "1 plate (240g)",
    defaultGrams: 240,
    per100g: { calories: 165, protein: 3.8, carbs: 28.5, fat: 4.2, fiber: 2.1, sugar: 2.4, sodium: 380 },
    micronutrients: { potassium: 210, calcium: 30, iron: 1.6, vitaminA: 260 },
    healthScore: 82
  },
  "tagine": {
    name: "Moroccan Spiced Chicken Tagine",
    cuisine: "African",
    aliases: ["tagine", "moroccan tagine", "tajine", "chicken tagine"],
    servingSize: "1 bowl (250g)",
    defaultGrams: 250,
    per100g: { calories: 155, protein: 14.0, carbs: 8.5, fat: 7.2, fiber: 2.5, sugar: 4.0, sodium: 370 },
    micronutrients: { potassium: 340, calcium: 55, iron: 2.2 },
    healthScore: 86
  },
  "injera": {
    name: "Ethiopian Fermented Teff Injera",
    cuisine: "African",
    aliases: ["injera", "teff flatbread", "ethiopian bread"],
    servingSize: "1 flatbread (120g)",
    defaultGrams: 120,
    per100g: { calories: 150, protein: 5.5, carbs: 29.0, fat: 1.2, fiber: 4.8, sugar: 0.5, sodium: 160 },
    micronutrients: { potassium: 210, calcium: 75, iron: 4.2 },
    healthScore: 91
  },
  "suya": {
    name: "West African Spiced Beef Suya",
    cuisine: "African",
    aliases: ["suya", "beef suya", "spiced grilled meat"],
    servingSize: "4 skewers (150g)",
    defaultGrams: 150,
    per100g: { calories: 235, protein: 25.0, carbs: 4.5, fat: 13.0, fiber: 1.5, sugar: 1.2, sodium: 440 },
    micronutrients: { potassium: 350, calcium: 40, iron: 3.1 },
    healthScore: 82
  }
};

/**
 * Standard Portion Weights dictionary for accurate grams resolution
 */
const STANDARD_PORTIONS = {
  "1 roti": 35,
  "2 rotis": 70,
  "1 chapati": 35,
  "2 chapatis": 70,
  "1 naan": 110,
  "1 paratha": 80,
  "1 bowl dal": 180,
  "1 cup rice": 150,
  "1 plate rice": 200,
  "150g rice": 150,
  "100g paneer": 100,
  "1 glass milk": 250,
  "250ml milk": 250,
  "1 apple": 160,
  "1 banana": 120,
  "1 boiled egg": 50,
  "2 boiled eggs": 100,
  "1 chicken breast": 160,
  "1 bowl salad": 120,
  "1 slice pizza": 90,
  "2 slices pizza": 180,
  "1 burger": 200,
  "1 samosa": 80,
  "2 samosas": 160,
  "3 idlis": 150,
  "1 dosa": 150,
  "1 plate biryani": 300
};

/**
 * Clean & normalize food queries
 */
function cleanQuery(str) {
  return (str || '')
    .toLowerCase()
    .trim()
    .replace(/[_\-,;.]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Search and find best match in the worldwide database
 */
function findBestFoodMatch(query) {
  if (!query) return null;
  const q = cleanQuery(query);

  // 1. Direct key match
  if (WORLDWIDE_FOOD_CATALOG[q]) {
    return { key: q, ...WORLDWIDE_FOOD_CATALOG[q] };
  }

  // 2. Alias match
  for (const [key, item] of Object.entries(WORLDWIDE_FOOD_CATALOG)) {
    if (item.aliases && item.aliases.some(alias => q.includes(alias) || alias.includes(q))) {
      return { key, ...item };
    }
    if (item.name.toLowerCase().includes(q) || q.includes(item.name.toLowerCase())) {
      return { key, ...item };
    }
  }

  // 3. Token overlap match
  const qTokens = q.split(' ').filter(t => t.length > 2);
  let bestItem = null;
  let maxMatches = 0;

  for (const [key, item] of Object.entries(WORLDWIDE_FOOD_CATALOG)) {
    let matches = 0;
    for (const t of qTokens) {
      if (key.includes(t) || item.name.toLowerCase().includes(t)) {
        matches++;
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestItem = { key, ...item };
    }
  }

  return maxMatches > 0 ? bestItem : null;
}

/**
 * Parse portion weight in grams
 */
function parseEstimatedGrams(portionText, defaultGrams = 150) {
  if (!portionText) return defaultGrams;
  const p = portionText.toLowerCase().trim();

  // Direct lookup in standard portions
  for (const [key, grams] of Object.entries(STANDARD_PORTIONS)) {
    if (p.includes(key)) return grams;
  }

  // Regex pattern for "150g", "200 grams", "250 ml", "1.5 kg", "8 oz"
  const gMatch = p.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|grams)\b/);
  if (gMatch) return Math.round(parseFloat(gMatch[1]));

  const mlMatch = p.match(/(\d+(?:\.\d+)?)\s*(?:ml|milliliters)\b/);
  if (mlMatch) return Math.round(parseFloat(mlMatch[1]));

  const kgMatch = p.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos|kilograms)\b/);
  if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);

  const ozMatch = p.match(/(\d+(?:\.\d+)?)\s*(?:oz|ounces)\b/);
  if (ozMatch) return Math.round(parseFloat(ozMatch[1]) * 28.35);

  const cupMatch = p.match(/(\d+(?:\.\d+)?)\s*(?:cup|cups)\b/);
  if (cupMatch) return Math.round(parseFloat(cupMatch[1]) * 200);

  const pieceMatch = p.match(/(\d+)\s*(?:piece|pieces|slice|slices|strip|strips|roti|rotis|idli|idlis)\b/);
  if (pieceMatch) {
    const count = parseInt(pieceMatch[1], 10);
    return count * 45; // average 45g per piece
  }

  return defaultGrams;
}

/**
 * Calculate accurate nutritional breakdown for food item based on grams
 */
function calculateItemNutrition(foodName, portionText = "", rawGrams = null, originalItem = null) {
  const match = findBestFoodMatch(foodName);
  const grams = rawGrams || parseEstimatedGrams(portionText, match ? match.defaultGrams : 150);

  if (match) {
    const factor = grams / 100;
    return {
      name: match.name,
      matchedKey: match.key,
      cuisine: match.cuisine,
      portion: portionText || `${grams}g`,
      estimatedGrams: grams,
      calories: Math.round(match.per100g.calories * factor),
      protein: parseFloat((match.per100g.protein * factor).toFixed(1)),
      carbs: parseFloat((match.per100g.carbs * factor).toFixed(1)),
      fat: parseFloat((match.per100g.fat * factor).toFixed(1)),
      fiber: parseFloat((match.per100g.fiber * factor).toFixed(1)),
      sugar: parseFloat((match.per100g.sugar * factor).toFixed(1)),
      sodium: Math.round(match.per100g.sodium * factor),
      healthScore: match.healthScore || 80,
      micronutrients: match.micronutrients || {}
    };
  }

  // If verified values exist in originalItem from verified AI detection
  if (originalItem && typeof originalItem.calories === 'number' && originalItem.calories > 0) {
    return {
      name: foodName,
      matchedKey: null,
      cuisine: originalItem.cuisine || "International",
      portion: portionText || `${grams}g`,
      estimatedGrams: grams,
      calories: Math.round(originalItem.calories),
      protein: parseFloat(Number(originalItem.protein || 0).toFixed(1)),
      carbs: parseFloat(Number(originalItem.carbs || 0).toFixed(1)),
      fat: parseFloat(Number(originalItem.fat || 0).toFixed(1)),
      fiber: parseFloat(Number(originalItem.fiber || 0).toFixed(1)),
      sugar: parseFloat(Number(originalItem.sugar || 0).toFixed(1)),
      sodium: Math.round(Number(originalItem.sodium || 0)),
      healthScore: originalItem.healthScore || 80,
      micronutrients: originalItem.micronutrients || {}
    };
  }

  // If no match and no verified values, NEVER fabricate nutrition: return 0
  return {
    name: foodName,
    matchedKey: null,
    cuisine: "Unverified",
    portion: portionText || `${grams}g`,
    estimatedGrams: grams,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    healthScore: 0,
    micronutrients: {}
  };
}

/**
 * Resolve multi-food plate / meal items and compute aggregate metrics
 */
function resolveMultiFoodMeal(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      items: [],
      totalCalories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      overallHealthScore: 0
    };
  }

  const resolvedItems = items.map(item => {
    const name = item.name || item.foodName || "Food Item";
    const portion = item.portion || item.serving || "";
    const grams = item.estimatedGrams || item.weight || null;
    const computed = calculateItemNutrition(name, portion, grams, item);
    return {
      ...computed,
      confidence: item.confidence || 95
    };
  });

  const totals = resolvedItems.reduce((acc, curr) => {
    acc.calories += curr.calories;
    acc.protein += curr.protein;
    acc.carbs += curr.carbs;
    acc.fat += curr.fat;
    acc.fiber += curr.fiber;
    acc.sugar += curr.sugar;
    acc.sodium += curr.sodium;
    acc.scoreSum += curr.healthScore;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, scoreSum: 0 });

  return {
    items: resolvedItems,
    totalCalories: Math.round(totals.calories),
    protein: parseFloat(totals.protein.toFixed(1)),
    carbs: parseFloat(totals.carbs.toFixed(1)),
    fat: parseFloat(totals.fat.toFixed(1)),
    fiber: parseFloat(totals.fiber.toFixed(1)),
    sugar: parseFloat(totals.sugar.toFixed(1)),
    sodium: Math.round(totals.sodium),
    overallHealthScore: resolvedItems.length > 0 ? Math.round(totals.scoreSum / resolvedItems.length) : 0
  };
}

/**
 * Search the Worldwide Food Catalog by query and cuisine
 */
function searchCatalog(query = "", cuisineFilter = "") {
  const q = (query || "").toLowerCase().trim();
  const cf = (cuisineFilter || "").toLowerCase().trim();

  const results = [];
  for (const [key, item] of Object.entries(WORLDWIDE_FOOD_CATALOG)) {
    if (cf && item.cuisine.toLowerCase() !== cf) continue;
    if (q) {
      const matchName = item.name.toLowerCase().includes(q);
      const matchAliases = (item.aliases || []).some(a => a.toLowerCase().includes(q));
      const matchCuisine = item.cuisine.toLowerCase().includes(q);
      if (!matchName && !matchAliases && !matchCuisine) continue;
    }
    results.push({
      key,
      ...item
    });
    if (results.length >= 60) break;
  }
  return results;
}

module.exports = {
  WORLDWIDE_FOOD_CATALOG,
  STANDARD_PORTIONS,
  findBestFoodMatch,
  parseEstimatedGrams,
  calculateItemNutrition,
  resolveMultiFoodMeal,
  searchCatalog
};
