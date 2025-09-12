// ====== DATA ======
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

// Flexible API 
const API_BASE = "https://pinuno-translate-proxy.onrender.com";

async function translateText(q) {
  const res = await fetch(`${API_BASE}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q, source: "auto", target: "en" })
  });
  return res.json();
}

// Quiz state
let quizIndex = 0;
let score = 0;
let quizAnswered = false;
let stopClickedOnce = false;

// Modal state
let deleteIndex = null;
let addFromSearchWord = null;

// ====== STORAGE ======
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

// ====== TOAST ======
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

// ====== FLASHCARD ======
function showWord(index) {
  if (!words.length) return;
  currentIndex = (index + words.length) % words.length;
  document.getElementById("flashcard").classList.remove("flipped");
  const word = words[currentIndex];
  document.getElementById("cardFront").textContent = word.filipino;
  document.getElementById("cardBack").textContent = word.english;
  const deleteBtn = document.getElementById("deleteWordBtn");
  const isUserWord = userWords.some(w => w.filipino === word.filipino && w.english === word.english);
  deleteBtn.style.display = isUserWord ? "block" : "none";
}
function flipCard() {
  document.getElementById("flashcard").classList.toggle("flipped");
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

// ====== ADD WORD MODAL ======
function openAddWord() {
  document.getElementById("addWordModal").style.display = "flex";
}
function closeAddWord() {
  document.getElementById("addWordModal").style.display = "none";
}
function addWord() {
  const filipino = document.getElementById("filipinoInput").value.trim();
  const english = document.getElementById("englishInput").value.trim();
  if (!filipino || !english) {
    showToast("⚠️ Please fill in both fields.");
    return;
  }
  const exists = words.some(w =>
    w.filipino.toLowerCase() === filipino.toLowerCase() &&
    w.english.toLowerCase() === english.toLowerCase()
  );
  if (exists) {
    showToast("⚠️ This word already exists!");
    closeAddWord();
    return;
  }
  userWords.push({ filipino, english });
  saveUserWords();
  refreshWords();
  showWord(words.length - 1);
  document.getElementById("filipinoInput").value = "";
  document.getElementById("englishInput").value = "";
  closeAddWord();
  showToast(`✅ "${filipino}" added!`);
}

// ====== DELETE CURRENT WORD ======
function confirmDeleteCurrentWord() {
  if (!words.length) return;
  const current = words[currentIndex];
  deleteIndex = userWords.findIndex(w => w.filipino === current.filipino && w.english === current.english);
  if (deleteIndex === -1) {
    showToast("⚠️ Only user-added words can be deleted.");
    return;
  }
  document.getElementById("deleteMessage").textContent =
    `Delete "${current.filipino}" from your words?`;
  document.getElementById("deleteModal").style.display = "flex";
  document.getElementById("confirmDeleteBtn").onclick = () => {
    userWords.splice(deleteIndex, 1);
    saveUserWords();
    refreshWords();
    favouriteWords = favouriteWords.filter(w => !(w.filipino === current.filipino && w.english === current.english));
    saveFavourites();
    if (words.length === 0) {
      document.getElementById("cardFront").textContent = "No words yet";
      document.getElementById("cardBack").textContent = "";
    } else {
      showWord(Math.min(currentIndex, words.length - 1));
    }
    if (document.getElementById("allWordsModal").style.display !== "none") {
      renderAllWordsList();
    }
    if (document.getElementById("favouriteModal").style.display !== "none") {
      renderFavouriteList(document.getElementById("favouriteList"));
    }
    closeDeleteModal();
    showToast("🗑️ Word deleted.");
  };
}
function closeDeleteModal() {
  document.getElementById("deleteModal").style.display = "none";
}

// ====== FAVOURITES ======
function addToFavourites() {
  const current = words[currentIndex];
  const exists = favouriteWords.some(w =>
    w.filipino === current.filipino && w.english === current.english
  );
  if (exists) {
    showToast("⚠️ Already in favourites.");
    return;
  }
  favouriteWords.push(current);
  saveFavourites();
  showToast(`⭐ "${current.filipino}" added to favourites!`);
}
function updateFavouriteButtonVisibility() {
  document.getElementById("toggleFavouritesBtn").style.display = "inline-block";
}
function toggleFavourites() {
  favouriteWords = JSON.parse(localStorage.getItem("favouriteWords")) || [];
  renderFavouriteList(document.getElementById("favouriteList"));
  if (favouriteWords.length > 0) {
    document.getElementById("favouriteModal").style.display = "flex";
  } else {
    showToast("⭐ You have no favourite words yet!");
  }
}
function closeFavourites() {
  document.getElementById("favouriteModal").style.display = "none";
}

function renderFavouriteList(listEl) {
  listEl.innerHTML = "";
  if (favouriteWords.length === 0) return;

  favouriteWords.forEach((word, index) => {
    const li = document.createElement("li");
    li.textContent = `${word.filipino} – ${word.english}`;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "🗑️";
    removeBtn.className = "inline-delete-btn";
    removeBtn.onclick = () => {
      deleteIndex = index;
      document.getElementById("deleteMessage").textContent =
        `Delete "${word.filipino}" from favourites?`;
      document.getElementById("deleteModal").style.display = "flex";
      document.getElementById("confirmDeleteBtn").onclick = () => {
        favouriteWords.splice(deleteIndex, 1);
        saveFavourites();
        renderFavouriteList(listEl);
        closeDeleteModal();
        showToast("🗑️ Removed from favourites.");
      };
    };

    li.appendChild(removeBtn);
    listEl.appendChild(li);
  });
}


// ====== QUIZ ======
function startQuiz() {
  refreshWords();
  if (words.length < 4) {
    showToast("⚠️ Add at least 4 words to start the quiz.");
    return;
  }
  quizIndex = 0;
  score = 0;
  incorrectWords = [];
  quizAnswered = false;
  stopClickedOnce = false;

  document.getElementById("quizModal").style.display = "flex";
  document.getElementById("quizOptions").innerHTML = "";
  document.getElementById("quizFeedback").textContent = "";
  document.getElementById("restartQuizBtn").style.display = "none";
  document.getElementById("reviewMistakesBtn").style.display = "none";
  document.getElementById("stopQuizBtn").textContent = "⏹ Stop Quiz";
  document.getElementById("nextQuizBtn").style.display = "inline-block";

  nextQuizQuestion();
}

function nextQuizQuestion() {
  if (quizIndex >= words.length) {
    endQuiz(false);
    return;
  }

  quizAnswered = false;
  const current = words[quizIndex];
  const correct = current.english;

  let options = words.filter((_, i) => i !== quizIndex).map(w => w.english);
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
    btn.className = "btn quiz-option";
    btn.onclick = () => {
      if (quizAnswered) return;
      quizAnswered = true;

      if (opt === correct) {
        score++;
        btn.classList.add("correct");
        document.getElementById("quizFeedback").textContent = "✅ Correct!";
      } else {
        btn.classList.add("wrong");
        document.getElementById("quizFeedback").textContent = `❌ Wrong. Correct answer: ${correct}`;
        incorrectWords.push(current);
      }

      Array.from(container.children).forEach(b => b.disabled = true);
    };
    container.appendChild(btn);
  });

  quizIndex++;
}

function endQuiz(stoppedEarly) {
  document.getElementById("nextQuizBtn").style.display = "none";
  document.getElementById("quizOptions").innerHTML = "";
  document.getElementById("quizQuestion").textContent = stoppedEarly ? "Quiz stopped early." : "Quiz complete!";
  document.getElementById("quizFeedback").textContent = `Your score: ${score}/${quizIndex}`;
  document.getElementById("reviewMistakesBtn").style.display = incorrectWords.length > 0 ? "inline-block" : "none";
  document.getElementById("restartQuizBtn").style.display = "inline-block";
}

function stopQuiz() {
  const stopBtn = document.getElementById("stopQuizBtn");
  if (!stopClickedOnce) {
    endQuiz(true);
    stopBtn.textContent = "Close Quiz";
    stopClickedOnce = true;
  } else {
    document.getElementById("quizModal").style.display = "none";
    stopBtn.textContent = "⏹ Stop Quiz";
    stopClickedOnce = false;
  }
}

function restartQuiz() {
  quizIndex = 0;
  score = 0;
  incorrectWords = [];
  quizAnswered = false;
  stopClickedOnce = false;

  document.getElementById("quizOptions").innerHTML = "";
  document.getElementById("quizFeedback").textContent = "";
  document.getElementById("restartQuizBtn").style.display = "none";
  document.getElementById("reviewMistakesBtn").style.display = "none";
  document.getElementById("nextQuizBtn").style.display = "inline-block";
  document.getElementById("stopQuizBtn").textContent = "⏹ Stop Quiz";

  nextQuizQuestion();
}

function showIncorrectWords() {
  const container = document.getElementById("quizOptions");
  document.getElementById("quizQuestion").textContent = "Your mistakes to review:";
  document.getElementById("quizFeedback").textContent = "";
  container.innerHTML = "";

  if (!incorrectWords.length) {
    const none = document.createElement("div");
    none.textContent = "No mistakes — great job!";
    container.appendChild(none);
    return;
  }

  incorrectWords.forEach(word => {
    const row = document.createElement("div");
    row.textContent = `${word.filipino} — ${word.english}`;
    container.appendChild(row);
  });
}

// ====== SEARCH (with fixed endpoint) ======
const debounce = (fn, delay = 150) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
};

// Fetch suggestions from backend when no local matches are found
async function fetchExternalSuggestions(query) {
  try {
    const response = await fetch(
      `https://pinuno-translate-proxy.onrender.com`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: query,
          source: "auto",
          target: "en"
        })
      }
    );

    if (!response.ok) {
      console.error("Backend error:", await response.text());
      return [];
    }

    const data = await response.json();

    // If your backend returns { translatedText: "..." }
    // wrap it in an array so renderSuggestions() can handle it
    if (data.translatedText) {
      return [
        {
          filipino: query,
          english: data.translatedText
        }
      ];
    }

    // If backend returns an array of suggestions, just return it
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error fetching external suggestions:", err);
    return [];
  }
}


