// Prevent shift+arrows from being annoying when moving
window.addEventListener('keydown', function(e) {
  if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    const targetTag = e.target.tagName.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) {
      return;
    }
    e.preventDefault();
  }
})


// From injct.js: `modifyJSON` & `hook`
const origFetch = window.fetch;
window.fetch = async function (...args) {
  if (!args[0].endsWith(".json")) {
    return origFetch(...args)
  }
  console.log("Fetching", args[0])
  let orig = await origFetch(...args);
  const data = await orig.clone().json();
  modifyJSON(args[0], data)

  return new Response(JSON.stringify(data), {
    status: orig.status,
    statusText: orig.statusText,
    headers: new Headers(orig.headers),
  });
};

hook()
console.log("[Terraformed] Loaded!")
