"use client";

import { createContext, useContext, useMemo } from "react";
import { assignCourseTints, courseTint, type Tint } from "@/lib/format";
import { useOfferings } from "@/lib/queries";

type TintOf = (courseName: string) => Tint;

const CourseTintContext = createContext<TintOf>(courseTint);

/**
 * Deals pastel tints to the signed-in user's courses (alphabetical order) so cards, timetable blocks and
 * list marks use one consistent colour per course and neighbours never repeat.
 */
export function CourseTintProvider({ children }: { children: React.ReactNode }) {
  const { data } = useOfferings();
  const tintOf = useMemo<TintOf>(() => {
    const map = assignCourseTints((data ?? []).map((o) => o.courseName));
    return (name) => map.get(name) ?? courseTint(name);
  }, [data]);
  return <CourseTintContext.Provider value={tintOf}>{children}</CourseTintContext.Provider>;
}

/** Tint lookup that updates once the course list has loaded. */
export function useCourseTint() {
  return useContext(CourseTintContext);
}
