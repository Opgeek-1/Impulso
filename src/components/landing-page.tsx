"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Zap,
  ArrowRight,
  Sparkles,
  Palette,
  CalendarDays,
  AlignJustify,
  Layers,
  MessageSquare,
  ImageIcon,
  Users,
  BarChart3,
  ScanLine,
  Globe,
} from "lucide-react";

export function LandingPage() {
  const navRef = useRef<HTMLElement>(null);

  const handleScroll = useCallback(() => {
    navRef.current?.classList.toggle("scrolled", window.scrollY > 8);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const els = document.querySelectorAll(".landing-reveal");
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="landing">
      <div className="landing-atmos" />

      {/* NAV */}
      <nav className="landing-nav" ref={navRef}>
        <div className="landing-wrap landing-nav__inner">
          <Link className="landing-brand" href="#top">
            <Image
              src="/tomo-mark-color.png"
              alt="Tomo"
              width={26}
              height={26}
              style={{ borderRadius: 7 }}
            />
            Impulso
          </Link>
          <div className="landing-nav__links">
            <a href="#pipeline">How it works</a>
            <a href="#features">Features</a>
            <a href="#workspace">Teams</a>
          </div>
          <div className="landing-nav__spacer" />
          <div className="landing-nav__cta">
            <Link
              className="landing-btn landing-btn--ghost landing-btn--sm"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="landing-btn landing-btn--primary landing-btn--sm"
              href="/register"
            >
              Open Impulso
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </nav>

      <a id="top" />

      {/* HERO — Statement (variant C) */}
      <header className="landing-hero">
        <div className="landing-wrap">
          <div className="landing-hero__center">
            <span className="landing-eyebrow" style={{ justifyContent: "center" }}>
              <Zap size={15} />
              Generate · Curate · Schedule
            </span>
            <h1>
              A content engine your <em>whole team</em> can run.
            </h1>
            <p className="lead">
              Impulso brings idea generation, curation, design, and scheduling
              for X into one warm, focused workspace. Free to start — open it
              and go.
            </p>
            <div className="landing-hero__actions">
              <Link
                className="landing-btn landing-btn--primary landing-btn--lg"
                href="/register"
              >
                Start creating — it&apos;s free
                <ArrowRight size={18} />
              </Link>
              <a
                className="landing-btn landing-btn--ghost landing-btn--lg"
                href="#pipeline"
              >
                See how it works
              </a>
            </div>

            {/* Card fan */}
            <div className="landing-compo">
              <div className="landing-glow" />
              <PostCard
                style={{
                  left: "50%",
                  top: 0,
                  "--tx": "-340px",
                  width: 280,
                  zIndex: 3,
                } as React.CSSProperties}
                initial="N"
                name="Nova Labs"
                handle="@novalabs"
                badge={<Badge variant="designed" label="Designed" />}
                body="Most teams have a finishing problem, not a content problem."
              />
              <PostCard
                style={{
                  left: "50%",
                  top: 60,
                  "--tx": "-140px",
                  width: 300,
                  zIndex: 5,
                  animationDelay: "-3s",
                } as React.CSSProperties}
                initial="T"
                avatarBg="linear-gradient(135deg,#f59e0b,#fbbf24)"
                name="Tomo Team"
                handle="@tomo"
                badge={<Badge variant="sched" label="Tue 9:00a" />}
                body="Here's what our calendar looks like this week 👇"
              />
              <PostCard
                style={{
                  left: "50%",
                  top: 30,
                  "--tx": "180px",
                  width: 270,
                  zIndex: 4,
                  animationDelay: "-1.5s",
                } as React.CSSProperties}
                initial="K"
                avatarBg="linear-gradient(135deg,#3b82f6,#60a5fa)"
                name="Kira"
                handle="@kirabuilds"
                badge={<Badge variant="curated" label="Curated" />}
                body="One idea → a week of content. Save this 🧵"
              />
            </div>
          </div>

          {/* Stat strip */}
          <div className="landing-stats landing-reveal">
            <div className="landing-stat">
              <div className="n">
                <b>5×</b>
              </div>
              <div className="l">faster from idea to scheduled</div>
            </div>
            <div className="landing-stat">
              <div className="n">
                <b>1</b> workspace
              </div>
              <div className="l">no more tool-switching</div>
            </div>
            <div className="landing-stat">
              <div className="n">
                ∞ <b>accounts</b>
              </div>
              <div className="l">manage every brand in one place</div>
            </div>
          </div>
        </div>
      </header>

      {/* LOGOS */}
      <div className="landing-wrap landing-logos">
        <div className="landing-logos__lead">
          Built by teams who ship on X every day
        </div>
        <div className="landing-logos__row">
          <span>Nova Labs</span>
          <span>Kira</span>
          <span>Tomo</span>
          <span>Driftwork</span>
          <span>Lumen</span>
          <span>Faro</span>
        </div>
      </div>

      {/* PIPELINE */}
      <section className="landing-section" id="pipeline">
        <div className="landing-wrap">
          <div className="landing-section__head landing-reveal">
            <span className="landing-eyebrow">
              <AlignJustify size={15} />
              The pipeline
            </span>
            <h2>Three stages. One smooth flow.</h2>
            <p className="lead">
              Every post moves through the same simple path — so nothing gets
              stuck in someone&apos;s drafts folder.
            </p>
          </div>
          <div className="landing-pipe">
            <div className="landing-pipe__step landing-reveal">
              <div className="landing-pipe__num">01</div>
              <div
                className="landing-pipe__ico"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                }}
              >
                <Sparkles size={23} />
              </div>
              <h3>Generate</h3>
              <p>
                Start from a topic, a link, or a rough thought. Impulso drafts
                on-brand posts and threads in your voice — dozens at a time.
              </p>
              <div className="landing-chips">
                <span className="landing-chip landing-chip--accent">
                  Topic → 12 drafts
                </span>
                <span className="landing-chip">Threads</span>
                <span className="landing-chip">Brand voice</span>
              </div>
              <div className="landing-pipe__arrow">
                <ArrowRight size={15} />
              </div>
            </div>
            <div className="landing-pipe__step landing-reveal">
              <div className="landing-pipe__num">02</div>
              <div
                className="landing-pipe__ico"
                style={{
                  background: "var(--s-designed-bg)",
                  color: "var(--s-designed)",
                }}
              >
                <Palette size={23} />
              </div>
              <h3>Curate &amp; design</h3>
              <p>
                Pick the keepers, refine the copy, and drop on matching visuals.
                Approve as a team — drafts become designed posts ready to go.
              </p>
              <div className="landing-chips">
                <span className="landing-chip">Review &amp; approve</span>
                <span className="landing-chip landing-chip--accent">
                  Auto visuals
                </span>
                <span className="landing-chip">Edit copy</span>
              </div>
              <div className="landing-pipe__arrow">
                <ArrowRight size={15} />
              </div>
            </div>
            <div className="landing-pipe__step landing-reveal">
              <div className="landing-pipe__num">03</div>
              <div
                className="landing-pipe__ico"
                style={{
                  background: "var(--s-sched-bg)",
                  color: "var(--s-sched)",
                }}
              >
                <CalendarDays size={23} />
              </div>
              <h3>Schedule</h3>
              <p>
                Drag posts onto a calendar tuned to when your audience is
                online. Set it, and Impulso ships the whole week for you.
              </p>
              <div className="landing-chips">
                <span className="landing-chip">Smart times</span>
                <span className="landing-chip">Drag &amp; drop</span>
                <span className="landing-chip landing-chip--accent">
                  Auto-publish
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="landing-section landing-section--alt" id="features">
        <div className="landing-wrap">
          <div className="landing-section__head landing-reveal">
            <span className="landing-eyebrow">
              <Layers size={15} />
              Everything in the box
            </span>
            <h2>Built for the way teams actually publish.</h2>
            <p className="lead">
              No glue, no exports, no &quot;who has the latest draft?&quot; Just
              one calm place to make great content together.
            </p>
          </div>
          <div className="landing-features">
            <div className="landing-feat landing-feat--wide landing-reveal">
              <div className="landing-feat__ico">
                <MessageSquare size={20} />
              </div>
              <h3>Stays in your brand voice</h3>
              <p>
                Teach Impulso your tone once. Every generated draft sounds like
                you — not like a robot — across each account you run.
              </p>
            </div>
            <div className="landing-feat landing-reveal">
              <div className="landing-feat__ico">
                <ImageIcon size={20} />
              </div>
              <h3>Visuals, attached</h3>
              <p>
                Generate or drop in images that match each post — no separate
                design round-trip.
              </p>
            </div>
            <div className="landing-feat landing-reveal">
              <div className="landing-feat__ico">
                <CalendarDays size={20} />
              </div>
              <h3>Smart calendar</h3>
              <p>
                A week-at-a-glance schedule that suggests the best times and
                auto-publishes.
              </p>
            </div>
            <div className="landing-feat landing-reveal">
              <div className="landing-feat__ico">
                <Users size={20} />
              </div>
              <h3>Team approvals</h3>
              <p>
                Comment, edit, and approve together. Everyone sees the same live
                board.
              </p>
            </div>
            <div className="landing-feat landing-feat--wide landing-reveal">
              <div className="landing-feat__ico">
                <BarChart3 size={20} />
              </div>
              <h3>See what&apos;s working</h3>
              <p>
                Lightweight performance signals flow back into the board, so
                your next batch of drafts leans into the formats your audience
                already loves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WORKSPACE / TEAMS */}
      <section className="landing-section" id="workspace">
        <div className="landing-wrap landing-work">
          <div className="landing-reveal">
            <span className="landing-eyebrow">
              <ScanLine size={15} />
              One workspace, every brand
            </span>
            <h2
              style={{
                fontSize: "clamp(28px,3.4vw,42px)",
                marginTop: 14,
              }}
            >
              Run every account from a single home.
            </h2>
            <p className="lead" style={{ marginTop: 14 }}>
              Switch between brands without losing context. Each account keeps
              its own voice, calendar, and team — all under one roof.
            </p>
            <div className="landing-work__list">
              <div className="landing-work__item">
                <div className="ic">
                  <ScanLine size={19} />
                </div>
                <div>
                  <h4>Instant account switching</h4>
                  <p>
                    Jump between brands in a click — context, drafts, and
                    calendar follow you.
                  </p>
                </div>
              </div>
              <div className="landing-work__item">
                <div className="ic">
                  <Users size={19} />
                </div>
                <div>
                  <h4>Roles for everyone</h4>
                  <p>
                    Writers draft, editors approve, managers oversee — with the
                    right access per account.
                  </p>
                </div>
              </div>
              <div className="landing-work__item">
                <div className="ic">
                  <Globe size={19} />
                </div>
                <div>
                  <h4>Separate voices, one bill</h4>
                  <p>
                    Each brand keeps its own tone and queue while you manage it
                    all from a single workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="landing-reveal">
            <div className="landing-accts">
              <div className="landing-acct active">
                <div
                  className="landing-acct__av"
                  style={{ background: "var(--accent-grad)" }}
                >
                  N
                </div>
                <div className="landing-acct__who">
                  <b>Nova Labs</b>
                  <span>@novalabs</span>
                </div>
                <div className="landing-acct__spacer" />
                <div className="landing-acct__stat">
                  <b>14</b>
                  <span>queued</span>
                </div>
              </div>
              <div className="landing-acct">
                <div
                  className="landing-acct__av"
                  style={{
                    background: "linear-gradient(135deg,#3b82f6,#60a5fa)",
                  }}
                >
                  K
                </div>
                <div className="landing-acct__who">
                  <b>Kira</b>
                  <span>@kirabuilds</span>
                </div>
                <div className="landing-acct__spacer" />
                <div className="landing-acct__stat">
                  <b>9</b>
                  <span>queued</span>
                </div>
              </div>
              <div className="landing-acct">
                <div
                  className="landing-acct__av"
                  style={{
                    background: "linear-gradient(135deg,#a855f7,#c084fc)",
                  }}
                >
                  D
                </div>
                <div className="landing-acct__who">
                  <b>Driftwork</b>
                  <span>@driftwork</span>
                </div>
                <div className="landing-acct__spacer" />
                <div className="landing-acct__stat">
                  <b>6</b>
                  <span>queued</span>
                </div>
              </div>
              <div className="landing-acct">
                <div
                  className="landing-acct__av"
                  style={{
                    background: "linear-gradient(135deg,#22c55e,#4ade80)",
                  }}
                >
                  L
                </div>
                <div className="landing-acct__who">
                  <b>Lumen</b>
                  <span>@lumenhq</span>
                </div>
                <div className="landing-acct__spacer" />
                <div className="landing-acct__stat">
                  <b>11</b>
                  <span>queued</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-wrap">
          <div className="landing-cta landing-reveal">
            <div className="landing-cta__inner">
              <span
                className="landing-eyebrow"
                style={{ color: "#ff8cc6", justifyContent: "center" }}
              >
                It&apos;s free — start now
              </span>
              <h2 style={{ marginTop: 14 }}>
                Give your team a <em>content engine.</em>
              </h2>
              <p>
                Open Impulso and turn this week&apos;s ideas into a full
                calendar of posts — no setup, no card, no catch.
              </p>
              <div
                className="landing-hero__actions"
                style={{ justifyContent: "center" }}
              >
                <Link
                  className="landing-btn landing-btn--primary landing-btn--lg"
                  href="/register"
                >
                  Open Impulso
                  <ArrowRight size={18} />
                </Link>
                <a
                  className="landing-btn landing-btn--ghost landing-btn--lg"
                  href="#pipeline"
                >
                  See how it works
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-wrap">
          <div className="landing-footer__top">
            <div className="landing-footer__brand">
              <Link className="landing-brand" href="#top">
                <Image
                  src="/tomo-mark-color.png"
                  alt="Tomo"
                  width={26}
                  height={26}
                  style={{ borderRadius: 7 }}
                />
                Impulso
              </Link>
              <p>
                The warm, all-in-one workspace where content teams generate,
                curate, design, and schedule for X.
              </p>
            </div>
            <div className="landing-footer__cols">
              <div className="landing-fcol">
                <h5>Product</h5>
                <a href="#pipeline">How it works</a>
                <a href="#features">Features</a>
                <a href="#workspace">For teams</a>
                <Link href="/register">Open app</Link>
              </div>
              <div className="landing-fcol">
                <h5>Company</h5>
                <a href="#">About</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
              </div>
              <div className="landing-fcol">
                <h5>Legal</h5>
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
              </div>
            </div>
          </div>
          <div className="landing-footer__bot">
            <span>© 2025 Impulso · A Tomo product</span>
            <span style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}>
              Made for content teams on X
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PostCard({
  style,
  initial,
  avatarBg,
  name,
  handle,
  badge,
  body,
}: {
  style: React.CSSProperties;
  initial: string;
  avatarBg?: string;
  name: string;
  handle: string;
  badge: React.ReactNode;
  body: string;
}) {
  return (
    <div className="landing-post landing-float" style={style}>
      <div className="landing-post__head">
        <div
          className="landing-post__av"
          style={avatarBg ? { background: avatarBg } : undefined}
        >
          {initial}
        </div>
        <div className="landing-post__who">
          <b>{name}</b>
          <span>{handle}</span>
        </div>
        {badge}
      </div>
      <div className="landing-post__body">{body}</div>
    </div>
  );
}

function Badge({ variant, label }: { variant: string; label: string }) {
  return (
    <span className={`landing-badge landing-badge--${variant}`}>
      <span className="dot" />
      {label}
    </span>
  );
}
