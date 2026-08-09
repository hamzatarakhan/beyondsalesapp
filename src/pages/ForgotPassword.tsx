import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Eye, EyeOff, Check, Circle, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";

type Step = "username" | "otp" | "reset";

const RULES = [
  { id: "upper", label: "Uppercase", test: (v: string) => /[A-Z]/.test(v) },
  { id: "special", label: "Special character (e.g. !@^*&)", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
  { id: "numeric", label: "Numeric character", test: (v: string) => /[0-9]/.test(v) },
  { id: "length", label: "At least 8 characters", test: (v: string) => v.length >= 8 },
];

const LockArt = () => (
  <div className="mx-auto w-[86px] h-[86px] rounded-3xl bg-card shadow-sm flex items-center justify-center">
    <Lock className="w-10 h-10 text-amber-400" strokeWidth={2.2} />
  </div>
);

const SmsArt = () => (
  <div className="mx-auto w-[86px] h-[86px] rounded-3xl bg-card shadow-sm flex items-center justify-center">
    <svg viewBox="0 0 48 48" className="w-11 h-11">
      <rect x="10" y="5" width="28" height="38" rx="5" fill="#E7EAF3" />
      <rect x="13" y="8" width="22" height="32" rx="3" fill="#F7F9FC" />
      <path d="M14 14h20a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4H24l-6 5v-5h-4a4 4 0 0 1-4-4v-7a4 4 0 0 1 4-4Z" fill="#5B8DEF" />
      <circle cx="19" cy="21.5" r="1.7" fill="#fff" />
      <circle cx="24" cy="21.5" r="1.7" fill="#fff" />
      <circle cx="29" cy="21.5" r="1.7" fill="#fff" />
    </svg>
  </div>
);

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");

  // OTP
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [seconds, setSeconds] = useState(30);

  // Reset
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (step !== "otp") return;
    setSeconds(30);
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step === "otp" && otp.every((d) => d !== "")) {
      const t = setTimeout(() => setStep("reset"), 350);
      return () => clearTimeout(t);
    }
  }, [otp, step]);

  const handleOtpChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    setOtp((prev) => prev.map((d, idx) => (idx === i ? digit : d)));
    if (digit && i < 3) otpRefs.current[i + 1]?.focus();
  };

  const failedRule = RULES.find((r) => !r.test(pwd));
  const pwdError = submitted && pwd && failedRule ? `Password must contain ${failedRule.label}` : "";
  const matchError = submitted && confirm && pwd !== confirm ? "The passwords entered do not match." : "";

  const handleReset = () => {
    setSubmitted(true);
    if (RULES.every((r) => r.test(pwd)) && pwd === confirm) {
      navigate("/login", { replace: true, state: { passwordReset: true } });
    }
  };

  const close = () => navigate("/login");

  return (
    <div className="mobile-container min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background px-4 py-4 grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
        <div className="flex items-center justify-center">
          {step === "username" && (
            <button
              onClick={close}
              className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-foreground rtl:rotate-180" />
            </button>
          )}
        </div>
        <h1 className="text-center text-lg font-semibold text-foreground">Forget Password</h1>
        <div className="flex items-center justify-center">
          {step !== "username" && (
            <button
              onClick={close}
              className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 px-6 pt-24">
        {step === "username" && (
          <>
            <LockArt />
            <h2 className="mt-5 text-center text-xl font-semibold text-foreground">Forget Password</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Enter your username below to reset password.
            </p>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="mt-7 h-12 rounded-2xl bg-card px-4"
            />
            <button
              type="button"
              onClick={() => setStep("otp")}
              className="mt-4 w-full h-12 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold text-base"
            >
              Continue
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <SmsArt />
            <h2 className="mt-5 text-center text-xl font-semibold text-foreground">Enter Verification Code</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              To reset your password, enter the verification code sent via SMS.
            </p>
            <div className="mt-7 flex items-center justify-center gap-4" dir="ltr">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                  }}
                  inputMode="numeric"
                  maxLength={1}
                  className="w-14 h-14 rounded-full bg-card text-center text-lg font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Didn't receive the code?</span>
              {seconds > 0 ? (
                <span className="font-semibold text-foreground">
                  00:{String(seconds).padStart(2, "0")}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setSeconds(30)}
                  className="font-semibold text-foreground"
                >
                  Resend
                </button>
              )}
            </div>
          </>
        )}

        {step === "reset" && (
          <>
            <LockArt />
            <h2 className="mt-5 text-center text-xl font-semibold text-foreground">Reset Password</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Enter and confirm your new password to continue.
            </p>

            <div className="mt-7 space-y-3">
              <div>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    placeholder="New Password"
                    className={`h-12 rounded-2xl bg-card px-4 pe-11 ${pwdError ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwdError && <p className="mt-1.5 text-xs text-destructive">{pwdError}</p>}
              </div>

              <div>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm Password"
                    className={`h-12 rounded-2xl bg-card px-4 pe-11 ${matchError ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {matchError && <p className="mt-1.5 text-xs text-destructive">{matchError}</p>}
              </div>
            </div>

            <ul className="mt-4 space-y-1.5">
              {RULES.map((r) => {
                const ok = r.test(pwd);
                return (
                  <li
                    key={r.id}
                    className={`flex items-center gap-2 text-xs ${ok ? "text-emerald-600" : "text-muted-foreground"}`}
                  >
                    {ok ? (
                      <span className="w-3.5 h-3.5 rounded-full border border-emerald-600 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                    {r.label}
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={handleReset}
              className="mt-6 w-full h-12 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold text-base"
            >
              Reset Password
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
