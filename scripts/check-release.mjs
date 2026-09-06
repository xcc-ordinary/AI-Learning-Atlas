import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const versions = JSON.parse(fs.readFileSync("versions.json", "utf8"));
const errors = [];

if (manifest.id !== "ai-learning-atlas") errors.push("Unexpected manifest id");
if (manifest.version !== pkg.version)
  errors.push("package and manifest versions differ");
if (versions[manifest.version] !== manifest.minAppVersion)
  errors.push("versions.json does not match manifest");
for (const file of ["main.js", "manifest.json", "styles.css"]) {
  if (!fs.existsSync(file) || fs.statSync(file).size === 0)
    errors.push(`Missing release file: ${file}`);
}
if (!pkg.repository.url.includes("xcc-ordinary/AI-Learning-Atlas"))
  errors.push("Unexpected repository URL");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Release metadata OK: ${manifest.id} ${manifest.version}`);
