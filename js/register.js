// -----------------------
// CONFIGURATION
// -----------------------

//ADRESSE DE L'API SELON ENVIRONNEMENT
const BASE_URL = location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "https://x-clone-api-3unv.onrender.com";

const NEXT_STEP_URL = "register-password.html"; // Page suivante après la 1ère étape

//Object mois convertit en nombre
const MONTHS_DATE = {
  Janvier: "01",
  Février: "02",
  Mars: "03",
  Avril: "04",
  Mai: "05",
  Juin: "06",
  Juillet: "07",
  Août: "08",
  Septembre: "09",
  Octobre: "10",
  Novembre: "11",
  Décembre: "12",
};

/*SWITCH PHONE/EMAIL INPUT*/

const switchLink = document.getElementById("switchLink");
let usingPhone = true; // vrai si le champ est en mode téléphone

if (switchLink) {
  switchLink.addEventListener("click", function (e) {
    e.preventDefault();
    const input = getActiveContactInput();
    if (!input) return;

    if (usingPhone) {
      // passer en email
      input.type = "email";
      input.placeholder = "Email";
      input.id = "emailInput";
      switchLink.textContent = "Utiliser un téléphone";
    } else {
      // revenir en téléphone
      input.type = "tel";
      input.placeholder = "Téléphone";
      input.id = "contactInput";
      switchLink.textContent = "Utiliser un email";
    }

    usingPhone = !usingPhone;
    // on peut appeler une vérification simple ici si on veut:
    if (typeof checkFormValidity === "function") {
      checkFormValidity();
    }
    if (typeof checkContactValidation === "function") {
      checkContactValidation();
    }
  });
}

// Retourne l'input actif contact / email selon l'état (peut être contactInput ou emailInput)
function getActiveContactInput() {
  const oneContact = document.getElementById("contactInput");
  if (oneContact) return oneContact;
  return document.getElementById("emailInput");
}

/*----------------------------------------------------------------*/
/*CHARGE BIRTHDATE*/
function populateSelect(id, values, placeholder = "") {
  const select = document.getElementById(id);
  select.innerHTML = ""; // Nettoyage

  if (placeholder) {
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = placeholder;
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);
  }

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

const months = Object.keys(MONTHS_DATE);
const days = [];
for (let d = 1; d <= 31; d++) days.push(String(d));
const years = [];
for (let y = 2025; y >= 1900; y--) years.push(String(y));

document.addEventListener("DOMContentLoaded", () => {
  populateSelect("month-select", months, "Mois");
  populateSelect("day-select", days, "Jour");
  populateSelect("year-select", years, "Année");
});
/*----------------------------------------------------------------*/

// VALIDATIONS (nom, contact, date)
// -----------------------

function checkNameValidity() {
  const nameInput = document.getElementById("name");
  const errorName = document.getElementById("error-name");
  if (!nameInput || !errorName) return false;
  const valueName = nameInput.value.trim();
  const nameRgx = /^[A-Za-zÀ-ÖØ-öø-ÿ\s\-']{2,}$/;
  if (!nameRgx.test(valueName)) {
    errorName.textContent = "Veuillez entrer un nom valide !";
    return false;
  } else {
    errorName.textContent = "";
    return true;
  }
}

function checkContactValidation() {
  const input = getActiveContactInput();
  const errEmail = document.getElementById("error-email");
  const errPhone = document.getElementById("error-telephone");
  if (!input || !errEmail || !errPhone) return false;

  errEmail.textContent = "";
  errPhone.textContent = "";

  const valueInputContact = input.value.trim();
  let emailFormatRgx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let phoneFormatRgx = /^\+?[0-9]{10,15}$/;

  if (input.type === "email") {
    if (
      valueInputContact.length > 0 &&
      !emailFormatRgx.test(valueInputContact)
    ) {
      errEmail.textContent = "Veuillez entrer une adresse email valide !";
      return false;
    }
    return valueInputContact.length > 0;
  } else {
    if (
      valueInputContact.length > 0 &&
      !phoneFormatRgx.test(valueInputContact)
    ) {
      errPhone.textContent = "Veuillez entrer un numéro de téléphone valide!";
      return false;
    }
    return valueInputContact.length > 0;
  }
}

// VALIDATION MOTS DE PASSE (page password)
// -----------------------

function validatePasswords(passwordP1, passwordP2, errorP, submitBtn) {
  if (!passwordP1 || !passwordP2 || !errorP || !submitBtn) return;
  const valuePassword1 = passwordP1.value.trim();
  const valuePassword2 = passwordP2.value.trim();
  errorP.textContent = "";

  if (valuePassword1.length === 0) {
    submitBtn.disabled = true;
    return;
  }
  if (valuePassword1.length < 6) {
    errorP.textContent =
      "Votre mot de passe doit contenir au moins 6 caractères";
    submitBtn.disabled = true;
    return;
  }
  if (valuePassword2.length === 0) {
    submitBtn.disabled = true;
    return;
  }
  if (valuePassword1 !== valuePassword2) {
    errorP.textContent = "Les deux mots de passe doivent être identiques";
    submitBtn.disabled = true;
    return;
  }

  errorP.textContent = "";
  submitBtn.disabled = false;
}
// Simple fonction fetch POST pour créer un utilisateur sur JSON Server
function postUser(userData) {
  return fetch(BASE_URL + "/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  }).then(function (res) {
    if (!res.ok) {
      return res.text().then(function (txt) {
        throw new Error("HTTP " + res.status + " - " + txt);
      });
    }
    return res.json();
  });
}

