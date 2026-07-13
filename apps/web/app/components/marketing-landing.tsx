"use client";

import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import styles from "./marketing-landing.module.css";

export function MarketingLanding() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function joinWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) throw new Error(data.message ?? "Unable to join yet.");

      setStatus("success");
      setMessage(
        data.message ?? "You’re on the list. Keep an eye on your inbox."
      );
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to join yet."
      );
    }
  }

  return (
    <main className="waitlist-page">
      <header className="waitlist-nav">
        <Link href="/" className="waitlist-logo" aria-label="copium.fun home">
          <span>c</span>copium<em>.fun</em>
        </Link>
        <p>Early access · World Cup 2026</p>
      </header>

      <section className="waitlist-hero">
        <div className="waitlist-copy">
          <p className="waitlist-eyebrow">
            <i /> THE GROUP CHAT, ON THE CLOCK
          </p>
          <h1>
            Know ball?
            <br />
            <em>Prove it.</em>
          </h1>
          <p className="waitlist-dek">
            Live predictions for every match moment. Call it before it happens,
            build your streak, and settle the takes with your people.
          </p>

          {status === "success" ? (
            <div className="waitlist-confirmation" role="status">
              <Check aria-hidden />
              <div>
                <strong>You’re in.</strong>
                <span>{message}</span>
              </div>
            </div>
          ) : (
            <form className="waitlist-form" onSubmit={joinWaitlist}>
              <label htmlFor="waitlist-email">Email address</label>
              <div>
                <input
                  id="waitlist-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@knowball.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={status === "loading"}
                />
                <button type="submit" disabled={status === "loading"}>
                  {status === "loading" ? (
                    <LoaderCircle className="waitlist-spinner" aria-hidden />
                  ) : (
                    <>
                      Join the waitlist <ArrowUpRight aria-hidden />
                    </>
                  )}
                </button>
              </div>
              {status === "error" && (
                <p className="waitlist-error" role="alert">
                  {message}
                </p>
              )}
            </form>
          )}
          <p className="waitlist-note">
            No spam. Just your invitation when it’s time to play.
          </p>
        </div>

        <div className="waitlist-signal" aria-hidden>
          <div className="signal-stamp">THE 90TH MINUTE</div>
          <div className="signal-field">
            <span className="signal-center" />
            <span className="signal-box signal-box-left" />
            <span className="signal-box signal-box-right" />
            <span className="signal-dot signal-dot-one" />
            <span className="signal-dot signal-dot-two" />
            <span className="signal-dot signal-dot-three" />
          </div>
          <div className="signal-card">
            <p>LIVE CALL · 89:42</p>
            <strong>
              Next touch
              <br />
              in the box?
            </strong>
            <div>
              <span>YES</span>
              <b>62%</b>
              <span>NO</span>
            </div>
          </div>
          <p className="signal-caption">
            One instinct. One moment. No hiding in the chat.
          </p>
        </div>
      </section>

      <section className={styles.demo} aria-labelledby="demo-title">
        <div className={styles.demoHeading}>
          <p className="waitlist-eyebrow">
            <i /> SEE IT IN MOTION
          </p>
          <h2 id="demo-title">The call. The clock. The chaos.</h2>
          <p>Take a quick look at the experience before you claim your spot.</p>
        </div>
        <div className={styles.demoFrame}>
          <iframe
            src="https://www.youtube-nocookie.com/embed/QktTKWbdxV0"
            title="copium.fun demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </section>

      <footer className="waitlist-footer">
        <span>© 2026 copium.fun</span>
        <span>Built for people who watch the whole match.</span>
      </footer>
    </main>
  );
}
