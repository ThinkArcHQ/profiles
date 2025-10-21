import { tool } from "ai";
import { z } from "zod";

/**
 * Tool for creating or updating a file
 */
export const createFileTool = tool({
  description:
    "Create or update a file with the given content. Use this for HTML, CSS, JavaScript, or any other file type.",
  inputSchema: z.object({
    filePath: z
      .string()
      .describe(
        'The path of the file (e.g., "index.html", "styles.css", "script.js")'
      ),
    content: z.string().describe("The complete content of the file"),
    explanation: z
      .string()
      .describe("Brief explanation of what this file does"),
  }),
  execute: async ({ filePath, content, explanation }) => {
    // This is executed on the server and returns data to the AI
    console.log(`Creating file: ${filePath}`);
    return {
      success: true,
      filePath,
      contentLength: content.length,
      explanation,
    };
  },
});

/**
 * Tool for modifying an existing file using search/replace
 */
export const modifyFileTool = tool({
  description:
    "Modify an existing file by searching for specific content and replacing it. Use this for targeted updates.",
  inputSchema: z.object({
    filePath: z.string().describe("The path of the file to modify"),
    searchContent: z
      .string()
      .describe(
        "The exact content to search for (must match exactly including whitespace)"
      ),
    replaceContent: z.string().describe("The new content to replace with"),
    explanation: z.string().describe("Brief explanation of what changed"),
  }),
  execute: async ({ filePath, searchContent, replaceContent, explanation }) => {
    console.log(`Modifying file: ${filePath}`);
    return {
      success: true,
      filePath,
      searchLength: searchContent.length,
      replaceLength: replaceContent.length,
      explanation,
    };
  },
});

/**
 * All available tools for code generation
 */
export const codeGenerationTools = {
  createFile: createFileTool,
  modifyFile: modifyFileTool,
};
