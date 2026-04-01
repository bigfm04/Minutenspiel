let spielerListe = [];
let aktuellerSpielmodus = "Linear";
let aktuelleNachspielzeit = 0;
let tortypenUnterscheiden = false;
let offeneTorMinute = null;
let offeneMinutenAktion = null;

const addPlayerBtn = document.getElementById("addPlayerBtn");
const playerListDiv = document.getElementById("playerList");
const nachspielzeitInput = document.getElementById("nachspielzeitInput");
const nachspielzeitValue = document.getElementById("nachspielzeitValue");
const startGameBtn = document.getElementById("startGameBtn");
const gameGrid = document.getElementById("gameGrid");
const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const statsBtn = document.getElementById("statsBtn");
const backToStartBtn = document.getElementById("backToStartBtn");
const toast = document.getElementById("toast");

const splashScreen = document.getElementById("splashScreen");

function hideSplashScreen() {
  if (!splashScreen) return;
  splashScreen.classList.add("hiddenSplash");
}


const playerModal = document.getElementById("playerModal");
const playerNameInput = document.getElementById("playerNameInput");
const savePlayerBtn = document.getElementById("savePlayerBtn");
const closePlayerModal = document.getElementById("closePlayerModal");

const minuteActionModal = document.getElementById("minuteActionModal");
const minuteActionInfo = document.getElementById("minuteActionInfo");
const addGoalToMinuteBtn = document.getElementById("addGoalToMinuteBtn");
const removeGoalFromMinuteBtn = document.getElementById("removeGoalFromMinuteBtn");
const closeMinuteActionModal = document.getElementById("closeMinuteActionModal");

const goalTypeModal = document.getElementById("goalTypeModal");
const goalTypeInfo = document.getElementById("goalTypeInfo");
const closeGoalTypeModal = document.getElementById("closeGoalTypeModal");
const goalTypeButtons = document.querySelectorAll(".goalTypeBtn");

const statsModal = document.getElementById("statsModal");
const statsPlayerSelect = document.getElementById("statsPlayerSelect");
const statsOutput = document.getElementById("statsOutput");
const closeStatsModal = document.getElementById("closeStatsModal");

const exportModal = document.getElementById("exportModal");
const exportOutput = document.getElementById("exportOutput");
const copyExportBtn = document.getElementById("copyExportBtn");
const confirmEndGameBtn = document.getElementById("confirmEndGameBtn");
const closeExportModal = document.getElementById("closeExportModal");
const playerHeaderRow = document.getElementById("playerHeaderRow");

addPlayerBtn.addEventListener("click", () => {
  if (spielerListe.length >= 45) {
    showToast("Maximal 45 Spieler sind möglich.");
    return;
  }

  playerNameInput.value = "";
  playerModal.classList.remove("hidden");
  playerNameInput.focus();
});

savePlayerBtn.addEventListener("click", () => {
  if (spielerListe.length >= 45) {
    showToast("Maximal 45 Spieler sind möglich.");
    return;
  }

  const saubererName = playerNameInput.value.trim();
  if (saubererName === "") {
    showToast("Der Name darf nicht leer sein.");
    return;
  }

  const nameExistiertSchon = spielerListe.some(
    spieler => spieler.name.toLowerCase() === saubererName.toLowerCase()
  );
  if (nameExistiertSchon) {
    showToast("Die Spielernamen müssen unterschiedlich sein.");
    return;
  }

  spielerListe.push({
    name: saubererName,
    tore: [],
    minuten: []
  });

  renderSpielerListe();
  updateModeCardStates();
  speichereAppStatus();
  playerModal.classList.add("hidden");
  showToast("Spieler hinzugefügt.");
});

closePlayerModal.addEventListener("click", () => {
  playerModal.classList.add("hidden");
});

playerNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    savePlayerBtn.click();
  }
});

nachspielzeitInput.addEventListener("input", () => {
  updateNachspielzeitSlider();
  speichereAppStatus();
});

document.querySelectorAll('input[name="modus"]').forEach(radio => {
  radio.addEventListener("change", () => {
    aktuellerSpielmodus = radio.value;
    updateModeCardStates();
    speichereAppStatus();
  });
});

document.getElementById("tortypenCheckbox").addEventListener("change", (event) => {
  tortypenUnterscheiden = event.target.checked;
  speichereAppStatus();
});

