import Script from "next/script";
import { getProfileLabel, getSessionFromCookies, isPasswordConfigured } from "@/lib/auth";

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const session = await getSessionFromCookies();
  const params = searchParams ? await searchParams : {};
  const loginStatus = Array.isArray(params.login) ? params.login[0] : params.login;
  const buildLabel = getBuildLabel();

  if (!session) {
    return <LoginScreen loginStatus={loginStatus} buildLabel={buildLabel} />;
  }

  const selectedName = getProfileLabel(session.profileId);

  return (
    <>
      <main className="app-shell" data-selected-profile={session.profileId}>
        <header className="app-header">
          <div>
            <p className="eyebrow">RemiTrainer</p>
            <h1>Household workouts that remember</h1>
          </div>
          <div className="header-actions">
            <div className="account-strip">
              <span>
                Signed in as <strong id="active-profile-name">{selectedName}</strong>
              </span>
              <form action="/api/logout" method="post">
                <button className="ghost-action" type="submit">
                  Switch
                </button>
              </form>
            </div>
            <div className="status-strip" aria-live="polite">
              <span id="saved-sessions">0 saved sessions</span>
              <span id="saved-feedback">0 feedback logs</span>
              <span id="saved-bans">0 banned exercises</span>
              <span className="build-pill">{buildLabel}</span>
            </div>
          </div>
        </header>

        <nav className="app-tabs" aria-label="Main sections">
          <button className="tab-button active" type="button" data-app-tab="workout">
            Workout
          </button>
          <button className="tab-button" type="button" data-app-tab="profile">
            Profile
          </button>
          <button className="tab-button" type="button" data-app-tab="memory">
            Memory
          </button>
          <button className="tab-button" type="button" data-app-tab="data">
            Data
          </button>
        </nav>

        <section className="panel request-panel is-active-tab" data-section-panel="workout" aria-labelledby="request-title">
          <div className="section-title">
            <div>
              <p className="eyebrow">Request</p>
              <h2 id="request-title">Generate a workout</h2>
            </div>
            <button id="reset-demo" className="ghost-action" type="button">
              Reset demo data
            </button>
          </div>

          <form id="workout-form" className="request-form">
            <input id="active-profile" type="hidden" value={session.profileId} />
            <fieldset className="control-group">
              <legend>Workout size</legend>
              <div className="size-grid" role="radiogroup" aria-label="Workout size">
                <label className="size-option">
                  <input type="radio" name="exerciseCount" value="3" />
                  <span>Tiny</span>
                  <strong>3</strong>
                  <small>exercises</small>
                </label>
                <label className="size-option">
                  <input type="radio" name="exerciseCount" value="5" defaultChecked />
                  <span>Short</span>
                  <strong>5</strong>
                  <small>exercises</small>
                </label>
                <label className="size-option">
                  <input type="radio" name="exerciseCount" value="7" />
                  <span>Standard</span>
                  <strong>7</strong>
                  <small>exercises</small>
                </label>
                <label className="size-option">
                  <input type="radio" name="exerciseCount" value="10" />
                  <span>Long</span>
                  <strong>10</strong>
                  <small>exercises</small>
                </label>
              </div>

              <label className="inline-field">
                <span>Exact exercise count</span>
                <input id="custom-count" type="number" min="3" max="12" defaultValue="5" />
              </label>
            </fieldset>

            <div className="form-grid">
              <label className="field">
                <span>Intensity</span>
                <select id="intensity" name="intensity" defaultValue="normal">
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                  <option value="recovery">Recovery</option>
                  <option value="surprise">Surprise me</option>
                </select>
              </label>

              <label className="field">
                <span>Focus</span>
                <select id="focus" name="focus" defaultValue="full-body">
                  <option value="full-body">Full body</option>
                  <option value="upper-body">Upper body</option>
                  <option value="lower-body">Lower body</option>
                  <option value="push">Push</option>
                  <option value="pull">Pull</option>
                  <option value="core">Core</option>
                  <option value="mobility">Mobility/stretching</option>
                  <option value="pt-recovery">PT/recovery</option>
                  <option value="cardio">Cardio/conditioning</option>
                  <option value="ai-chooses">AI chooses</option>
                </select>
              </label>

              <label className="field">
                <span>Preferred style</span>
                <select id="style" name="style" defaultValue="balanced">
                  <option value="balanced">Balanced</option>
                  <option value="strength">Strength bias</option>
                  <option value="mobility">Mobility bias</option>
                  <option value="pt">PT/recovery bias</option>
                  <option value="cardio">Cardio bias</option>
                </select>
              </label>

              <div className="field join-field">
                <span>Shared workout</span>
                <label className="switch join-switch">
                  <input id="household-join" type="checkbox" />
                  <span className="switch-track" aria-hidden="true"></span>
                  <span>
                    <strong id="join-profile-name">Other person</strong> joins
                  </span>
                </label>
                <select id="participants" name="participants" defaultValue={session.profileId} hidden aria-hidden="true">
                  <option value="all">Everyone available</option>
                  <option value="jon">Jon only</option>
                  <option value="jeanne">Jeanne only</option>
                </select>
              </div>
            </div>

            <div className="toggle-row">
              <label className="switch">
                <input id="warmup" type="checkbox" defaultChecked />
                <span className="switch-track" aria-hidden="true"></span>
                <span>Warmup</span>
              </label>
              <label className="switch">
                <input id="cooldown" type="checkbox" defaultChecked />
                <span className="switch-track" aria-hidden="true"></span>
                <span>Cooldown</span>
              </label>
            </div>

            <button id="generate-button" className="primary-action" type="submit">
              Spin up fresh workout
            </button>
          </form>
        </section>

        <section className="panel household-panel is-active-tab" data-section-panel="profile" aria-labelledby="household-title">
          <div className="section-title">
            <div>
              <p className="eyebrow">Household</p>
              <h2 id="household-title">Profile and equipment</h2>
            </div>
          </div>
          <div id="profiles" className="profile-grid"></div>
          <div className="equipment-panel">
            <h3>Household equipment</h3>
            <div id="equipment-list" className="check-grid"></div>
          </div>
        </section>

        <section className="panel trainer-panel" data-section-panel="memory" aria-labelledby="trainer-title">
          <div className="section-title">
            <div>
              <p className="eyebrow">Trainer memory</p>
              <h2 id="trainer-title">Recent balance and risks</h2>
            </div>
          </div>
          <div id="history-insights" className="insight-grid"></div>
        </section>

        <section className="panel output-panel is-active-tab" data-section-panel="workout" aria-live="polite" aria-labelledby="workout-title">
          <div className="summary-bar">
            <div>
              <p className="eyebrow">Shared session</p>
              <h2 id="workout-title">Ready to generate</h2>
            </div>
            <div className="summary-stats">
              <span>
                <strong id="exercise-count">5</strong> exercises
              </span>
              <span>
                <strong id="estimate-main">0</strong> min
              </span>
              <span>
                <strong id="participant-count">1</strong> <span id="participant-label">person</span>
              </span>
            </div>
          </div>

          <div id="workout-output" className="workout-output">
            <p className="empty-state">
              Create a workout to see the movement plan and the selected person&apos;s adapted version.
            </p>
          </div>
        </section>

        <section className="panel data-panel" data-section-panel="data" aria-labelledby="data-title">
          <div className="section-title">
            <div>
              <p className="eyebrow">AI contract</p>
              <h2 id="data-title">Strict JSON and saved records</h2>
            </div>
          </div>
          <div className="data-tabs" role="tablist" aria-label="Data views">
            <button className="tab-button active" type="button" data-data-tab="context">
              Compact context
            </button>
            <button className="tab-button" type="button" data-data-tab="response">
              AI JSON
            </button>
            <button className="tab-button" type="button" data-data-tab="schema">
              Data model
            </button>
          </div>
          <pre id="data-view" className="json-view"></pre>
        </section>
      </main>

      <dialog id="instruction-dialog" className="instruction-dialog">
        <button id="close-dialog" className="dialog-close" type="button" aria-label="Close exercise details">
          Close
        </button>
        <div id="instruction-detail"></div>
      </dialog>

      <dialog id="profile-guide-dialog" className="profile-guide-dialog">
        <div id="profile-guide-content"></div>
      </dialog>

      <Script src="/remitrainer-app.js" strategy="afterInteractive" />
    </>
  );
}

