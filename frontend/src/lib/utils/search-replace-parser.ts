/**
 * Parser for SEARCH/REPLACE diff format
 * Used for incremental code modifications
 */

export interface SearchReplaceBlock {
  file: string;
  search: string;
  replace: string;
}

export interface ParsedEdit {
  file: string;
  blocks: SearchReplaceBlock[];
}

/**
 * Parse SEARCH/REPLACE blocks from AI response
 *
 * Format:
 * FILE: path/to/file.html
 * <<<<<<< SEARCH
 * [code to find]
 * =======
 * [code to replace with]
 * >>>>>>> REPLACE
 */
export function parseSearchReplace(content: string): ParsedEdit[] {
  const edits: ParsedEdit[] = [];

  // Split by FILE: declarations
  const fileRegex = /FILE:\s*([^\n]+)/g;
  const fileSections: Array<{ file: string; content: string }> = [];

  let lastIndex = 0;
  let match;

  while ((match = fileRegex.exec(content)) !== null) {
    if (lastIndex > 0) {
      // Save previous section
      const prevMatch = content.lastIndexOf("FILE:", match.index - 1);
      if (prevMatch >= 0) {
        const prevFile = content
          .substring(prevMatch + 5, content.indexOf("\n", prevMatch))
          .trim();
        const prevContent = content.substring(
          content.indexOf("\n", prevMatch) + 1,
          match.index
        );
        fileSections.push({ file: prevFile, content: prevContent });
      }
    }
    lastIndex = match.index;
  }

  // Add last section
  if (lastIndex > 0) {
    const lastFile = content
      .substring(lastIndex + 5, content.indexOf("\n", lastIndex))
      .trim();
    const lastContent = content.substring(content.indexOf("\n", lastIndex) + 1);
    fileSections.push({ file: lastFile, content: lastContent });
  }

  // Parse SEARCH/REPLACE blocks for each file
  for (const section of fileSections) {
    const blocks: SearchReplaceBlock[] = [];

    const searchReplaceRegex =
      /<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g;

    let blockMatch;
    while ((blockMatch = searchReplaceRegex.exec(section.content)) !== null) {
      blocks.push({
        file: section.file,
        search: blockMatch[1],
        replace: blockMatch[2],
      });
    }

    if (blocks.length > 0) {
      edits.push({
        file: section.file,
        blocks,
      });
    }
  }

  return edits;
}

/**
 * Normalize text for comparison (remove extra whitespace, trim)
 */
function normalizeForComparison(text: string): string {
  return text
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/>\s+</g, "><") // Remove spaces between tags
    .trim();
}

/**
 * Find the best match for search text in content using fuzzy matching
 */
function findBestMatch(
  content: string,
  searchText: string
): { start: number; end: number } | null {
  // Try exact match first
  const exactIndex = content.indexOf(searchText);
  if (exactIndex !== -1) {
    return { start: exactIndex, end: exactIndex + searchText.length };
  }

  // Try normalized match
  const normalizedSearch = normalizeForComparison(searchText);
  const lines = content.split("\n");

  // Try to find a sequence of lines that matches
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j <= lines.length; j++) {
      const candidate = lines.slice(i, j).join("\n");
      const normalizedCandidate = normalizeForComparison(candidate);

      if (normalizedCandidate === normalizedSearch) {
        // Found a match! Calculate character positions
        const before = lines.slice(0, i).join("\n");
        const start = before.length + (i > 0 ? 1 : 0); // +1 for newline
        const end = start + candidate.length;
        return { start, end };
      }
    }
  }

  return null;
}

/**
 * Apply SEARCH/REPLACE blocks to existing file content
 * Returns updated content or null if search block not found
 */
export function applySearchReplace(
  existingContent: string,
  blocks: SearchReplaceBlock[]
): { success: boolean; content: string; errors: string[] } {
  let updated = existingContent;
  const errors: string[] = [];

  for (const block of blocks) {
    const match = findBestMatch(updated, block.search);

    if (match) {
      // Replace the matched section
      updated =
        updated.substring(0, match.start) +
        block.replace +
        updated.substring(match.end);
      console.log(`✓ Applied SEARCH/REPLACE in ${block.file}`);
    } else {
      // Try to provide helpful error message
      const searchPreview = block.search
        .substring(0, 100)
        .replace(/\n/g, "\\n");
      errors.push(
        `Search block not found in ${block.file}:\n${searchPreview}...`
      );
      console.warn(
        `✗ Failed to find search block in ${block.file}:`,
        searchPreview
      );
    }
  }

  return {
    success: errors.length === 0,
    content: updated,
    errors,
  };
}

/**
 * Check if content contains SEARCH/REPLACE blocks
 */
export function hasSearchReplaceBlocks(content: string): boolean {
  return (
    content.includes("<<<<<<< SEARCH") &&
    content.includes("=======") &&
    content.includes(">>>>>>> REPLACE")
  );
}

/**
 * Detect if this is a modification request vs initial generation
 */
export function isModificationRequest(
  message: string,
  hasExistingFiles: boolean
): boolean {
  if (!hasExistingFiles) return false;

  const modificationKeywords = [
    "change",
    "update",
    "modify",
    "edit",
    "fix",
    "adjust",
    "improve",
    "refactor",
    "add",
    "remove",
    "delete",
    "replace",
    "make it",
    "can you",
    "instead",
    "different",
    "better",
    "more",
    "less",
    "switch",
    "convert",
  ];

  const lowerMessage = message.toLowerCase();
  return modificationKeywords.some((keyword) => lowerMessage.includes(keyword));
}