startGameBtn.addEventListener("click", () => {
  if (spielerListe.length < 1) {
    showToast("Bitte mindestens einen Spieler anlegen.");
    return;
  }

  aktuellerSpielmodus = document.querySelector('input[name="modus"]:checked').value;
  aktuelleNachspielzeit = parseInt(nachspielzeitInput.value || "5", 10);
  tortypenUnterscheiden = document.getElementById("tortypenCheckbox").checked;

  const verteilung = generiereMinutenverteilung(
    spielerListe,
    aktuellerSpielmodus,
    aktuelleNachspielzeit
  );

  spielerListe.forEach(spieler => {
    spieler.tore = [];
    spieler.minuten = verteilung[spieler.name] || [];
  });

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  renderGameGrid();
  speichereAppStatus();
  showToast("Spiel gestartet.");
});

backToStartBtn.addEventListener("click", () => {
  renderExport();
  exportModal.classList.remove("hidden");
});

statsBtn.addEventListener("click", () => {
  renderStatsPlayerSelect();

  if (spielerListe.length > 0) {
    statsPlayerSelect.value = spielerListe[0].name;
    renderStatistik(spielerListe[0].name);
  }

  statsModal.classList.remove("hidden");
});

statsPlayerSelect.addEventListener("change", () => {
  renderStatistik(statsPlayerSelect.value);
});

closeStatsModal.addEventListener("click", () => {
  statsModal.classList.add("hidden");
});

copyExportBtn.addEventListener("click", async () => {
  const text = generiereExportText();
  try {
    await navigator.clipboard.writeText(text);
    showToast("Exporttext kopiert.");
  } catch (error) {
    showToast("Kopieren nicht möglich. Bitte Text manuell markieren.");
  }
});

confirmEndGameBtn.addEventListener("click", () => {
  exportModal.classList.add("hidden");
  gameScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  speichereAppStatus();
  showToast("Spiel beendet.");
});

closeExportModal.addEventListener("click", () => {
  exportModal.classList.add("hidden");
});

addGoalToMinuteBtn.addEventListener("click", () => {
  if (!offeneMinutenAktion) return;

  minuteActionModal.classList.add("hidden");

  if (!tortypenUnterscheiden) {
    torSpeichern(
      offeneMinutenAktion.spielerName,
      offeneMinutenAktion.minute,
      "Normal",
      offeneMinutenAktion.minuteElement
    );
    offeneMinutenAktion = null;
    return;
  }

  offeneTorMinute = { ...offeneMinutenAktion };
  offeneMinutenAktion = null;

  goalTypeInfo.textContent = `${offeneTorMinute.spielerName} – Minute ${offeneTorMinute.minute}`;
  goalTypeModal.classList.remove("hidden");
});

removeGoalFromMinuteBtn.addEventListener("click", () => {
  if (!offeneMinutenAktion) return;

  letztesTorEntfernen(
    offeneMinutenAktion.spielerName,
    offeneMinutenAktion.minute,
    offeneMinutenAktion.minuteElement
  );

  offeneMinutenAktion = null;
  minuteActionModal.classList.add("hidden");
});

closeMinuteActionModal.addEventListener("click", () => {
  offeneMinutenAktion = null;
  minuteActionModal.classList.add("hidden");
});

goalTypeButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (!offeneTorMinute) return;

    const typ = button.dataset.type;
    torSpeichern(
      offeneTorMinute.spielerName,
      offeneTorMinute.minute,
      typ,
      offeneTorMinute.minuteElement
    );

    offeneTorMinute = null;
    goalTypeModal.classList.add("hidden");
  });
});

closeGoalTypeModal.addEventListener("click", () => {
  offeneTorMinute = null;
  goalTypeModal.classList.add("hidden");
});

