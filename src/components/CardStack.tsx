"use client"
import styles from "./CardStack.module.css";

const FEATURES = [
  {
    title: "Live Collaboration",
    desc: "Edit code together in real time with shared cursors and instant updates.",
  },
  {
    title: "Live Video & Chat",
    desc: "Communicate seamlessly with built-in video and chat.",
  },
  {
    title: "Code Execution",
    desc: "Run code in 30+ languages and see output instantly.",
  },
  {
    title: "Multi-Language Support",
    desc: "Switch between Python, JS, C++, and more.",
  },
  {
    title: "Share & Invite",
    desc: "Invite anyone to your session with a link.",
  },
];

const CardStack = () => {
  return (
    <section className="min-h-[calc(110vh)]">
    <div className={styles.centeredStackArea}>
      <div className={styles.stack}>
        {FEATURES.map((feature, idx) => (
          <div
            key={feature.title}
            className={`${styles.card} ${styles[`layer${idx+1}`]}`}
            style={{ zIndex: 5 - idx }}
          >
            {idx === 0 && (
              <div className={styles.topCardText}>
                <b>
                  <span id="desktop-prompt"></span>
                  <span id="mobile-prompt">Tap</span> 
                </b>
                <br />
                DevMeet provides a real-time, collaborative coding environment with all the tools you need to succeed.
              </div>
            )}
            {/* Connector and label, only visible on hover */}
            <div className={`${styles.connector} ${styles[idx % 2 === 0 ? "right" : "left"]}`}>
              <div className={styles.line}></div>
              <div className={styles.labelBlock}>
                <span className={styles.featureTitle}>{feature.title}</span>
                <span className={styles.featureDesc}>{feature.desc}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </section>
  );
};

export default CardStack; 