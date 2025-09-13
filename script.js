// ====== DATA ======
const defaultWords = [
  { filipino: "Kamusta ka?", english: "How are you?" },
  { filipino: "Paalam", english: "Good bye" },
  { filipino: "Inom", english: "Drink" },
  { filipino: "Kain", english: "Eat" },
  { filipino: "Tae", english: "Poop" },
  { filipino: "Tayo", english: "Stand/Together" },
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
  { filipino: "Malapit", english: "Near" },
   { filipino: "Kamay", english: "Hand" },
  { filipino: "Kuko", english: "Nail" },
   { filipino: "Sing-sing", english: "Ring" },
  { filipino: "Alahas", english: "Jewelry" },
 { filipino: "Hikaw", english: "Earrings" },
  { filipino: "Kwintas", english: "Necklace" }
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

let uiCooldownUntil = 0;

function withUICooldown(ms = 300) {
  uiCooldownUntil = Date.now() + ms;
}

// Block clicks during cooldown (capture phase)
document.addEventListener("click", (e) => {
  if (Date.now() < uiCooldownUntil) {
    e.stopPropagation();
    e.preventDefault();
  }
}, true);


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

// Add current word to favourites
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

// Show/hide the Favourite Words button if needed
function updateFavouriteButtonVisibility() {
  const btn = document.getElementById("toggleFavBtn"); // fixed ID
  if (btn) btn.style.display = "inline-block";
}

// Open the favourites modal and populate the list
function toggleFavourites() {
  const favListEl = document.getElementById("favouriteList");
  if (!favListEl) return; // safety check

  favouriteWords = JSON.parse(localStorage.getItem("favouriteWords")) || [];

  // Clear the list
  favListEl.innerHTML = "";

  if (favouriteWords.length > 0) {
    // Populate the list
    favouriteWords.forEach((word, index) => {
      const li = document.createElement("li");
      li.textContent = `${word.filipino} — ${word.english}`;

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
          renderFavouriteList(favListEl);
          closeDeleteModal();
          showToast("🗑️ Removed from favourites.");
        };
      };

      li.appendChild(removeBtn);
      favListEl.appendChild(li);
    });
  } else {
    // Show a friendly empty state
    const li = document.createElement("li");
    li.textContent = "⭐ You have no favourite words yet!";
    li.style.fontStyle = "italic";
    favListEl.appendChild(li);
  }

  // Always open the modal
  document.getElementById("favouriteModal").style.display = "flex";
}

// Render favourites list (used after deletion)
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
let quizWords = [];

function startQuiz(source = "all") {
  refreshWords();

  // Decide which list to use
  if (source === "favourites") {
    quizWords = [...favouriteWords];
  } else {
    quizWords = [...words];
  }

  if (quizWords.length < 4) {
    showToast("⚠️ Add at least 4 words to start the quiz.");
    return;
  }

  // Shuffle the quiz words for random order
  quizWords = shuffle(quizWords);

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
  if (quizIndex >= quizWords.length) {
    endQuiz(false);
    return;
  }

  quizAnswered = false;
  const current = quizWords[quizIndex];
  const correct = current.english;

  let options = quizWords
    .filter((_, i) => i !== quizIndex)
    .map(w => w.english);

  options = shuffle(options).slice(0, 3);
  options.push(correct);
  options = shuffle(options);

  document.getElementById("quizQuestion").textContent =
    `What does "${current.filipino}" mean?`;
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
        document.getElementById("quizFeedback").textContent =
          `❌ Wrong. Correct answer: ${correct}`;
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
  document.getElementById("quizQuestion").textContent =
    stoppedEarly ? "Quiz stopped early." : "Quiz complete!";
  document.getElementById("quizFeedback").textContent =
    `Your score: ${score}/${quizIndex}`;
  document.getElementById("reviewMistakesBtn").style.display =
    incorrectWords.length > 0 ? "inline-block" : "none";
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
    const lang = detectLanguage(query);

    if (!lang) {
      showToast("⚠️ Please enter only Filipino or English words.");
      return [];
    }

    // Map 'fil' to 'tl' for LibreTranslate
    const sourceLang = lang === "fil" ? "tl" : "en";
    const targetLang = lang === "en" ? "tl" : "en";

    const response = await fetch(
      "https://pinuno-translate-proxy.onrender.com/translate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: query,
          source: sourceLang,
          target: targetLang
        })
      }
    );

    if (!response.ok) {
      console.error("Backend error:", await response.text());
      showToast("⚠️ Translation service error.");
      return [];
    }

    const data = await response.json();
    console.log("API raw response:", data);

    // Check if translation is missing or identical to input
    if (
      !data.translatedText ||
      data.translatedText.trim() === "" ||
      data.translatedText.trim().toLowerCase() === query.trim().toLowerCase()
    ) {
      showToast(`⚠️ Could not translate "${query}" to English.`);
      return [];
    }

    // Return in your expected format
    return [
      {
        filipino: lang === "fil" ? capitaliseIfSingleWord(query) : capitaliseIfSingleWord(data.translatedText),
        english: lang === "en" ? capitaliseIfSingleWord(query) : capitaliseIfSingleWord(data.translatedText)
      }
    ];

  } catch (err) {
    console.error("Error fetching external suggestions:", err);
    showToast("⚠️ Could not connect to translation service.");
    return [];
  }
}




