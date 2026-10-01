const fs = require('fs');

function fixUpload(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/supabase\.storage\.from\('assets'\)\.upload\(`thumbnails\/\$\{filename\}`/g, 'supabase.storage.from("thumbnails").upload(filename');
  code = code.replace(/supabase\.storage\.from\('assets'\)\.getPublicUrl\(`thumbnails\/\$\{filename\}`/g, 'supabase.storage.from("thumbnails").getPublicUrl(filename');
  fs.writeFileSync(filePath, code);
}

fixUpload('app/admin/(protected)/courses/page.tsx');
fixUpload('app/admin/(protected)/milestone-videos/page.tsx');
console.log('Fixed upload bucket names.');
