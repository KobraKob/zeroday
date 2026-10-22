async function check() {
  const r = await fetch('http://localhost:3000/_next/static/css/a0e6bd2d8d3f17a0.css');
  console.log("CSS fetch status:", r.status);
  const text = await r.text();
  console.log("CSS text length:", text.length);
}
check();
