import { safeReturnPath } from "@/lib/staff/security";
export default async function SignIn({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const notice = params.notice;
  return <main className="desk-auth">
    <a className="desk-wordmark" href="/">Zadok <span>Farm</span></a>
    <div className="desk-auth-body"><p className="desk-eyebrow">ZADOK DESK</p><h1>A little closer<br />to the day&apos;s work.</h1>
    <p className="desk-lead">Sign in to review submitted requests.</p>
    {notice === "sent" ? <div className="desk-notice" role="status"><h2>Check your email</h2><p>If this address can sign in, a link will arrive shortly. Open it in this browser. If it does not arrive, wait a moment or contact the farm owner.</p><a href="/staff/sign-in">Try again</a></div> : <>
      {notice === "unavailable" && <p className="desk-notice" role="alert">Access unavailable. Request a new link or contact the farm owner.</p>}
      {notice === "signed-out" && <p className="desk-notice" role="status">You are signed out of this browser.</p>}
      <form action="/staff/sign-in/request" method="post" className="desk-sign-in">
        <input type="hidden" name="next" value={safeReturnPath(params.next)} />
        <label htmlFor="staff-email">Work email</label>
        <input id="staff-email" name="email" type="email" autoComplete="email" required maxLength={254} />
        <button className="desk-primary" type="submit">Email me a sign-in link <span aria-hidden="true">↗</span></button>
      </form>
    </>}
    <p className="desk-muted desk-auth-note">For invited Zadok staff. There is no public registration.</p></div>
    <p className="desk-auth-footer">Good work starts with care.</p>
  </main>;
}
