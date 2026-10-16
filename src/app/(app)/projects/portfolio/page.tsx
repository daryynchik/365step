import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FolderKanban, Lightbulb, Rocket } from "lucide-react";

import { ProjectManager } from "@/components/project-manager";
import { RewardProvider } from "@/components/reward-toast";
import {
  Badge,
  ButtonLink,
  Card,
  Panel,
  ProgressBar,
  SectionHeader,
  Stat,
} from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { portfolioStrength } from "@/lib/portfolio";
import { getProjects } from "@/lib/queries";

export const metadata: Metadata = { title: "My Projects" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await currentUser();
  if (!user) redirect("/signin");

  const projects = await getProjects(user.id);
  const strength = portfolioStrength(projects);

  return (
    <RewardProvider>
      <div className="space-y-7">
        <header>
          <p className="eyebrow mb-1.5">My projects</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Your portfolio, built a little at a time
          </h1>
          <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">
            A portfolio is the strongest thing in an application and the hardest to start.
            Add projects while they are still ideas — the point is to have something you
            keep returning to, not something perfect.
          </p>
        </header>

        {/* ============================================ portfolio strength */}
        <Panel className="p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr] lg:gap-8">
            <div>
              <p className="eyebrow mb-3">Portfolio progress</p>

              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="nums text-3xl font-semibold tracking-tight">
                  {strength.score}
                  <span className="subtle text-lg">/100</span>
                </span>
                <Badge
                  tone={strength.score >= 70 ? "done" : strength.score >= 35 ? "soon" : "neutral"}
                >
                  {strength.score >= 70
                    ? "Strong"
                    : strength.score >= 35
                      ? "Coming together"
                      : "Getting started"}
                </Badge>
              </div>

              <ProgressBar value={strength.score} gradient label="Portfolio strength" />

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                <MiniStat label="Projects" value={projects.length} />
                <MiniStat label="Shipped" value={strength.shipped} />
                <MiniStat label="Linked" value={strength.linked} />
              </div>
            </div>

            <div>
              <p className="eyebrow mb-3 flex items-center gap-1.5">
                <Lightbulb className="size-3.5" />
                What would move it
              </p>
              <ul className="space-y-2.5">
                {strength.notes.map((note) => (
                  <li key={note} className="flex items-start gap-2.5">
                    <span
                      aria-hidden
                      className="mt-[0.45rem] size-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--color-arc-mid)" }}
                    />
                    <span className="text-[13px] leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>

              <div className="hairline mt-5 pt-4">
                <ButtonLink href="/learn/project-building" variant="secondary" size="sm">
                  <Rocket className="size-3.5" />
                  Learn how to scope a project
                </ButtonLink>
              </div>
            </div>
          </div>
        </Panel>

        {/* ===================================================== the projects */}
        <section>
          <SectionHeader
            eyebrow={`${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
            title="Everything you are building"
          />
          <ProjectManager projects={projects} />
        </section>

        {/* ============================================================ stats */}
        {projects.length > 0 ? (
          <section>
            <SectionHeader eyebrow="Breakdown" title="By status" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["idea", "in_progress", "shipped", "paused"] as const).map((status) => (
                <Stat
                  key={status}
                  label={
                    status === "in_progress"
                      ? "In progress"
                      : status.charAt(0).toUpperCase() + status.slice(1)
                  }
                  value={projects.filter((p) => p.status === status).length}
                  icon={<FolderKanban className="size-3.5" />}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </RewardProvider>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="sunken border-0 p-3 text-center">
      <p className="nums text-xl font-semibold">{value}</p>
      <p className="subtle mt-0.5 text-[10px] uppercase tracking-wider">{label}</p>
    </Card>
  );
}
