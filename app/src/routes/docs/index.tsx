import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from './-components/PageHeader'
import { DocsCard } from './-components/DocsCard'
import { CARDS } from './-constants'

export const Route = createFileRoute('/docs/')({
  component: DocsIndex,
})

function DocsIndex() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Documentation"
        description="Learn how to use 1ls to process data with familiar JavaScript syntax."
      />
      <div className="flex flex-wrap gap-2">
        <a href="https://github.com/yowainwright/1ls/actions/workflows/ci.yml">
          <img src="https://github.com/yowainwright/1ls/actions/workflows/ci.yml/badge.svg" alt="CI" />
        </a>
        <a href="https://codecov.io/gh/yowainwright/1ls">
          <img src="https://codecov.io/gh/yowainwright/1ls/branch/main/graph/badge.svg" alt="codecov" />
        </a>
        <a href="https://www.npmjs.com/package/1ls">
          <img src="https://img.shields.io/npm/v/1ls.svg" alt="npm version" />
        </a>
        <a href="https://opensource.org/licenses/MIT">
          <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" />
        </a>
        <a href="https://github.com/yowainwright/1ls">
          <img src="https://img.shields.io/badge/GitHub-repo-blue" alt="GitHub" />
        </a>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <DocsCard key={card.href} {...card} />
        ))}
      </div>
    </div>
  )
}
