const DB_PATH = "./database/db.json";

function sanitizeId(s) {
  return String(s).replace(/[^\w-]/g, "-");
}

// ---------- gestion simple de "session" via localStorage ----------
function getLoggedInUser() {
  // supporte plusieurs clés et formats (string ou JSON)
  const keys = ["loggedInUser", "currentUser"];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string" && parsed) return parsed;
      if (parsed && typeof parsed.username === "string") return parsed.username;
      if (parsed && typeof parsed.name === "string") return parsed.name;
    } catch (_) {
      if (raw) return raw;
    }
  }
  return null;
}

function setLoggedInUser(username) {
  if (username) {
    // on écrit les deux clés pour compatibilité
    localStorage.setItem("loggedInUser", username);
    localStorage.setItem("currentUser", username);
  } else {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("currentUser");
  }
  applySidebarUser(username);
  loadTimeline(username);
}

// fonctions disponibles dans la console pour tester rapidement
window.login = (username) => setLoggedInUser(username);
window.logout = () => setLoggedInUser(null);

// met à jour l'affichage de la sidebar (nom, @username, avatar si présent)
function applySidebarUser(username) {
  const nameEl = document.getElementById("sidebar-user-name");
  const usernameEl = document.getElementById("sidebar-user-username");
  const avatar = document.getElementById("sidebar-user-avatar");
  const avatarMobile = document.getElementById("sidebar-user-avatar-mobile");
  if (!nameEl || !usernameEl) return;

  if (!username) {
    nameEl.textContent = "Invité";
    usernameEl.textContent = "";
    if (avatar) avatar.src = "assets/avatars/default-avatar.jpg";
    if (avatarMobile) avatarMobile.src = "assets/avatars/default-avatar.jpg";
    return;
  }

  // lecture simple de la DB pour afficher les infos réelles
  fetch(DB_PATH)
    .then((r) => (r.ok ? r.json() : null))
    .then((db) => {
      const user = db?.users?.find((u) => u.username === username);
      if (user) {
        const uid = sanitizeId(user.id);
        nameEl.textContent = user.name;
        usernameEl.textContent = `@${user.username}`;
        if (user.profilePicture) {
          if (avatar) avatar.src = user.profilePicture;
          if (avatarMobile) avatarMobile.src = user.profilePicture;
        }
        nameEl.id = `sidebar-user-name-${uid}`;
        usernameEl.id = `sidebar-user-username-${uid}`;
      } else {
        nameEl.textContent = username;
        usernameEl.textContent = `@${username}`;
      }
    })
    .catch(() => {
      nameEl.textContent = username;
      usernameEl.textContent = `@${username}`;
    });
}

