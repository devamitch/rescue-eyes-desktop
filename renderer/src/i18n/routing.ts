import { defineRouting } from 'next-intl/routing';

const encodePath = (path: string) => {
	return encodeURIComponent(path).replace(/%/g, '').toLowerCase();
};
export const routing = defineRouting({
	locales: ['en', 'ja', 'ko'],
	defaultLocale: 'en',
	localePrefix: 'as-needed',
	// pathnames: {
	// 	'/': '/',
	// 	'/dashboard': {
	// 		en: '/dashboard',
	// 		ja: `/${encodePath('ダッシュボード')}`,
	// 		ko: `/${encodePath('대시보드')}`,
	// 	},
	// 	'/live': {
	// 		en: '/live',
	// 		ja: `/${encodePath('ライブ')}`,
	// 		ko: `/${encodePath('실시간')}`,
	// 	},
	// 	'/icare': {
	// 		en: '/icare',
	// 		ja: `/${encodePath('アイケア')}`,
	// 		ko: `/${encodePath('아이케어')}`,
	// 	},
	// 	'/history': {
	// 		en: '/history',
	// 		ja: `/${encodePath('履歴')}`,
	// 		ko: `/${encodePath('기록')}`,
	// 	},
	// 	'/settings': {
	// 		en: '/settings',
	// 		ja: `/${encodePath('設定')}`,
	// 		ko: `/${encodePath('설정')}`,
	// 	},
	// 	'/profile': {
	// 		en: '/profile',
	// 		ja: `/${encodePath('プロフィール')}`,
	// 		ko: `/${encodePath('프로필')}`,
	// 	},
	// 	'/signin': {
	// 		en: '/signin',
	// 		ja: `/${encodePath('サインイン')}`,
	// 		ko: `/${encodePath('로그인')}`,
	// 	},
	// 	'/register': {
	// 		en: '/register',
	// 		ja: `/${encodePath('登録')}`,
	// 		ko: `/${encodePath('가입')}`,
	// 	},
	// },
});
