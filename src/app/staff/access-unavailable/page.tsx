export default function AccessUnavailable() {
  return <main className="desk-auth"><a className="desk-wordmark" href="/">Zadok <span>Farm</span></a><div className="desk-auth-body"><p className="desk-eyebrow">ZADOK DESK</p><h1>Access unavailable</h1><p className="desk-lead">We cannot open this workspace. Contact the farm owner if you need help.</p><form method="post" action="/staff/sign-out"><button className="desk-primary">Sign out</button></form></div></main>;
}
