"use client";

import { useEffect, useRef, useCallback, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setUserLocale } from "@/app/actions/locale";
import { locales, type Locale } from "@/i18n/config";
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
  Languages,
  ChevronDown,
} from "lucide-react";

export function LandingPage() {
  const t = useTranslations("landing");
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
            <a href="#pipeline">{t("nav.howItWorks")}</a>
            <a href="#features">{t("nav.features")}</a>
            <a href="#workspace">{t("nav.teams")}</a>
          </div>
          <div className="landing-nav__spacer" />
          <LandingLangSwitcher />
          <div className="landing-nav__cta">
            <Link
              className="landing-btn landing-btn--ghost landing-btn--sm"
              href="/login"
            >
              {t("nav.signIn")}
            </Link>
            <Link
              className="landing-btn landing-btn--primary landing-btn--sm"
              href="/register"
            >
              {t("nav.openImpulso")}
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
              {t("hero.eyebrow")}
            </span>
            <h1>
              {t("hero.headlinePre")}
              <em>{t("hero.headlineEm")}</em>
              {t("hero.headlinePost")}
            </h1>
            <p className="lead">{t("hero.lead")}</p>
            <div className="landing-hero__actions">
              <Link
                className="landing-btn landing-btn--primary landing-btn--lg"
                href="/register"
              >
                {t("hero.ctaPrimary")}
                <ArrowRight size={18} />
              </Link>
              <a
                className="landing-btn landing-btn--ghost landing-btn--lg"
                href="#pipeline"
              >
                {t("hero.ctaSecondary")}
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
                body={t("cards.nova.body")}
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
                body={t("cards.tomo.body")}
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
                body={t("cards.kira.body")}
              />
            </div>
          </div>

          {/* Stat strip */}
          <div className="landing-stats landing-reveal">
            <div className="landing-stat">
              <div className="n">
                <b>{t("stats.speed")}</b>
              </div>
              <div className="l">{t("stats.speedLabel")}</div>
            </div>
            <div className="landing-stat">
              <div className="n">
                <b>{t("stats.workspace")}</b>
                {t("stats.workspaceUnit")}
              </div>
              <div className="l">{t("stats.workspaceLabel")}</div>
            </div>
            <div className="landing-stat">
              <div className="n">
                ∞ <b>{t("stats.accounts")}</b>
              </div>
              <div className="l">{t("stats.accountsLabel")}</div>
            </div>
          </div>
        </div>
      </header>

      {/* LOGOS */}
      <div className="landing-wrap landing-logos">
        <div className="landing-logos__lead">{t("logos.lead")}</div>
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
              {t("pipeline.eyebrow")}
            </span>
            <h2>{t("pipeline.title")}</h2>
            <p className="lead">{t("pipeline.lead")}</p>
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
              <h3>{t("pipeline.generate.title")}</h3>
              <p>{t("pipeline.generate.body")}</p>
              <div className="landing-chips">
                <span className="landing-chip landing-chip--accent">
                  {t("pipeline.generate.chip1")}
                </span>
                <span className="landing-chip">
                  {t("pipeline.generate.chip2")}
                </span>
                <span className="landing-chip">
                  {t("pipeline.generate.chip3")}
                </span>
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
              <h3>{t("pipeline.curate.title")}</h3>
              <p>{t("pipeline.curate.body")}</p>
              <div className="landing-chips">
                <span className="landing-chip">
                  {t("pipeline.curate.chip1")}
                </span>
                <span className="landing-chip landing-chip--accent">
                  {t("pipeline.curate.chip2")}
                </span>
                <span className="landing-chip">
                  {t("pipeline.curate.chip3")}
                </span>
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
              <h3>{t("pipeline.schedule.title")}</h3>
              <p>{t("pipeline.schedule.body")}</p>
              <div className="landing-chips">
                <span className="landing-chip">
                  {t("pipeline.schedule.chip1")}
                </span>
                <span className="landing-chip">
                  {t("pipeline.schedule.chip2")}
                </span>
                <span className="landing-chip landing-chip--accent">
                  {t("pipeline.schedule.chip3")}
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
              {t("features.eyebrow")}
            </span>
            <h2>{t("features.title")}</h2>
            <p className="lead">{t("features.lead")}</p>
          </div>
          <div className="landing-features">
            <div className="landing-feat landing-feat--wide landing-reveal">
              <div className="landing-feat__ico">
                <MessageSquare size={20} />
              </div>
              <h3>{t("features.brandVoice.title")}</h3>
              <p>{t("features.brandVoice.body")}</p>
            </div>
            <div className="landing-feat landing-reveal">
              <div className="landing-feat__ico">
                <ImageIcon size={20} />
              </div>
              <h3>{t("features.visuals.title")}</h3>
              <p>{t("features.visuals.body")}</p>
            </div>
            <div className="landing-feat landing-reveal">
              <div className="landing-feat__ico">
                <CalendarDays size={20} />
              </div>
              <h3>{t("features.calendar.title")}</h3>
              <p>{t("features.calendar.body")}</p>
            </div>
            <div className="landing-feat landing-reveal">
              <div className="landing-feat__ico">
                <Users size={20} />
              </div>
              <h3>{t("features.approvals.title")}</h3>
              <p>{t("features.approvals.body")}</p>
            </div>
            <div className="landing-feat landing-feat--wide landing-reveal">
              <div className="landing-feat__ico">
                <BarChart3 size={20} />
              </div>
              <h3>{t("features.analytics.title")}</h3>
              <p>{t("features.analytics.body")}</p>
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
              {t("workspace.eyebrow")}
            </span>
            <h2
              style={{
                fontSize: "clamp(28px,3.4vw,42px)",
                marginTop: 14,
              }}
            >
              {t("workspace.title")}
            </h2>
            <p className="lead" style={{ marginTop: 14 }}>
              {t("workspace.lead")}
            </p>
            <div className="landing-work__list">
              <div className="landing-work__item">
                <div className="ic">
                  <ScanLine size={19} />
                </div>
                <div>
                  <h4>{t("workspace.switching.title")}</h4>
                  <p>{t("workspace.switching.body")}</p>
                </div>
              </div>
              <div className="landing-work__item">
                <div className="ic">
                  <Users size={19} />
                </div>
                <div>
                  <h4>{t("workspace.roles.title")}</h4>
                  <p>{t("workspace.roles.body")}</p>
                </div>
              </div>
              <div className="landing-work__item">
                <div className="ic">
                  <Globe size={19} />
                </div>
                <div>
                  <h4>{t("workspace.billing.title")}</h4>
                  <p>{t("workspace.billing.body")}</p>
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
                  <span>{t("workspace.queued")}</span>
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
                  <span>{t("workspace.queued")}</span>
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
                  <span>{t("workspace.queued")}</span>
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
                  <span>{t("workspace.queued")}</span>
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
                {t("cta.eyebrow")}
              </span>
              <h2 style={{ marginTop: 14 }}>
                {t("cta.headlinePre")}
                <em>{t("cta.headlineEm")}</em>
              </h2>
              <p>{t("cta.body")}</p>
              <div
                className="landing-hero__actions"
                style={{ justifyContent: "center" }}
              >
                <Link
                  className="landing-btn landing-btn--primary landing-btn--lg"
                  href="/register"
                >
                  {t("cta.primary")}
                  <ArrowRight size={18} />
                </Link>
                <a
                  className="landing-btn landing-btn--ghost landing-btn--lg"
                  href="#pipeline"
                >
                  {t("cta.secondary")}
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
              <p>{t("footer.tagline")}</p>
            </div>
            <div className="landing-footer__cols">
              <div className="landing-fcol">
                <h5>{t("footer.product")}</h5>
                <a href="#pipeline">{t("nav.howItWorks")}</a>
                <a href="#features">{t("nav.features")}</a>
                <a href="#workspace">{t("footer.forTeams")}</a>
                <Link href="/register">{t("footer.openApp")}</Link>
              </div>
              <div className="landing-fcol">
                <h5>{t("footer.company")}</h5>
                <a href="#">{t("footer.about")}</a>
                <a href="#">{t("footer.blog")}</a>
                <a href="#">{t("footer.careers")}</a>
              </div>
              <div className="landing-fcol">
                <h5>{t("footer.legal")}</h5>
                <a href="#">{t("footer.privacy")}</a>
                <a href="#">{t("footer.terms")}</a>
              </div>
            </div>
          </div>
          <div className="landing-footer__bot">
            <span>{t("footer.copyright")}</span>
            <span
              style={{
                fontFamily:
                  "var(--font-geist-mono), ui-monospace, monospace",
              }}
            >
              {t("footer.madeFor")}
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

const LANG_LABELS: Record<Locale, string> = {
  en: "EN",
  "zh-CN": "中文",
};

function LandingLangSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function switchTo(next: Locale) {
    setOpen(false);
    startTransition(async () => {
      await setUserLocale(next);
      router.refresh();
    });
  }

  return (
    <div className="landing-lang" ref={ref}>
      <button
        className="landing-lang__trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        disabled={isPending}
      >
        <Languages size={15} />
        {LANG_LABELS[locale]}
        <ChevronDown size={13} style={{ opacity: 0.5 }} />
      </button>
      {open && (
        <div className="landing-lang__menu">
          {locales.map((option) => (
            <button
              key={option}
              className={`landing-lang__item${option === locale ? " active" : ""}`}
              onClick={() => switchTo(option)}
            >
              {option === "en" ? "English" : "简体中文"}
              {option === locale && <span style={{ color: "var(--accent)", marginLeft: "auto" }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
