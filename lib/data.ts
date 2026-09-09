export interface Channel {
	name: string
	subscribers: string
	url: string
	category: string
}

export interface ChannelCategory {
	id: string
	nameRu: string
	nameEn: string
	channels: Channel[]
}

// Easy to add/remove channels and update links
export const channelCategories: ChannelCategory[] = [
	{
		id: "gaming",
		nameRu: "Игры",
		nameEn: "Gaming",
		channels: [
			{ name: "GameZone", subscribers: "2.1M", url: "https://t.me/gamezone", category: "gaming" },
			{
				name: "PC Gaming RU",
				subscribers: "1.8M",
				url: "https://t.me/pcgamingru",
				category: "gaming",
			},
			{
				name: "Mobile Games",
				subscribers: "1.5M",
				url: "https://t.me/mobilegames",
				category: "gaming",
			},
			{ name: "Game News", subscribers: "1.2M", url: "https://t.me/gamenews", category: "gaming" },
			{
				name: "Indie Games",
				subscribers: "890K",
				url: "https://t.me/indiegames",
				category: "gaming",
			},
			{
				name: "Game Reviews",
				subscribers: "760K",
				url: "https://t.me/gamereviews",
				category: "gaming",
			},
		],
	},
	{
		id: "esports",
		nameRu: "Киберспорт",
		nameEn: "Esports",
		channels: [
			{ name: "CS2 News", subscribers: "3.2M", url: "https://t.me/cs2news", category: "esports" },
			{
				name: "Dota 2 Hub",
				subscribers: "2.8M",
				url: "https://t.me/dota2hub",
				category: "esports",
			},
			{
				name: "Valorant CIS",
				subscribers: "1.9M",
				url: "https://t.me/valorantcis",
				category: "esports",
			},
			{
				name: "LoL Russia",
				subscribers: "1.4M",
				url: "https://t.me/lolrussia",
				category: "esports",
			},
			{
				name: "Esports Daily",
				subscribers: "2.1M",
				url: "https://t.me/esportsdaily",
				category: "esports",
			},
		],
	},
	{
		id: "media",
		nameRu: "Медиа и развлечения",
		nameEn: "Media & Entertainment",
		channels: [
			{
				name: "Tech & Gadgets",
				subscribers: "1.7M",
				url: "https://t.me/techandgadgets",
				category: "media",
			},
			{
				name: "Meme Factory",
				subscribers: "4.5M",
				url: "https://t.me/memefactory",
				category: "media",
			},
			{
				name: "Stream Highlights",
				subscribers: "2.3M",
				url: "https://t.me/streamhighlights",
				category: "media",
			},
			{
				name: "Anime & Games",
				subscribers: "1.1M",
				url: "https://t.me/animeandgames",
				category: "media",
			},
		],
	},
	{
		id: "betting",
		nameRu: "Ставки и аналитика",
		nameEn: "Betting & Analytics",
		channels: [
			{
				name: "Esports Bets",
				subscribers: "980K",
				url: "https://t.me/esportsbets",
				category: "betting",
			},
			{
				name: "Match Analytics",
				subscribers: "750K",
				url: "https://t.me/matchanalytics",
				category: "betting",
			},
			{
				name: "Predict Pro",
				subscribers: "620K",
				url: "https://t.me/predictpro",
				category: "betting",
			},
		],
	},
]

export const partnerLogos = [
	{ name: "Valve", nameShort: "VLV" },
	{ name: "Riot Games", nameShort: "RIOT" },
	{ name: "Epic Games", nameShort: "EPIC" },
	{ name: "HyperX", nameShort: "HPX" },
	{ name: "Red Bull", nameShort: "RB" },
	{ name: "Logitech", nameShort: "LOGI" },
	{ name: "Intel", nameShort: "INTL" },
	{ name: "MSI", nameShort: "MSI" },
	{ name: "SteelSeries", nameShort: "SS" },
	{ name: "Razer", nameShort: "RAZR" },
	{ name: "ASUS ROG", nameShort: "ROG" },
	{ name: "Monster Energy", nameShort: "MNSTR" },
]
