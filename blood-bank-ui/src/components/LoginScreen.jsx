import WaveCanvas from './WaveCanvas';

// The logged-out view: the animated background plus the sign-in card.
// All the auth state lives in App; this component just renders it and reports events back
// up through the setter/handler props.
function LoginScreen({
  theme,
  username, setUsername,
  password, setPassword,
  loginError,
  handleLogin,
  quotes, currentQuoteIndex,
  isHovered, setIsHovered
}) {
  return (
    <div className={`theme-wrapper ${theme}`}>
      <div className="login-wrapper">
        <WaveCanvas isHovered={isHovered} />

        <div
          className="login-glow-box"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="login-card">
            <h2>BLOOD BANK PORTAL</h2>
            <p className="login-subtitle">AUTHORIZED PERSONNEL ONLY</p>

            <div className="login-quote-box animate-fade-in" key={currentQuoteIndex}>
              <p className="login-quote-text">{quotes[currentQuoteIndex]}</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter admin username" required />
              </div>
              <div className="form-group">
                <label>Security Key</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter portal password" required />
              </div>
              {loginError && <p className="form-error">{loginError}</p>}
              <button type="submit" className="login-btn">Initialize Session</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
