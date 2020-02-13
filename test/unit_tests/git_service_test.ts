import * as assert from 'assert';
import * as vscode from 'vscode';
import { parseGitRemote } from '../../src/services/git_service';

suite('git_service tests', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('parseGitRemote', () => {
    assert.deepEqual(parseGitRemote('git@gitlab.com:fatihacet/gitlab-vscode-extension.git'), [
      'ssh:',
      'gitlab.com',
      'fatihacet',
      'gitlab-vscode-extension',
    ]);
    assert.deepEqual(
      parseGitRemote('gitlab-ci@gitlab-mydomain.com:fatihacet/gitlab-vscode-extension.git'),
      ['ssh:', 'gitlab-mydomain.com', 'fatihacet', 'gitlab-vscode-extension'],
    );
    assert.deepEqual(parseGitRemote('ssh://git@gitlab.com:fatihacet/gitlab-vscode-extension.git'), [
      'ssh:',
      'gitlab.com',
      'fatihacet',
      'gitlab-vscode-extension',
    ]);
    assert.deepEqual(parseGitRemote('git://git@gitlab.com:fatihacet/gitlab-vscode-extension.git'), [
      'git:',
      'gitlab.com',
      'fatihacet',
      'gitlab-vscode-extension',
    ]);
    assert.deepEqual(
      parseGitRemote('http://git@gitlab.com/fatihacet/gitlab-vscode-extension.git'),
      ['http:', 'gitlab.com', 'fatihacet', 'gitlab-vscode-extension'],
    );
    assert.deepEqual(parseGitRemote('http://gitlab.com/fatihacet/gitlab-vscode-extension.git'), [
      'http:',
      'gitlab.com',
      'fatihacet',
      'gitlab-vscode-extension',
    ]);
    assert.deepEqual(
      parseGitRemote('https://git@gitlab.com/fatihacet/gitlab-vscode-extension.git'),
      ['https:', 'gitlab.com', 'fatihacet', 'gitlab-vscode-extension'],
    );
    assert.deepEqual(parseGitRemote('https://gitlab.com/fatihacet/gitlab-vscode-extension.git'), [
      'https:',
      'gitlab.com',
      'fatihacet',
      'gitlab-vscode-extension',
    ]);
    assert.deepEqual(parseGitRemote('https://gitlab.com/fatihacet/gitlab-vscode-extension'), [
      'https:',
      'gitlab.com',
      'fatihacet',
      'gitlab-vscode-extension',
    ]);
    assert.deepEqual(
      parseGitRemote('https://gitlab.company.com/fatihacet/gitlab-vscode-extension.git'),
      ['https:', 'gitlab.company.com', 'fatihacet', 'gitlab-vscode-extension'],
    );
    assert.deepEqual(
      parseGitRemote('https://gitlab.company.com:8443/fatihacet/gitlab-vscode-extension.git'),
      ['https:', 'gitlab.company.com:8443', 'fatihacet', 'gitlab-vscode-extension'],
    );
  });
});