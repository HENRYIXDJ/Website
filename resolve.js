async function resolveUrl(url) {
  const res = await fetch(url, { redirect: "manual" });
  if (res.status >= 300 && res.status < 400) {
    return res.headers.get("location");
  }
  return url;
}

async function main() {
  const urls = [
    "https://on.soundcloud.com/cdObzGpHwrohPLFHJ1",
    "https://on.soundcloud.com/quOL7wJa4pPHwpI0El",
    "https://on.soundcloud.com/PorVDvYWB16AbqWtDf",
    "https://on.soundcloud.com/QyuXwAwZS9InzhGcKQ"
  ];
  for (const url of urls) {
    console.log(await resolveUrl(url));
  }
}
main();
