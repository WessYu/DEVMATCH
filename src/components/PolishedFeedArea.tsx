"use client";

import { FeedArea } from "@/components/FeedArea";
import styles from "@/components/PolishedFeedArea.module.css";

export function PolishedFeedArea() {
  return (
    <div className={styles.shell}>
      <FeedArea />
    </div>
  );
}
