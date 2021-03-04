import * as vscode from 'vscode';
import * as assert from 'assert';
import {
  GitLabNewService,
  GqlTextDiffDiscussion,
  GqlTextPosition,
} from '../gitlab/gitlab_new_service';
import { GitLabComment } from './gitlab_comment';
import { toReviewUri } from './review_uri';

const commentRangeFromPosition = (position: GqlTextPosition): vscode.Range => {
  const glLine = position.oldLine ?? position.newLine;
  const vsPosition = new vscode.Position(glLine - 1, 0); // VS Code numbers lines starting with 0, GitLab starts with 1
  return new vscode.Range(vsPosition, vsPosition);
};

const uriFromPosition = (
  position: GqlTextPosition,
  workspaceFolder: string,
  gitlabProjectId: number,
) => {
  const onOldVersion = position.oldLine === null;
  const path = onOldVersion ? position.oldPath : position.newPath;
  const commit = onOldVersion ? position.diffRefs.baseSha : position.diffRefs.headSha;
  return toReviewUri({
    path,
    commit,
    workspacePath: workspaceFolder,
    projectId: gitlabProjectId,
  });
};

interface CreateThreadOptions {
  commentController: vscode.CommentController;
  workspaceFolder: string;
  gitlabProjectId: number;
  discussion: GqlTextDiffDiscussion;
  gitlabService: GitLabNewService;
}

export class GitLabCommentThread {
  private resolved: boolean;

  private constructor(
    private vsThread: vscode.CommentThread,
    private gqlDiscussion: GqlTextDiffDiscussion,
    private gitlabService: GitLabNewService,
  ) {
    this.vsThread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
    this.vsThread.canReply = false;
    this.resolved = gqlDiscussion.resolved;
    this.updateThreadContext();
  }

  async toggleResolved(): Promise<void> {
    await this.gitlabService.setResolved(this.gqlDiscussion.replyId, !this.resolved);
    this.resolved = !this.resolved;
    this.updateThreadContext();
  }

  private allowedToResolve(): boolean {
    const [firstNote] = this.gqlDiscussion.notes.nodes;
    assert(firstNote);
    return firstNote.userPermissions.resolveNote;
  }

  private updateThreadContext() {
    // when user doesn't have permission to resolve the discussion we don't show the
    // resolve/unresolve buttons at all (`context` stays `undefined`) because otherwise
    // user would be presented with buttons that don't do anything when clicked
    if (this.gqlDiscussion.resolvable && this.allowedToResolve()) {
      this.vsThread.contextValue = this.resolved ? 'resolved' : 'unresolved';
    }
  }

  dispose(): void {
    this.vsThread.dispose();
  }

  static createThread({
    commentController,
    workspaceFolder,
    gitlabProjectId,
    discussion,
    gitlabService,
  }: CreateThreadOptions): GitLabCommentThread {
    const { position } = discussion.notes.nodes[0];
    const vsThread = commentController.createCommentThread(
      uriFromPosition(position, workspaceFolder, gitlabProjectId),
      commentRangeFromPosition(position),
      // the comments need to know about the thread, so we first
      // create empty thread to be able to create comments
      [],
    );
    const glThread = new GitLabCommentThread(vsThread, discussion, gitlabService);
    vsThread.comments = discussion.notes.nodes.map(note =>
      GitLabComment.fromGqlNote(note, glThread),
    );
    return glThread;
  }
}
