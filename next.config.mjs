/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		unoptimized: true,
	},
	async redirects() {
		return [
			{
				source: "/affiliate",
				destination: "/wishlists",
				permanent: true,
			},
			{
				source: "/affiliate/:path*",
				destination: "/wishlists/:path*",
				permanent: true,
			},
		]
	},
}

export default nextConfig
