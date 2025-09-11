const defaultWords = [
  { filipino: "Kamusta ka?", english: "How are you?" },
  { filipino: "Paalam", english: "Good bye" },
  { filipino: "Inom", english: "Drink" },
  { filipino: "Kain", english: "Eat" }
];

let userWords = JSON.parse(localStorage.getItem("userWords")) || [];
let incorrectWords = [];
let words = [...defaultWords, ...userWords];
let currentIndex = 0;
let quizIndex = 0;
let score = 0;
let isFlipped = false;

function saveUserWords() {
  localStorage.setItem("userWords", JSON.stringify(userWords));
}

function refreshWords() {
  words = [...defaultWords, ...userWords];
}

function showWord(index) {
  if (words.length === 0) return;
  currentIndex = (index + words.length) % words.length;
  isFlipped = false;
  document.getElementById("cardText").textContent = words[currentIndex].filipino;
}

function flipCard() {
  if (words.length === 0) return;
  const card = document.getElementById("cardText");
  card.textContent = isFlipped ? words[currentIndex].filipino : words[currentIndex].english;
  isFlipped = !isFlipped;
}

function showRandomWord() {
  currentIndex = Math.floor(Math.random() * words.length);
  showWord(currentIndex);
}

function showNextWord() {
  showWord(currentIndex + 1);
}

function showPreviousWord() {
  showWord(currentIndex - 1);
}

function toggleForm() {
  const form = document.getElementById("formSection");
  form.style.display = form.style.display === "none" ? "block" : "none";
}

function addWord() {
  const filipino = document.getElementById("filipinoInput").value.trim();
  const english = document.getElementById("englishInput").value.trim();
  if (!filipino || !english) return;

  userWords.push({ filipino, english });
  saveUserWords();
  refreshWords();
  document.getElementById("filipinoInput").value = "";
  document.getElementById("englishInput").value = "";
  document.getElementById("formSection").style.display = "none";
  showWord(words.length - 1);
}

function startQuiz() {
  if (words.length < 4) {
    alert("Add at least 4 words to start the quiz.");
    return;
  }
  quizIndex = 0;
  score = 0;
  incorrectWords = [];
  document.getElementById("quizSection").style.display = "block";
  document.getElementById("mistakeReviewSection").style.display = "none";
  document.getElementById("reviewMistakesBtn").style.display = "none";
  document.getElementById("restartQuizBtn").style.display = "none";
  nextQuizQuestion();
}

function nextQuizQuestion() {
  if (quizIndex >= words.length) {
    document.getElementById("quizQuestion").textContent = "Quiz complete!";
    document.getElementById("quizOptions").innerHTML = "";
    document.getElementById("quizFeedback").textContent = `Your score: ${score}/${words.length}`;
    document.getElementById("restartQuizBtn").style.display = "inline-block";

    if (incorrectWords.length > 0) {
      document.getElementById("reviewMistakesBtn").style.display = "inline-block";
    }
    return;
  }

  const current = words[quizIndex];
  const correct = current.english;

  let options = words
    .filter((w, i) => i !== quizIndex)
    .map(w => w.english);
  options = shuffle(options).slice(0, 3);
  options.push(correct);
  options = shuffle(options);

  document.getElementById("quizQuestion").textContent = `What does "${current.filipino}" mean?`;
  document.getElementById("quizFeedback").textContent = "";

  const container = document.getElementById("quizOptions");
  container.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => {
      if (opt === correct) {
        score++;
        document.getElementById("quizFeedback").textContent = "✅ Correct!";
      } else {
        document.getElementById("quizFeedback").textContent = `❌ Wrong. Correct answer: ${correct}`;
        incorrectWords.push(current);
      }
    };
    container.appendChild(btn);
  });

  quizIndex++;
}

function endQuiz() {
  document.getElementById("quizSection").style.display = "none";
  document.getElementById("quizQuestion").textContent = "";
  document.getElementById("quizOptions").innerHTML = "";
  document.getElementById("quizFeedback").textContent = "";
  document.getElementById("restartQuizBtn").style.display = "none";
}

function restartQuiz() {
  quizIndex = 0;
  score = 0;
  incorrectWords = [];
  document.getElementById("quizSection").style.display = "block";
  document.getElementById("mistakeReviewSection").style.display = "none";
  document.getElementById("reviewMistakesBtn").style.display = "none";
  document.getElementById("restartQuizBtn").style.display = "none";
  nextQuizQuestion();
}

function showIncorrectWords() {
  const section = document.getElementById("mistakeReviewSection");
  const list = document.getElementById("mistakeList");

  if (!section || !list) return;

  section.style.display = "block";
  list.innerHTML = "";

  incorrectWords.forEach(word => {
    const li = document.createElement("li");
    li.textContent = `${word.filipino} – ${word.english}`;
    list.appendChild(li);
  });
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Initial render
refreshWords();