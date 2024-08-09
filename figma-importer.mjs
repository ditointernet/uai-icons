import fs, { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { loadConfig, optimize } from 'svgo';
import * as cheerio from 'cheerio';
import cliProgress from 'cli-progress';
import color from 'ansi-colors';
import ora from 'ora';
import 'dotenv/config';

// Set __dirname to the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load SVG optimization configuration
const svgConfig = await loadConfig();

// Get environment variables
const { TOKEN, FILE } = process.env;

/**
 * Convert kebab-case to camelCase.
 * @param {string} s - The string to convert.
 * @returns {string} - The camelCase string.
 */
const camelize = (s) => s.replace(/-./g, (x) => x[1].toUpperCase());

const captalize = (s) => {
  const string = camelize(s);
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Fetch the Figma file from the API.
 * @param {string} key - The Figma file key.
 * @returns {Promise<object>} - The Figma file data as JSON.
 */
async function fetchFigmaFile(key) {
  const spinner = ora('Loading Figma file').start();
  try {
    const response = await fetch(`https://api.figma.com/v1/files/${key}`, {
      headers: { 'X-Figma-Token': TOKEN },
    });
    spinner.succeed('File loaded');
    return await response.json();
  } catch (e) {
    console.error(e);
    spinner.fail('Failed to load file');
    return {};
  }
}

/**
 * Flatten nested arrays.
 * @param {Array} acc - The accumulator array.
 * @param {Array} cur - The current array.
 * @returns {Array} - The flattened array.
 */
const flatten = (acc, cur) => [...acc, ...cur];

/**
 * Get components from Figma node.
 * @param {object} node - The Figma node.
 * @returns {Array} - Array of component nodes.
 */
const getComponentsFromNode = (node) => {
  if (node.type === 'COMPONENT') {
    return [node];
  }
  if ('children' in node) {
    return node.children.map(getComponentsFromNode).reduce(flatten, []);
  }
  return [];
};

/**
 * Format the component name.
 * @param {string} name - The component name.
 * @returns {string} - The formatted name.
 */
const formatName = (name) =>
  name
    .split('/')
    .pop()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\//g, '_')
    .trim();

/**
 * Get SVGs from components.
 * @param {string} key - The Figma file key.
 * @returns {function(Array): Promise<Array>} - Function that returns a Promise of SVG components.
 */
const getSVGsFromComponents = (key) => async (components) => {
  const progressBar = new cliProgress.SingleBar({
    format: `Downloading icons | ${color.cyan(`{bar}`)} | {percentage}% || {value}/{total}`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });

  const ids = components.map(({ id }) => id);
  progressBar.start(ids.length, 0);

  try {
    const response = await fetch(
      `https://api.figma.com/v1/images/${key}?ids=${ids.join()}&format=svg`,
      { headers: { 'X-Figma-Token': TOKEN } }
    );
    const { images } = await response.json();

    const result = await Promise.all(
      components.map(async ({ id, name }) => {
        const response = await fetch(images[id]);
        const svg = await response.text();
        progressBar.increment();
        return {
          name: `Icon${captalize(camelize(formatName(name)))}`,
          fileName: formatName(name),
          svg: formatIconsSVG(svg)
        };
      })
    );

    progressBar.stop();
    return result;
  } catch (e) {
    console.error(e);
    progressBar.stop();
    return [];
  }
};

/**
 * Optimize SVG data.
 * @param {string} svg - The raw SVG data.
 * @returns {string} - The optimized SVG data.
 */
const formatIconsSVG = (svg) => optimize(svg, svgConfig).data;

/**
 * Generate the icon component template.
 * @param {string} svgRaw - The raw SVG data.
 * @param {string} componentName - The component name.
 * @returns {string} - The icon component template as a string.
 */
const iconComponentTemplate = (svgRaw, componentName) => {
  const svg = cheerio.load(svgRaw, { xmlMode: true });
  svg('*').each((_, el) => {
    Object.keys(el.attribs).forEach((attrKey) => {
      if (attrKey.includes('-')) {
        svg(el)
          .attr(camelize(attrKey), el.attribs[attrKey])
          .removeAttr(attrKey);
      }
      if (attrKey === 'class') {
        svg(el).attr('className', el.attribs[attrKey]).removeAttr(attrKey);
      }
      if (attrKey === 'xmlns:xlink') {
        svg(el).removeAttr(attrKey);
      }
    });
  });

  const content = svg("svg")
    .attr("props", "...")
    .toString()
    .replace(
      /stroke=['"](#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([0-9, ]+\)|rgba\([0-9, ]+\)|hsl\([0-9, %, ]+\))['"]/g,
      "stroke='currentcolor'"
    )
    .replace(
      /fill=['"](#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([0-9, ]+\)|rgba\([0-9, ]+\)|hsl\([0-9, %, ]+\))['"]/g,
      "fill='currentcolor'"
    )
    .replace('props="..."', "{...props}");

  return `import React from 'react';
export const ${componentName} = (props: React.SVGProps<SVGSVGElement>) => (${content});
`;
};

/**
 * Organize the output directory by creating or cleaning the `src` folder.
 * @returns {Promise<void>} - Promise representing the completion of directory organization.
 */
async function organizeDirectory() {
  const spinner = ora('Organizing directory').start();
  try {
    const folderName = path.join(__dirname, 'src');
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
    } else {
      readdirSync(folderName).forEach((file) =>
        rmSync(`${folderName}/${file}`)
      );
    }
  } catch (err) {
    console.error(err);
  }
  spinner.stop();
}

/**
 * Generate the index.tsx file.
 * @param {Array} icons - Array of icon objects.
 * @returns {Promise<void>} - Promise representing the completion of index file generation.
 */
async function generateIndexFile(icons) {
  const spinner = ora('Generating index.tsx').start();
  const indexContent = Array.from(
    new Set(icons.map(({ fileName }) => fileName))
  )
    .map((fileName) => icons.find((icon) => icon.fileName === fileName))
    .map(({ name, filePath }) => `export {${name}} from '${filePath}';`)
    .join('\n');
  fs.writeFileSync(path.join(__dirname, 'src', 'index.ts'), indexContent, {
    flag: 'w+'
  });
  spinner.succeed('Index file generated successfully!');
}

/**
 * Main function to generate Figma icons.
 * @returns {Promise<void>} - Promise representing the completion of icon generation.
 */
export async function generateFigmaIcons() {
  if (!TOKEN) {
    console.error(
      'The Figma API token is not defined. You need to set an environment variable `FIGMA_API_TOKEN` to run the script'
    );
    return;
  }

  const data = await fetchFigmaFile(FILE);
  const spinner = ora('Parsing the file').start();
  const components = getComponentsFromNode(
    data?.document?.children
      .filter(({ name }) => name.includes('Icons'))
      ?.pop()
      .children?.pop()
  );
  spinner.stop();

  const icons = await getSVGsFromComponents(FILE)(components);
  await organizeDirectory();

  const progressBar = new cliProgress.SingleBar({
    format: `Generating icons | ${color.cyan(`{bar}`)} | {percentage}% || {value}/{total}`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });
  progressBar.start(icons.length, 0);

  const generatedIcons = icons.map((icon) => {
    try {
      const content = iconComponentTemplate(icon.svg, icon.name);
      let filePath = `src/${icon.fileName}.tsx`;
      fs.writeFileSync(path.join(__dirname, filePath), content, {
        flag: 'w+'
      });
      progressBar.increment();
      filePath = filePath.replace('src/', './').replace('.tsx', '');

      return {
        ...icon,
        filePath
      };
    } catch (err) {
      console.error(err);
      return '';
    }
  });

  progressBar.stop();
  await generateIndexFile(generatedIcons);
}

generateFigmaIcons();
