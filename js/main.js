document.addEventListener("DOMContentLoaded", () => {
  const currentUserRaw = localStorage.getItem("currentUser");

  if (!currentUserRaw) {
    // Pas connecté → redirection
    window.location.href = "pages/welcome.html";
    return;
  }

  let currentUser;
  try {
    currentUser = JSON.parse(currentUserRaw);
  } catch (e) {
    console.error("Erreur parsing currentUser:", e);
    localStorage.removeItem("currentUser");
    window.location.href = "welcome.html";
    return;
  }

  // Si on arrive ici, l'utilisateur est connecté
  console.log("Utilisateur connecté:", currentUser);

  // Exemple : afficher son nom dans l'interface
  const userDisplay = document.getElementById("user-display");
  if (userDisplay) {
    userDisplay.textContent = currentUser.username || currentUser.name;
  }
});