const runSearch = async () => {
  refreshWords();
  const inputEl = document.getElementById("searchInput");
  const suggestionsEl = document.getElementById("searchSuggestions");
  const query = (inputEl.value || "").trim();
  const qLower = query.toLowerCase();

  suggestionsEl.innerHTML = "";
  if (!query) return;

  const matches = words.filter(w =>
    w.filipino.toLowerCase().includes(qLower) ||
    w.english.toLowerCase().includes(qLower)
  );

  if (matches.length > 0) {
    renderSuggestions(matches, suggestionsEl, false);
    return;
  }

  const apiMatches = await fetchExternalSuggestions(query);
  if (apiMatches.length > 0) {
    renderSuggestions(apiMatches, suggestionsEl, true);
  } else {
    const li = document.createElement("li");
    li.textContent = "No matches found";
    suggestionsEl.appendChild(li);
  }
};
const searchWords = debounce(runSearch, 120);

function renderSuggestions(list, container, isExternal) {
  container.innerHTML = "";
  const q = (document.getElementById("searchInput").value || "").trim();
  list.forEach(match => {
    const li = document.createElement("li");
    li.innerHTML = highlightMatch(`${match.filipino} — ${match.english}`, q);
    li.onclick = () => {
      if (!isExternal) {
        currentIndex = words.findIndex(w =>
          w.filipino === match.filipino && w.english === match.english
        );
        showWord(currentIndex);
        container.innerHTML = "";
        document.getElementById("searchInput").value = "";
      } else {
        addFromSearchWord = match;
        document.getElementById("addFromSearchMessage").textContent =
          `Add "${match.filipino} — ${match.english}" to your words?`;
        document.getElementById("addFromSearchModal").style.display = "flex";
      }
    };
    container.appendChild(li);
  });
}

