/**
 * Ready-to-copy dataset example library.
 * Used by Admin → Bulk Upload to show copyable templates of every format
 * the parser accepts. Keep the examples small but valid.
 */

export interface DatasetExample {
  id: string;
  title: string;
  format: string;
  ext: string;
  desc: string;
  content: string;
}

export const DATASET_EXAMPLES: DatasetExample[] = [
  {
    id: 'json-advanced',
    title: '⭐ JSON — Multi-answer + Placeholders + Media (best)',
    format: 'JSON',
    ext: '.json',
    desc: 'একটা question-এ একাধিক answer, [name]/[character]/[age] placeholder, এবং image/video/audio link সহ সবচেয়ে powerful format।',
    content: `[
  {
    "questions": ["Tumi kemon acho?", "তুমি কেমন আছো?"],
    "answers": [
      "ভালো আছি [name]! তুমি কেমন আছো?",
      "তোমার সাথে কথা বলে তো দারুণ লাগছে [name] 💖",
      "এখন তো **[character]** হয়ে তোমার পাশে আছি — দারুণ আছি!"
    ],
    "category": "greeting",
    "tags": ["multi-answer"]
  },
  {
    "questions": ["Tomar chobi dekhao", "তোমার ছবি দেখাও"],
    "answer": "এই দেখো [name] 💕\\n\\nhttps://i.ibb.co/pBt8bS5c/1748861266024.jpg",
    "category": "media",
    "tags": ["image"]
  },
  {
    "questions": ["Gan shonao", "গান শোনাও"],
    "answer": "তোমার জন্য একটা গান 🎵\\n\\nhttps://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "category": "media",
    "tags": ["audio"]
  }
]`,
  },
  {
    id: 'json-array',
    title: 'JSON Array (recommended)',
    format: 'JSON',
    ext: '.json',
    desc: 'সবচেয়ে শক্তিশালী format। Multiple question variants + category + tags support করে।',
    content: `[
  {
    "questions": ["Tumi ke?", "তুমি কে?", "Who are you?", "Tomar nam ki?"],
    "answer": "আমি Sofia — তোমার AI সঙ্গী। যেকোনো প্রশ্ন করতে পারো।",
    "category": "intro",
    "tags": ["greeting", "identity"]
  },
  {
    "questions": ["Ajker weather kemon?", "আজকের আবহাওয়া কেমন?"],
    "answer": "আমি real-time weather দেখতে পারি না, কিন্তু weather app ব্যবহার করো।",
    "category": "weather",
    "tags": ["info"]
  },
  {
    "questions": ["Bangla shikhte chai", "How to learn Bangla?"],
    "answer": "প্রতিদিন ১৫ মিনিট শোনা, পড়া, এবং বলার চেষ্টা করো। ছোট ছোট বাক্য দিয়ে শুরু করো।",
    "category": "learning",
    "tags": ["language", "tutorial"]
  }
]`,
  },
  {
    id: 'json-wrapped',
    title: 'JSON (wrapped in "qa" / "data")',
    format: 'JSON',
    ext: '.json',
    desc: 'যদি তোমার dataset একটা wrapper object-এ থাকে, parser auto detect করে।',
    content: `{
  "qa": [
    { "question": "Hello", "answer": "হ্যালো! কেমন আছো?", "category": "greeting" },
    { "question": "Bye", "answer": "বিদায়! আবার এসো।", "category": "greeting" }
  ]
}`,
  },
  {
    id: 'jsonl',
    title: 'JSONL (one record per line)',
    format: 'JSONL',
    ext: '.jsonl',
    desc: 'বড় dataset-এর জন্য efficient। প্রতি লাইনে একটি JSON object।',
    content: `{"questions":["Tumi ke?"],"answer":"আমি Sofia।","category":"intro"}
{"questions":["Khabar suggest koro"],"answer":"আজ বিরিয়ানি try করো!","category":"food"}
{"questions":["Movie recommendation"],"answer":"Inception দেখো — দারুণ thriller।","category":"entertainment"}`,
  },
  {
    id: 'csv',
    title: 'CSV (spreadsheet export)',
    format: 'CSV',
    ext: '.csv',
    desc: 'Excel / Google Sheets থেকে export করা যাবে। Headers: question, answer, category, tags',
    content: `question,answer,category,tags
"Tumi ke?","আমি Sofia, তোমার AI সঙ্গী।","intro","greeting;identity"
"Ki khete valo lage?","আমি AI, তাই কিছু খাই না 😄","fun","casual"
"Bangla type kivabe?","Avro বা Ridmik keyboard ব্যবহার করো।","tech","tutorial"`,
  },
  {
    id: 'tsv',
    title: 'TSV (tab-separated)',
    format: 'TSV',
    ext: '.tsv',
    desc: 'CSV-এর মতই, কিন্তু comma-এর জায়গায় tab। Translation tools থেকে useful।',
    content: `question\tanswer\tcategory
Tumi ke?\tআমি Sofia।\tintro
Ki koro?\tতোমার প্রশ্নের উত্তর দিই।\tcasual`,
  },
  {
    id: 'conversation',
    title: 'Conversation / Chat-log',
    format: 'JSON',
    ext: '.json',
    desc: 'ChatGPT-style messages array থেকে সরাসরি import করা যায়।',
    content: `[
  {
    "messages": [
      { "role": "user", "content": "Tomar bayos koto?" },
      { "role": "assistant", "content": "আমি AI, তাই বয়স নেই — কিন্তু সবসময় তোমার পাশে আছি।" }
    ],
    "category": "personal"
  },
  {
    "messages": [
      { "role": "user", "content": "Programming shikhte chai" },
      { "role": "assistant", "content": "Python দিয়ে শুরু করো। Free resources: freeCodeCamp, MDN, W3Schools।" }
    ],
    "category": "tech"
  }
]`,
  },
  {
    id: 'plaintext',
    title: 'Plain Text (Q/A blocks)',
    format: 'TXT',
    ext: '.txt',
    desc: 'সহজতম format। Q: ... এবং A: ... pattern; blank line দিয়ে records আলাদা করো।',
    content: `Q: Tumi ke?
A: আমি Sofia, তোমার বন্ধু।

Q: Mood off
A: Cheer up! একটু গান শুনে দেখো — মন ভালো হবে।

Q: Joke bolo
A: Programmer-রা কেন dark mode পছন্দ করে? কারণ light attracts bugs! 🐛`,
  },
  {
    id: 'pipe',
    title: 'Pipe-delimited (one-liners)',
    format: 'TXT',
    ext: '.txt',
    desc: 'এক লাইনে একটা QA। Quick brainstorm-এর জন্য perfect।',
    content: `Hi | হ্যালো! কেমন আছো?
Thanks | তোমাকেও ধন্যবাদ।
Sorry | কোনো ব্যাপার না, ঠিক আছে।
Help | আমি সাহায্য করতে এখানেই আছি।`,
  },
  {
    id: 'yaml',
    title: 'YAML-lite',
    format: 'YAML',
    ext: '.yaml',
    desc: 'Human-readable format। Hand-editing-এর জন্য সহজ।',
    content: `- question: Tumi ke?
  answer: আমি Sofia।
  category: intro

- question: Bhalo achi
  answer: শুনে খুশি হলাম!
  category: casual`,
  },
];

