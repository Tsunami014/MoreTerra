browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    console.log("Fetching", details.url);
    const url = new URL(details.url);

    if (url.pathname.includes("GameCanvas")) {
      const filter = browser.webRequest.filterResponseData(details.requestId);
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      let data = "";
      filter.ondata = (event) => {
        data += decoder.decode(event.data, { stream: true });
      };
      filter.onstop = () => {
        const patched = patchData(data); // Included in gameCanvas.js
        filter.write(encoder.encode(patched));
        filter.close();
      };
    }

    for (const name of Object.keys(PATCH)) {
      for (const pth of PATCH[name].data) {
        if (url.pathname.endsWith(pth)) {
          const redirectUrl = browser.runtime.getURL(PATCH[name].prefix+pth);
          return { redirectUrl };
        }
      }
    }
  },
  { urls: ["*://terra.hackclub.com/*"], types: ["image", "script", "xmlhttprequest", "other"] },
  ["blocking"]
);
