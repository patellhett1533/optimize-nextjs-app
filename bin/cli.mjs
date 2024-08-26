#!/usr/bin/env node

import { fileURLToPath } from "url";
import fs from "fs-extra";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const [, , projectName] = process.argv;

if (!projectName) {
  console.error(red("Please specify the project name."));
  process.exit(1);
}

const projectPath = join(process.cwd(), projectName);
const templatePath = join(__dirname, "template");

if (fs.existsSync(projectPath)) {
  console.error(`Directory ${projectName} already exists.`);
  process.exit(1);
}

try {
  fs.copySync(templatePath, projectPath);
  console.log(`Project ${projectName} created successfully.`);
  console.log(`cd ${projectName} && docker-compose up --build`);
} catch (err) {
  console.error(`Failed to create project: ${err.message}`);
  process.exit(1);
}
