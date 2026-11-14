"use client";

import { useEffect, useRef, useState } from "react";
import { PiArrowRightLight } from "react-icons/pi";
import { Magnetic } from "@/components/ui/Magnetic";
import { playUi } from "@/lib/audio/ui";
import { TIE_IN } from "@/lib/content";
import { DURATION, EASE, MEDIA, STAGGER, gsap, useGSAP } from "@/lib/gsap";
import { emit } from "@/lib/store";
import { FormField } from "./FormField";
import { FormSuccess } from "./FormSuccess";
import { InterestChoice } from "./InterestChoice";
import { threadReference } from "./threadReference";

type Values = { name: string; email: string; organisation: string; interest: string };
type RequiredField = "name" | "email" | "interest";
type Errors = Partial<Record<RequiredField, string>>;
type Status = "idle" | "sending" | "sent";

const EMPTY: Values = { name: "", email: "", organisation: "", interest: "" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SENDING_SECONDS = 1.4;
const { form } = TIE_IN;

function fieldError(field: RequiredField, values: Values): string | undefined {
  if (field === "name") return values.name.trim() ? undefined : form.name.error;
  if (field === "email") return EMAIL_PATTERN.test(values.email.trim()) ? undefined : form.email.error;
  return values.interest ? undefined : form.interest.error;
}

function withFieldError(errors: Errors, field: RequiredField, values: Values): Errors {
  const next = { ...errors };
  const error = fieldError(field, values);
  if (error) next[field] = error;
  else delete next[field];
  return next;
}

/** Frontend only: validates, pretends to wind for a moment, then becomes the success state. */
export function TieInForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [lockedHeight, setLockedHeight] = useState<number | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const interestRef = useRef<HTMLInputElement>(null);
  const previousStatus = useRef<Status>("idle");
  const sending = status === "sending";

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const mm = gsap.matchMedia();

      const finish = () => {
        setLockedHeight(wrapper.offsetHeight);
        setStatus("sent");
        emit("form-sent");
        playUi("confirm");
      };

      if (status === "idle") {
        mm.add(MEDIA.motion, () => {
          gsap
            .timeline({ scrollTrigger: { trigger: wrapper, start: "top 88%", once: true } })
            .from("[data-form-rule]", {
              scaleX: 0,
              transformOrigin: "left center",
              duration: DURATION.reveal,
              ease: EASE.reveal,
              stagger: STAGGER.items,
            })
            .from(
              "[data-form-row]",
              { autoAlpha: 0, y: 24, duration: DURATION.reveal, ease: EASE.reveal, stagger: STAGGER.lines },
              0,
            );
        });
      }

      if (status === "sending") {
        mm.add(MEDIA.motion, () => {
          gsap.to("[data-spinner]", { rotation: 360, transformOrigin: "50% 50%", duration: 1.2, ease: EASE.none, repeat: -1 });
          gsap
            .timeline({ delay: SENDING_SECONDS, onComplete: finish })
            .to("[data-form-rule]", {
              scaleX: 0,
              transformOrigin: "right center",
              duration: DURATION.move,
              ease: EASE.move,
              stagger: STAGGER.items / 2,
            })
            .to(
              "[data-form-row]",
              { autoAlpha: 0, y: -16, duration: DURATION.move, ease: EASE.move, stagger: STAGGER.items / 2 },
              0,
            );
        });
        mm.add(MEDIA.reduced, () => {
          gsap.delayedCall(SENDING_SECONDS, finish);
        });
      }

      return () => mm.revert();
    },
    { scope: wrapperRef, dependencies: [status], revertOnUpdate: true },
  );

  useEffect(() => {
    if (previousStatus.current === "sent" && status === "idle") nameRef.current?.focus();
    previousStatus.current = status;
  }, [status]);

  const change = (field: keyof Values, value: string) => {
    if (sending) return;
    const next = { ...values, [field]: value };
    setValues(next);
    if (field !== "organisation" && errors[field]) setErrors(withFieldError(errors, field, next));
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    playUi("press");
    let next: Errors = {};
    next = withFieldError(next, "name", values);
    next = withFieldError(next, "email", values);
    next = withFieldError(next, "interest", values);
    setErrors(next);
    if (next.name) nameRef.current?.focus();
    else if (next.email) emailRef.current?.focus();
    else if (next.interest) interestRef.current?.focus();
    else setStatus("sending");
  };

  const onReset = () => {
    setValues(EMPTY);
    setErrors({});
    setLockedHeight(undefined);
    setStatus("idle");
  };

  return (
    <div ref={wrapperRef} style={lockedHeight ? { minHeight: lockedHeight } : undefined}>
      {status === "sent" ? (
        <FormSuccess reference={threadReference(values.email)} onReset={onReset} />
      ) : (
        <form noValidate onSubmit={onSubmit} aria-labelledby="tie-in-title" className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          <FormField
            ref={nameRef}
            id="tie-in-name"
            name="name"
            label={form.name.label}
            autoComplete="name"
            required
            readOnly={sending}
            value={values.name}
            error={errors.name}
            onChange={(value) => change("name", value)}
            onBlur={() => setErrors(withFieldError(errors, "name", values))}
          />
          <FormField
            ref={emailRef}
            id="tie-in-email"
            name="email"
            type="email"
            inputMode="email"
            label={form.email.label}
            autoComplete="email"
            required
            readOnly={sending}
            value={values.email}
            error={errors.email}
            onChange={(value) => change("email", value)}
            onBlur={() => setErrors(withFieldError(errors, "email", values))}
          />
          <FormField
            id="tie-in-organisation"
            name="organisation"
            label={form.organisation.label}
            optionalTag={form.organisation.optional}
            autoComplete="organization"
            readOnly={sending}
            value={values.organisation}
            onChange={(value) => change("organisation", value)}
          />
          <InterestChoice
            id="tie-in-interest"
            name="interest"
            label={form.interest.label}
            options={form.interest.options}
            value={values.interest}
            error={errors.interest}
            disabled={sending}
            firstOptionRef={interestRef}
            onChange={(value) => {
              playUi("tick");
              change("interest", value);
            }}
          />
          <div data-form-row className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 sm:col-span-2">
            <Magnetic strength={0.2}>
              <button
                type="submit"
                aria-disabled={sending}
                className="type-title group relative inline-flex min-h-12 cursor-pointer items-center gap-4 py-2 text-bone"
              >
                <span>{sending ? form.sending : form.submit}</span>
                {sending ? (
                  <svg data-spinner aria-hidden="true" viewBox="0 0 24 24" className="size-6 text-plasma">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="44 19" />
                  </svg>
                ) : (
                  <PiArrowRightLight
                    aria-hidden="true"
                    className="size-6 text-plasma transition-transform duration-300 ease-reveal group-hover:translate-x-2"
                  />
                )}
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-rule-strong" />
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 bottom-0 h-px origin-left bg-plasma transition-transform duration-500 ease-reveal ${
                    sending ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </button>
            </Magnetic>
            <p className="type-micro max-w-xs text-ash">{form.privacy}</p>
          </div>
          <p role="status" className="sr-only">
            {sending ? form.sending : ""}
          </p>
        </form>
      )}
    </div>
  );
}
