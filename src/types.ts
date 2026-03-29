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
    name: 'Sky News (UK)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Sky_News_logo_2023.svg/200px-Sky_News_logo_2023.svg.png',
    category: 'News',
    url: 'https://skynews-skynews-main-ssai-gb.samsung.wurl.com/manifest/playlist.m3u8',
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
    name: 'ABC News (USA)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/ABC_News_logo_2021.svg/200px-ABC_News_logo_2021.svg.png',
    category: 'News',
    url: 'https://content.uplynk.com/channel/332e8dfefedc4ef08851f5c56f0235c0.m3u8',
    number: 5
  },
  {
    id: 'iptv-org-6',
    name: 'Bloomberg TV',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Bloomberg_logo.svg/200px-Bloomberg_logo.svg.png',
    category: 'News',
    url: 'https://live-bloomberg-us-east.amagi.tv/index.m3u8',
    number: 6
  },
  {
    id: 'iptv-org-7',
    name: 'NHK World (Japan)',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/NHK_World_logo.svg/200px-NHK_World_logo.svg.png',
    category: 'News',
    url: 'https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/master.m3u8',
    number: 7
  }
];