function checkDateValidity() {
  const mois = document.getElementById("month-select");
  const jour = document.getElementById("day-select");
  const annee = document.getElementById("year-select");
  if (!mois || !jour || !annee) return false;
  return mois.value !== "" && jour.value !== "" && annee.value !== "";
}

function checkFormValidity() {
  const nextBtn = document.getElementById("signin-btn1"); // <-- supprimé l'espace erroné
  if (!nextBtn) return;
  const verifName = checkNameValidity();
  const verifContact = checkContactValidation();
  const verifDate = checkDateValidity();
  nextBtn.disabled = !(verifName && verifContact && verifDate);
}

// -----------------------
// GESTION DU BOUTON "SUIVANT"
// -----------------------

function handleNextStep(e) {
  e.preventDefault();
  const signinBtn = document.getElementById("signin-btn1");
  if (!signinBtn || signinBtn.disabled) return;

  const fullName = (
    document.getElementById("name") || { value: "" }
  ).value.trim();
  const input = getActiveContactInput();
  const identifier = input ? input.value.trim() : "";
  const isEmail = input ? input.type === "email" : false;
  const monthName = (document.getElementById("month-select") || { value: "" })
    .value;
  let day = (document.getElementById("day-select") || { value: "" }).value; // <-- let pour pouvoir réassigner
  if (day.length === 1) day = "0" + day;
  const year = (document.getElementById("year-select") || { value: "" }).value;

  const username = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.+|\.+$)/g, "");

  const partial = {
    name: fullName,
    username: username,
    email: isEmail ? identifier : null,
    phone: isEmail ? null : identifier,
    birthdate: year + "-" + (MONTHS_DATE[monthName] || "01") + "-" + day,
  };

  try {
    localStorage.setItem("tempRegistrationData", JSON.stringify(partial));
    window.location.href = NEXT_STEP_URL;
  } catch (err) {
    console.error("Erreur stockage:", err);
    alert("Impossible de sauvegarder. Réessayez.");
  }
}

// -----------------------
// SOUMISSION FINALE (POST)
// -----------------------

function handleFinalRegistration(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("signin-btn2");
  if (submitBtn) submitBtn.disabled = true;

  const registreData = localStorage.getItem("tempRegistrationData");
  if (!registreData) {
    alert("Données d'inscription manquantes. Veuillez recommencer.");
    window.location.href = "./register.html";
    return;
  }

  const partial = JSON.parse(registreData);
  const passwordRegister = document.getElementById("password-register1");
  const password = passwordRegister ? passwordRegister.value.trim() : "";

  // Construire l'objet final
  const finalUser = {
    name: partial.name || "",
    username: partial.username || "user" + Date.now(),
    email: partial.email || partial.username + "@gmail.com",
    phone: partial.phone || null,
    password: password,
    createdAt: new Date().toISOString(),
    followers: 0,
    following: 0,
  };

  postUser(finalUser)
    .then(function (created) {
      console.log("User created:", created);
      localStorage.removeItem("tempRegistrationData");
      // Redirection à la page de connexion
      window.location.href = "login.html";
      // Confirmation par alert
      setTimeout(() => {
        alert("Compte créé ! Vous pouvez maintenant vous connecter.");
      }, 500);
    })
    .catch(function (err) {
      console.error("Erreur création:", err);
      if (
        err.message &&
        err.message.toLowerCase().includes("failed to fetch")
      ) {
        alert(
          "Échec de l'inscription : impossible de joindre le serveur (vérifie que json-server tourne sur http://localhost:3000)."
        );
      } else {
        alert("Échec de l'inscription: " + err.message);
      }
      if (submitBtn) submitBtn.disabled = false;
    });
}

// -----------------------
// INITIALISATION AU CHARGEMENT DE LA PAGE
// -----------------------

document.addEventListener("DOMContentLoaded", function () {
  const nextBtn = document.getElementById("signin-btn1"); // <-- supprimé l'espace erroné
  if (nextBtn) {
    // lier le click du bouton suivant
    nextBtn.addEventListener("click", handleNextStep);
  }

  // Ré-attacher les écouteurs pour re-valider en temps réel
  const nameInput = document.getElementById("name");
  if (nameInput) nameInput.addEventListener("input", checkFormValidity);

  // Pour le champ contact qui change d'id entre contactInput et emailInput,
  // utiliser une délégation d'événement pour détecter les inputs sur ces ids
  document.addEventListener("input", function (e) {
    if (!e.target) return;
    const id = e.target.id;
    if (id === "contactInput" || id === "emailInput") {
      checkFormValidity();
    }
  });

  // selects date
  ["month-select", "day-select", "year-select"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", checkFormValidity);
  });

  // --- initialisation existante pour la page password ---
  const firstPassword = document.getElementById("password-register1");
  const secondPassword = document.getElementById("password-register2");
  const errorPassword = document.getElementById("error-password");
  const submitBtn = document.getElementById("signin-btn2");
  const passwordForm = document.getElementById("password");
  if (firstPassword && secondPassword && errorPassword && submitBtn) {
    firstPassword.addEventListener("input", function () {
      validatePasswords(
        firstPassword,
        secondPassword,
        errorPassword,
        submitBtn
      );
    });
    secondPassword.addEventListener("input", function () {
      validatePasswords(
        firstPassword,
        secondPassword,
        errorPassword,
        submitBtn
      );
    });
    if (passwordForm)
      passwordForm.addEventListener("submit", handleFinalRegistration);
    validatePasswords(firstPassword, secondPassword, errorPassword, submitBtn);
  }
});

