export default function handler(req, res) {
  res.status(200).json({
    posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
    posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  });
}
