import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('github');

    // Fetch user's repos
    const res = await fetch('https://api.github.com/user/repos?per_page=50&sort=updated&affiliation=owner,collaborator', {
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

    const repos = await res.json();
    const mapped = repos.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      owner: r.owner?.login,
      name: r.name,
      description: r.description,
      private: r.private,
      url: r.html_url,
      default_branch: r.default_branch,
      open_issues: r.open_issues_count,
      updated_at: r.updated_at,
    }));

    return Response.json({ repos: mapped });
  } catch (error) {
    console.error('githubRepos error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});