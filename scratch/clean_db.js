const fs = require('fs');
const path = require('path');
const p = path.join(process.env.APPDATA, 'dubai-electronics-stock-manager', 'database.json');
if (fs.existsSync(p)) {
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/"Customer Sale \(Dummy\)"/g, '""');
  fs.writeFileSync(p, content, 'utf8');
  console.log('Successfully cleaned database.json');
} else {
  console.log('database.json not found');
}
