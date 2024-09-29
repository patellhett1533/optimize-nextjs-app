#!/usr/bin/env node

import { fileURLToPath } from "url";
import fs from "fs-extra";
import { dirname, join } from "path";
import prompts from "prompts";
import { createSpinner } from "nanospinner";

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log(`Welcome to Optimize Nextjs Boilerplate\n`);

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

  console.log("\n");

  const spinner = createSpinner("Setting up the project...").start();

  await setup_project(response.isTailwind, response.isRedux, response.isDocker);

  spinner.success({ text: `Project setup complete!` });
})();

const setup_project = async (isTailwind, isRedux, isDocker) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const [, , projectName] = process.argv;

  if (!projectName) {
    console.error("Please specify the project name.");
    process.exit(1);
  }

  const projectPath = join(process.cwd(), projectName);
  const templatePath = join(__dirname, "template");

  if (await fs.pathExists(projectPath)) {
    console.error(`Directory ${projectName} already exists.`);
    process.exit(1);
  }

  try {
    await fs.copy(templatePath, projectPath);

    if (!isTailwind) {
      const tailwindFiles = [
        join(projectPath, "tailwind.config.ts"),
        join(projectPath, "postcss.config.mjs"),
      ];

      await Promise.all(tailwindFiles.map((file) => fs.remove(file)));

      const packageJson = join(projectPath, "package.json");
      const packageJsonData = await fs.readJSON(packageJson);

      delete packageJsonData.devDependencies?.tailwindcss;
      delete packageJsonData.devDependencies?.postcss;

      await fs.writeJSON(packageJson, packageJsonData);
    }

    if (!isDocker) {
      const dockerFiles = [
        join(projectPath, "Dockerfile"),
        join(projectPath, "Dockerfile.prod"),
        join(projectPath, "docker-compose.yml"),
        join(projectPath, "docker-compose.prod.yml"),
      ];

      await Promise.all(dockerFiles.map((file) => fs.remove(file)));
    }

    if (!isRedux) {
      const libPath = join(projectPath, "lib");
      const storeProviderPath = join(projectPath, "app", "StoreProvider.tsx");

      await fs.remove(libPath);
      await fs.remove(storeProviderPath);

      const layoutPath = join(projectPath, "app", "layout.tsx");

      if (await fs.pathExists(layoutPath)) {
        let layoutContent = await fs.readFile(layoutPath, "utf8");
        layoutContent = layoutContent
          .replace(/<StoreProvider>/g, "")
          .replace(/<\/StoreProvider>/g, "")
          .replace(/import StoreProvider from '.\/StoreProvider'/g, "");

        await fs.writeFile(layoutPath, layoutContent);
      }

      const packageJson = join(projectPath, "package.json");
      const packageJsonData = await fs.readJSON(packageJson);

      delete packageJsonData.dependencies?.["react-redux"];
      delete packageJsonData.devDependencies?.["@reduxjs/toolkit"];

      await fs.writeJSON(packageJson, packageJsonData);
    }

    const packageJson = join(projectPath, "package.json");
    const packageJsonData = await fs.readJSON(packageJson);
    packageJsonData.name = projectName;
    await fs.writeJSON(packageJson, packageJsonData);
  } catch (err) {
    console.error(`Failed to create project: ${err.message}`);
    process.exit(1);
  }
};
