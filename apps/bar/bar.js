const roomId = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || "demo");
const elements = {
  guests: document.querySelector("#guests"), vip: document.querySelector("#vipSeats"),
  effects: document.querySelector("#effects"), spotlight: document.querySelector("#spotlight"),
  toast: document.querySelector("#toast"), count: document.querySelector("#guestCount"),
  room: document.querySelector("#roomLabel"),
};
elements.room.textContent = `#${roomId}`;

const guests = new Map();
let cursor = 0;
let toastTimer;
const floorSlots = [
  [18,44],[34,28],[50,40],[66,27],[82,44],[28,66],[50,72],[72,65],
  [13,82],[38,88],[62,87],[87,81],[20,24],[80,22],[42,55],[59,56],
];
const colors = ["#22d3ee", "#f472b6", "#a78bfa", "#34d399", "#fb923c", "#facc15"];

function initials(name) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function safeImage(url) { try { const parsed = new URL(url); return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : ""; } catch { return ""; } }

function createGuest(user = {}) {
  const id = String(user.id || `guest-${Date.now()}`);
  if (guests.has(id)) return guests.get(id);
  const guest = document.createElement("div");
  guest.className = "guest dancing";
  guest.dataset.id = id;
  guest.style.setProperty("--accent", colors[guests.size % colors.length]);
  const image = safeImage(user.avatarUrl);
  guest.innerHTML = `<div class="avatar">${image ? `<img alt="" src="${image}">` : initials(user.name || "Guest")}</div><div class="body"></div><div class="name"></div>`;
  guest.querySelector(".name").textContent = user.name || "Guest";
  const slot = floorSlots[guests.size % floorSlots.length];
  guest.style.left = `${slot[0]}%`; guest.style.top = `${slot[1]}%`;
  elements.guests.append(guest);
  const model = { id, user, element: guest, slot };
  guests.set(id, model); updateCount();
  guest.animate([{ opacity: 0, transform: "translate(-50%,20%) scale(.2)" }, { opacity: 1 }], { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)" });
  return model;
}

function removeGuest(user) { const model = guests.get(String(user?.id)); if (!model) return; model.element.remove(); guests.delete(model.id); updateCount(); }
function updateCount() { elements.count.textContent = String(guests.size); }
function getGuest(user) { return createGuest(user || { id: "mystery", name: "Mystery Guest" }); }
function dance(user) { const model = getGuest(user); model.element.classList.add("dancing"); clearTimeout(model.danceTimer); model.danceTimer = setTimeout(() => model.element.classList.remove("dancing"), 7000); }

function focus(user) {
  const model = getGuest(user); const host = model.element.parentElement;
  const left = host === elements.vip ? 50 : model.slot[0]; const top = host === elements.vip ? 8 : 44 + model.slot[1] * .48;
  elements.spotlight.style.left = `${left}%`; elements.spotlight.style.top = `${top}%`;
  elements.spotlight.classList.add("active"); model.element.style.zIndex = "20";
  setTimeout(() => { elements.spotlight.classList.remove("active"); model.element.style.zIndex = ""; }, 5000);
}

function promote(user) {
  const model = getGuest(user); model.element.classList.add("vip"); elements.vip.append(model.element);
  show(`${model.user.name || "Guest"} entered the VIP lounge 👑`); focus(user);
}

function fireworks() {
  const colors = ["#22d3ee", "#f472b6", "#facc15", "#a78bfa", "#34d399"];
  for (let burst = 0; burst < 5; burst++) setTimeout(() => {
    const x = 15 + Math.random() * 70, y = 18 + Math.random() * 48;
    for (let i = 0; i < 24; i++) {
      const spark = document.createElement("i"); spark.className = "spark";
      const angle = (i / 24) * Math.PI * 2, distance = 45 + Math.random() * 130;
      spark.style.cssText = `left:${x}%;top:${y}%;--x:${Math.cos(angle)*distance}px;--y:${Math.sin(angle)*distance}px;--color:${colors[i%colors.length]}`;
      elements.effects.append(spark); setTimeout(() => spark.remove(), 1700);
    }
  }, burst * 300);
}

function confetti() { for (let i = 0; i < 70; i++) { const bit = document.createElement("i"); bit.className = "confetti"; bit.style.cssText = `left:${Math.random()*100}%;--drift:${-50+Math.random()*100}px;--color:${colors[i%colors.length]};animation-delay:${Math.random()*.7}s`; elements.effects.append(bit); setTimeout(() => bit.remove(), 3500); } }
function smoke() { for (let i = 0; i < 6; i++) { const cloud = document.createElement("i"); cloud.className = "smoke"; cloud.style.left = `${Math.random()*75}%`; cloud.style.animationDelay = `${Math.random()*.7}s`; elements.effects.append(cloud); setTimeout(() => cloud.remove(), 4000); } }
function show(text) { clearTimeout(toastTimer); elements.toast.textContent = text; elements.toast.classList.remove("hidden"); toastTimer = setTimeout(() => elements.toast.classList.add("hidden"), 4200); }
function reset() { guests.forEach(({ element }) => element.remove()); guests.clear(); updateCount(); show("The room has been reset"); }

function gift(event) {
  const model = getGuest(event.user); const giftName = String(event.data?.giftName || event.data?.name || event.data?.giftId || "Gift");
  const key = giftName.toLowerCase(); show(`${model.user.name || "Guest"} sent ${giftName} ×${event.data?.count || 1}`);
  if (key.includes("rose") || key.includes("camera")) focus(event.user);
  else if (key.includes("fire") || key.includes("universe")) { fireworks(); focus(event.user); }
  else if (key.includes("vip") || key.includes("crown") || key.includes("rosa")) promote(event.user);
  else if (key.includes("smoke") || key.includes("perfume")) smoke();
  else { dance(event.user); confetti(); }
}

function apply(event) {
  switch (event.type) {
    case "guest.joined": case "viewer.joined": createGuest(event.user); show(`${event.user?.name || "A guest"} joined the bar`); break;
    case "guest.left": removeGuest(event.user); break;
    case "guest.dance": dance(event.user); break;
    case "guest.promoted": promote(event.user); break;
    case "camera.focus": focus(event.user); break;
    case "effect.fireworks": fireworks(); break;
    case "effect.confetti": confetti(); break;
    case "effect.smoke": smoke(); break;
    case "room.message": show(String(event.data?.message || "Welcome to OpenLiveBar")); break;
    case "room.reset": reset(); break;
    case "gift.received": gift(event); break;
    case "chat.message": if (/^(hey|join|tham gia)$/i.test(String(event.data?.text || "").trim())) createGuest(event.user); break;
  }
}

async function poll() {
  try {
    const response = await fetch(`/api/v1/rooms/${encodeURIComponent(roomId)}/events?after=${cursor}&limit=100`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    for (const event of payload.events) { apply(event); cursor = Math.max(cursor, event.cursor); }
    document.body.dataset.connected = "true";
  } catch { document.body.dataset.connected = "false"; }
  setTimeout(poll, 450);
}

poll();
