import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "lucide-react";
import { Codeblock } from "@/components/Codeblock";
import { cn } from "@/lib/utils";
import { KeyboardShortcuts } from "@/routes/docs/guides/-components/KeyboardShortcuts";
import { MethodsByType } from "@/routes/docs/guides/-components/MethodsByType";
import { ExpressionBuilderSteps } from "@/routes/docs/guides/-components/ExpressionBuilderSteps";
import { FormatsTable } from "@/routes/docs/api/formats/-components/FormatsTable";
import { ShortcutsTable } from "@/routes/docs/api/shortcuts/-components/ShortcutsTable";
import { CliCommands } from "@/routes/docs/api/shortcuts/-components/CliCommands";
import { MethodCard } from "@/routes/docs/api/-components/MethodCard";
import { ARRAY_METHODS } from "@/routes/docs/api/array-methods/-constants";
import { BUILTIN_CATEGORIES } from "@/routes/docs/api/builtins/-constants";

interface HeadingProps extends ComponentPropsWithoutRef<"h1"> {
  id?: string;
}

function HeadingLink({
  id,
  children,
  className,
  as: Tag,
}: HeadingProps & { as: "h1" | "h2" | "h3" | "h4" }) {
  if (!id) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag id={id} className={cn("group flex items-center gap-2 not-prose", className)}>
      <a href={`#${id}`} className="text-inherit hover:text-inherit">
        {children}
      </a>
      <a
        href={`#${id}`}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
        aria-label="Link to section"
      >
        <Link size={16} />
      </a>
    </Tag>
  );
}

function ArrayMethodsList() {
  return (
    <div className="space-y-8">
      {ARRAY_METHODS.map((method) => (
        <MethodCard key={method.name} {...method} />
      ))}
    </div>
  );
}

function BuiltinsList() {
  return (
    <div className="space-y-12">
      {BUILTIN_CATEGORIES.map((category) => (
        <div key={category.title}>
          <h2 className="text-2xl font-semibold tracking-tight mt-10 mb-2">{category.title}</h2>
          <p className="text-muted-foreground mb-6">{category.description}</p>
          <div className="space-y-6">
            {category.builtins.map((builtin) => (
              <MethodCard key={builtin.name} {...builtin} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export const mdxComponents: MDXComponents = {
  h1: ({ className, id, children, ...props }) => (
    <HeadingLink
      as="h1"
      id={id}
      className={cn("text-4xl font-bold tracking-tight mt-8 mb-4", className)}
      {...props}
    >
      {children}
    </HeadingLink>
  ),
  h2: ({ className, id, children, ...props }) => (
    <HeadingLink
      as="h2"
      id={id}
      className={cn("text-2xl font-semibold tracking-tight mt-10 mb-4 scroll-mt-24", className)}
      {...props}
    >
      {children}
    </HeadingLink>
  ),
  h3: ({ className, id, children, ...props }) => (
    <HeadingLink
      as="h3"
      id={id}
      className={cn("text-xl font-semibold tracking-tight mt-8 mb-3 scroll-mt-24", className)}
      {...props}
    >
      {children}
    </HeadingLink>
  ),
  h4: ({ className, id, children, ...props }) => (
    <HeadingLink
      as="h4"
      id={id}
      className={cn("text-lg font-semibold tracking-tight mt-6 mb-2 scroll-mt-24", className)}
      {...props}
    >
      {children}
    </HeadingLink>
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn("leading-7 text-muted-foreground [&:not(:first-child)]:mt-4", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("my-4 ml-6 list-disc text-muted-foreground [&>li]:mt-2", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("my-4 ml-6 list-decimal text-muted-foreground [&>li]:mt-2", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }) => <li className={cn("", className)} {...props} />,
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "mt-4 border-l-4 border-primary/50 pl-4 italic text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn("text-primary underline underline-offset-4 hover:text-primary/80", className)}
      {...props}
    />
  ),
  pre: ({ children, className }) => {
    const extractLanguage = (cls: string | undefined, node: ReactNode): string | null => {
      if (cls) {
        const m = cls.match(/language-(\w+)/);
        if (m) return m[1];
      }
      if (!node || typeof node !== "object") return null;
      const el = node as { props?: { className?: string; "data-language"?: string } };
      if (el.props?.["data-language"]) return el.props["data-language"];
      const m = (el.props?.className ?? "").match(/language-(\w+)/);
      return m ? m[1] : null;
    };

    const extractText = (node: ReactNode): string => {
      if (typeof node === "string") return node;
      if (Array.isArray(node)) return node.map(extractText).join("");
      if (node && typeof node === "object" && "props" in node) {
        const el = node as { props?: { children?: ReactNode } };
        return extractText(el.props?.children);
      }
      return "";
    };

    const language = extractLanguage(className, children) ?? "bash";
    const code = extractText(children);

    return <Codeblock code={code} language={language} showLanguage={!!extractLanguage(className, children)} />;
  },
  code: ({ className, children, ...props }) => {
    const isInline = typeof children === "string" && !children.includes("\n");
    if (isInline) {
      return (
        <code
          className={cn("bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono", className)}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  table: ({ className, ...props }) => (
    <div className="my-6 w-full overflow-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn("border border-border/20 px-4 py-2 text-left font-semibold", className)}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("border border-border/20 px-4 py-2", className)} {...props} />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-8 border-border/20", className)} {...props} />
  ),
  Codeblock,
  KeyboardShortcuts,
  MethodsByType,
  ExpressionBuilderSteps,
  FormatsTable,
  ShortcutsTable,
  CliCommands,
  ArrayMethodsList,
  BuiltinsList,
};
