// Définition de l'URL de base selon l'environnement
const BASE_URL = "https://x-clone-api-3unv.onrender.com";


// Détermine le type d'identifiant (email, téléphone, pseudo)
function detectIdentifierType(id) {
  const emailRgx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRgx = /^\+?[0-9]{10,15}$/;
  const usernameRgx = /^[a-zA-Z0-9._-]{2,}$/;

  // Test des regex (formats valides seulement)
  if (emailRgx.test(id)) return "email";
  if (phoneRgx.test(id)) return "phone";
  if (usernameRgx.test(id)) return "username";
  return null;
}
// Recherche un utilisateur par son identifiant
async function findUserByIdentifier(identifier) {
  try {
    const res = await fetch(BASE_URL + "/users");
    if (!res.ok) throw new Error("Impossible de contacter le serveur");

    const users = await res.json();
    const type = detectIdentifierType(identifier);
    if (!type) return null;
    // Recherche dans la liste des utilisateurs
    return (
      users.find(
        (u) =>
          (type === "email" && u.email === identifier) ||
          (type === "phone" && u.phone === identifier) ||
          (type === "username" && u.username === identifier)
      ) || null
    );
  } catch (err) {
    console.error("Erreur fetch users:", err);
    return null;
  }
}

//DOM LOGIN
document.addEventListener("DOMContentLoaded", () => {
  const loginIdentifier = document.getElementById("login-identifier");
  const loginBtn = document.getElementById("login-btn");

  if (loginIdentifier && loginBtn) {
    loginIdentifier.addEventListener("input", () => {
      const valueIdentifier = loginIdentifier.value.trim();
      loginBtn.disabled = detectIdentifierType(valueIdentifier) === null;
    });
    // Gestion du clic sur le bouton "Suivant"
    loginBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const identifier = loginIdentifier.value.trim();
      const type = detectIdentifierType(identifier);

      if (!type) {
        alert("Entrez un email, téléphone ou pseudo valide.");
        return;
      }

      try {
        const user = await findUserByIdentifier(identifier);
        if (!user) {
          alert("Utilisateur introuvable !");
          return;
        }

        const data = { userId: user.id, identifier };
        sessionStorage.setItem("loginData", JSON.stringify(data));
        window.location.href = "login-password.html";
      } catch (err) {
        console.error("Erreur recherche utilisateur:", err);
        alert("Erreur serveur. Réessayez plus tard.");
      }
    });
  }

  // -----------------------
  //DOM login-password.html
  // -----------------------
  const loginPasswordInput = document.getElementById("login-password");
  const loginNextBtn = document.getElementById("login-next-btn");
  const loginIdentifierDisplay = document.getElementById(
    "login-identifier-display"
  );
  const errorLoginPassword = document.getElementById("error-login-password");

  if (loginPasswordInput && loginNextBtn) {
    const loginDataRaw = sessionStorage.getItem("loginData");
    if (!loginDataRaw) {
      alert("Session expirée. Veuillez recommencer la connexion.");
      window.location.href = "login.html";
      return;
    }

    let loginData;
    try {
      loginData = JSON.parse(loginDataRaw);
    } catch (e) {
      console.error("Erreur parsing session:", e);
      sessionStorage.removeItem("loginData");
      window.location.href = "login.html";
      return;
    }

    if (loginIdentifierDisplay) {
      loginIdentifierDisplay.textContent = loginData.identifier;
    }

    loginPasswordInput.addEventListener("input", () => {
      loginNextBtn.disabled = loginPasswordInput.value.trim().length === 0;
      errorLoginPassword.textContent = "";
    });

    loginNextBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const password = loginPasswordInput.value.trim();

      if (!password) {
        errorLoginPassword.textContent = "Veuillez entrer votre mot de passe.";
        return;
      }

      try {
        const res = await fetch(BASE_URL + "users/" + loginData.userId);
        if (!res.ok) throw new Error("Utilisateur introuvable");
        const user = await res.json();

        if (user.password !== password) {
          errorLoginPassword.textContent = "Mot de passe incorrect";
          return;
        }

        const current = {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email || null,
          profilePicture: user.profilePicture || null,
        };

        localStorage.setItem("currentUser", JSON.stringify(current));
        sessionStorage.removeItem("loginData");
        window.location.href = "../index.html";
      } catch (err) {
        console.error("Erreur fetch user by id:", err);
        errorLoginPassword.textContent = "Erreur serveur. Réessayez plus tard.";
      }
    });
  }
});




