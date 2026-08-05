const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

const heading = document.createElement("h1");
heading.textContent = "聊天长截图";
app.append(heading);
