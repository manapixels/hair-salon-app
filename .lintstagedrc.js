module.exports = {
  // TypeScript and JavaScript files (excluding config files in root)
  '*.{ts,tsx}': ['prettier --write', 'eslint --fix --max-warnings=0 --cache'],

  // JavaScript files (for src/ only to avoid config file issues)
  'src/**/*.{js,jsx}': ['prettier --write', 'eslint --fix --max-warnings=0 --cache'],

  // Config and other JS files - just format, don't lint
  '*.{js,jsx}': ['prettier --write'],

  // JSON, Markdown, and YAML files
  '*.{json,md,yml,yaml}': ['prettier --write'],

  // Run TypeScript type checking on staged TS files only
  '*.ts?(x)': () => 'tsc --noEmit',
};