// ---------- rendu de la timeline ----------
async function loadTimeline(profileUsername) {
  const username = profileUsername ?? getLoggedInUser();
  try {
    const res = await fetch(DB_PATH);
    if (!res.ok) throw new Error("Impossible de charger la base de données");
    const db = await res.json();

    if (username) applySidebarUser(username);

    const tweets = (db.tweets || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const timeline = document.getElementById("timeline");
    if (!timeline) return;
    timeline.innerHTML = "";

    if (tweets.length === 0) {
      timeline.innerHTML =
        '<p id="timeline-empty" class="p-4 text-zinc-500">Aucun tweet</p>';
      return;
    }

    const tpl = document.getElementById("tweet-template");
    if (!tpl) return;

    tweets.forEach((tweet) => {
      const node = tpl.content.cloneNode(true);
      const tweetId = sanitizeId(tweet.id);
      const article = node.querySelector("article");
      if (article) article.id = `tweet-${tweetId}`;

      const author = db.users.find(
        (u) =>
          String(u.id) === String(tweet.userId) ||
          Number(u.id) === Number(tweet.userId)
      );
      const nameEl = node.querySelector('[data-role="tweet-user-name"]');
      if (nameEl) {
        nameEl.id = `tweet-user-name-${tweetId}`;
        nameEl.textContent = author?.name ?? "Inconnu";
      }
      const usernameEl = node.querySelector(
        '[data-role="tweet-user-username"]'
      );
      if (usernameEl) {
        usernameEl.id = `tweet-user-username-${tweetId}`;
        usernameEl.textContent = `@${author?.username ?? "inconnu"}`;
      }

      // createdAt : à côté du username, formaté
      const createdAtEl = node.querySelector('[data-role="tweet-createdAt"]');
      if (createdAtEl) {
        createdAtEl.id = `tweet-createdAt-${tweetId}`;
        createdAtEl.textContent = formatDateISO(tweet.createdAt);
      }

      const contentEl = node.querySelector('[data-role="tweet-content"]');
      if (contentEl) {
        contentEl.id = `tweet-content-${tweetId}`;
        contentEl.textContent = tweet.content ?? "";
      }
      const avatarEl = node.querySelector('[data-role="tweet-avatar"]');
      if (avatarEl) {
        avatarEl.id = `tweet-avatar-${tweetId}`;
        avatarEl.src =
          author?.profilePicture ?? "assets/avatars/default-avatar.jpg";
        avatarEl.alt = `${author?.name ?? "user"} avatar`;
      }
      const likesEl = node.querySelector('[data-role="tweet-likes"]');
      if (likesEl) {
        likesEl.id = `tweet-likes-${tweetId}`;
        likesEl.textContent = tweet.likes ?? 0;
      }
      const retweetsEl = node.querySelector('[data-role="tweet-retweets"]');
      if (retweetsEl) {
        retweetsEl.id = `tweet-retweets-${tweetId}`;
        retweetsEl.textContent = tweet.retweets ?? 0;
      }
      const repliesEl = node.querySelector('[data-role="tweet-replies"]');
      if (repliesEl) {
        repliesEl.id = `tweet-replies-${tweetId}`;
        repliesEl.textContent = tweet.replies?.length ?? 0;
      }

      timeline.appendChild(node);
    });
  } catch (err) {
    console.error(err);
    const timeline = document.getElementById("timeline");
    if (timeline)
      timeline.innerHTML =
        '<p class="p-4 text-red-500">Erreur de chargement</p>';
  }
}

function formatDateISO(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Format  : "2 déc." ou "2 déc. 2025" si année différente
  const options = { day: "numeric", month: "short" };
  // ajoute l'année si ce n'est pas l'année courante
  if (d.getFullYear() !== new Date().getFullYear()) {
    Object.assign(options, { year: "numeric" });
  }
  return d.toLocaleDateString("fr-FR", options);
}

// initialisation au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  const username = getLoggedInUser();
  applySidebarUser(username);
  loadTimeline(username);

  // Poster : activer le bouton quand texte présent et gérer l'envoi
  const poster = document.getElementById("poster");
  const postButton = document.getElementById("post-button");
  const timeline = document.getElementById("timeline");

  if (poster && postButton) {
    const updatePostButton = () => {
      if (poster.value.trim()) {
        postButton.classList.remove("opacity-50", "cursor-not-allowed");
        postButton.disabled = false;
      } else {
        postButton.classList.add("opacity-50", "cursor-not-allowed");
        postButton.disabled = true;
      }
    };

    poster.addEventListener("input", updatePostButton);
    updatePostButton();

    // helper to render a single tweet at the top
    const renderSingleTweet = (tweet, author, prepend = true) => {
      const tpl = document.getElementById("tweet-template");
      if (!tpl) return;
      const node = tpl.content.cloneNode(true);
      const tweetId = sanitizeId(tweet.id);
      const article = node.querySelector("article");
      if (article) article.id = `tweet-${tweetId}`;

      const nameEl = node.querySelector('[data-role="tweet-user-name"]');
      if (nameEl) {
        nameEl.id = `tweet-user-name-${tweetId}`;
        nameEl.textContent = author?.name ?? username ?? "Inconnu";
      }
      const usernameEl = node.querySelector(
        '[data-role="tweet-user-username"]'
      );
      if (usernameEl) {
        usernameEl.id = `tweet-user-username-${tweetId}`;
        usernameEl.textContent = `@${
          author?.username ?? username ?? "inconnu"
        }`;
      }
      const createdAtEl = node.querySelector('[data-role="tweet-createdAt"]');
      if (createdAtEl) {
        createdAtEl.id = `tweet-createdAt-${tweetId}`;
        createdAtEl.textContent = formatDateISO(tweet.createdAt);
      }
      const contentEl = node.querySelector('[data-role="tweet-content"]');
      if (contentEl) {
        contentEl.id = `tweet-content-${tweetId}`;
        contentEl.textContent = tweet.content ?? "";
      }
      const avatarEl = node.querySelector('[data-role="tweet-avatar"]');
      if (avatarEl) {
        avatarEl.id = `tweet-avatar-${tweetId}`;
        avatarEl.src =
          author?.profilePicture ?? "assets/avatars/default-avatar.jpg";
        avatarEl.alt = `${author?.name ?? "user"} avatar`;
      }

      if (prepend) {
        timeline.prepend(node);
      } else {
        timeline.appendChild(node);
      }
    };

    postButton.addEventListener("click", async () => {
      const content = poster.value.trim();
      if (!content) return;

      // récupérer l'utilisateur connecté
      const logged = getLoggedInUser();
      // lecture des users pour retrouver l'id
      try {
        const res = await fetch(DB_PATH);
        if (!res.ok) throw new Error("Impossible de lire DB");
        const db = await res.json();
        const author = db.users.find((u) => u.username === logged) || {
          name: logged ?? "Invité",
          username: logged ?? "guest",
        };
        const newTweet = {
          id: Date.now().toString(),
          userId: isNaN(Number(author.id))
            ? author.id ?? logged
            : Number(author.id),
          content: content,
          media: [],
          likes: 0,
          retweets: 0,
          replies: [],
          createdAt: new Date().toISOString(),
        };

        // afficher immédiatement
        renderSingleTweet(newTweet, author, true);

        // tenter de persister via API REST (json-server expected at /tweets)
        try {
          const postRes = await fetch("/tweets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTweet),
          });
          if (!postRes.ok) throw new Error("POST failed");
          // si succès on pourrait remplacer l'id par celui renvoyé
          const saved = await postRes.json();
          // nothing else required
        } catch (err) {
          // fallback: stocker dans localStorage pending
          const pending = JSON.parse(
            localStorage.getItem("pendingTweets") || "[]"
          );
          pending.push(newTweet);
          localStorage.setItem("pendingTweets", JSON.stringify(pending));
          console.warn("Tweet en cache local (pas de serveur disponible)");
        }

        // reset UI
        poster.value = "";
        updatePostButton();
      } catch (err) {
        console.error(err);
      }
    });
  }
});

