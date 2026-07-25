const voterKey = "jonghoon-blog:like-voter";

function storedValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storeValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The button still works for this page load when storage is unavailable.
  }
}

function voterId() {
  const stored = storedValue(voterKey);
  if (stored) return stored;
  const created =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  storeValue(voterKey, created);
  return created;
}

function render(button, count, liked) {
  const label = button.querySelector("[data-like-label]");
  const heart = button.querySelector(".like-heart");
  const countElement = button.querySelector("[data-like-count]");
  button.setAttribute("aria-pressed", String(liked));
  if (label) label.textContent = liked ? "Liked" : "Like";
  if (heart) heart.textContent = liked ? "♥" : "♡";
  if (countElement) {
    countElement.textContent = new Intl.NumberFormat("en").format(count);
    countElement.setAttribute(
      "aria-label",
      `${count} ${count === 1 ? "like" : "likes"}`
    );
  }
}

for (const button of document.querySelectorAll("[data-like-button]")) {
  const slug = button.dataset.slug;
  const status = button.parentElement?.querySelector("[data-like-status]");
  const likedKey = `jonghoon-blog:liked:${slug}`;
  let liked = storedValue(likedKey) === "true";
  let count = 0;

  render(button, count, liked);

  fetch(`/api/likes/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" }
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      count = Number(data.count ?? 0);
      render(button, count, liked);
    })
    .catch(() => {
      if (status) status.textContent = "Likes are temporarily unavailable.";
    });

  button.addEventListener("click", async () => {
    button.disabled = true;
    if (status) status.textContent = "Saving…";
    const nextLiked = !liked;
    try {
      const response = await fetch(`/api/likes/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          voterId: voterId(),
          liked: nextLiked
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      liked = Boolean(data.liked);
      count = Number(data.count ?? count);
      storeValue(likedKey, String(liked));
      render(button, count, liked);
      if (status) status.textContent = "";
    } catch {
      if (status) status.textContent = "Like could not be saved. Try again later.";
    } finally {
      button.disabled = false;
    }
  });
}