function detectLanguage(text) {
  const filipinoPattern = /[ÁÉÍÓÚÑáéíóúñ]/;
  const englishPattern = /^[A-Za-z\s-]+$/;

  const trimmed = text.trim();

  if (filipinoPattern.test(trimmed)) {
    return "fil"; // We'll map this to 'tl' later
  }

  if (englishPattern.test(trimmed)) {
    return "en";
  }

  return null;
}

const runSearch = async () => {
  refreshWords();
  const inputEl = document.getElementById("searchInput");
  const suggestionsEl = document.getElementById("searchSuggestions");
  const query = (inputEl.value || "").trim();
  const qLower = query.toLowerCase();

  suggestionsEl.innerHTML = "";

  if (query.length < 3) return;

  if (!detectLanguage(query)) {
    const li = document.createElement("li");
    li.textContent = "⚠ Please enter only Filipino or English words.";
    suggestionsEl.appendChild(li);
    return;
  }

  // Local matches — startsWith first
  let matches = words.filter(w =>
    w.filipino.toLowerCase().startsWith(qLower) ||
    w.english.toLowerCase().startsWith(qLower)
  );

  if (matches.length === 0) {
    matches = words.filter(w =>
      w.filipino.toLowerCase().includes(qLower) ||
      w.english.toLowerCase().includes(qLower)
    );
  }

  if (matches.length > 0) {
    renderSuggestions(matches, suggestionsEl, false);
    return;
  }

  // API matches
  const apiMatches = await fetchExternalSuggestions(query);
  if (apiMatches.length > 0) {
    renderSuggestions(apiMatches, suggestionsEl, true);
    return;
  }

  // No matches — show Google Translate button
  const li = document.createElement("li");
  li.textContent = "No matches found";

  const gBtn = document.createElement("button");
  gBtn.textContent = "🌐 Translate in Google";
  gBtn.classList.add("btn", "btn-secondary");
  gBtn.addEventListener("click", () => {
    localStorage.setItem("lastGoogleTranslateQuery", query.trim());
    const url = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(query)}&op=translate`;
    window.open(url, "_blank");
  });

  li.appendChild(document.createElement("br"));
  li.appendChild(gBtn);
  suggestionsEl.appendChild(li);
};

const searchWords = debounce(runSearch, 350);

function showManualAddPrompt(word) {
  const formattedWord = capitaliseIfSingleWord(word);
  document.getElementById("manualAddWord").textContent = formattedWord;
  document.getElementById("manualAddPrompt").style.display = "flex";

  document.getElementById("manualAddYes").onclick = () => {
    document.getElementById("manualAddPrompt").style.display = "none";
    openAddWord();

    const lang = detectLanguage(word);
    if (lang === "fil") {
      const filipinoInput = document.getElementById("filipinoWordInput");
      if (filipinoInput) filipinoInput.value = capitaliseIfSingleWord(formattedWord);
    } else if (lang === "en") {
      const englishInput = document.getElementById("englishWordInput");
      if (englishInput) englishInput.value = capitaliseIfSingleWord(formattedWord);
    } else {
      const filipinoInput = document.getElementById("filipinoWordInput");
      if (filipinoInput) filipinoInput.value = capitaliseIfSingleWord(formattedWord);
    }
  };

  document.getElementById("manualAddNo").onclick = () => {
    document.getElementById("manualAddPrompt").style.display = "none";
  };
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    const lastQuery = localStorage.getItem("lastGoogleTranslateQuery");
    if (lastQuery) {
      showManualAddPrompt(lastQuery);
      localStorage.removeItem("lastGoogleTranslateQuery");
    }
  }
});

// Detect when user comes back to the tab
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    const lastQuery = localStorage.getItem("lastGoogleTranslateQuery");
    if (lastQuery) {
      showManualAddPrompt(lastQuery);
      localStorage.removeItem("lastGoogleTranslateQuery");
    }
  }
});

// Capitalise first letter if single word
function capitaliseIfSingleWord(text) {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.includes(" ")) return trimmed; // phrase/sentence — leave as-is
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function showAddedPopup(message) {
  const toast = document.getElementById("toast");
  if (!toast) {
    console.warn("Toast element not found in DOM");
    return;
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}


function addWordToList(filipino, english) {
  // Check if it already exists
  const exists = words.some(w =>
    w.filipino.toLowerCase() === filipino.toLowerCase() &&
    w.english.toLowerCase() === english.toLowerCase()
  );

  if (exists) {
    showToast(`⚠️ "${filipino}" is already in your list`);
    return;
  }

  // ✅ Add to userWords (not words directly)
  userWords.push({ filipino, english });

  // Save and refresh
  saveUserWords();
  refreshWords();

  // Highlight the newly added word
  showWord(words.length - 1);

  // Show toast (same style as Add Word modal)
  showToast(`✅ "${filipino}" added!`);
}


function renderSuggestions(suggestions, container, isFromAPI) {
  container.innerHTML = "";

  suggestions.forEach(suggestion => {
    const li = document.createElement("li");

    const filipinoWord = capitaliseIfSingleWord(suggestion.filipino);
    const englishWord = capitaliseIfSingleWord(suggestion.english);

    const textSpan = document.createElement("span");
    textSpan.textContent = `${filipinoWord} — ${englishWord}`;
    li.appendChild(textSpan);

    const alreadyInList = words.some(
      w => w.filipino === filipinoWord && w.english === englishWord
    );

    if (!alreadyInList) {
      const addBtn = document.createElement("button");
      addBtn.innerHTML = "➕";
      addBtn.classList.add("add-word-btn", "icon-btn");
      addBtn.title = "Add to My List";
      addBtn.onclick = () => addWordToList(filipinoWord, englishWord);
      li.appendChild(addBtn);
    }

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
// ====== Modal helpers ======
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "flex";
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

// ====== Specific modal actions ======
function closeFavourites() {
  closeModal("favouriteModal");
}
function closeAllWords() {
  closeModal("allWordsModal");
}
function closeAddWord() {
  closeModal("addWordModal");
}
function closeDeleteModal() {
  closeModal("deleteModal");
}
function closeAddFromSearchModal() {
  closeModal("addFromSearchModal");
}

// ====== INIT ======
document.addEventListener("DOMContentLoaded", () => {
  const bind = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  };

document.addEventListener("DOMContentLoaded", () => {
  const filipinoInput = document.getElementById("filipinoWordInput");
  const englishInput = document.getElementById("englishWordInput");

  [filipinoInput, englishInput].forEach(input => {
    if (input) {
      input.addEventListener("input", () => {
        const cursorPos = input.selectionStart;
        input.value = capitaliseIfSingleWord(input.value);
        input.setSelectionRange(cursorPos, cursorPos);
      });
    }
  });
});


  // Flashcard
  bind("flashcard", "click", flipCard);
  bind("deleteWordBtn", "click", e => {
    e.stopPropagation();
    confirmDeleteCurrentWord();
  });

  // Navigation
  bind("prevWordBtn", "click", showPreviousWord);
  bind("nextWordBtn", "click", showNextWord);
  bind("randomWordBtn", "click", showRandomWord);

  // Word actions
  bind("addToFavBtn", "click", addToFavourites);
  bind("toggleFavBtn", "click", toggleFavourites);
  bind("openAddWordBtn", "click", openAddWord);

  // Add Word modal
  bind("closeAddWordBtn", "click", closeAddWord);
  bind("saveWordBtn", "click", addWord);
  bind("cancelAddWordBtn", "click", closeAddWord);

  // All Words modal
  bind("openAllWordsBtn", "click", openAllWords);
  bind("closeAllWordsBtn", "click", closeAllWords);
  bind("closeAllWordsBtn2", "click", closeAllWords);

  // Favourite modal
  bind("closeFavBtn", "click", closeFavourites);
  bind("closeFavBtn2", "click", closeFavourites);

  // Delete confirmation modal
  bind("closeDeleteModalBtn", "click", closeDeleteModal);
  bind("confirmDeleteBtn", "click", () => {
    document.getElementById("deleteModal").style.display = "none";
  });
  bind("cancelDeleteBtn", "click", closeDeleteModal);

  // SEARCH
  bind("searchInput", "input", searchWords);

  const searchInput = document.getElementById("searchInput");
  const suggestionsEl = document.getElementById("searchSuggestions");
  const closeBtn = document.getElementById("closeSearchBtn");

  // Close button clears and blurs
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      searchInput.value = "";
      suggestionsEl.innerHTML = "";
      searchInput.blur();
    });
  }

  // Click outside search area clears suggestions
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) {
      suggestionsEl.innerHTML = "";
      searchInput.blur();
    }
  });

  // Add-from-search modal
  bind("closeAddFromSearchBtn", "click", closeAddFromSearchModal);
  bind("confirmAddFromSearchBtn", "click", confirmAddFromSearch);
  bind("cancelAddFromSearchBtn", "click", closeAddFromSearchModal);

  // Quiz Flow
  bind("startQuizBtn", "click", () => {
    document.getElementById("quizChoiceModal").style.display = "flex";
  });

  bind("quizAllBtn", "click", () => {
    document.getElementById("quizChoiceModal").style.display = "none";
    startQuiz("all");
  });

  bind("quizFavBtn", "click", () => {
    document.getElementById("quizChoiceModal").style.display = "none";
    startQuiz("favourites");
  });

  bind("closeQuizBtn", "click", () => {
    document.getElementById("quizModal").style.display = "none";
    stopClickedOnce = false;
  });

  bind("closeQuizChoiceBtn", "click", () => {
    document.getElementById("quizChoiceModal").style.display = "none";
  });

  // Quiz controls
  bind("nextQuizBtn", "click", nextQuizQuestion);
  bind("stopQuizBtn", "click", stopQuiz);
  bind("restartQuizBtn", "click", restartQuiz);
  bind("reviewMistakesBtn", "click", showIncorrectWords);
}); // ✅ Only one closing brace here