function renderSpielerListe() {
  playerListDiv.innerHTML = "";

  spielerListe.forEach((spieler, index) => {
    const div = document.createElement("div");
    div.className = "playerItem";

    const info = document.createElement("div");
    info.className = "playerIdentity";

    const avatar = document.createElement("div");
    avatar.className = "playerAvatar";
    avatar.textContent = spieler.name.slice(0, 1).toUpperCase();

    const textWrap = document.createElement("div");

    const nameSpan = document.createElement("div");
    nameSpan.className = "playerName";
    nameSpan.textContent = spieler.name;

    const meta = document.createElement("div");
    meta.className = "playerMeta";
    meta.textContent = "Hat gewaltig Durst";

    textWrap.appendChild(nameSpan);
    textWrap.appendChild(meta);
    info.appendChild(avatar);
    info.appendChild(textWrap);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "deletePlayerBtn";
    deleteBtn.textContent = "Löschen";
    deleteBtn.addEventListener("click", () => {
      spielerListe.splice(index, 1);
      renderSpielerListe();
      speichereAppStatus();
      showToast("Spieler entfernt.");
    });

    div.appendChild(info);
    div.appendChild(deleteBtn);
    playerListDiv.appendChild(div);
  });
  startGameBtn.disabled = spielerListe.length < 2;
}

function updateModeCardStates() {
  document.querySelectorAll(".modeCard").forEach(card => {
    const input = card.querySelector("input");
    card.classList.toggle("mode-active", !!input?.checked);
  });
}

function updateNachspielzeitSlider() {
  const value = parseInt(nachspielzeitInput.value, 10) || 0;
  nachspielzeitValue.textContent = `+${value} Min`;

  const percent = (value / 10) * 100;
  nachspielzeitInput.style.background = `
    linear-gradient(
      90deg,
      #22c55e 0%,
      #2563eb ${percent}%,
      rgba(255,255,255,0.14) ${percent}%,
      rgba(255,255,255,0.14) 100%
    )
  `;

  document.querySelectorAll(".sliderScale span").forEach((el, index) => {
    if (index === value) {
      el.style.color = "#ffffff";
      el.style.fontWeight = "700";
      el.style.transform = "scale(1.2)";
    } else {
      el.style.color = "rgba(255,255,255,0.4)";
      el.style.fontWeight = "400";
      el.style.transform = "scale(1)";
    }
  });
}

