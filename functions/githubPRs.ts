import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');

    const body = await req.json().catch(() => ({}));
    const { owner, repo, state = 'all' } = body;

    if (!owner || !repo) {
      return Response.json({ error: 'owner and repo are required' }, { status: 400 });
    }

    // Fetch PRs from GitHub API
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=50&sort=updated&direction=desc`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'AtlasCore-App',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('GitHub API error:', err);
      return Response.json({ error: `GitHub API error: ${res.status}` }, { status: res.status });
    }

    const prs = await res.json();

    // Also fetch repos list if no repo specified
    const mapped = prs.map((pr) => ({
      id: pr.number,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      draft: pr.draft,
      url: pr.html_url,
      author: pr.user?.login,
      author_avatar: pr.user?.avatar_url,
      branch: pr.head?.ref,
      base_branch: pr.base?.ref,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      merged_at: pr.merged_at,
      labels: pr.labels?.map((l) => ({ name: l.name, color: l.color })) || [],
      reviewers: pr.requested_reviewers?.map((r) => r.login) || [],
      body: pr.body?.slice(0, 300) || '',
    }));

    return Response.json({ prs: mapped, total: mapped.length });
  } catch (error) {
    console.error('githubPRs error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});