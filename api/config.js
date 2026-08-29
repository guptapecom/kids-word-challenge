export default function handler(req, res) {
  res.status(200).json({
    posthogKey: process.env.POSTHOG_KEY || '',
    posthogHost: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
  });
}
