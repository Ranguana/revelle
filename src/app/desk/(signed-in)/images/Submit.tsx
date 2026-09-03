"use client";

import { useFormStatus } from "react-dom";

import styles from "../../desk.module.css";

/**
 * A SUBMIT BUTTON THAT SAYS IT IS WORKING.
 *
 * Founder, on the image bank: "when I press read it its hard to know its
 * working so after pressed, make button diff color or something."
 *
 * Reading a picture is one model call — several seconds, sometimes more — and
 * the plain form button gave no sign it had been pressed. So the honest
 * reading of a still page is "nothing happened", and the honest response is to
 * press it again, which spends a second call on the same picture.
 *
 * `useFormStatus` is the only way to know: it reports the pending state of the
 * form this button sits INSIDE, which is why this is a component rather than a
 * prop on the page — the hook has to be under the <form>, and the page is a
 * server component and cannot hold a hook at all.
 *
 * Disabled while pending, because a second press is not a second opinion, it
 * is a second bill.
 */
export function Submit({
  idle,
  working,
  danger = false,
  confirm,
}: {
  idle: string;
  working: string;
  danger?: boolean;
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={danger ? styles.buttonDanger : styles.button}
      aria-busy={pending}
      // A destructive action gets one question. Not on the read, which is
      // recoverable by pressing it again, and not on anything a person can
      // undo — asking every time is how a confirmation stops being read.
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {pending ? working : idle}
    </button>
  );
}
