const defaultWords = [
  { filipino: "Kamusta ka?", english: "How are you?" },
  { filipino: "Paalam", english: "Good bye" },
  { filipino: "Inom", english: "Drink" },
  { filipino: "Kain", english: "Eat" },
  { filipino: "Tae", english: "Poop" },
  { filipino: "Tayo", english: "Stand" },
  { filipino: "Upo", english: "Sit" },
  { filipino: "Upuan", english: "Seat" },
  { filipino: "Kamot", english: "Scratch" },
  { filipino: "Palo", english: "Smack" },
  { filipino: "Ngipin", english: "Teeth" },
  { filipino: "Tainga (Tenga)", english: "Ear" },
  { filipino: "Mata", english: "Eyes" },
  { filipino: "Ilong", english: "Nose" },
  { filipino: "Pisngi", english: "Cheeks" },
  { filipino: "Labi", english: "Lips" },
  { filipino: "Kilay", english: "Eyebrows" },
  { filipino: "Pilik-mata", english: "Eyelashes" },
  { filipino: "Makikiraan (po)/Tabi-tabi (po)", english: "Excuse me" },
  { filipino: "Paa", english: "Feet" },
  { filipino: "Malayo", english: "Far" },
  { filipino: "Malapit", english: "Near" }
];

let userWords = JSON.parse(localStorage.getItem("userWords")) || [];
let favouriteWords = JSON.parse(localStorage.getItem("favouriteWords")) || [];
let incorrectWords = [];
let words = [...defaultWords, ...userWords];
let currentIndex = 0;
let quizIndex = 0;
let score = 0;
let isFlipped = false;

function saveUserWords() {
  localStorage.setItem("userWords", JSON.stringify(userWords));
}

function saveFavourites() {
  localStorage.setItem("favouriteWords", JSON.stringify(favouriteWords));
  updateFavouriteButtonVisibility();
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
  const form = document.getElementById("formSection");

  if (!filipino || !english) {
    showToast("⚠️ Please fill in both fields.");
    return;
  }

  const exists = words.some(word =>
    word.filipino.toLowerCase() === filipino.toLowerCase() &&
    word.english.toLowerCase() === english.toLowerCase()
  );

  if (exists) {
    showToast("⚠️ This word already exists in the list!");
    form.style.display = "none";
    return;
  }

  userWords.push({ filipino, english });
  saveUserWords();
  refreshWords();
  showWord(words.length - 1);
  document.getElementById("filipinoInput").value = "";
  document.getElementById("englishInput").value = "";
  form.style.display = "none";
  showToast(`✅ "${filipino}" added successfully!`);
}

function addToFavourites() {
  const current = words[currentIndex];
  const exists = favouriteWords.some(w =>
    w.filipino.toLowerCase() === current.filipino.toLowerCase() &&
    w.english.toLowerCase() === current.english.toLowerCase()
  );

  if (exists) {
    showToast("⚠️ This word is already in your favourites.");
    return;
  }

  favouriteWords.push(current);
  saveFavourites();
  showToast(`⭐ "${current.filipino}" added to favourites!`);
}

function updateFavouriteButtonVisibility() {
  const toggleBtn = document.getElementById("toggleFavouritesBtn");
  toggleBtn.style.display = favouriteWords.length > 0 ? "inline-block" : "none";
}

function toggleFavourites() {
  const section = document.getElementById("favouriteSection");
  const list = document.getElementById("favouriteList");

  if (section.style.display === "none") {
    section.style.display = "block";
    list.innerHTML = "";

    favouriteWords.forEach((word, index) => {
      const li = document.createElement("li");
      li.textContent = `${word.filipino} – ${word.english}`;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "🗑️";
      removeBtn.onclick = () => {
        favouriteWords.splice(index, 1);
        saveFavourites();
        toggleFavourites(); // refresh list
      };

      li.appendChild(removeBtn);
      list.appendChild(li);
    });
  } else {
    section.style.display = "none";
  }
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

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// Initial render
refreshWords();
updateFavouriteButtonVisibility();