function LoginScreen({ loginStatus, buildLabel }: { loginStatus?: string; buildLabel: string }) {
  const passwordConfigured = isPasswordConfigured();
  const errorMessage =
    loginStatus === "failed"
      ? "That password did not match. Try again."
      : loginStatus === "not_configured"
        ? "Set REMITRAINER_PASSWORD in Vercel before opening the app."
        : "";

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <p className="eyebrow">RemiTrainer</p>
        <h1 id="login-title">Choose who is training</h1>
        <p className="login-copy">
          One shared household password keeps the workout generator private for Jon and Jeanne.
        </p>
        {!passwordConfigured ? (
          <p className="login-error">Add `REMITRAINER_PASSWORD` in Vercel, then redeploy.</p>
        ) : null}
        {errorMessage ? <p className="login-error">{errorMessage}</p> : null}
        <form className="login-form" action="/api/login" method="post">
          <label className="field">
            <span>User</span>
            <select name="profile_id" defaultValue="jeanne">
              <option value="jeanne">Jeanne</option>
              <option value="jon">Jon</option>
            </select>
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="primary-action" type="submit" disabled={!passwordConfigured}>
            Open RemiTrainer
          </button>
        </form>
        <p className="build-note">{buildLabel}</p>
      </section>
    </main>
  );
}

function getBuildLabel() {
  const shortSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  return shortSha ? `Build ${shortSha}` : "Build local";
}
