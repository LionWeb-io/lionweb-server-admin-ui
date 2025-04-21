export async function getUserInfo(): Promise<{ name: string } | null> {
	try {
		const res = await fetch('/oauth2/userinfo', {
			credentials: 'include'
		});

		if (!res.ok) return null;

		const data = await res.json();
		return { name: data.name || data.preferred_username || data.email };
	} catch (e) {
		console.error('Failed to load user info:', e);
		return null;
	}
}
