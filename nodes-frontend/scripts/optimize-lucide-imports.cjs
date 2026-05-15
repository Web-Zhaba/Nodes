const fs = require('fs');
const path = require('path');

function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase();
}

function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTsFiles(fullPath, files);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  return files;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  
  // Match: import { Icon1, Icon2 } from 'lucide-react' or "lucide-react"
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"];?/g;
  
  let match;
  let hasChanges = false;
  
  while ((match = importRegex.exec(originalContent)) !== null) {
    const fullMatch = match[0];
    const iconsStr = match[1];
    
    // Parse icon names
    const icons = iconsStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => {
        // Handle "Icon as Alias" syntax
        const parts = s.split(/\s+as\s+/);
        return {
          name: parts[0].trim(),
          alias: parts[1]?.trim(),
          full: s
        };
      });
    
    // Generate new imports
    const newImports = icons.map(icon => {
      const kebabName = toKebabCase(icon.name);
      const iconPath = `lucide-react/dist/esm/icons/${kebabName}`;
      
      // Verify file exists
      const fullIconPath = path.resolve('node_modules', iconPath + '.js');
      if (!fs.existsSync(fullIconPath)) {
        console.warn(`⚠️  Icon file not found: ${iconPath} for ${icon.name} in ${filePath}`);
        return null;
      }
      
      if (icon.alias) {
        return `import ${icon.alias} from "${iconPath}";`;
      }
      return `import ${icon.name} from "${iconPath}";`;
    }).filter(Boolean);
    
    if (newImports.length > 0) {
      content = content.replace(fullMatch, newImports.join('\n'));
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

const srcDir = path.resolve('src');
const files = findTsFiles(srcDir);

console.log(`🔍 Found ${files.length} TypeScript files\n`);

let updatedCount = 0;
for (const file of files) {
  if (processFile(file)) {
    updatedCount++;
  }
}

console.log(`\n🎉 Done! Updated ${updatedCount} files.`);