function mischeArray(array) {
  const kopie = [...array];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

function minutenZuSortierwert(minute) {
  if (minute.includes("+")) {
    const teile = minute.split("+");
    return parseInt(teile[0], 10) + parseInt(teile[1], 10) / 100;
  }
  return parseInt(minute, 10);
}

function sortiereMinuten(minutenListe) {
  minutenListe.sort((a, b) => minutenZuSortierwert(a) - minutenZuSortierwert(b));
}

function erzeugeAlleMinuten(nachspielzeit) {
  const ersteHalbzeit = [];
  const zweiteHalbzeit = [];

  for (let i = 1; i <= 45; i++) {
    ersteHalbzeit.push(String(i));
  }
  for (let i = 1; i <= nachspielzeit; i++) {
    ersteHalbzeit.push(`45+${i}`);
  }
  for (let i = 46; i <= 90; i++) {
    zweiteHalbzeit.push(String(i));
  }
  for (let i = 1; i <= nachspielzeit; i++) {
    zweiteHalbzeit.push(`90+${i}`);
  }

  return {
    ersteHalbzeit,
    zweiteHalbzeit,
    alleMinuten: [...ersteHalbzeit, ...zweiteHalbzeit]
  };
}

function generiereLinear(spielerListe, nachspielzeit) {
  const { alleMinuten } = erzeugeAlleMinuten(nachspielzeit);
  const zufallsReihenfolge = mischeArray(spielerListe);
  const verteilung = {};
  zufallsReihenfolge.forEach(spieler => {
    verteilung[spieler.name] = [];
  });

  alleMinuten.forEach((minute, index) => {
    const spieler = zufallsReihenfolge[index % zufallsReihenfolge.length];
    verteilung[spieler.name].push(minute);
  });

  Object.keys(verteilung).forEach(name => sortiereMinuten(verteilung[name]));
  return verteilung;
}

function generiereZufall90(spielerListe, nachspielzeit) {
  const { alleMinuten } = erzeugeAlleMinuten(nachspielzeit);
  const gemischteMinuten = mischeArray(alleMinuten);
  const verteilung = {};
  spielerListe.forEach(spieler => {
    verteilung[spieler.name] = [];
  });

  gemischteMinuten.forEach((minute, index) => {
    const spieler = spielerListe[index % spielerListe.length];
    verteilung[spieler.name].push(minute);
  });

  Object.keys(verteilung).forEach(name => sortiereMinuten(verteilung[name]));
  return verteilung;
}

function generiereZufall45(spielerListe, nachspielzeit) {
  const { ersteHalbzeit, zweiteHalbzeit } = erzeugeAlleMinuten(nachspielzeit);
  const gemischteErsteHalbzeit = mischeArray(ersteHalbzeit);
  const gemischteZweiteHalbzeit = mischeArray(zweiteHalbzeit);
  const verteilung = {};
  spielerListe.forEach(spieler => {
    verteilung[spieler.name] = [];
  });

  gemischteErsteHalbzeit.forEach((minute, index) => {
    const spieler = spielerListe[index % spielerListe.length];
    verteilung[spieler.name].push(minute);
  });

  gemischteZweiteHalbzeit.forEach((minute, index) => {
    const spieler = spielerListe[index % spielerListe.length];
    verteilung[spieler.name].push(minute);
  });

  Object.keys(verteilung).forEach(name => sortiereMinuten(verteilung[name]));
  return verteilung;
}

function generiereZufallBlock(spielerListe, nachspielzeit) {
  const { alleMinuten } = erzeugeAlleMinuten(nachspielzeit);
  const anzahlSpieler = spielerListe.length;
  const verteilung = {};
  spielerListe.forEach(spieler => {
    verteilung[spieler.name] = [];
  });

  for (let i = 0; i < alleMinuten.length; i += anzahlSpieler) {
    const block = alleMinuten.slice(i, i + anzahlSpieler);
    const gemischteSpieler = mischeArray(spielerListe);

    block.forEach((minute, index) => {
      const spieler = gemischteSpieler[index];
      if (spieler) {
        verteilung[spieler.name].push(minute);
      }
    });
  }

  Object.keys(verteilung).forEach(name => sortiereMinuten(verteilung[name]));
  return verteilung;
}

function generiereMinutenverteilung(spielerListe, modus, nachspielzeit) {
  switch (modus) {
    case "Zufall Block":
      return generiereZufallBlock(spielerListe, nachspielzeit);
    case "Zufall45":
      return generiereZufall45(spielerListe, nachspielzeit);
    case "Zufall90":
      return generiereZufall90(spielerListe, nachspielzeit);
    case "Linear":
      return generiereLinear(spielerListe, nachspielzeit);
    default:
      return {};
  }
}

function sortiereSpielerFuerAnzeige(spielerArray) {
  return [...spielerArray].sort((a, b) => {
    const ersteMinuteA = a.minuten?.length ? minutenZuSortierwert(a.minuten[0]) : 999;
    const ersteMinuteB = b.minuten?.length ? minutenZuSortierwert(b.minuten[0]) : 999;

    if (ersteMinuteA !== ersteMinuteB) {
      return ersteMinuteA - ersteMinuteB;
    }

    return a.name.localeCompare(b.name, "de");
  });
}

function renderGameGrid() {
  gameGrid.innerHTML = "";

  const sortierteSpieler = sortiereSpielerFuerAnzeige(spielerListe);
  renderPlayerHeaderRow(sortierteSpieler);
  gameGrid.innerHTML = "";
  sortierteSpieler.forEach(spieler => {
    const column = document.createElement("div");
    column.className = "playerColumn";


    spieler.minuten.forEach(minute => {
      const minuteDiv = document.createElement("div");
      const toreInMinute = spieler.tore.filter(tor => tor.minute === minute).length;

      minuteDiv.className = "minuteCircle";
      minuteDiv.textContent = minute;
      minuteDiv.dataset.spieler = spieler.name;
      minuteDiv.dataset.minute = minute;
      minuteDiv.dataset.tore = String(toreInMinute);

      aktualisiereMinutenFarbe(minuteDiv, toreInMinute);
      aktualisiereMinutenBadge(minuteElement, aktuelleAnzahl);
      minuteDiv.addEventListener("click", () => {
        minuteAngeklickt(spieler.name, minute, minuteDiv);
      });

      column.appendChild(minuteDiv);
    });

    gameGrid.appendChild(column);
  });
}

function minuteAngeklickt(spielerName, minute, minuteElement) {
  offeneMinutenAktion = { spielerName, minute, minuteElement };
  minuteActionInfo.textContent = `${spielerName} – Minute ${minute}`;
  minuteActionModal.classList.remove("hidden");
}

function torSpeichern(spielerName, minute, typ, minuteElement) {
  const spieler = spielerListe.find(s => s.name === spielerName);
  if (!spieler) return;

  spieler.tore.push({ minute, typ });

  let aktuelleAnzahl = parseInt(minuteElement.dataset.tore, 10);
  aktuelleAnzahl++;
  minuteElement.dataset.tore = String(aktuelleAnzahl);

  aktualisiereMinutenFarbe(minuteElement, aktuelleAnzahl);
  aktualisiereMinutenBadge(minuteElement, aktuelleAnzahl);
  speichereAppStatus();
  showToast("Tor gespeichert.");
}

function letztesTorEntfernen(spielerName, minute, minuteElement) {
  const spieler = spielerListe.find(s => s.name === spielerName);
  if (!spieler) return;

  const index = [...spieler.tore].reverse().findIndex(tor => tor.minute === minute);
  if (index === -1) {
    showToast("In dieser Minute ist noch kein Tor gespeichert.");
    return;
  }

  const echterIndex = spieler.tore.length - 1 - index;
  spieler.tore.splice(echterIndex, 1);

  let aktuelleAnzahl = parseInt(minuteElement.dataset.tore, 10);
  aktuelleAnzahl = Math.max(0, aktuelleAnzahl - 1);
  minuteElement.dataset.tore = String(aktuelleAnzahl);

  aktualisiereMinutenFarbe(minuteElement, aktuelleAnzahl);
  aktualisiereMinutenBadge(minuteElement, aktuelleAnzahl);
  speichereAppStatus();
  showToast("Tor entfernt.");
}

function aktualisiereMinutenFarbe(element, tore) {
  element.classList.remove("tore-0", "tore-1", "tore-2", "tore-3", "tore-4plus");

  if (tore === 0) {
    element.classList.add("tore-0");
  } else if (tore === 1) {
    element.classList.add("tore-1");
  } else if (tore === 2) {
    element.classList.add("tore-2");
  } else if (tore === 3) {
    element.classList.add("tore-3");
  } else {
    element.classList.add("tore-4plus");
  }
}

function aktualisiereMinutenBadge(element, tore) {
  const vorhandenesBadge = element.querySelector(".minuteBadge");

  if (tore <= 0) {
    if (vorhandenesBadge) {
      vorhandenesBadge.remove();
    }
    return;
  }

  if (vorhandenesBadge) {
    vorhandenesBadge.textContent = String(tore);
    return;
  }

  const badge = document.createElement("div");
  badge.className = "minuteBadge";
  badge.textContent = String(tore);
  element.appendChild(badge);
}

function berechneStatistik(spielerName) {
  const spieler = spielerListe.find(s => s.name === spielerName);
  if (!spieler) return null;

  const gesamttore = spielerListe.reduce((summe, s) => summe + s.tore.length, 0);
  const toreGesamt = spieler.tore.length;
  const elfmeter = spieler.tore.filter(t => t.typ === "Elfmeter").length;
  const freistoss = spieler.tore.filter(t => t.typ === "Freistoß").length;
  const normal = spieler.tore.filter(t => t.typ === "Normal").length;
  const anteil = gesamttore === 0 ? 0 : (toreGesamt / gesamttore) * 100;

  return {
    toreGesamt,
    anteil: anteil.toFixed(1),
    elfmeter,
    freistoss,
    normal
  };
}

function renderStatsPlayerSelect() {
  statsPlayerSelect.innerHTML = "";
  spielerListe.forEach(spieler => {
    const option = document.createElement("option");
    option.value = spieler.name;
    option.textContent = spieler.name;
    statsPlayerSelect.appendChild(option);
  });
}

function renderStatistik(spielerName) {
  const statistik = berechneStatistik(spielerName);
  if (!statistik) {
    statsOutput.innerHTML = "Keine Statistik verfügbar.";
    return;
  }

  statsOutput.innerHTML = `
    <div class="statCard">
      <div class="statLabel">Anzahl Tore</div>
      <div class="statValue">${statistik.toreGesamt}</div>
    </div>
    <div class="statCard">
      <div class="statLabel">Anteil an Gesamttoren</div>
      <div class="statValue">${statistik.anteil}%</div>
    </div>
    <div class="statCard">
      <div class="statLabel">Elfmeter</div>
      <div class="statValue">${statistik.elfmeter}</div>
    </div>
    <div class="statCard">
      <div class="statLabel">Freistoß</div>
      <div class="statValue">${statistik.freistoss}</div>
    </div>
    <div class="statCard">
      <div class="statLabel">Normal</div>
      <div class="statValue">${statistik.normal}</div>
    </div>
  `;
}


function generiereExportDaten() {
  return spielerListe.map(spieler => {
    const minuten = spieler.tore.map(tor => tor.minute);
    return {
      name: spieler.name,
      tore: spieler.tore.length,
      minutenText: minuten.length ? minuten.join(", ") : "-"
    };
  });
}

function generiereExportText() {
  const daten = generiereExportDaten();
  return daten
    .map(eintrag => `${eintrag.name} | Tore: ${eintrag.tore} | Minuten: ${eintrag.minutenText}`)
    .join("\n");
}

function renderExport() {
  const daten = generiereExportDaten();

  if (daten.length === 0) {
    exportOutput.innerHTML = "<div class=\"exportCard\"><div class=\"exportLine\">Keine Daten vorhanden.</div></div>";
    return;
  }

  const cards = daten.map(eintrag => `
    <div class="exportCard">
      <div class="exportPlayerName">${eintrag.name}</div>
      <div class="exportLine"><strong>Anzahl Tore:</strong> ${eintrag.tore}</div>
      <div class="exportLine"><strong>Minuten:</strong> ${eintrag.minutenText}</div>
    </div>
  `).join("");

  const text = generiereExportText()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  exportOutput.innerHTML = cards + `<textarea class="exportTextBox" readonly>${text}</textarea>`;
}

function speichereAppStatus() {
  const daten = {
    spielerListe,
    aktuellerSpielmodus,
    aktuelleNachspielzeit,
    tortypenUnterscheiden,
    istSpielAnsichtOffen: !gameScreen.classList.contains("hidden")
  };
  localStorage.setItem("minutenspielApp", JSON.stringify(daten));
}

function ladeAppStatus() {
  const rohdaten = localStorage.getItem("minutenspielApp");
  if (!rohdaten) return;

  try {
    const daten = JSON.parse(rohdaten);
    spielerListe = Array.isArray(daten.spielerListe) ? daten.spielerListe : [];
    aktuellerSpielmodus = daten.aktuellerSpielmodus || "Linear";
    aktuelleNachspielzeit = Number.isInteger(daten.aktuelleNachspielzeit) ? daten.aktuelleNachspielzeit : 5;
    tortypenUnterscheiden = !!daten.tortypenUnterscheiden;

    nachspielzeitInput.value = String(aktuelleNachspielzeit || 5);

    const radio = document.querySelector(`input[name="modus"][value="${aktuellerSpielmodus}"]`);
    if (radio) radio.checked = true;

    document.getElementById("tortypenCheckbox").checked = tortypenUnterscheiden;

    renderSpielerListe();
    updateModeCardStates();

    if (daten.istSpielAnsichtOffen) {
      startScreen.classList.add("hidden");
      gameScreen.classList.remove("hidden");
      renderGameGrid();
    }
  } catch (fehler) {
    console.error("Fehler beim Laden des App-Status:", fehler);
  }
}

let toastTimeout = null;
function showToast(text) {
  toast.textContent = text;
  toast.classList.remove("hidden");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add("hidden"), 2200);
}

function renderPlayerHeaderRow(sortierteSpieler) {
  playerHeaderRow.innerHTML = "";

  sortierteSpieler.forEach(spieler => {
    const headerCell = document.createElement("div");
    headerCell.className = "playerHeaderCell";
    headerCell.textContent = spieler.name;
    playerHeaderRow.appendChild(headerCell);
  });

  playerHeaderRow.scrollLeft = gameGrid.scrollLeft;
}
function synchronisiereHeaderScroll() {
  let isSyncing = false;

  gameGrid.addEventListener("scroll", () => {
    if (isSyncing) return;
    isSyncing = true;
    playerHeaderRow.scrollLeft = gameGrid.scrollLeft;
    requestAnimationFrame(() => {
      isSyncing = false;
    });
  });
}

ladeAppStatus();
updateModeCardStates();

if (!nachspielzeitInput.value) {
  nachspielzeitInput.value = "5";
}
updateNachspielzeitSlider();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .catch(error => console.error("Service Worker Fehler:", error));
  });
}
synchronisiereHeaderScroll();

window.addEventListener("load", () => {
  setTimeout(hideSplashScreen, 1300);
});

setTimeout(hideSplashScreen, 1800);
