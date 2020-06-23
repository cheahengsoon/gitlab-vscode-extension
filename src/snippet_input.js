const vscode = require('vscode');
const openers = require('./openers');
const gitLabService = require('./gitlab_service');
const gitlabProjectInput = require('./gitlab_project_input');

const visibilityOptions = [
  {
    label: 'Public',
    type: 'public',
  },
  {
    label: 'Internal',
    type: 'internal',
  },
  {
    label: 'Private',
    type: 'private',
  },
];

const contextOptions = [
  {
    label: 'Snippet from file',
    type: 'file',
  },
  {
    label: 'Snippet from selection',
    type: 'selection',
  },
];

async function createSnippet(project, editor, visibility, context) {
  let content = '';
  const fileName = editor.document.fileName.split('/').reverse()[0];

  if (context === 'selection' && editor.selection) {
    const { start, end } = editor.selection;
    const endLine = end.line + 1;
    const startPos = new vscode.Position(start.line, 0);
    const endPos = new vscode.Position(endLine, 0);
    const range = new vscode.Range(startPos, endPos);
    content = editor.document.getText(range);
  } else {
    content = editor.document.getText();
  }

  let data = {
    title: fileName,
    file_name: fileName,
    visibility,
  };

  data.content = content;

  if (project) {
    data.id = project.id;
  }

  const snippet = await gitLabService.createSnippet(data);

  openers.openUrl(snippet.web_url);
}

async function showPicker() {
  const editor = vscode.window.activeTextEditor;
  let workspaceFolder = null;
  let project = null;

  if (editor) {
    workspaceFolder = await gitLabService.getCurrenWorkspaceFolder();
    project = await gitLabService.fetchCurrentProject(workspaceFolder);

    if (project == null) {
      workspaceFolder = await gitlabProjectInput.show(
        [
          {
            label: "User's Snippets",
            uri: '',
          },
        ],
        "Select a Gitlab Project or use the User's Snippets",
      );
      project = await gitLabService.fetchCurrentProject(workspaceFolder);
    }

    const visibility = await vscode.window.showQuickPick(visibilityOptions);

    if (visibility) {
      const context = await vscode.window.showQuickPick(contextOptions);

      if (context) {
        createSnippet(project, editor, visibility.type, context.type);
      }
    }
  } else {
    vscode.window.showInformationMessage('GitLab Workflow: No open file.');
  }
}

exports.show = showPicker;
