import fs from 'fs';

async function run() {
  const res = await fetch('https://ahcab.net/general-members');
  const text = await res.text();
  fs.writeFileSync('ahcab.html', text);
  console.log('Saved to ahcab.html. Length:', text.length);
}

run();
