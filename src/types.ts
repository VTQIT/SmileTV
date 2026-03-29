export interface IPTVChannel {
  id: string;
  name: string;
  logo: string;
  category: string;
  url: string;
  number?: number;
}

export interface PlaylistData {
  name: string;
  channels: IPTVChannel[];
  categories: string[];
}

export const DEMO_CHANNELS: IPTVChannel[] = [
  {
    id: 'iptv-org-1',
    name: 'NASA TV',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/200px-NASA_logo.svg.png',
    category: 'Science',
    url: 'https://ntv-public-live.akamaized.net/hls/live/2023153/NASA-Public/master.m3u8',
    number: 1
  },
  {
    id: 'iptv-org-2',
    name: 'France 24 (English)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/France_24_logo.svg/200px-France_24_logo.svg.png',
    category: 'News',
    url: 'https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8',
    number: 2
  },
  {
    id: 'iptv-org-3',
    name: 'DW (English)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Deutsche_Welle_logo.svg/200px-Deutsche_Welle_logo.svg.png',
    category: 'News',
    url: 'https://dwstream72-lh.akamaihd.net/i/dwstream72_live@123556/master.m3u8',
    number: 3
  },
  {
    id: 'iptv-org-4',
    name: 'Al Jazeera (English)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Al_Jazeera_English_logo.svg/200px-Al_Jazeera_English_logo.svg.png',
    category: 'News',
    url: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8',
    number: 4
  },
  {
    id: 'iptv-org-5',
    name: 'Red Bull TV',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_TV_logo.svg/200px-Red_Bull_TV_logo.svg.png',
    category: 'Sports',
    url: 'https://rbmn-live.akamaized.net/hls/live/590964/boRBmn/master.m3u8',
    number: 5
  }
];
