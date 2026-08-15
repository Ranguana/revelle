import Link from "next/link";

/**
 * The holding hero.
 *
 * The full landing page lives in docs/index.html and is the approved art
 * direction; this is the app's own front door and deliberately says one thing
 * and points at the quiz. Porting the rest of the landing into React is a
 * separate job — until then there is exactly one route worth being here for.
 */
export default function Home() {
  return (
    <header className="hero">
      <div className="hero__inner">
        <div className="hero__copy">
          <p className="eyebrow">Est. for people who host</p>
          <p className="wordmark">Revelle Société</p>

          <h1>
            You bring the occasion. We create the <em>experience</em>.
          </h1>

          <p className="hero__lede">
            A creative director for your social life. You tell us what you are
            planning and how your people actually have fun. We come back with a
            world — <strong>and everything you need to pull it off yourself</strong>.
          </p>

          <Link className="cta" href="/quiz">
            Take the quiz <span>2 minutes</span>
          </Link>
        </div>

        <svg
          className="arc arc--hero"
          viewBox="0 0 600 600"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M520 10 A290 290 0 0 0 520 590 L520 530 A230 230 0 0 1 520 70 Z"
            fill="var(--bone)"
          />
          <rect x="0" y="299" width="600" height="2" fill="var(--night-aqua)" />
        </svg>
      </div>
    </header>
  );
}