//Gestion du bouton de logout
document.addEventListener("DOMContentLoaded", () => {
  const userButton = document.getElementById("sidebar-user-button");
  const userMenu = document.getElementById("sidebar-user-menu");
  const logoutLink = document.getElementById("logout-link");
  const usernameEl = document.getElementById("sidebar-user-username");

  // Récupérer le username depuis localStorage
  const username = localStorage.getItem("username") || "@guest";
  usernameEl.textContent = username;

  // Injecter le texte du lien
  logoutLink.textContent = `Se déconnecter de ${username}`;

  // Toggle du menu avec animation
  userButton.addEventListener("click", () => {
    if (userMenu.classList.contains("hidden")) {
      userMenu.classList.remove("hidden");
      // Activer animation fade-in
      requestAnimationFrame(() => {
        userMenu.classList.remove("opacity-0", "scale-95");
        userMenu.classList.add("opacity-100", "scale-100");
      });
    } else {
      // Animation fade-out
      userMenu.classList.remove("opacity-100", "scale-100");
      userMenu.classList.add("opacity-0", "scale-95");
      setTimeout(() => {
        userMenu.classList.add("hidden");
      }, 200); // durée = 200ms
    }
  });

  // Support : bouton avatar en haut (mobile) qui ouvre le même menu
  const mobileUserButton = document.getElementById("mobile-user-button");
  if (mobileUserButton) {
    mobileUserButton.addEventListener("click", (e) => {
      e.stopPropagation();
      // Déclenche le même comportement que le bouton principal
      userButton.click();
    });
  }

  // Action de déconnexion
  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "pages/welcome.html";
  });
});
