const KEY='menudeo_admin_session_v1';
export function getAdminToken():string {
 if(typeof window==='undefined')return '';
 try {const raw=localStorage.getItem(KEY);if(!raw)return '';const session=JSON.parse(raw) as {token?:string};if(typeof session.token==='string'&&session.token)return session.token;}catch{}
 localStorage.removeItem(KEY);return '';
}
export function saveAdminToken(token:string):void {
 if(typeof window==='undefined')return;
 localStorage.setItem(KEY,JSON.stringify({token}));
}
export function clearAdminToken():void {
 if(typeof window==='undefined')return;
 localStorage.removeItem(KEY);
 sessionStorage.removeItem('menudeo_admin_token');
}
