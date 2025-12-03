import { afterEach } from "bun:test"
import { cleanup } from "@testing-library/react"
import * as matchers from "@testing-library/jest-dom/matchers"
import { expect } from "bun:test"
import { GlobalRegistrator } from "@happy-dom/global-registrator"

GlobalRegistrator.register()

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
