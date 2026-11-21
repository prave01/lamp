import { Play, Terminal, TriangleAlert, Wrench, Brain } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Design system · Agent Builder",
};

const surfaces = [
  { name: "background", className: "bg-background", note: "The page" },
  { name: "card", className: "bg-card", note: "Panels on the page" },
  { name: "muted", className: "bg-muted", note: "Quiet fills, hover" },
  { name: "secondary", className: "bg-secondary", note: "Secondary buttons" },
  { name: "foreground", className: "bg-foreground", note: "Text" },
  { name: "primary", className: "bg-primary", note: "Primary buttons" },
];

const signals = [
  { name: "tool", className: "bg-signal-tool", note: "Tool call" },
  { name: "sandbox", className: "bg-signal-sandbox", note: "Sandbox output" },
  { name: "reasoning", className: "bg-signal-reasoning", note: "Model reasoning" },
  { name: "error", className: "bg-signal-error", note: "Something failed" },
];

function Swatch({
  name,
  className,
  note,
}: {
  name: string;
  className: string;
  note: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("size-10 shrink-0 rounded-md border", className)} />
      <div className="min-w-0">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </div>
    </div>
  );
}

/* One row in a run trace. The rail colour is the event kind. */
function TraceRow({
  kind,
  icon,
  label,
  children,
}: {
  kind: "user" | "tool" | "sandbox" | "reasoning" | "error";
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  const rail = {
    user: "border-foreground/30",
    tool: "border-signal-tool",
    sandbox: "border-signal-sandbox",
    reasoning: "border-signal-reasoning",
    error: "border-signal-error",
  }[kind];

  return (
    <div className={cn("flex gap-3 border-l-2 py-1 pl-4", rail)}>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {icon}
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="max-w-prose space-y-1">
        <h2 className="text-xl">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default function DesignPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-14 px-6 py-12">
      <header className="flex items-start justify-between gap-6">
        <div className="max-w-xl space-y-3">
          <h1 className="text-3xl">Design system</h1>
          <p className="text-base text-muted-foreground">
            A neutral, monochrome interface in the style of Vercel and shadcn/ui.
            Color is reserved for what happened in a run, and the typeface tells
            you who is speaking.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Separator />

      <Section
        title="Color"
        description="The interface is black, white, and grey. Signal colors appear only in run traces and status."
      >
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {surfaces.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
        <Separator />
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {signals.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </Section>

      <Section
        title="Type"
        description="Geist Sans speaks for people and the model. Geist Mono speaks for the machine."
      >
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <h1 className="text-3xl">Draft the release notes</h1>
            <h2 className="text-2xl">Draft the release notes</h2>
            <h3 className="text-xl">Draft the release notes</h3>
            <p className="max-w-prose text-base">
              The agent reads every merged pull request since the last tag,
              groups them by area, and writes a first draft you can edit.
            </p>
            <p className="text-sm text-muted-foreground">
              Runs stop after 12 turns or when the agent finishes, whichever
              comes first.
            </p>
          </div>
          <div className="space-y-3">
            <pre className="overflow-x-auto rounded-lg border bg-card p-4 leading-relaxed">
              {`$ git log --merges --oneline v2.3..HEAD
a41c9e2 Merge pull request #418
7d02b1f Merge pull request #421`}
            </pre>
            <p className="text-sm text-muted-foreground">
              Anything the agent or a tool produced is set in mono: arguments,
              output, and ids like <code>sess_8f3a21</code>.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Buttons"
        description="Primary is inverse ink: black in light, white in dark. Use one primary button per view."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Play />
            Run agent
          </Button>
          <Button variant="secondary">Save draft</Button>
          <Button variant="outline">Duplicate</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Delete agent</Button>
          <Button variant="link">View docs</Button>
          <Button disabled>Run agent</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section
        title="Forms"
        description="Fields are flat with a 1px border. Focus adds a soft neutral ring."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Agent name</Label>
              <Input id="agent-name" placeholder="Release notes writer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-model">Model</Label>
              <Input
                id="agent-model"
                defaultValue="openai/gpt-5"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-limit">Turn limit</Label>
              <Input
                id="agent-limit"
                defaultValue="0"
                aria-invalid
                aria-describedby="agent-limit-error"
              />
              <p id="agent-limit-error" className="text-xs text-signal-error">
                Turn limit must be at least 1.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-instructions">Instructions</Label>
            <Textarea
              id="agent-instructions"
              className="min-h-40"
              placeholder="Tell the agent what to do and how to report back."
            />
          </div>
        </div>
      </Section>

      <Section
        title="Badges"
        description="Each signal badge names one kind of event in a run."
      >
        <div className="flex flex-wrap gap-2">
          <Badge>Idle</Badge>
          <Badge variant="outline">Draft</Badge>
          <Badge variant="tool">
            <Wrench />
            Tool call
          </Badge>
          <Badge variant="sandbox">
            <Terminal />
            Sandbox
          </Badge>
          <Badge variant="reasoning">
            <Brain />
            Reasoning
          </Badge>
          <Badge variant="error">
            <TriangleAlert />
            Error
          </Badge>
        </div>
      </Section>

      <Section
        title="Panels and traces"
        description="Panels are flat and bordered. A run trace is a column of events, each on a rail colored by its kind."
      >
        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Release notes writer</CardTitle>
              <CardDescription>
                Session <code>sess_8f3a21</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TraceRow
                kind="user"
                icon={null}
                label="You"
              >
                <p>Summarize the pull requests merged since v2.3 and draft the release notes.</p>
              </TraceRow>
              <TraceRow
                kind="reasoning"
                icon={<Brain className="size-3.5" />}
                label="Reasoning"
              >
                <p className="text-muted-foreground">
                  I need the merge commits since the v2.3 tag first, then I can
                  group them by area.
                </p>
              </TraceRow>
              <TraceRow
                kind="tool"
                icon={<Wrench className="size-3.5" />}
                label="Tool call: run_command"
              >
                <pre className="overflow-x-auto rounded-md bg-signal-tool-soft px-3 py-2">
                  {`{ "cmd": "git log --merges --oneline v2.3..HEAD" }`}
                </pre>
              </TraceRow>
              <TraceRow
                kind="sandbox"
                icon={<Terminal className="size-3.5" />}
                label="Sandbox output"
              >
                <pre className="overflow-x-auto rounded-md bg-signal-sandbox-soft px-3 py-2">
                  {`a41c9e2 Merge pull request #418
7d02b1f Merge pull request #421
3be9c40 Merge pull request #425`}
                </pre>
              </TraceRow>
              <TraceRow
                kind="error"
                icon={<TriangleAlert className="size-3.5" />}
                label="Tool failed"
              >
                <p>
                  The web search tool timed out after 30 seconds. The agent will
                  retry once.
                </p>
              </TraceRow>
            </CardContent>
            <CardFooter className="gap-2">
              <Input placeholder="Ask a follow-up" className="flex-1" />
              <Button>Send</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tools</CardTitle>
              <CardDescription>What this agent can use.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Web search</span>
                <Badge variant="outline">On</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span>Sandbox commands</span>
                <Badge variant="outline">On</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" size="sm">
                Edit tools
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Section>
    </main>
  );
}
