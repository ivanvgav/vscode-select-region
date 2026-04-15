import * as vscode from "vscode";

let mark: vscode.Position | null = null;
let isSelecting = false;
let statusBarItem: vscode.StatusBarItem;
let decorationType: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
  // Define the decoration type with transparent highlight and solid underline
  decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgba(200, 200, 255, 0.2)", // Transparent blue highlight
    textDecoration: "underline solid #007acc", // Solid underline
    isWholeLine: false,
  });

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  context.subscriptions.push(statusBarItem);

  const toggleMarkCommand = vscode.commands.registerCommand(
    "select-region.toggleMark",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      if (isSelecting) {
        if (mark) {
          const currentPos = editor.selection.active;
          
          // Create mirrored "L" shape selection (upper-left to current position)
          const selection = createMirroredLSelection(mark, currentPos);
          editor.selection = selection;
          
          // Apply underline decoration
          applyUnderlineDecoration(editor, selection);
        }
        isSelecting = false;
        statusBarItem.hide();
      } else {
        mark = editor.selection.active;
        isSelecting = true;
        
        // Display initial mirrored "L" shape from upper-left
        displayInitialLShape(mark);
        
        statusBarItem.text = "Start mark set (upper-left L-shape)";
        statusBarItem.show();
      }
    }
  );
  context.subscriptions.push(toggleMarkCommand);

  // Clean up on deactivate
  context.subscriptions.push(decorationType);
}

/**
 * Creates a mirrored "L" shape selection starting from upper-left corner
 * The selection spans from the mark position horizontally, then vertically to current position
 */
function createMirroredLSelection(
  markPos: vscode.Position,
  currentPos: vscode.Position
): vscode.Selection {
  // Mirrored L: horizontal line from mark, then vertical line down to current position
  const startLine = Math.min(markPos.line, currentPos.line);
  const endLine = Math.max(markPos.line, currentPos.line);
  const startChar = Math.min(markPos.character, currentPos.character);
  const endChar = Math.max(markPos.character, currentPos.character);

  // Create selection that covers the L-shape region
  const upperLeftCorner = new vscode.Position(startLine, startChar);
  const lowerRightCorner = new vscode.Position(endLine, endChar);

  return new vscode.Selection(upperLeftCorner, lowerRightCorner);
}

/**
 * Displays the initial L-shape preview from the upper-left corner
 */
function displayInitialLShape(mark: vscode.Position): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  // Create a preview decoration for the initial L-shape
  const line = editor.document.lineAt(mark.line);
  const range = new vscode.Range(
    new vscode.Position(mark.line, mark.character),
    new vscode.Position(mark.line, Math.min(mark.character + 20, line.text.length))
  );

  editor.setDecorations(decorationType, [range]);
}

/**
 * Applies the underline decoration to the selected region
 */
function applyUnderlineDecoration(
  editor: vscode.TextEditor,
  selection: vscode.Selection
): void {
  const decorationRanges: vscode.Range[] = [];

  // Create horizontal line from mark start to end character
  const startLine = selection.start.line;
  const endLine = selection.end.line;
  const startChar = selection.start.character;
  const endChar = selection.end.character;

  // Horizontal segment (L top)
  decorationRanges.push(
    new vscode.Range(
      new vscode.Position(startLine, startChar),
      new vscode.Position(startLine, endChar)
    )
  );

  // Vertical segment (L down)
  for (let line = startLine; line <= endLine; line++) {
    const lineText = editor.document.lineAt(line).text;
    const char = line === endLine ? endChar : Math.min(startChar, lineText.length);
    decorationRanges.push(
      new vscode.Range(
        new vscode.Position(line, startChar),
        new vscode.Position(line, char)
      )
    );
  }

  editor.setDecorations(decorationType, decorationRanges);
}

export function deactivate() {
  mark = null;
  decorationType.dispose();
}