/** Big sample with 10 records for quick "load and try" workflow. */
export const STARTER_DATASET = `[
  { "questions": ["Hi", "Hello", "হ্যালো"], "answer": "হ্যালো! আমি Sofia। কেমন আছো?", "category": "greeting" },
  { "questions": ["Tumi ke?", "তুমি কে?", "Who are you?"], "answer": "আমি Sofia, তোমার AI সঙ্গী।", "category": "intro" },
  { "questions": ["Tomar nam ki?"], "answer": "আমার নাম Sofia।", "category": "intro" },
  { "questions": ["Kemon acho?", "How are you?"], "answer": "ভালো আছি, তুমি কেমন আছো?", "category": "casual" },
  { "questions": ["Ki koro?"], "answer": "তোমার সাথে কথা বলছি 😊", "category": "casual" },
  { "questions": ["Joke bolo", "Tell me a joke"], "answer": "কেন programmer-রা চশমা পরে? কারণ তারা C# দেখতে পারে না!", "category": "fun" },
  { "questions": ["Mood off", "Mon kharap"], "answer": "চিন্তা করো না, সব ঠিক হয়ে যাবে। আমি আছি।", "category": "support" },
  { "questions": ["Thanks", "Dhonnobad"], "answer": "তোমাকেও ধন্যবাদ ❤️", "category": "casual" },
  { "questions": ["Bye", "Tata"], "answer": "বিদায়! আবার এসো।", "category": "greeting" },
  { "questions": ["Help", "Sahajjo dorkar"], "answer": "অবশ্যই! কী সাহায্য লাগবে বলো।", "category": "support" }
]`;
