#!/usr/bin/env node

import { fileURLToPath } from "url";
import fs from "fs-extra";
import { dirname, join } from "path";
import prompts from "prompts";

(async () => {
  const response = await prompts([
    {
      type: "toggle",
      name: "isTailwind",
      message: "Do you want to use Tailwind Css?",
      initial: true,
      active: "Yes",
      inactive: "No",
    },
    {
      type: "toggle",
      name: "isRedux",
      message: "Do you want to use Redux?",
      initial: true,
      active: "Yes",
      inactive: "No",
    },
    {
      type: "toggle",
      name: "isDocker",
      message: "Do you want to use Docker?",
      initial: true,
      active: "Yes",
      inactive: "No",
    },
  ]);

  console.log(response);

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
    if (!response.isTailwind) {
      const tailwindFile = [
        join(projectPath, "tailwind.config.ts"),
        join(projectPath, "postcss.config.mjs"),
      ];

      tailwindFile.forEach((file) => {
        if (fs.existsSync(file)) {
          fs.removeSync(file);
        }
      });

      const packageJson = join(projectPath, "package.json");
      const packageJsonData = fs.readJSONSync(packageJson);
      if (packageJsonData?.devDependencies?.tailwindcss) {
        delete packageJsonData.devDependencies["tailwindcss"];
      }
      if (packageJsonData?.devDependencies?.postcss) {
        delete packageJsonData.devDependencies["postcss"];
      }
      fs.writeJSONSync(packageJson, packageJsonData);
    }

    if (!response.isDocker) {
      const dockerFiles = [
        join(projectPath, "Dockerfile"),
        join(projectPath, "Dockerfile.prod"),
        join(projectPath, "docker-compose.yml"),
        join(projectPath, "docker-compose.prod.yml"),
      ];

      dockerFiles.forEach((file) => {
        if (fs.existsSync(file)) {
          fs.removeSync(file);
        }
      });
    }
    console.log(`Project ${projectName} created successfully.`);
  } catch (err) {
    console.error(`Failed to create project: ${err.message}`);
    process.exit(1);
  }
})();
