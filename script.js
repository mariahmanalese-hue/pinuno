// ====== SEARCH ======
const runSearch = async () => {
  refreshWords();
  const inputEl = document.getElementById("searchInput");
  const suggestionsEl = document.getElementById("searchSuggestions");
  const query = (inputEl.value || "").trim();
  const qLower = query.toLowerCase();

  suggestionsEl.innerHTML = "";
  if (!query) return;

  // Local matches
  const matches = words.filter(w =>
    w.filipino.toLowerCase().includes(qLower) ||
    w.english.toLowerCase().includes(qLower)
  );

  if (matches.length > 0) {
    renderSuggestions(matches, suggestionsEl, false);
    return;
  }

  // API matches
  try {
    const apiMatches = await fetchExternalSuggestions(query);
    if (apiMatches.length > 0) {
      renderSuggestions(apiMatches, suggestionsEl, true);
    } else {
      const li = document.createElement("li");
      li.className = "no-results";
      li.textContent = `No matches found for "${query}"`;
      suggestionsEl.appendChild(li);
    }
  } catch (err) {
    console.error("Error fetching external suggestions:", err);
    const li = document.createElement("li");
    li.className = "no-results";
    li.textContent = `No matches found for "${query}"`;
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
    const response = await fetch("https://pinuno-translate-proxy.onrender.com/translate", {
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