function highlightMatch(text, query) {
  if (!query) return text;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safe})`, "gi");
  return text.replace(regex, "<strong>$1</strong>");
}

async function translateText(userInput) {
  try {
    const response = await fetch("https://pinuno-translate-proxy.onrender.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: userInput,
        source: "auto",
        target: "en"
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Translated text:", data.translatedText);
      return data.translatedText;
    } else {
      console.error("Translation error:", data.error);
      return `⚠️ Error: ${data.error}`;
    }
  } catch (err) {
    console.error("Network error:", err);
    return "⚠️ Unable to reach translation server.";
  }
}


function confirmAddFromSearch() {
  if (!addFromSearchWord) return;
  const exists = words.some(w =>
    w.filipino.toLowerCase() === addFromSearchWord.filipino.toLowerCase() &&
    w.english.toLowerCase() === addFromSearchWord.english.toLowerCase()
  );
  if (exists) {
    showToast("⚠️ This word already exists!");
    closeAddFromSearchModal();
    return;
  }
  userWords.push(addFromSearchWord);
  saveUserWords();
  refreshWords();
  showWord(words.length - 1);
  showToast(`✅ "${addFromSearchWord.filipino}" added!`);
  document.getElementById("searchSuggestions").innerHTML = "";
  document.getElementById("searchInput").value = "";
  addFromSearchWord = null;
  closeAddFromSearchModal();
}

function closeAddFromSearchModal() {
  document.getElementById("addFromSearchModal").style.display = "none";
}

// ====== ALL WORDS MODAL ======
function openAllWords() {
  refreshWords();
  renderAllWordsList();
  document.getElementById("allWordsModal").style.display = "flex";
}
function closeAllWords() {
  document.getElementById("allWordsModal").style.display = "none";
}
function renderAllWordsList() {
  const list = document.getElementById("allWordsList");
  list.innerHTML = "";
  words.forEach(word => {
    const li = document.createElement("li");
    li.textContent = `${word.filipino} – ${word.english}`;
    const isUserWord = userWords.some(w => w.filipino === word.filipino && w.english === word.english);
    if (isUserWord) {
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "🗑️";
      removeBtn.className = "inline-delete-btn";
      removeBtn.onclick = () => {
        deleteIndex = userWords.findIndex(w => w.filipino === word.filipino && w.english === word.english);
        document.getElementById("deleteMessage").textContent =
          `Delete "${word.filipino}" from your words?`;
        document.getElementById("deleteModal").style.display = "flex";
        document.getElementById("confirmDeleteBtn").onclick = () => {
          userWords.splice(deleteIndex, 1);
          saveUserWords();
          refreshWords();
          favouriteWords = favouriteWords.filter(f => !(f.filipino === word.filipino && f.english === word.english));
          saveFavourites();
          renderAllWordsList();
          if (words.length === 0) {
            document.getElementById("cardFront").textContent = "No words yet";
            document.getElementById("cardBack").textContent = "";
          } else {
            const isCurrent = words[currentIndex] &&
              words[currentIndex].filipino === word.filipino &&
              words[currentIndex].english === word.english;
            showWord(isCurrent ? Math.min(currentIndex, words.length - 1) : currentIndex);
          }
          if (document.getElementById("favouriteModal").style.display !== "none") {
            renderFavouriteList(document.getElementById("favouriteList"));
          }
          closeDeleteModal();
          showToast("🗑️ Word deleted.");
        };
      };
      li.appendChild(removeBtn);
    }
    list.appendChild(li);
  });
}

// ====== UTILITIES ======
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]
    ];
  }
  return array;
}

// ====== INIT ======
window.addEventListener("DOMContentLoaded", () => {
  refreshWords();
  updateFavouriteButtonVisibility();
  showWord(0);

  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.addEventListener("input", searchWords);

  document.addEventListener("click", (e) => {
    const sc = document.querySelector(".search-container");
    if (sc && !sc.contains(e.target)) {
      const ul = document.getElementById("searchSuggestions");
      if (ul) ul.innerHTML = "";
    }
  });

  const cancelDel = document.getElementById("cancelDeleteBtn");
  if (cancelDel) cancelDel.onclick = closeDeleteModal;

  const confirmAddBtn = document.getElementById("confirmAddFromSearchBtn");
  if (confirmAddBtn) confirmAddBtn.onclick = confirmAddFromSearch;
});
